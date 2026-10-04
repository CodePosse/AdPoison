/**
 * Ad Poison — hosts-file builder.
 * Requires: assets/utils/helpers.js, assets/utils/blocklists.js
 */
(function () {
  'use strict';

  var AP = window.AP;
  var root = document.getElementById('hosts-builder');
  if (!root || !AP || !AP.blocklists) return;

  var groupsEl = root.querySelector('#hosts-groups');
  var output = root.querySelector('#hosts-output');
  var countEl = root.querySelector('#hosts-count');
  var targetSel = root.querySelector('#hosts-target');
  var ipv6Box = root.querySelector('#hosts-ipv6');
  var customEl = root.querySelector('#hosts-custom');

  var saved = AP.store.get('hosts-groups', null);

  /* ---------- Render group checkboxes ---------- */
  AP.blocklists.forEach(function (g) {
    var label = document.createElement('label');
    label.className = 'check';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'group';
    input.value = g.id;
    input.checked = saved ? saved.indexOf(g.id) >= 0 : g.on;
    var span = document.createElement('span');
    span.appendChild(document.createTextNode(g.name + ' (' + g.hosts.length + ')'));
    if (g.breaks) {
      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = 'may break';
      span.appendChild(tag);
    }
    var small = document.createElement('small');
    small.textContent = g.note + (g.breaks ? ' Heads up: ' + g.breaks : '');
    span.appendChild(small);
    label.appendChild(input);
    label.appendChild(span);
    groupsEl.appendChild(label);
  });

  var customSaved = AP.store.get('hosts-custom', '');
  if (customSaved) customEl.value = customSaved;

  /* ---------- Build ---------- */
  var HOST_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

  function build() {
    var chosen = [];
    var selected = [];
    Array.prototype.forEach.call(groupsEl.querySelectorAll('input:checked'), function (c) { selected.push(c.value); });
    AP.store.set('hosts-groups', selected);
    AP.store.set('hosts-custom', customEl.value);

    var ip = targetSel.value;
    var lines = [
      '# >>> Ad Poison hosts block >>>',
      '# Generated ' + new Date().toISOString().slice(0, 10) + ' at ' + location.host + location.pathname,
      '# Remove everything between the >>> and <<< markers to undo.'
    ];
    var seen = {};
    AP.blocklists.forEach(function (g) {
      if (selected.indexOf(g.id) < 0) return;
      lines.push('', '# ' + g.name);
      g.hosts.forEach(function (h) {
        if (seen[h]) return;
        seen[h] = true;
        chosen.push(h);
        lines.push(ip + ' ' + h);
        if (ipv6Box.checked) lines.push(':: ' + h);
      });
    });

    var custom = customEl.value.split(/[\s,]+/).map(function (s) {
      return s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    }).filter(function (s) { return s && HOST_RE.test(s) && !seen[s]; });
    if (custom.length) {
      lines.push('', '# Your custom entries');
      custom.forEach(function (h) {
        seen[h] = true;
        chosen.push(h);
        lines.push(ip + ' ' + h);
        if (ipv6Box.checked) lines.push(':: ' + h);
      });
    }

    lines.push('', '# <<< Ad Poison hosts block <<<', '');
    output.value = lines.join('\n');
    countEl.textContent = chosen.length + ' hostnames';
  }

  root.addEventListener('change', build);
  customEl.addEventListener('input', build);

  root.querySelector('#hosts-all').addEventListener('click', function () {
    Array.prototype.forEach.call(groupsEl.querySelectorAll('input'), function (c) { c.checked = true; });
    build();
  });
  root.querySelector('#hosts-safe').addEventListener('click', function () {
    Array.prototype.forEach.call(groupsEl.querySelectorAll('input'), function (c) {
      var g = AP.blocklists.filter(function (x) { return x.id === c.value; })[0];
      c.checked = !g.breaks;
    });
    build();
  });
  root.querySelector('#hosts-download').addEventListener('click', function () {
    AP.download('adpoison-hosts.txt', output.value);
    AP.toast('Downloaded adpoison-hosts.txt');
  });

  build();
})();
