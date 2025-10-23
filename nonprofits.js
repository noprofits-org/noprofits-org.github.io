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
    DEFAULT_TAB: 'about'
  };

  // Cached DOM elements
  const DOM = {
    hamburger: null,
    navList: null,
    tabLinks: null,
    tabContents: null
  };

  /**
   * Caches frequently accessed DOM elements to improve performance
   */
  function cacheDOMElements() {
    DOM.hamburger = document.getElementById('hamburger');
    DOM.navList = document.querySelector('.nav-list');
    DOM.tabLinks = document.querySelectorAll(CONFIG.TAB_SELECTOR);
    DOM.tabContents = document.querySelectorAll(CONFIG.TAB_CONTENT_SELECTOR);
  }

  /**
   * Closes the mobile navigation menu and updates ARIA attributes
   */
  function closeMenu() {
    if (!DOM.navList || !DOM.hamburger) return;

    DOM.navList.classList.remove(CONFIG.SHOW_CLASS);
    DOM.hamburger.classList.remove(CONFIG.ACTIVE_CLASS);
    DOM.hamburger.setAttribute('aria-expanded', 'false');
  }

  /**
   * Opens the mobile navigation menu and updates ARIA attributes
   */
  function openMenu() {
    if (!DOM.navList || !DOM.hamburger) return;

    DOM.navList.classList.add(CONFIG.SHOW_CLASS);
    DOM.hamburger.classList.add(CONFIG.ACTIVE_CLASS);
    DOM.hamburger.setAttribute('aria-expanded', 'true');
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
    const tabLink = document.querySelector(`[data-tab="${tabId}"]`);

    if (!tabContent || !tabLink) {
      console.warn(`Tab "${tabId}" not found`);
      return;
    }

    // Remove active class from all tabs and content
    DOM.tabContents.forEach(content => content.classList.remove(CONFIG.ACTIVE_CLASS));
    DOM.tabLinks.forEach(link => link.classList.remove(CONFIG.ACTIVE_CLASS));

    // Activate the selected tab
    tabContent.classList.add(CONFIG.ACTIVE_CLASS);
    tabLink.classList.add(CONFIG.ACTIVE_CLASS);

    // Update ARIA attributes
    DOM.tabLinks.forEach(link => {
      const isActive = link === tabLink;
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

    // Focus management - focus the tab panel for screen readers
    tabContent.focus();
  }

  /**
   * Handles tab link click events
   * @param {Event} event - The click event
   */
  function handleTabClick(event) {
    event.preventDefault();
    const tabId = event.target.getAttribute('data-tab');
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
   * Initializes the mobile hamburger menu
   */
  function initMobileMenu() {
    if (!DOM.hamburger || !DOM.navList) {
      console.warn('Hamburger menu or nav list element not found');
      return;
    }

    // Toggle menu on hamburger click
    DOM.hamburger.addEventListener('click', toggleMenu);

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

  /**
   * Initializes the application
   */
  function init() {
    try {
      cacheDOMElements();
      initMobileMenu();
      initTabs();
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
    switchTab
  };
})();
