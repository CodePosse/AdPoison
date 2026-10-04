/**
 * Ad Poison — shared helpers.
 * Classic script (no modules) so pages also work when opened from disk.
 * Exposes a single global: window.AP
 */
(function (global) {
  'use strict';

  var AP = global.AP || {};

  /** Safe localStorage wrapper (private mode / blocked storage never throws). */
  AP.store = {
    get: function (key, fallback) {
      try {
        var raw = global.localStorage.getItem('adpoison:' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        global.localStorage.setItem('adpoison:' + key, JSON.stringify(value));
      } catch (e) { /* ignore */ }
    },
    remove: function (key) {
      try { global.localStorage.removeItem('adpoison:' + key); } catch (e) { /* ignore */ }
    }
  };

  /** Pixel toast, announced politely to screen readers. */
  var toastEl, toastTimer;
  AP.toast = function (message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  };

  /** Copy text to the clipboard with a legacy fallback. Returns a Promise<boolean>. */
  AP.copy = function (text) {
    if (navigator.clipboard && global.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  };
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  /** Trigger a text-file download. */
  AP.download = function (filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  /** Random helpers. Uses crypto when available. */
  AP.rand = function () {
    if (global.crypto && global.crypto.getRandomValues) {
      var a = new Uint32Array(1);
      global.crypto.getRandomValues(a);
      return a[0] / 4294967296;
    }
    return Math.random();
  };
  AP.pick = function (list) { return list[Math.floor(AP.rand() * list.length)]; };
  AP.between = function (min, max) { return min + AP.rand() * (max - min); };

  /** Zero-padded HH:MM:SS. */
  AP.clock = function (d) {
    d = d || new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
  };

  global.AP = AP;
})(window);
