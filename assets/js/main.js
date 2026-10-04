/**
 * Ad Poison — site-wide behaviour.
 * Requires: assets/utils/helpers.js
 */
(function () {
  'use strict';

  var AP = window.AP;

  /* ---------- Console easter egg (same skull as humans.txt) ---------- */
  var SKULL = String.raw`
               _.---------------------._
          _.-'    *      \ | /      *    '-._
       .'   .           --(@)--           .   '.
     .'   \|/            / | \            \|/   '.
    /   --@--   .          .          .   --@--   \
   ;     /|\      *                 *      /|\     ;
   |       .-""""-.                 .-""""-.       |
   |  .   / .-''-. \               / .-''-. \   .  |
   | -*-  | ( @@ ) |               | ( @@ ) |  -*- |
   |  '   \ '-..-' /      / \      \ '-..-' /   '  |
   ;       '-....-'      (_^_)      '-....-'       ;
    \   .~@~.     *                 *     .~@~.   /
      \     ._.-._.-._.-._.-._.-._.-._.-._.     /
       \    |_|_|_|_|_|_|_|_|_|_|_|_|_|_|_|    /
        '.   '-'-'-'-'-'-'-'-'-'-'-'-'-'-'   .'
          '-._____________________________.-'
`;
  if (window.console && console.log) {
    console.log('%c' + SKULL, 'color:#ffd23f;font-family:monospace;font-size:12px;line-height:1.15');
    console.log(
      '%cA D   P O I S O N%c\nfeed the trackers garbage ~ dia de los datos\nNo trackers here. Read every line: https://github.com/CodePosse/AdPoison',
      'color:#ff5c9d;font-family:monospace;font-size:16px;font-weight:bold',
      'color:#2ec4b6;font-family:monospace;font-size:12px'
    );
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- External links: open safely in a new tab ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="http"]'), function (a) {
    if (a.host === location.host) return;
    a.setAttribute('target', '_blank');
    var rel = (a.getAttribute('rel') || '').split(' ');
    ['noopener', 'noreferrer'].forEach(function (r) { if (rel.indexOf(r) < 0) rel.push(r); });
    a.setAttribute('rel', rel.join(' ').trim());
    if (!a.querySelector('.sr-only')) {
      var sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = ' (opens in a new tab)';
      a.appendChild(sr);
    }
  });

  /* ---------- Copy buttons ----------
     <button class="copy-btn" data-copy-target="#id">  copies an element's text/value
     <button class="copy-btn" data-copy="literal text">  copies the literal          */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy-target], [data-copy]');
    if (!btn) return;
    var text = btn.getAttribute('data-copy');
    if (text === null) {
      var target = document.querySelector(btn.getAttribute('data-copy-target'));
      if (!target) return;
      text = 'value' in target && target.tagName !== 'PRE' ? target.value : target.textContent;
    }
    AP.copy(text.trim()).then(function (ok) {
      AP.toast(ok ? 'Copied to clipboard' : 'Copy failed: select and copy manually');
    });
  });

  /* ---------- Web Share API with clipboard fallback ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-share]'), function (btn) {
    btn.addEventListener('click', function () {
      var data = {
        title: document.title,
        text: btn.getAttribute('data-share-text') || (document.querySelector('meta[name="description"]') || {}).content || '',
        url: (document.querySelector('link[rel="canonical"]') || {}).href || location.href
      };
      if (navigator.share) {
        navigator.share(data).catch(function () { /* user cancelled */ });
      } else {
        AP.copy(data.url).then(function () { AP.toast('Link copied. Paste it anywhere!'); });
      }
    });
  });

  /* ---------- Mascot: click (or Space/Enter) to flap ---------- */
  var mascot = document.querySelector('.mascot');
  if (mascot) {
    var lines = ['Feed them noise!', 'Who are you, really?', 'Ad profile: corrupted.', 'Boo, trackers!', 'Flap flap.'];
    mascot.addEventListener('click', function () {
      mascot.classList.remove('is-flapping');
      void mascot.offsetWidth; // restart animation
      mascot.classList.add('is-flapping');
      var tip = document.querySelector('.mascot-tip');
      if (tip) tip.textContent = AP.pick(lines);
    });
    mascot.addEventListener('animationend', function () { mascot.classList.remove('is-flapping'); });
  }

  /* ---------- Persisted checklists ----------
     One or more <ul data-checklist="key"> sharing a key, checkboxes with unique values,
     optional progress bar: <div class="progress" data-progress-for="key"> */
  var checklistKeys = [];
  Array.prototype.forEach.call(document.querySelectorAll('[data-checklist]'), function (list) {
    var k = list.getAttribute('data-checklist');
    if (checklistKeys.indexOf(k) < 0) checklistKeys.push(k);
  });
  checklistKeys.forEach(function (name) {
    var key = 'checklist:' + name;
    var saved = AP.store.get(key, []);
    var boxes = document.querySelectorAll('[data-checklist="' + name + '"] input[type="checkbox"]');
    var bar = document.querySelector('[data-progress-for="' + name + '"]');
    var label = document.querySelector('[data-progress-label="' + name + '"]');

    function update() {
      var done = [];
      Array.prototype.forEach.call(boxes, function (b) { if (b.checked) done.push(b.value); });
      AP.store.set(key, done);
      var pct = boxes.length ? Math.round((done.length / boxes.length) * 100) : 0;
      if (bar) {
        bar.querySelector('.progress__bar').style.width = pct + '%';
        bar.setAttribute('aria-valuenow', String(pct));
      }
      if (label) label.textContent = done.length + ' of ' + boxes.length + ' done';
    }
    Array.prototype.forEach.call(boxes, function (b) {
      b.checked = saved.indexOf(b.value) >= 0;
      b.addEventListener('change', update);
    });
    var reset = document.querySelector('[data-checklist-reset="' + name + '"]');
    if (reset) {
      reset.addEventListener('click', function () {
        Array.prototype.forEach.call(boxes, function (b) { b.checked = false; });
        update();
        AP.toast('Checklist reset');
      });
    }
    update();
  });

  /* ---------- Privacy page: wipe local data ---------- */
  var wipe = document.getElementById('wipe-local');
  if (wipe) {
    wipe.addEventListener('click', function () {
      try {
        Object.keys(localStorage).filter(function (k) { return k.indexOf('adpoison:') === 0; })
          .forEach(function (k) { localStorage.removeItem(k); });
        AP.toast('All Ad Poison data wiped from this browser');
      } catch (e) {
        AP.toast('Storage is blocked here, so nothing was saved');
      }
    });
  }

  /* ---------- Footer year ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
