(() => {
  const pageMarker = "data-luna-search";
  const toolbarSelector = "body > .LoygGf:has(> .Xx7Mif > #searchform)";
  const toolbarHeightProperty = "--luna-search-toolbar-height";
  const overviewMarker = "data-luna-overview";
  const formSelector = 'form#tsf, #searchform form, form[role="search"][action="/search"]';
  const resultsSelector = "#cnt, #rcnt, #search, #rso, #center_col";
  const aiFieldSelector = "textarea.ITIRGe";
  const overviewSelector = '[data-attrid="AIOverview" i], [data-attrid="ai_overview" i], .hdzaWe, #m-x-content';

  let overview = null;
  let toolbar = null;
  let pendingUpdate = 0;

  const toolbarSize = new ResizeObserver(([entry]) => {
    if (entry.target !== toolbar) return;
    document.documentElement.style.setProperty(toolbarHeightProperty, entry.borderBoxSize[0].blockSize + "px");
  });

  function observeToolbar(nextToolbar) {
    if (toolbar === nextToolbar) return;
    toolbarSize.disconnect();
    toolbar = nextToolbar;
    if (toolbar) {
      toolbarSize.observe(toolbar, { box: "border-box" });
    } else {
      document.documentElement?.style.removeProperty(toolbarHeightProperty);
    }
  }

  function isSearchPage() {
    const { origin, pathname, searchParams } = new URL(location.href);
    return origin === "https://www.google.com" && pathname === "/search"
      && Boolean(searchParams.get("q")?.trim() || searchParams.get("udm") === "50");
  }

  function searchTone(page) {
    // Google can use a different appearance from the browser's color preference.
    for (const element of [document.body, page]) {
      const color = getComputedStyle(element).backgroundColor.match(/\d+(?:\.\d+)?/g)?.map(Number);
      if (color?.length === 3 || color?.[3] === 1) {
        const [red, green, blue] = color;
        const brightness = .2126 * red + .7152 * green + .0722 * blue;
        return brightness >= 160 ? "light" : "dark";
      }
    }
    return "dark"; // Keep Google's text and surfaces when the background is unknown.
  }

  function findOverview() {
    // Use module or answer-body hooks without climbing to a wrapper shared by other results.
    const region = document.querySelector("#rcnt, #center_col, #search");
    return region?.querySelector(overviewSelector) ?? null;
  }

  function update() {
    pendingUpdate = 0;
    const page = document.documentElement;
    const onSearchPage = isSearchPage();
    const form = onSearchPage && document.querySelector(formSelector);
    const field = form && form.querySelector('input[name="q"], textarea[name="q"]');
    const active = onSearchPage && document.body && document.querySelector(resultsSelector)
      && (field || document.querySelector(aiFieldSelector));

    if (active) {
      const tone = searchTone(page);
      if (page.getAttribute(pageMarker) !== tone) page.setAttribute(pageMarker, tone);
    } else {
      page?.removeAttribute(pageMarker);
    }

    observeToolbar(active ? document.querySelector(toolbarSelector) : null);

    const currentOverview = active ? findOverview() : null;
    if (currentOverview !== overview) {
      overview?.removeAttribute(overviewMarker);
      currentOverview?.setAttribute(overviewMarker, "");
      overview = currentOverview;
    }
  }

  function scheduleUpdate() {
    if (!pendingUpdate) pendingUpdate = requestAnimationFrame(update);
  }

  // Google can render the form and the generated answer at different times.
  const observer = new MutationObserver(records => {
    const needsUpdate = records.some(({ type, target }) => type === "childList"
      || target === document.documentElement || target === document.body
      || target === overview || target.matches(overviewSelector) || target.matches(aiFieldSelector));
    if (needsUpdate) scheduleUpdate();
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["id", "class", "style", "data-attrid", "color-scheme", "dark"],
  });
  window.addEventListener("pageshow", scheduleUpdate);
  window.addEventListener("popstate", scheduleUpdate);
  window.navigation?.addEventListener("currententrychange", scheduleUpdate);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", scheduleUpdate);
  scheduleUpdate();
})();
