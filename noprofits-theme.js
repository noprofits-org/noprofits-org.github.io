/* vendored from noprofits-web-engineering/theme — v1.0.0 — do not edit here */
/* noprofits-theme v1.0.0 — companion JS (canonical; vendored with the CSS).
   1. Theme toggle: persists 'theme' in localStorage, drives <html data-theme>.
      Pair with the no-flash inline script in <head> (see snippet below).
   2. Off-canvas drawer wiring for .np-header__toggle / #np-drawer / .np-scrim.

   No-flash snippet — inline this in <head> BEFORE any stylesheet:
     <script>
       (function () {
         try {
           var t = localStorage.getItem('theme');
           if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
           document.documentElement.setAttribute('data-theme', t);
         } catch (e) { document.documentElement.setAttribute('data-theme', 'light'); }
       })();
     </script>
*/
(function () {
  'use strict';

  /* ---- Theme toggle (any element with [data-np-themetoggle]) ---- */
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* private mode */ }
    document.querySelectorAll('[data-np-themetoggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      var icon = btn.querySelector('[data-np-themeicon]');
      if (icon) icon.textContent = theme === 'dark' ? '☀︎' : '☽';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current);
    document.querySelectorAll('[data-np-themetoggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(now);
      });
    });

    /* ---- Off-canvas drawer (mobile nav) ---- */
    var toggle = document.querySelector('.np-header__toggle');
    var drawer = document.getElementById('np-drawer');
    var scrim = document.querySelector('[data-drawer-scrim]');
    if (!toggle || !drawer || !scrim) return;
    var closeBtn = drawer.querySelector('.np-drawer__close');

    function setOpen(open) {
      drawer.classList.toggle('is-open', open);
      scrim.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('np-no-scroll', open);
    }
    function open() { setOpen(true); if (closeBtn) closeBtn.focus(); }
    function close(returnFocus) { setOpen(false); if (returnFocus) toggle.focus(); }

    toggle.addEventListener('click', function () {
      toggle.getAttribute('aria-expanded') === 'true' ? close(true) : open();
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { close(true); });
    scrim.addEventListener('click', function () { close(false); });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { close(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close(true);
    });
  });
})();
