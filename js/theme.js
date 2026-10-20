(() => {
  const root = document.documentElement;
  const body = document.body;
  const themeKey = "gkblog-theme";
  const accentKey = "gkblog-accent-v2";
  const accents = [
    ["115,87,216", "#7357d8", "#f0edff", "#6245c5", "✦ 想要换个颜色吗？✦"],
    ["124,58,237", "#7c3aed", "#f5f3ff", "#6d28d9", "你觉得紫色怎么样？🤔"],
    ["220,38,38", "#dc2626", "#fef2f2", "#b91c1c", "红色怎么样？😡"],
    ["217,119,6", "#d97706", "#fffbeb", "#b45309", "琥珀色很好哦 🤩"],
    ["234,88,12", "#ea580c", "#fff7ed", "#c2410c", "你喜欢橙色吗？🍊"],
    ["22,163,74", "#16a34a", "#f0fdf4", "#15803d", "啊，绿色，不错的选择！😁"],
    ["219,39,119", "#db2777", "#fdf2f8", "#be185d", "粉色！🌸"],
  ];
  const themeToggle = document.querySelector(".theme-toggle");
  const quickDialog = document.querySelector("[data-quick-dialog]");
  const quickSearch = quickDialog?.querySelector("[data-quick-search]");
  const quickSearchStatus = quickDialog?.querySelector("[data-quick-search-status]");
  const quickRecentList = quickDialog?.querySelector("[data-quick-recent-list]");
  const searchIndexUrl = quickSearch?.dataset.searchIndexUrl;
  const quickSearchResults = [...(quickDialog?.querySelectorAll(".quick-search-result") || [])];
  let searchIndexPromise;
  const mobileToggle = document.querySelector("[data-mobile-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const homeVisual = document.querySelector(".home-visual");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lightbox = document.querySelector("[data-lightbox-dialog]");
  const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
  const lightboxCaption = lightbox?.querySelector("[data-lightbox-caption]");
  const galleryButtons = [...document.querySelectorAll("[data-lightbox-src]")];
  let lightboxIndex = -1;
  const showLightboxImage = (index) => {
    if (!galleryButtons.length || !lightboxImage || !lightboxCaption) return;
    lightboxIndex = (index + galleryButtons.length) % galleryButtons.length;
    const button = galleryButtons[lightboxIndex];
    lightboxImage.src = button.dataset.lightboxSrc;
    lightboxImage.alt = button.dataset.lightboxTitle || "";
    lightboxCaption.textContent = button.dataset.lightboxTitle || "";
  };

  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === "dark" || savedTheme === "light") {
    root.dataset.theme = savedTheme;
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.dataset.theme = "dark";
  }

  const savedAccent = Number(localStorage.getItem(accentKey) || 0);
  let accentIndex = Number.isInteger(savedAccent) && savedAccent >= 0 && savedAccent < accents.length
    ? savedAccent
    : 0;

  const setAccent = (index) => {
    accentIndex = index;
    const [rgb, color, soft, hover, label] = accents[index];
    root.style.setProperty("--accent-rgb", rgb);
    root.style.setProperty("--accent", color);
    root.style.setProperty("--accent-soft", soft);
    root.style.setProperty("--accent-hover", hover);
    const accentLabel = document.querySelector("[data-accent-label]");
    if (accentLabel) accentLabel.textContent = label;
    localStorage.setItem(accentKey, String(index));
  };
  setAccent(accentIndex);

  const setTheme = () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    localStorage.setItem(themeKey, nextTheme);
    document.querySelectorAll("[data-theme-label]").forEach((label) => {
      label.textContent = nextTheme === "dark" ? "暗模式：开启" : "暗模式：关闭";
    });
    document.querySelector("[data-theme-control]")?.classList.toggle("is-active", nextTheme === "dark");
  };
  themeToggle?.addEventListener("click", setTheme);
  document.querySelector("[data-theme-control]")?.addEventListener("click", setTheme);
  const syncFocusControl = () => {
    const active = body.classList.contains("focus-mode");
    const button = document.querySelector("[data-focus-control]");
    const label = document.querySelector("[data-focus-label]");
    button?.classList.toggle("is-active", active);
    if (label) label.textContent = active ? "专注模式：开启" : "专注模式：关闭";
  };
  const toggleFocus = () => {
    body.classList.toggle("focus-mode");
    syncFocusControl();
  };
  document.querySelector("[data-focus-control]")?.addEventListener("click", toggleFocus);
  document.querySelector("[data-theme-control]")?.classList.toggle("is-active", root.dataset.theme === "dark");
  document.querySelectorAll("[data-theme-label]").forEach((label) => {
    label.textContent = root.dataset.theme === "dark" ? "暗模式：开启" : "暗模式：关闭";
  });
  const articleToc = document.querySelector(".post-page-toc #TableOfContents");
  if (articleToc) {
    const tocLinks = [...articleToc.querySelectorAll("a[href^='#']")];
    const articleHeadings = [...document.querySelectorAll(".post-page-body .article-content h2, .post-page-body .article-content h3")];
    const updateActiveHeading = () => {
      let activeHeading = articleHeadings[0];
      articleHeadings.forEach((heading) => {
        if (heading.getBoundingClientRect().top <= 200) activeHeading = heading;
      });
      tocLinks.forEach((link) => {
        const isActive = activeHeading && decodeURIComponent(link.hash.slice(1)) === activeHeading.id;
        link.classList.toggle("toc-link--active", Boolean(isActive));
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    updateActiveHeading();
  }
  document.querySelector("[data-toc-top]")?.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });
  document.querySelector("[data-accent-toggle]")?.addEventListener("click", () => {
    setAccent((accentIndex + 1) % accents.length);
  });

  const archiveTagToggle = document.querySelector("[data-show-all-tags]");
  archiveTagToggle?.addEventListener("click", () => {
    const tags = [...document.querySelectorAll("[data-archive-tag]")];
    const showAll = archiveTagToggle.dataset.expanded !== "true";
    tags.forEach((tag, index) => {
      tag.hidden = !showAll && index >= 15;
    });
    archiveTagToggle.dataset.expanded = String(showAll);
    archiveTagToggle.textContent = showAll ? "收起标签" : "查看全部标签";
  });

  const openQuickAccess = () => {
    if (!quickDialog?.open) {
      quickDialog?.showModal();
      quickSearch?.focus();
    }
  };
  const closeQuickAccess = () => {
    if (quickDialog?.open) quickDialog.close();
  };
  document.querySelectorAll("[data-quick-open]").forEach((button) => {
    button.addEventListener("click", openQuickAccess);
  });
  document.querySelectorAll("[data-quick-close]").forEach((button) => {
    button.addEventListener("click", closeQuickAccess);
  });
  quickDialog?.querySelectorAll(".quick-post,.quick-search-result,.quick-shortcuts>a").forEach((link) => {
    link.addEventListener("click", closeQuickAccess);
  });
  quickSearch?.addEventListener("input", () => {
    const query = quickSearch.value.trim().toLocaleLowerCase();
    const resultsContainer = quickDialog?.querySelector("[data-quick-search-results]");
    const updateSearchResults = (searchTextByUrl) => {
      if (query !== quickSearch.value.trim().toLocaleLowerCase()) return;
      let matchCount = 0;
      quickSearchResults.forEach((result) => {
        const articleText = searchTextByUrl.get(result.getAttribute("href")) || result.dataset.searchText;
        const matches = query !== "" && articleText.includes(query);
        result.hidden = !matches;
        if (matches) matchCount += 1;
      });
      if (quickRecentList) quickRecentList.hidden = query !== "";
      if (quickSearchStatus) {
        quickSearchStatus.hidden = query === "";
        quickSearchStatus.textContent = matchCount
          ? `找到 ${matchCount} 篇相关文章`
          : query
            ? "没有找到相关文章，试试其他关键词。"
            : "";
      }
      if (resultsContainer) resultsContainer.hidden = query === "";
    };
    if (!query) {
      updateSearchResults(new Map());
      return;
    }
    if (!searchIndexUrl) {
      console.error("Article search index URL is not configured.");
      if (quickSearchStatus) {
        quickSearchStatus.hidden = false;
        quickSearchStatus.textContent = "全文搜索未配置，请刷新页面重试。";
      }
      return;
    }
    if (!searchIndexPromise) {
      searchIndexPromise = fetch(searchIndexUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
          return response.json();
        })
        .then((articles) => {
          if (!Array.isArray(articles)) throw new Error("Search index has an invalid format.");
          return new Map(articles.map((article) => [article.url, article.text]));
        });
    }
    if (quickSearchStatus) {
      quickSearchStatus.hidden = false;
      quickSearchStatus.textContent = "正在检索文章全文…";
    }
    searchIndexPromise
      .then(updateSearchResults)
      .catch((error) => {
        console.error("Unable to load the article full-text search index.", error);
        if (query === quickSearch.value.trim().toLocaleLowerCase() && quickSearchStatus) {
          quickSearchStatus.hidden = false;
          quickSearchStatus.textContent = "文章全文索引加载失败，请刷新页面重试。";
        }
      });
  });
  quickSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      quickSearchResults.find((result) => !result.hidden)?.click();
    } else if (event.key === "Escape" && quickSearch.value) {
      event.preventDefault();
      event.stopPropagation();
      quickSearch.value = "";
      quickSearch.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  mobileToggle?.addEventListener("click", () => {
    const isOpen = mobileNav?.classList.toggle("is-open") ?? false;
    mobileToggle.setAttribute("aria-expanded", String(isOpen));
    mobileToggle.setAttribute("aria-label", isOpen ? "收起菜单" : "展开菜单");
    mobileToggle.textContent = isOpen ? "×" : "☰";
  });
  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      mobileToggle?.setAttribute("aria-expanded", "false");
      if (mobileToggle) mobileToggle.textContent = "☰";
    });
  });
  document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) {
        document.querySelectorAll(".nav-dropdown").forEach((other) => {
          if (other !== dropdown) other.open = false;
        });

        const mediaCards = [...document.querySelectorAll("[data-media-category]")];
        document.querySelectorAll("[data-media-filter]").forEach((button) => {
          button.addEventListener("click", () => {
            const category = button.dataset.mediaFilter;
            let visibleCount = 0;
            mediaCards.forEach((card) => {
              const visible = category === "all" || card.dataset.mediaCategory === category;
              card.hidden = !visible;
              if (visible) visibleCount += 1;
            });
            document.querySelectorAll("[data-media-filter]").forEach((filter) => {
              const active = filter === button;
              filter.classList.toggle("is-active", active);
              filter.setAttribute("aria-pressed", String(active));
            });
            const empty = document.querySelector(".media-empty");
            if (empty) empty.hidden = visibleCount > 0;
          });
        });

      }
    });
  });
  galleryButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showLightboxImage(index);
      if (lightbox && !lightbox.open) lightbox.showModal();
    });
  });
  lightbox?.querySelector("[data-lightbox-close]")?.addEventListener("click", () => lightbox.close());
  lightbox?.querySelector("[data-lightbox-next]")?.addEventListener("click", () => showLightboxImage(lightboxIndex + 1));
  lightbox?.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => showLightboxImage(lightboxIndex - 1));
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || event.target.closest(".nav-dropdown")) return;
    document.querySelectorAll(".nav-dropdown[open]").forEach((dropdown) => {
      dropdown.open = false;
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openDropdown = document.querySelector(".nav-dropdown[open]");
    if (!openDropdown) return;
    openDropdown.open = false;
    openDropdown.querySelector("summary")?.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox?.open && event.key === "ArrowRight") {
      showLightboxImage(lightboxIndex + 1);
      return;
    }
    if (lightbox?.open && event.key === "ArrowLeft") {
      showLightboxImage(lightboxIndex - 1);
      return;
    }
    if (event.key === "Escape") {
      closeQuickAccess();
      return;
    }
    if (!event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (
      target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    )) return;

    switch (event.code) {
      case "KeyD":
        event.preventDefault();
        setTheme();
        break;
      case "KeyQ":
        event.preventDefault();
        quickDialog?.open ? closeQuickAccess() : openQuickAccess();
        break;
      case "KeyF":
        event.preventDefault();
        toggleFocus();
        break;
      default:
        break;
    }
  });

  const header = document.querySelector("[data-site-header]");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 0);
  let scrollPauseTimer;
  window.addEventListener("scroll", () => {
    if (!homeVisual) return;
    homeVisual.classList.add("is-scrolling");
    window.clearTimeout(scrollPauseTimer);
    scrollPauseTimer = window.setTimeout(() => homeVisual.classList.remove("is-scrolling"), 140);
  }, { passive: true });
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (!reducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }

        const tocLinks = [...document.querySelectorAll(".toc-card a[href^='#']")];
        const tocHeadings = tocLinks
          .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
          .filter((heading) => heading instanceof HTMLElement);
        if (tocHeadings.length && "IntersectionObserver" in window) {
          const headingObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const currentHash = `#${entry.target.id}`;
              tocLinks.forEach((link) => {
                const current = link.hash === currentHash;
                link.classList.toggle("is-current", current);
                if (current) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
              });
            });
          }, { rootMargin: "-15% 0px -72% 0px" });
          tocHeadings.forEach((heading) => headingObserver.observe(heading));
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  const designStates = {
    typography: "选择字体类型、字体大小和字体粗细。",
    spacing: "定位并添加元素之间的间距。",
    colors: "选择具有足够对比度的配色方案。",
    effects: "添加边框、阴影、圆角等效果。",
  };
  const designTabs = [...document.querySelectorAll("[data-design-state]")];
  const todoPreviews = [...document.querySelectorAll("[data-preview-card]")];
  const designDescription = document.querySelector("[data-design-description]");
  const designOrder = Object.keys(designStates);
  let designIndex = 0;
  let designCycle;
  let designResume;
  const setDesignState = (state) => {
    designIndex = designOrder.indexOf(state);
    const tab = designTabs[designIndex];
    if (!tab) return;
    designTabs.forEach((other, index) => {
      const active = index === designIndex;
      other.classList.toggle("is-active", active);
      other.setAttribute("aria-pressed", String(active));
    });
    todoPreviews.forEach((preview) => {
      preview.setAttribute("data-states", tab.dataset.designStates || state);
    });
    if (designDescription) designDescription.textContent = designStates[state];
  };
  const startDesignCycle = (interval) => {
    window.clearInterval(designCycle);
    designCycle = window.setInterval(() => {
      const nextIndex = (designIndex + 1) % designOrder.length;
      setDesignState(designOrder[nextIndex]);
    }, interval);
  };
  startDesignCycle(1500);
  designTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const state = tab.dataset.designState;
      if (!state || !designStates[state]) return;
      setDesignState(state);
      window.clearInterval(designCycle);
      window.clearTimeout(designResume);
      designResume = window.setTimeout(() => startDesignCycle(1000), 5000);
    });
  });

  const contactLink = document.querySelector("[data-contact]");
  const contactActions = contactLink?.parentElement;
  const availability = contactActions?.querySelector(".availability-pill");
  const aboutLink = contactActions?.querySelector("[data-about-link]");
  const syncContactState = () => {
    const active = Boolean(contactLink?.matches(":hover"));
    contactActions?.toggleAttribute("data-contact-active", active);
    availability?.setAttribute("aria-hidden", String(!active));
    aboutLink?.setAttribute("aria-hidden", String(active));
  };
  contactLink?.addEventListener("mouseenter", syncContactState);
  contactLink?.addEventListener("mouseleave", syncContactState);
  syncContactState();
  aboutLink?.addEventListener("click", (event) => {
    if (aboutLink.getAttribute("href") === "/about-me/" && window.location.pathname.startsWith("/about")) {
      event.preventDefault();
    }
  });

  document.querySelector("[data-share]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = "已复制链接";
      window.setTimeout(() => { button.textContent = "复制文章链接"; }, 1800);
    } catch (error) {
      window.prompt("复制文章链接：", window.location.href);
    }
  });
})();
