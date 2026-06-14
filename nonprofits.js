/**
 * NoProfits.org - Main JavaScript Module
 * Handles navigation, tab switching, mobile menu, and URL hash routing
 * @version 2.0.0
 */
const NoProfits = (() => {
  'use strict';

  // Configuration constants
  const CONFIG = {
    TAB_SELECTOR: '.tab-link',
    TAB_CONTENT_SELECTOR: '.tab-content',
    ACTIVE_CLASS: 'active',
    SHOW_CLASS: 'show',
    DEFAULT_TAB: 'about',
    BLOG_FEED: 'https://blog.noprofits.org/atom.xml',
    BLOG_LIMIT: 12
  };

  // Cached DOM elements
  const DOM = {
    hamburger: null,
    navList: null,
    tabLinks: null,
    tabContents: null,
    themeToggle: null,
    themeSegBtns: null,
    mobileOverlay: null
  };

  /**
   * Caches frequently accessed DOM elements to improve performance
   */
  function cacheDOMElements() {
    DOM.hamburger = document.getElementById('hamburger');
    DOM.navList = document.querySelector('.nav-list');
    DOM.tabLinks = document.querySelectorAll(CONFIG.TAB_SELECTOR);
    DOM.tabContents = document.querySelectorAll(CONFIG.TAB_CONTENT_SELECTOR);
    DOM.themeToggle = document.getElementById('theme-toggle');
    DOM.themeSegBtns = DOM.themeToggle
      ? DOM.themeToggle.querySelectorAll('.seg-btn')
      : [];
    DOM.mobileOverlay = document.getElementById('mobile-overlay');
  }

  /**
   * Closes the mobile navigation menu and updates ARIA attributes
   */
  function closeMenu() {
    if (!DOM.navList || !DOM.hamburger) return;

    DOM.navList.classList.remove(CONFIG.SHOW_CLASS);
    DOM.hamburger.classList.remove(CONFIG.ACTIVE_CLASS);
    DOM.hamburger.setAttribute('aria-expanded', 'false');

    // Hide mobile overlay
    if (DOM.mobileOverlay) {
      DOM.mobileOverlay.classList.remove(CONFIG.SHOW_CLASS);
    }

    // Re-enable body scroll
    document.body.style.overflow = '';
  }

  /**
   * Opens the mobile navigation menu and updates ARIA attributes
   */
  function openMenu() {
    if (!DOM.navList || !DOM.hamburger) return;

    DOM.navList.classList.add(CONFIG.SHOW_CLASS);
    DOM.hamburger.classList.add(CONFIG.ACTIVE_CLASS);
    DOM.hamburger.setAttribute('aria-expanded', 'true');

    // Show mobile overlay
    if (DOM.mobileOverlay) {
      DOM.mobileOverlay.classList.add(CONFIG.SHOW_CLASS);
    }

    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Toggles the mobile navigation menu state
   */
  function toggleMenu() {
    const isOpen = DOM.navList?.classList.contains(CONFIG.SHOW_CLASS);
    isOpen ? closeMenu() : openMenu();
  }

  /**
   * Switches to the specified tab and updates URL hash
   * @param {string} tabId - The ID of the tab to activate
   * @param {boolean} updateHistory - Whether to update browser history (default: true)
   */
  function switchTab(tabId, updateHistory = true) {
    if (!tabId) return;

    const tabContent = document.getElementById(tabId);
    const matchingLinks = document.querySelectorAll(`[data-tab="${tabId}"]`);

    if (!tabContent || matchingLinks.length === 0) {
      console.warn(`Tab "${tabId}" not found`);
      return;
    }

    // Remove active class from all tabs and content
    DOM.tabContents.forEach(content => content.classList.remove(CONFIG.ACTIVE_CLASS));
    DOM.tabLinks.forEach(link => link.classList.remove(CONFIG.ACTIVE_CLASS));

    // Activate the selected tab content and every link bound to this tab
    tabContent.classList.add(CONFIG.ACTIVE_CLASS);
    matchingLinks.forEach(link => link.classList.add(CONFIG.ACTIVE_CLASS));

    // Update ARIA attributes
    DOM.tabLinks.forEach(link => {
      const isActive = link.getAttribute('data-tab') === tabId;
      link.setAttribute('aria-selected', isActive);
      link.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    DOM.tabContents.forEach(content => {
      content.setAttribute('aria-hidden', content !== tabContent);
    });

    // Update URL hash without triggering hashchange event
    if (updateHistory && window.location.hash !== `#${tabId}`) {
      history.pushState(null, '', `#${tabId}`);
    }

    // Lazy-load the blog feed the first time the Blog tab is opened
    if (tabId === 'blog') {
      loadBlogPosts();
    }

    // Focus management - focus the tab panel for screen readers
    tabContent.focus();
  }

  /**
   * Handles tab link click events
   * @param {Event} event - The click event
   */
  function handleTabClick(event) {
    event.preventDefault();
    const tabId = event.currentTarget.getAttribute('data-tab');
    if (tabId) {
      switchTab(tabId);
      closeMenu(); // Close mobile menu when tab is selected
    }
  }

  /**
   * Handles keyboard navigation for tabs (Arrow keys, Home, End)
   * @param {KeyboardEvent} event - The keyboard event
   */
  function handleTabKeydown(event) {
    const tabLinksArray = Array.from(DOM.tabLinks);
    const currentIndex = tabLinksArray.indexOf(event.target);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabLinksArray.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < tabLinksArray.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabLinksArray.length - 1;
        break;
      default:
        return;
    }

    const newTab = tabLinksArray[newIndex];
    if (newTab) {
      const tabId = newTab.getAttribute('data-tab');
      switchTab(tabId);
      newTab.focus();
    }
  }

  /**
   * Initializes the tab navigation system
   */
  function initTabs() {
    if (!DOM.tabLinks.length) {
      console.error('No tab links found');
      return;
    }

    // Add event listeners to tab links
    DOM.tabLinks.forEach(link => {
      link.addEventListener('click', handleTabClick);
      link.addEventListener('keydown', handleTabKeydown);

      // Set initial ARIA attributes
      link.setAttribute('role', 'tab');
      link.setAttribute('aria-selected', 'false');
      link.setAttribute('tabindex', '-1');
    });

    // Set ARIA roles on tab contents
    DOM.tabContents.forEach(content => {
      content.setAttribute('role', 'tabpanel');
      content.setAttribute('tabindex', '0');
      content.setAttribute('aria-hidden', 'true');
    });

    // Handle initial tab based on URL hash or default
    const initialHash = window.location.hash.slice(1);
    const initialTab = initialHash || CONFIG.DEFAULT_TAB;
    switchTab(initialTab, false);

    // Handle browser back/forward buttons
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        switchTab(hash, false);
      }
    });

    // Handle popstate for better browser history support
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.slice(1);
      const tab = hash || CONFIG.DEFAULT_TAB;
      switchTab(tab, false);
    });
  }

  /**
   * Gets the current theme from localStorage or system preference
   * @returns {string} 'light' or 'dark'
   */
  function getCurrentTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Sets the theme and updates the segmented control's active state
   * @param {string} theme - 'light' or 'dark'
   */
  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Reflect state on the Light/Dark segmented control
    if (DOM.themeSegBtns) {
      DOM.themeSegBtns.forEach(btn => {
        const isActive = btn.getAttribute('data-theme-set') === theme;
        btn.classList.toggle(CONFIG.ACTIVE_CLASS, isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    localStorage.setItem('theme', theme);
  }

  /**
   * Toggles between light and dark theme
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.hasAttribute('data-theme') ? 'dark' : 'light';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  /**
   * Initializes the Light/Dark segmented control
   */
  function initThemeToggle() {
    if (!DOM.themeToggle) {
      console.warn('Theme control not found');
      return;
    }

    // Set initial theme (also paints the active segment)
    setTheme(getCurrentTheme());

    // Each segment selects its theme explicitly
    DOM.themeSegBtns.forEach(btn => {
      btn.addEventListener('click', () => setTheme(btn.getAttribute('data-theme-set')));
    });

    // Follow the system preference until the user makes an explicit choice
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Initializes the mobile hamburger menu
   */
  function initMobileMenu() {
    if (!DOM.hamburger || !DOM.navList) {
      console.warn('Hamburger menu or nav list element not found');
      return;
    }

    // Toggle menu on hamburger click
    DOM.hamburger.addEventListener('click', toggleMenu);

    // Close menu when clicking overlay
    if (DOM.mobileOverlay) {
      DOM.mobileOverlay.addEventListener('click', closeMenu);
    }

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      const isMenuOpen = DOM.navList.classList.contains(CONFIG.SHOW_CLASS);
      const clickedInsideMenu = DOM.navList.contains(event.target);
      const clickedHamburger = DOM.hamburger.contains(event.target);

      if (isMenuOpen && !clickedInsideMenu && !clickedHamburger) {
        closeMenu();
      }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && DOM.navList.classList.contains(CONFIG.SHOW_CLASS)) {
        closeMenu();
        DOM.hamburger.focus(); // Return focus to hamburger button
      }
    });

    // Set initial ARIA attribute
    DOM.hamburger.setAttribute('aria-expanded', 'false');
  }

  // ---------------------------------------------------------------------------
  // Blog feed — pulls the most recent posts from blog.noprofits.org/atom.xml
  // ---------------------------------------------------------------------------
  let blogState = 'idle'; // idle | loading | done | error (error allows retry)

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  /**
   * Formats an ISO-8601 date string as "JUN 21, 2025" (UTC, to match the feed).
   * @param {string} iso
   * @returns {string}
   */
  function formatPostDate(iso) {
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return (iso || '').slice(0, 10);
    return `${MONTHS[dt.getUTCMonth()]} ${String(dt.getUTCDate()).padStart(2, '0')}, ${dt.getUTCFullYear()}`;
  }

  /**
   * Renders Atom <entry> elements as editorial post rows (first is featured).
   * Uses textContent throughout so feed data can never inject markup.
   * @param {HTMLElement} list
   * @param {Element[]} entries
   */
  function renderPosts(list, entries) {
    list.textContent = '';

    entries.forEach((entry, i) => {
      const titleEl = entry.querySelector('title');
      const linkEl = entry.querySelector('link');
      const dateEl = entry.querySelector('published') || entry.querySelector('updated');
      const summaryEl = entry.querySelector('summary');

      const row = document.createElement('a');
      row.className = i === 0 ? 'post-row featured' : 'post-row';
      row.href = linkEl ? linkEl.getAttribute('href') : 'https://blog.noprofits.org';
      row.target = '_blank';
      row.rel = 'noopener';

      const date = document.createElement('span');
      date.className = 'post-date';
      date.textContent = dateEl ? formatPostDate(dateEl.textContent.trim()) : '';

      const main = document.createElement('span');
      main.className = 'post-main';

      const title = document.createElement('span');
      title.className = 'post-title';
      title.textContent = titleEl ? titleEl.textContent.trim() : 'Untitled';
      main.appendChild(title);

      const excerptText = summaryEl ? summaryEl.textContent.trim() : '';
      if (excerptText) {
        const excerpt = document.createElement('span');
        excerpt.className = 'post-excerpt';
        excerpt.textContent = excerptText;
        main.appendChild(excerpt);
      }

      row.appendChild(date);
      row.appendChild(main);
      list.appendChild(row);
    });
  }

  /**
   * Populates the Home "Blog" feature card with a one-line preview of the
   * most recent post. Safe no-op if the card isn't present.
   * @param {Element} entry - the newest Atom <entry>
   */
  function renderHomePreview(entry) {
    const el = document.getElementById('home-blog-preview');
    if (!el || !entry) return;

    const titleEl = entry.querySelector('title');
    const dateEl = entry.querySelector('published') || entry.querySelector('updated');

    el.textContent = '';

    const label = document.createElement('span');
    label.className = 'fc-preview-label';
    label.textContent = 'Latest post';
    el.appendChild(label);

    const title = document.createElement('span');
    title.className = 'fc-preview-title';
    title.textContent = titleEl ? titleEl.textContent.trim() : '';
    el.appendChild(title);

    if (dateEl) {
      const date = document.createElement('span');
      date.className = 'fc-preview-date';
      date.textContent = formatPostDate(dateEl.textContent.trim());
      el.appendChild(date);
    }

    el.classList.add('is-loaded');
  }

  /**
   * Shows a graceful fallback link when the feed can't be loaded.
   * @param {HTMLElement} list
   */
  function renderBlogError(list) {
    list.textContent = '';
    const p = document.createElement('p');
    p.className = 'post-status';
    p.textContent = 'Couldn’t load recent posts right now — ';
    const a = document.createElement('a');
    a.href = 'https://blog.noprofits.org';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'visit the blog →';
    p.appendChild(a);
    list.appendChild(p);
  }

  /**
   * Fetches the Atom feed and renders the most recent posts. Runs at most once
   * per successful load; a failure leaves the state retryable.
   */
  async function loadBlogPosts() {
    if (blogState === 'loading' || blogState === 'done') return;

    const list = document.getElementById('blog-list');
    if (!list) return;

    blogState = 'loading';
    try {
      const res = await fetch(CONFIG.BLOG_FEED, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const doc = new DOMParser().parseFromString(await res.text(), 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('feed parse error');

      const entries = Array.from(doc.querySelectorAll('entry')).slice(0, CONFIG.BLOG_LIMIT);
      if (!entries.length) throw new Error('no entries in feed');

      renderPosts(list, entries);
      renderHomePreview(entries[0]);

      const count = document.getElementById('blog-count');
      if (count) count.textContent = `${entries.length} POSTS`;

      blogState = 'done';
    } catch (error) {
      console.warn('Blog feed load failed:', error);
      renderBlogError(list);
      blogState = 'error';
    }
  }

  /**
   * Initializes the application
   */
  function init() {
    try {
      cacheDOMElements();
      initThemeToggle();
      initMobileMenu();
      initTabs();
      loadBlogPosts(); // populate the Home blog-card preview + Blog tab list
    } catch (error) {
      console.error('Error initializing NoProfits.org:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    closeMenu,
    openMenu,
    toggleMenu,
    switchTab,
    toggleTheme,
    setTheme
  };
})();
