/**
 * lang.js — EN/UK toggle for Web Video Scheduler
 * ponytail: attribute scanning, no i18n lib, no JSON files
 *
 * Usage: add data-en="..." data-uk="..." to any element.
 * Call applyLang() after DOM mutations that add new translatable nodes.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'wvs_lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    document.querySelectorAll('[data-en]').forEach(function (el) {
      const text = el.getAttribute('data-' + lang);
      if (text !== null) {
        // Preserve child elements (e.g. <a> inside a <p>) — only swap if text-only node
        if (el.children.length === 0) {
          el.textContent = text;
        } else {
          // For mixed-content elements, use innerHTML if data attribute contains markup
          // ponytail: plain textContent for simple nodes, innerHTML only when markup present
          el.innerHTML = text;
        }
      }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-placeholder-en]').forEach(function (el) {
      const ph = el.getAttribute('data-placeholder-' + lang);
      if (ph !== null) el.placeholder = ph;
    });

    // Update all lang toggles to show opposite
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.textContent = lang === 'en' ? 'UK' : 'EN';
      btn.setAttribute('aria-label', lang === 'en' ? 'Switch to Ukrainian' : 'Switch to English');
    });

    // Update <html lang> attribute
    document.documentElement.lang = lang === 'uk' ? 'uk' : 'en';
  }

  function toggleLang() {
    // Route through public API so external patches (e.g. demo.js renderSlots/updateTV) fire
    window.wvsLang.apply(currentLang === 'en' ? 'uk' : 'en');
  }

  // Wire up all lang toggle buttons (present at init and added later)
  function wireToggles() {
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      if (!btn._wvsWired) {
        btn._wvsWired = true;
        btn.addEventListener('click', toggleLang);
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireToggles();
      applyLang(currentLang);
    });
  } else {
    wireToggles();
    applyLang(currentLang);
  }

  // Expose for demo.js to call after re-rendering slots
  window.wvsLang = {
    apply: applyLang,
    toggle: toggleLang,
    current: function () { return currentLang; },
    wire: wireToggles
  };
}());
