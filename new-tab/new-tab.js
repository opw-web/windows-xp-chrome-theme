import { checkLimit, encodeExport, mergeShortcuts, readImport, shortcutFields } from "./shortcuts.js";

const get = id => document.getElementById(id);
const list = get("shortcut-list");
const dialog = get("editor");
const form = get("edit-form");
const nameInput = get("shortcut-title");
const urlInput = get("shortcut-url");
const status = get("status");
const errorLabel = get("editor-error");
const editorStatus = get("editor-status");
const filePicker = get("import-file");
const manage = get("manage");
const moveUp = get("move-up");
const moveDown = get("move-down");
let shortcuts = [];
let editingId = null;
let returnFocusId = "add";
let busy = false;
let loading = true;

function make(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function tileContents(label, monogram) {
  const icon = make("span", "shortcut-icon", monogram);
  icon.setAttribute("aria-hidden", "true");
  return [icon, make("span", "shortcut-label", label)];
}

function tileControl(id) {
  return list.querySelector(`[data-shortcut-id="${CSS.escape(id)}"]`);
}

function render() {
  const focusedId = document.activeElement?.dataset.shortcutId;
  const children = shortcuts.map(entry => {
    const item = make("li", "shortcut-item");
    const anchor = make("a", "shortcut-target");
    anchor.href = entry.url;
    anchor.title = entry.title;
    anchor.dataset.shortcutId = entry.id;
    const letters = entry.title.split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();
    anchor.append(...tileContents(entry.title, letters));
    const { hostname } = new URL(entry.url);
    let hue = 0;
    for (const letter of hostname) hue = (hue * 31 + letter.codePointAt(0)) % 360;
    anchor.style.setProperty("--hue", String(hue));

    const edit = make("button", "edit-shortcut", "⋯");
    edit.type = "button";
    edit.dataset.shortcutId = `edit-${entry.id}`;
    edit.setAttribute("aria-label", `Edit ${entry.title}`);
    edit.addEventListener("click", () => openEditor(entry));
    item.append(anchor, edit);
    return item;
  });

  const last = make("li", "shortcut-item");
  const add = make("button", "shortcut-target add");
  add.type = "button";
  add.id = "add-shortcut";
  add.dataset.shortcutId = "add";
  add.append(...tileContents("Add shortcut", "+"));
  add.disabled = loading;
  add.addEventListener("click", () => openEditor());
  last.append(add);
  list.replaceChildren(...children, last);
  if (focusedId) (tileControl(focusedId) ?? add).focus();
  if (dialog.open) updateMoveControls();
}

function updateMoveControls() {
  const index = shortcuts.findIndex(item => item.id === editingId);
  moveUp.disabled = index <= 0;
  moveDown.disabled = index < 0 || index >= shortcuts.length - 1;
}

function openEditor(entry) {
  editingId = entry?.id ?? null;
  returnFocusId = entry ? `edit-${entry.id}` : "add";
  errorLabel.textContent = "";
  editorStatus.textContent = "";
  get("editor-heading").textContent = entry ? "Edit shortcut" : "Add shortcut";
  nameInput.value = entry?.title ?? "";
  urlInput.value = entry?.url ?? "";
  get("edit-tools").hidden = !entry;
  updateMoveControls();
  dialog.showModal();
}

async function changeShortcuts(update) {
  return navigator.locks.request("luna-shortcuts", async () => {
    const { shortcuts: current = [] } = await chrome.storage.local.get("shortcuts");
    const next = update(current);
    checkLimit(next);
    await chrome.storage.local.set({ shortcuts: next });
    return { current, next };
  });
}

function requireIndex(current, id) {
  const index = current.findIndex(entry => entry.id === id);
  if (index === -1) throw new Error("This shortcut was removed in another tab.");
  return index;
}

async function fromEditor(update, message, focusId) {
  if (busy) return;
  busy = true;
  try {
    const { next } = await changeShortcuts(update);
    shortcuts = next;
    render();
    returnFocusId = focusId ?? "add";
    dialog.close();
    status.textContent = message;
  } catch (error) {
    errorLabel.textContent = error.message;
  } finally {
    busy = false;
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const id = editingId;
  const savedId = id ?? crypto.randomUUID();
  fromEditor(current => {
    const fields = shortcutFields(nameInput.value, urlInput.value);
    if (current.some(entry => entry.id !== id && entry.url === fields.url)) {
      throw new Error("There is already a shortcut for that address.");
    }
    const updated = { id: savedId, ...fields };
    if (!id) return [...current, updated];
    const next = [...current];
    next[requireIndex(next, id)] = updated;
    return next;
  }, id ? "Shortcut saved." : "Shortcut added.", `edit-${savedId}`);
});

async function move(direction) {
  if (busy) return;
  busy = true;
  const id = editingId;
  errorLabel.textContent = "";
  try {
    const { next } = await changeShortcuts(current => {
      const updated = [...current];
      const index = requireIndex(updated, id);
      const destination = index + direction;
      if (destination >= 0 && destination < updated.length) {
        [updated[index], updated[destination]] = [updated[destination], updated[index]];
      }
      return updated;
    });
    shortcuts = next;
    render();
    const attempted = direction < 0 ? moveUp : moveDown;
    const opposite = direction < 0 ? moveDown : moveUp;
    (attempted.disabled ? opposite : attempted).focus();
    editorStatus.textContent = `Shortcut ${requireIndex(next, id) + 1} of ${next.length}.`;
  } catch (error) {
    errorLabel.textContent = error.message;
  } finally {
    busy = false;
  }
}

moveUp.addEventListener("click", () => move(-1));
moveDown.addEventListener("click", () => move(1));
get("remove").addEventListener("click", () => {
  const id = editingId;
  fromEditor(current => current.filter(entry => entry.id !== id), "Shortcut removed.");
});
get("cancel").addEventListener("click", () => { if (!busy) dialog.close(); });
dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
dialog.addEventListener("close", () => (tileControl(returnFocusId) ?? get("add-shortcut")).focus());

manage.addEventListener("click", () => {
  const tools = get("file-tools");
  tools.hidden = !tools.hidden;
  manage.setAttribute("aria-expanded", String(!tools.hidden));
});
get("import").addEventListener("click", () => filePicker.click());
filePicker.addEventListener("change", async () => {
  const file = filePicker.files[0];
  filePicker.value = "";
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error("The shortcut file is too large.");
    const incoming = readImport(await file.text());
    const { current, next } = await changeShortcuts(entries => mergeShortcuts(entries, incoming));
    const added = next.length - current.length;
    status.textContent = added === 1 ? "1 shortcut imported." : `${added} shortcuts imported.`;
  } catch (error) {
    status.textContent = error.message;
  }
});

get("export").addEventListener("click", async () => {
  try {
    const { shortcuts: current = [] } = await chrome.storage.local.get("shortcuts");
    const url = URL.createObjectURL(new Blob([encodeExport(current)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "luna-shortcuts.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Shortcuts exported.";
  } catch {
    status.textContent = "Could not export shortcuts.";
  }
});

const query = get("query");
query.form.addEventListener("submit", event => {
  query.value = query.value.trim();
  if (!query.value) {
    event.preventDefault();
    query.reportValidity();
  }
});

chrome.storage.local.onChanged.addListener(changes => {
  if (!changes.shortcuts) return;
  shortcuts = changes.shortcuts.newValue ?? [];
  render();
});

try {
  ({ shortcuts = [] } = await chrome.storage.local.get("shortcuts"));
  loading = false;
} catch {
  status.textContent = "Could not load shortcuts. Reload this page to try again.";
}
render();
