/**
 * Ad Poison — chaff generator.
 *
 * Opens ONE dedicated browser window (requires a user click, so the popup
 * blocker allows it) and steers it to random searches and pages at jittered
 * intervals. Because it's a real top-level window, the visits carry your
 * normal first-party cookies — which is exactly what ad profiles are built from.
 *
 * Requires: assets/utils/helpers.js, assets/utils/wordbank.js
 */
(function () {
  'use strict';

  var AP = window.AP;
  var root = document.getElementById('chaff');
  if (!root || !AP || !AP.wordbank) return;

  /* Destinations.
     `ping: true` marks sites that send Cross-Origin-Opener-Policy headers
     (Google, YouTube). Navigating the chaff window there would sever our
     handle to it, so those hops go out as background requests from a hidden
     iframe instead. They carry whatever cookies your browser allows for
     third-party requests. Everything else is a full first-party visit. */
  var enc = encodeURIComponent;
  var DESTINATIONS = {
    google:    { label: 'Google',  ping: true, url: function (q) { return 'https://www.google.com/search?q=' + enc(q); } },
    youtube:   { label: 'YouTube', ping: true, url: function (q) { return 'https://www.youtube.com/results?search_query=' + enc(q); } },
    news:      { label: 'G News',  ping: true, url: function (q) { return 'https://news.google.com/search?q=' + enc(q); } },
    bing:      { label: 'Bing',    url: function (q) { return 'https://www.bing.com/search?q=' + enc(q); } },
    amazon:    { label: 'Amazon',  url: function (q) { return 'https://www.amazon.com/s?k=' + enc(q); } },
    etsy:      { label: 'Etsy',    url: function (q) { return 'https://www.etsy.com/search?q=' + enc(q); } },
    wikipedia: { label: 'Wiki',    url: function () { return 'https://en.wikipedia.org/wiki/Special:Random'; }, noQuery: true },
    duck:      { label: 'DDG',     url: function (q) { return 'https://duckduckgo.com/?q=' + enc(q); } }
  };
  var needsWindow = function (dest) { return dest.some(function (k) { return !DESTINATIONS[k].ping; }); };

  /* ---------- Elements ---------- */
  var $ = function (sel) { return root.querySelector(sel); };
  var form = $('#chaff-form');
  var startBtn = $('#chaff-start');
  var stopBtn = $('#chaff-stop');
  var previewBtn = $('#chaff-preview');
  var shuffleBtn = $('#chaff-shuffle');
  var personaSelect = $('#chaff-persona');
  var paceInput = $('#chaff-pace');
  var paceOut = $('#chaff-pace-out');
  var durationSelect = $('#chaff-duration');
  var statusEl = $('#chaff-status');
  var personaCard = $('#chaff-persona-card');
  var logEl = $('#chaff-log');
  var statHops = $('#stat-hops');
  var statTime = $('#stat-time');
  var statNext = $('#stat-next');

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---------- Populate persona select ---------- */
  AP.wordbank.personas.forEach(function (p) {
    var o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name;
    personaSelect.appendChild(o);
  });

  /* ---------- Restore settings ---------- */
  var saved = AP.store.get('chaff-settings', null);
  if (saved) {
    if (saved.mode) { var r = form.querySelector('input[name="mode"][value="' + saved.mode + '"]'); if (r) r.checked = true; }
    if (saved.persona) personaSelect.value = saved.persona;
    if (saved.pace) paceInput.value = saved.pace;
    if (saved.duration) durationSelect.value = saved.duration;
    if (saved.dest) {
      Array.prototype.forEach.call(form.querySelectorAll('input[name="dest"]'), function (c) { c.checked = saved.dest.indexOf(c.value) >= 0; });
    }
  }

  function settings() {
    var dest = [];
    Array.prototype.forEach.call(form.querySelectorAll('input[name="dest"]:checked'), function (c) { dest.push(c.value); });
    return {
      mode: (form.querySelector('input[name="mode"]:checked') || {}).value || 'persona',
      persona: personaSelect.value,
      pace: Number(paceInput.value),
      duration: Number(durationSelect.value),
      dest: dest
    };
  }
  function persist() { AP.store.set('chaff-settings', settings()); }

  function renderPace() { paceOut.textContent = '~' + paceInput.value + 's'; }
  paceInput.addEventListener('input', renderPace);
  form.addEventListener('change', function () { persist(); syncModeUI(); });
  renderPace();

  /* ---------- Persona handling ---------- */
  var activePersona = null;
  function choosePersona() {
    var id = personaSelect.value;
    var list = AP.wordbank.personas;
    if (id === 'random') {
      var options = list.filter(function (p) { return !activePersona || p.id !== activePersona.id; });
      activePersona = AP.pick(options);
    } else {
      activePersona = list.filter(function (p) { return p.id === id; })[0] || AP.pick(list);
    }
    renderPersona();
  }
  function renderPersona() {
    var mode = settings().mode;
    if (mode === 'chaos') {
      personaCard.innerHTML = '<strong>Chaos mode:</strong> every hop is a different random interest.';
    } else if (activePersona) {
      personaCard.innerHTML = '';
      var s = document.createElement('strong');
      s.textContent = 'Playing: ' + activePersona.name + '. ';
      personaCard.appendChild(s);
      personaCard.appendChild(document.createTextNode(activePersona.blurb));
    }
  }
  function syncModeUI() {
    var chaos = settings().mode === 'chaos';
    personaSelect.disabled = chaos;
    shuffleBtn.disabled = chaos;
    if (!chaos && (!activePersona || (personaSelect.value !== 'random' && personaSelect.value !== activePersona.id))) choosePersona();
    renderPersona();
  }
  shuffleBtn.addEventListener('click', function () {
    personaSelect.value = 'random';
    choosePersona();
    persist();
    AP.toast('New persona: ' + activePersona.name);
  });

  function nextQuery(mode) {
    var wb = AP.wordbank;
    if (mode === 'chaos') {
      if (AP.rand() < 0.5) return AP.pick(AP.pick(wb.personas).queries);
      return AP.pick(wb.modifiers) + ' ' + AP.pick(wb.randomNouns);
    }
    if (!activePersona) choosePersona();
    return AP.pick(activePersona.queries);
  }

  function nextHop(cfg) {
    var key = AP.pick(cfg.dest);
    var d = DESTINATIONS[key];
    var q = d.noQuery ? 'random article' : nextQuery(cfg.mode);
    return { key: key, label: d.label, query: q, url: d.url(q) };
  }

  /* ---------- Log ---------- */
  function log(source, text, cls) {
    var li = document.createElement('li');
    if (cls) li.className = cls;
    var t = document.createElement('time');
    t.textContent = AP.clock();
    var s = document.createElement('span');
    s.className = 'src';
    s.textContent = source;
    var m = document.createElement('span');
    m.textContent = text;
    li.appendChild(t); li.appendChild(s); li.appendChild(m);
    logEl.insertBefore(li, logEl.firstChild);
    while (logEl.children.length > 60) logEl.removeChild(logEl.lastChild);
  }
  function setStatus(text, state) {
    statusEl.textContent = text;
    statusEl.setAttribute('data-state', state || 'idle');
  }
  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  /* ---------- Engine ----------
     A tiny worker ticks once per second. Worker timers are throttled far
     less than page timers when this tab is in the background. */
  var ticker = null;
  function startTicker(fn) {
    try {
      var src = 'setInterval(function(){postMessage(0)},1000);';
      var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      var w = new Worker(url);
      w.onmessage = fn;
      URL.revokeObjectURL(url);
      ticker = { stop: function () { w.terminate(); } };
    } catch (e) {
      var id = setInterval(fn, 1000);
      ticker = { stop: function () { clearInterval(id); } };
    }
  }

  var state = { running: false, win: null, hops: 0, startedAt: 0, nextAt: 0, endsAt: 0, cfg: null, last: null };

  function scheduleNext() {
    var base = state.cfg.pace;
    var jitter = AP.between(0.6, 1.4); // +/-40% so the rhythm isn't robotic
    state.nextAt = Date.now() + base * jitter * 1000;
  }

  function tick() {
    if (!state.running) return;
    var now = Date.now();
    if (state.win && state.win.closed) {
      // Either you closed it, or the last site isolated itself with COOP.
      var recent = state.last && !DESTINATIONS[state.last.key].ping && now - state.last.at < 8000;
      stop(recent
        ? 'Lost the chaff window right after ' + state.last.label + '. That site may block remote control: untick it and press Start again.'
        : 'Chaff window was closed.');
      return;
    }
    if (state.endsAt && now >= state.endsAt) { stop('Session complete. Nice work.'); return; }
    statTime.textContent = fmt((now - state.startedAt) / 1000);
    statNext.textContent = fmt((state.nextAt - now) / 1000);
    if (now >= state.nextAt) hop();
  }

  /** Background request from a hidden, sandboxed iframe (cleaned up after a while). */
  function ping(url) {
    var f = document.createElement('iframe');
    f.src = url;
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('tabindex', '-1');
    f.setAttribute('referrerpolicy', 'no-referrer');
    f.setAttribute('sandbox', ''); // never let a destination run code inside this page
    f.style.cssText = 'position:absolute;width:1px;height:1px;border:0;left:-9999px;top:0;visibility:hidden';
    document.body.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 20000);
  }

  function hop() {
    var h = nextHop(state.cfg);
    var d = DESTINATIONS[h.key];
    if (d.ping || !state.win) {
      ping(h.url);
      log(h.label, h.query + ' · ping');
    } else {
      try {
        state.win.location.href = h.url;
      } catch (e) {
        log('ERR', 'Could not steer the window: ' + e.message, 'err');
        stop('Lost control of the chaff window.');
        return;
      }
      log(h.label, h.query);
    }
    state.last = { key: h.key, label: h.label, at: Date.now() };
    state.hops++;
    statHops.textContent = String(state.hops);
    scheduleNext();
  }

  function writeLobby(win) {
    try {
      win.document.title = 'Ad Poison chaff window';
      win.document.body.style.cssText = 'margin:0;display:grid;place-items:center;height:100vh;background:#16091f;color:#f4ecd8;font:20px/1.4 monospace;text-align:center;padding:24px';
      win.document.body.innerHTML = '<div><p style="font-size:28px;color:#ffd23f">AD POISON</p><p>This window is the chaff window.<br>Leave it open (minimizing is fine).<br>Close it any time to stop.</p></div>';
    } catch (e) { /* cross-origin already: ignore */ }
  }

  function start() {
    var cfg = settings();
    if (!cfg.dest.length) {
      setStatus('Pick at least one destination first.', 'error');
      AP.toast('Pick at least one destination');
      return;
    }
    // Only open a window if at least one destination gets full visits.
    // Must run synchronously inside the click handler to pass popup blockers.
    var win = null;
    if (needsWindow(cfg.dest)) {
      win = window.open('about:blank', 'adpoison-chaff', 'popup=yes,width=980,height=720,left=40,top=40');
      if (!win) {
        setStatus('Popup blocked. Allow popups for this site, then press Start again.', 'error');
        log('SYS', 'Popup blocked by the browser.', 'err');
        return;
      }
      writeLobby(win);
    }
    if (cfg.mode !== 'chaos') choosePersona();

    state = { running: true, win: win, hops: 0, startedAt: Date.now(), nextAt: Date.now() + 2500, endsAt: cfg.duration ? Date.now() + cfg.duration * 60000 : 0, cfg: cfg, last: null };
    statHops.textContent = '0';
    startBtn.disabled = true;
    stopBtn.disabled = false;
    form.setAttribute('aria-disabled', 'true');
    Array.prototype.forEach.call(form.elements, function (el) { el.disabled = true; });
    setStatus(win ? 'Running. Chaff window is live.' : 'Running in the background (ping-only destinations).', 'running');
    log('SYS', 'Session started' + (cfg.mode === 'chaos' ? ' in chaos mode.' : ' as ' + activePersona.name + '.'));
    startTicker(tick);
    window.focus();
  }

  function stop(reason) {
    if (!state.running) return;
    state.running = false;
    if (ticker) { ticker.stop(); ticker = null; }
    try { if (state.win && !state.win.closed) state.win.close(); } catch (e) { /* ignore */ }
    state.win = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    form.removeAttribute('aria-disabled');
    Array.prototype.forEach.call(form.elements, function (el) { el.disabled = false; });
    syncModeUI();
    statNext.textContent = '-';
    setStatus((reason || 'Stopped.') + ' ' + state.hops + ' hop' + (state.hops === 1 ? '' : 's') + ' of noise sent.', 'idle');
    log('SYS', reason || 'Stopped by you.');
    var total = AP.store.get('lifetime-hops', 0) + state.hops;
    AP.store.set('lifetime-hops', total);
  }

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', function () { stop('Stopped by you.'); });
  previewBtn.addEventListener('click', function () {
    var cfg = settings();
    if (!cfg.dest.length) { AP.toast('Pick at least one destination'); return; }
    if (cfg.mode !== 'chaos' && !activePersona) choosePersona();
    for (var i = 0; i < 5; i++) {
      var h = nextHop(cfg);
      log(h.label, h.query + ' (preview)', 'preview');
    }
    setStatus('Preview only. Nothing was opened.', 'idle');
  });

  // If this page goes away, take the chaff window with it.
  window.addEventListener('pagehide', function () { if (state.running) stop('Page closed.'); });

  syncModeUI();
  setStatus('Ready. Press Start to open the chaff window.', 'idle');
})();
