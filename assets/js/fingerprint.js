/**
 * Ad Poison — fingerprint check.
 * Reads the same signals fingerprinting scripts use, entirely inside this tab.
 * Nothing is sent anywhere. Only the per-signal hashes of the previous scan are
 * kept (localStorage) so the next scan can say what changed.
 * Requires: assets/utils/helpers.js
 */
(function () {
  'use strict';

  var AP = window.AP;
  var root = document.getElementById('fp');
  if (!root) return;

  var STORE_KEY = 'fingerprint:last';
  var statusEl = document.getElementById('fp-status');
  var verdictEl = document.getElementById('fp-verdict');
  var idEl = document.getElementById('fp-id');
  var movingEl = document.getElementById('fp-moving');
  var prevEl = document.getElementById('fp-prev');
  var rowsEl = document.getElementById('fp-rows');
  var avatar = document.getElementById('fp-avatar');
  var scanBtn = document.getElementById('fp-scan');
  var forgetBtn = document.getElementById('fp-forget');

  /* ---------- Hashing (non-cryptographic, 64-bit, cyrb53-style) ---------- */
  function hashCore(len, at) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < len; i++) {
      ch = at(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }
  function hash(str) { return hashCore(str.length, function (i) { return str.charCodeAt(i); }); }
  function hashBytes(arr) { return hashCore(arr.length, function (i) { return arr[i]; }); }

  /* ---------- Probes: each resolves to { value, detail } or null when blocked ---------- */

  function probeCanvas() {
    var c = document.createElement('canvas');
    c.width = 240;
    c.height = 60;
    var ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ff9f1c';
    ctx.fillRect(110, 2, 70, 22);
    ctx.fillStyle = '#2ec4b6';
    ctx.font = '15px Arial';
    ctx.fillText('Ad Poison fp-check ☠ 8bit', 4, 22);
    ctx.fillStyle = 'rgba(255, 92, 157, 0.7)';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('Dia de los datos 💀', 6, 50);
    ctx.globalCompositeOperation = 'multiply';
    ctx.beginPath();
    ctx.arc(204, 32, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#b18cff';
    ctx.fill();

    // Tor Browser and Firefox's resistFingerprinting hand back a blank image.
    var px = ctx.getImageData(0, 0, c.width, c.height).data;
    var blank = true;
    for (var i = 4; i < px.length; i++) {
      if (px[i] !== px[i % 4]) { blank = false; break; }
    }
    if (blank) return null;
    return { value: hash(c.toDataURL()), detail: '240×60 test drawing' };
  }

  function probeWebGL() {
    var c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return null;

    var dbg = gl.getExtension('WEBGL_debug_renderer_info');
    var gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    var gpuVendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    var params = [
      gpuVendor, gpu, gl.getParameter(gl.VERSION), gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      Array.prototype.join.call(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [], 'x'),
      Array.prototype.join.call(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) || [], '-'),
      gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS), gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      gl.getParameter(gl.MAX_VARYING_VECTORS), gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      (gl.getSupportedExtensions() || []).join(',')
    ].join('|');

    // Render a shaded triangle: tiny driver and GPU differences show up in the pixels.
    var pixels = '';
    try {
      var vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.0,1.0);}');
      gl.compileShader(vs);
      var fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, 'precision mediump float;varying vec2 v;void main(){gl_FragColor=vec4(v*0.5+0.5,sin(v.x*v.y*9.0)*0.5+0.5,1.0);}');
      gl.compileShader(fs);
      var prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.9, -0.8, 0.85, -0.9, 0.1, 0.95]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      var out = new Uint8Array(64 * 64 * 4);
      gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, out);
      pixels = hashBytes(out);
    } catch (e) { /* parameters alone still identify the GPU */ }

    return { value: hash(params + '|' + pixels), detail: String(gpu || 'GPU hidden') };
  }

  function probeAudio() {
    var Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Ctx) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var settled = false;
      function finish(result) { if (!settled) { settled = true; resolve(result); } }
      var timer = setTimeout(function () { finish(null); }, 2000);
      try {
        var ctx = new Ctx(1, 5000, 44100);
        var osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 10000;
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -50;
        comp.knee.value = 40;
        comp.ratio.value = 12;
        comp.attack.value = 0;
        comp.release.value = 0.25;
        osc.connect(comp);
        comp.connect(ctx.destination);
        osc.start(0);
        var done = function (buffer) {
          clearTimeout(timer);
          var data = buffer.getChannelData(0);
          var sum = 0;
          for (var i = 4500; i < 5000; i++) sum += Math.abs(data[i]);
          finish({ value: hash(String(sum)), detail: 'sum ' + sum.toPrecision(12) });
        };
        var rendering = ctx.startRendering();
        if (rendering && rendering.then) {
          rendering.then(done, function () { finish(null); });
        } else {
          ctx.oncomplete = function (e) { done(e.renderedBuffer); };
        }
      } catch (e) {
        finish(null);
      }
    });
  }

  var FONTS = [
    'Arial', 'Arial Black', 'Bahnschrift', 'Calibri', 'Cambria', 'Candara', 'Comic Sans MS', 'Consolas',
    'Constantia', 'Corbel', 'Courier New', 'Franklin Gothic Medium', 'Gabriola', 'Georgia', 'Impact',
    'Lucida Console', 'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    'Helvetica Neue', 'Lucida Grande', 'Menlo', 'Monaco', 'Palatino', 'Avenir', 'Futura', 'Gill Sans',
    'Optima', 'Didot', 'Baskerville', 'Ubuntu', 'DejaVu Sans', 'Liberation Sans', 'Noto Sans',
    'Cantarell', 'Fira Sans', 'Roboto', 'Open Sans', 'Source Sans Pro', 'Garamond', 'Rockwell',
    'MS Gothic', 'SimSun', 'Meiryo', 'Yu Gothic', 'Malgun Gothic', 'Microsoft YaHei', 'PingFang SC',
    'Hiragino Sans'
  ];

  function probeFonts() {
    var ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    var sample = 'mmmmmmmmmmlli WwQq@#é中';
    var bases = ['monospace', 'serif', 'sans-serif'];
    var baseWidths = bases.map(function (b) { ctx.font = '72px ' + b; return ctx.measureText(sample).width; });
    var found = FONTS.filter(function (f) {
      return bases.some(function (b, i) {
        ctx.font = '72px "' + f + '", ' + b;
        return ctx.measureText(sample).width !== baseWidths[i];
      });
    });
    return { value: hash(found.join(',')), detail: found.length + ' of ' + FONTS.length + ' test fonts found' };
  }

  function probeHardware() {
    var s = window.screen || {};
    var nav = navigator;
    var parts = [
      s.width + 'x' + s.height, s.availWidth + 'x' + s.availHeight, s.colorDepth,
      window.devicePixelRatio, nav.hardwareConcurrency, nav.deviceMemory, nav.maxTouchPoints, nav.platform
    ];
    var detail = s.width + '×' + s.height + ' @' + (Math.round((window.devicePixelRatio || 1) * 100) / 100) + 'x';
    if (nav.hardwareConcurrency) detail += ' · ' + nav.hardwareConcurrency + ' cores';
    if (nav.deviceMemory) detail += ' · ' + nav.deviceMemory + ' GB';
    return { value: hash(parts.join('|')), detail: detail };
  }

  function probeLocale() {
    var nav = navigator;
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
    var parts = [
      tz, new Date().getTimezoneOffset(), nav.language, (nav.languages || []).join(','),
      nav.userAgent, nav.doNotTrack, nav.globalPrivacyControl, nav.cookieEnabled, nav.pdfViewerEnabled
    ];
    return { value: hash(parts.join('|')), detail: (tz || 'time zone hidden') + ' · ' + (nav.language || '?') };
  }

  var SIGNALS = [
    { key: 'canvas', name: 'Canvas', what: 'How your machine draws text and shapes', run: probeCanvas, recheck: true },
    { key: 'webgl', name: 'WebGL', what: 'Your graphics card and driver', run: probeWebGL, recheck: true },
    { key: 'audio', name: 'Audio', what: 'How your audio stack processes a test tone', run: probeAudio, recheck: true },
    { key: 'fonts', name: 'Fonts', what: 'Which fonts are installed', run: probeFonts, recheck: true },
    { key: 'hardware', name: 'Screen & hardware', what: 'Screen size, pixel ratio, CPU cores, memory', run: probeHardware },
    { key: 'locale', name: 'Locale & software', what: 'Time zone, languages, user agent', run: probeLocale }
  ];

  function safeRun(fn) {
    try { return Promise.resolve(fn()).catch(function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }

  /* ---------- Pixel skull drawn from the fingerprint ID ---------- */
  var SKULL = [
    '..#####..',
    '.#ddddd#.',
    '#ddddddd#',
    '#oo#d#oo#',
    '#oo#d#oo#',
    '#dd#n#dd#',
    '.#ddddd#.',
    '..#n#n#..',
    '..#####..'
  ];
  var COLORS = ['#ff9f1c', '#ff5c9d', '#2ec4b6', '#ffd23f', '#7bd389', '#b18cff', '#ff6b6b'];

  function drawSkull(id) {
    if (!avatar || !avatar.getContext) return;
    var ctx = avatar.getContext('2d');
    var bits = parseInt(hash(id + 'a').slice(0, 12), 16).toString(2).padStart(48, '0');
    var pick = hash(id + 'b');
    var accentA = COLORS[parseInt(pick[0], 16) % COLORS.length];
    var accentB = COLORS[(parseInt(pick[1], 16) % (COLORS.length - 1) + 1 + COLORS.indexOf(accentA)) % COLORS.length];
    var eyes = COLORS[parseInt(pick[2], 16) % COLORS.length];
    ctx.clearRect(0, 0, 9, 9);
    SKULL.forEach(function (row, y) {
      row.split('').forEach(function (cell, x) {
        var mx = Math.min(x, 8 - x);
        var color = null;
        if (cell === '#') color = '#f4ecd8';
        else if (cell === 'n') color = '#1a0f1f';
        else if (cell === 'o') color = eyes;
        else if (cell === 'd') {
          var i = y * 5 + mx;
          color = bits[i] === '1' ? (bits[(i + 23) % 48] === '1' ? accentA : accentB) : '#f4ecd8';
        }
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      });
    });
  }

  /* ---------- Rendering ---------- */
  function pill(text, cls) {
    var span = document.createElement('span');
    span.className = 'pill' + (cls ? ' ' + cls : '');
    span.textContent = text;
    return span;
  }

  function cell(tag, content) {
    var el = document.createElement(tag);
    if (tag === 'th') el.setAttribute('scope', 'row');
    if (typeof content === 'string') el.textContent = content;
    else if (content) el.appendChild(content);
    return el;
  }

  function formatId(h) {
    return h.slice(0, 12).toUpperCase().replace(/(.{4})(?=.)/g, '$1-');
  }

  function render(results, prev) {
    rowsEl.textContent = '';
    var moving = 0;
    var changed = 0;
    var noisy = 0;
    var blocked = 0;

    results.forEach(function (r) {
      var tr = document.createElement('tr');
      var name = cell('th');
      var strong = document.createElement('strong');
      strong.textContent = r.signal.name;
      var small = document.createElement('small');
      small.className = 'muted';
      small.textContent = r.signal.what;
      name.appendChild(strong);
      name.appendChild(document.createElement('br'));
      name.appendChild(small);
      tr.appendChild(name);

      if (!r.result) {
        blocked++;
        moving++;
        tr.appendChild(cell('td', pill('Blocked')));
        tr.appendChild(cell('td', '—'));
        tr.appendChild(cell('td', '—'));
        tr.appendChild(cell('td', 'Your browser refused or blanked this read.'));
        rowsEl.appendChild(tr);
        return;
      }

      var code = document.createElement('code');
      code.textContent = r.result.value;
      tr.appendChild(cell('td', code));

      var before = prev && prev.h ? prev.h[r.signal.key] : undefined;
      var vs;
      if (before === undefined) vs = pill('First scan', 'pill--new');
      else if (before === r.result.value) vs = pill('Same', 'pill--no');
      else { vs = pill('Changed'); changed++; }
      tr.appendChild(cell('td', vs));

      var reading;
      if (!r.signal.recheck) reading = '—';
      else if (r.noisy) { reading = pill('Noisy', 'pill--noise'); noisy++; }
      else reading = pill('Stable', 'pill--no');
      tr.appendChild(cell('td', reading));

      if (r.noisy || (before !== undefined && before !== r.result.value)) moving++;
      tr.appendChild(cell('td', r.result.detail));
      rowsEl.appendChild(tr);
    });

    return { moving: moving, changed: changed, noisy: noisy, blocked: blocked };
  }

  function verdict(stats, prev, isBrave) {
    var lines = [];
    if (!prev) {
      lines.push('First scan saved. Now fully close your browser (every window), reopen it, come back here and scan again. That shows whether your fingerprint survives a new session.');
    } else if (stats.changed === 0 && stats.noisy === 0 && stats.blocked === 0) {
      lines.push('Nothing changed since your previous scan. If you restarted your browser in between, your fingerprint is stable, which means trackers can follow you without cookies. The exception is Tor Browser and Mullvad Browser: there, a stable fingerprint is shared with every other user.');
    } else if (stats.changed > 0) {
      lines.push(stats.changed + ' signal' + (stats.changed === 1 ? '' : 's') + ' changed since your previous scan. If you didn’t change your screen, fonts or browser settings, your browser is randomizing them, and trackers can’t link today’s visit to the last one by fingerprint alone.');
    }
    if (stats.noisy > 0) {
      lines.push('Fresh noise is added on every read (' + stats.noisy + ' signal' + (stats.noisy === 1 ? '' : 's') + '). Trackers can’t get a stable value, though some scripts can spot that noise is present.');
    }
    if (stats.blocked > 0) {
      lines.push(stats.blocked + ' signal' + (stats.blocked === 1 ? ' was' : 's were') + ' blocked or blanked outright.');
    }
    if (isBrave) lines.push('Brave detected: its fingerprint randomization is on by default and changes each session and per site.');
    return lines.join(' ');
  }

  function readOnce() {
    return Promise.all(SIGNALS.map(function (s) { return safeRun(s.run); }));
  }

  function scan() {
    scanBtn.disabled = true;
    statusEl.setAttribute('data-state', 'running');
    statusEl.textContent = 'Scanning…';
    var prev = AP.store.get(STORE_KEY, null);
    var isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function'
      ? navigator.brave.isBrave().catch(function () { return false; })
      : Promise.resolve(false);

    // Two passes: if a signal differs between back-to-back reads, the browser is adding per-read noise.
    Promise.all([readOnce(), readOnce(), isBrave]).then(function (out) {
      var first = out[0], second = out[1];
      var results = SIGNALS.map(function (s, i) {
        var a = first[i], b = second[i];
        return { signal: s, result: a, noisy: !!(s.recheck && a && b && a.value !== b.value) };
      });

      var combined = hash(results.map(function (r) { return r.result ? r.result.value : 'x'; }).join('|'));
      var id = formatId(combined);
      var stats = render(results, prev);

      idEl.textContent = id;
      movingEl.textContent = stats.moving + ' / ' + SIGNALS.length;
      prevEl.textContent = prev && prev.t ? new Date(prev.t).toLocaleString() : 'None';
      drawSkull(combined);
      if (avatar) avatar.setAttribute('aria-label', 'Pixel sugar skull generated from fingerprint ID ' + id);
      verdictEl.textContent = verdict(stats, prev, out[2] === true);

      var save = { t: Date.now(), h: {} };
      results.forEach(function (r) { if (r.result) save.h[r.signal.key] = r.result.value; });
      AP.store.set(STORE_KEY, save);

      statusEl.setAttribute('data-state', 'idle');
      statusEl.textContent = 'Scan complete. ID ' + id + '.';
      scanBtn.disabled = false;
    }).catch(function () {
      statusEl.setAttribute('data-state', 'error');
      statusEl.textContent = 'The scan failed in this browser.';
      scanBtn.disabled = false;
    });
  }

  scanBtn.addEventListener('click', scan);
  forgetBtn.addEventListener('click', function () {
    AP.store.remove(STORE_KEY);
    prevEl.textContent = 'None';
    AP.toast('Previous scan forgotten');
  });

  scan();
})();
