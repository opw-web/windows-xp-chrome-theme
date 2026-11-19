const LIMIT = 200;

export function shortcutFields(title, address) {
  const name = typeof title === "string" ? title.trim() : "";
  if (!name || name.length > 120) throw new Error("Enter a name of 1 to 120 characters.");

  let url;
  try {
    url = new URL(typeof address === "string" ? address.trim() : "");
  } catch {
    throw new Error("Enter a full web address, including https://.");
  }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Use an HTTP or HTTPS address without a username or password.");
  }
  if (url.href.length > 8192) throw new Error("The web address is too long.");
  return { title: name, url: url.href };
}

export function readImport(text) {
  let data;
  try {
    data = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (data?.version !== 1 || !Array.isArray(data.shortcuts) || data.shortcuts.length > LIMIT) {
    throw new Error("Use a Luna shortcut export with up to 200 shortcuts.");
  }
  return data.shortcuts.map((entry, index) => {
    try {
      return shortcutFields(entry?.title, entry?.url);
    } catch (error) {
      throw new Error(`Shortcut ${index + 1}. ${error.message}`);
    }
  });
}

export function mergeShortcuts(current, imported) {
  const merged = [...current];
  const urls = new Set(current.map(entry => entry.url));
  for (const entry of imported) {
    if (urls.has(entry.url)) continue;
    merged.push({ id: crypto.randomUUID(), ...entry });
    urls.add(entry.url);
  }
  checkLimit(merged);
  return merged;
}

export function checkLimit(shortcuts) {
  if (shortcuts.length > LIMIT) throw new Error("Luna New Tab supports up to 200 shortcuts.");
}

export function encodeExport(shortcuts) {
  return JSON.stringify({
    version: 1,
    shortcuts: shortcuts.map(({ title, url }) => ({ title, url })),
  }, null, 2) + "\n";
}
