/* TalentVerse Play Zone engine — 3 games + leaderboard + network. Vanilla JS, no dependencies. */
(function () {
  var D = window.PZ_DATA, root = document.getElementById('pz');
  if (!D || !root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var rnd = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var store = { g: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, s: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var timers = [];
  function clearTimers() { timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = []; }
  function lang() { try { if (typeof getLang === 'function') return getLang() === 'bn' ? 'bn' : 'en'; } catch (e) {} return store.g('pz_lang') === 'bn' ? 'bn' : 'en'; }
  var N = function () { return window.TVNet; };
  var bn = function (n) { return lang() === 'bn' ? String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }) : String(n); };

  var T = {
    en: { memory: 'Memory Match', scramble: 'Word Scramble', rush: 'True / False Rush', lb: 'Leaderboard', net: 'Our Network',
      dMemory: 'Flip cards and match each country with its capital.', dScramble: 'Unscramble as many words as you can in 90 seconds.', dRush: 'True or false? Answer as many as you can in 45 seconds.',
      tabGames: 'Games', tabRank: 'Ranking', tabNet: 'Network', best: 'Best', play: 'Play', again: 'Play again', home: 'All games', score: 'Score', time: 'Time', moves: 'Moves', words: 'Words', streak: 'Streak',
      nick: 'Your nickname', nickAsk: 'Choose a nickname to appear on the leaderboard.', save: 'Save', skip: 'Play without leaderboard',
      hint: 'Hint', clear: 'Clear', back: '⌫', skipW: 'Skip', t: 'TRUE', f: 'FALSE', done: 'Finished!', newbest: '🎉 New personal best!',
      saved: 'Saved to the leaderboard ✓', offline: 'Could not reach the leaderboard — your score is kept on this phone.', nonick: 'Set a nickname to join the leaderboard.',
      all: 'All sites', here: 'This site', rank: 'Rank', empty: 'No scores yet — be the first!', share: 'Share', copied: 'Copied!', you: 'You', visit: 'Visit', hereTag: 'You are here',
      netT: 'Our Network', topT: 'Network Top Member', topM: 'Most active member across all our sites', netD: 'Sites connected through TalentVerse Network. One leaderboard, many communities.', loading: 'Loading…', change: 'change', shareT: 'I scored {s} in {g}! Can you beat me?' },
    bn: { memory: 'মেমোরি ম্যাচ', scramble: 'শব্দ সাজাও', rush: 'সত্য / মিথ্যা রাশ', lb: 'লিডারবোর্ড', net: 'আমাদের নেটওয়ার্ক',
      dMemory: 'কার্ড উল্টে প্রতিটা দেশের সঙ্গে তার রাজধানী মেলাও।', dScramble: '৯০ সেকেন্ডে যত পারো এলোমেলো শব্দ সাজাও।', dRush: 'সত্য না মিথ্যা? ৪৫ সেকেন্ডে যত পারো উত্তর দাও।',
      tabGames: 'গেম', tabRank: 'র‍্যাংক', tabNet: 'নেটওয়ার্ক', best: 'সেরা', play: 'খেলো', again: 'আবার খেলো', home: 'সব খেলা', score: 'স্কোর', time: 'সময়', moves: 'চাল', words: 'শব্দ', streak: 'ধারা',
      nick: 'তোমার ডাকনাম', nickAsk: 'লিডারবোর্ডে দেখানোর জন্য একটা ডাকনাম দাও।', save: 'সেভ', skip: 'লিডারবোর্ড ছাড়াই খেলি',
      hint: 'ইঙ্গিত', clear: 'মুছো', back: '⌫', skipW: 'বাদ', t: 'সত্য', f: 'মিথ্যা', done: 'শেষ!', newbest: '🎉 নতুন ব্যক্তিগত রেকর্ড!',
      saved: 'লিডারবোর্ডে সেভ হয়েছে ✓', offline: 'লিডারবোর্ডে পৌঁছানো যায়নি — স্কোর এই ফোনে রাখা হলো।', nonick: 'লিডারবোর্ডে আসতে একটা ডাকনাম দাও।',
      all: 'সব সাইট', here: 'এই সাইট', rank: 'র‍্যাংক', empty: 'এখনো কোনো স্কোর নেই — প্রথম হও!', share: 'শেয়ার', copied: 'কপি হয়েছে!', you: 'তুমি', visit: 'দেখো', hereTag: 'তুমি এখানে আছো',
      netT: 'আমাদের নেটওয়ার্ক', topT: 'নেটওয়ার্ক টপ মেম্বার', topM: 'আমাদের সব সাইটে সবচেয়ে সক্রিয় সদস্য', netD: 'TalentVerse Network-এর মাধ্যমে যুক্ত সাইটগুলো। একটা লিডারবোর্ড, অনেক কমিউনিটি।', loading: 'লোড হচ্ছে…', change: 'বদলাও', shareT: 'আমি {g}-এ {s} স্কোর করেছি! তুমি হারাতে পারবে?' }
  };
  var t = function (k) { return T[lang()][k] || k; };
  var ICON = { memory: '🧠', scramble: '🔤', rush: '⚡' };
  var cur = 'home', lbGame = 'memory', lbScope = 'all';

  /* ---------- shell ---------- */
  function shell() {
    var n = N(), name = n ? n.getName() : (store.g('tvnet_name') || '');
    root.innerHTML =
      '<div class="pz-top"><button class="pz-chip" id="pzName">👤 <span>' + (name ? '<b>' + esc(name) + '</b> · ' + t('change') : t('nick')) + '</span></button>' + (typeof getLang === 'function' ? '' : '<button class="pz-chip" id="pzLang">🌐 ' + (lang() === 'bn' ? 'English' : 'বাংলা') + '</button>') + '</div>' +
      '<div class="pz-tabs" id="pzTabs">' +
      ['home', 'lb', 'net'].map(function (k) { return '<button class="pz-tab' + (cur === k || (k === 'home' && ['memory', 'scramble', 'rush'].indexOf(cur) > -1) ? ' on' : '') + '" data-t="' + k + '">' + (k === 'home' ? '🎮 ' + t('tabGames') : k === 'lb' ? '🏆 ' + t('tabRank') : '🌐 ' + t('tabNet')) + '</button>'; }).join('') +
      '</div><div id="pzBody"></div>';
    $('#pzName').onclick = function () { askName(function () { go(cur); }); };
    var lb = $('#pzLang'); if (lb) lb.onclick = function () { store.s('pz_lang', lang() === 'bn' ? 'en' : 'bn'); go(cur); };
    $('#pzTabs').onclick = function (e) { var b = e.target.closest('[data-t]'); if (b) go(b.dataset.t); };
  }
  function go(view) { clearTimers(); cur = view; shell(); var b = $('#pzBody'); ({ home: home, memory: memory, scramble: scramble, rush: rush, lb: board, net: network }[view] || home)(b); window.scrollTo && 0; }

  function askName(done, force) {
    var n = N(); var m = document.createElement('div'); m.className = 'pz-modal';
    m.innerHTML = '<div class="pz-card"><h2>' + t('nick') + '</h2><p>' + t('nickAsk') + '</p><input maxlength="24" id="pzIn" placeholder="e.g. Rafi" value="' + esc(n ? n.getName() : '') + '"><div class="pz-row"><button class="pz-btn" id="pzOk">' + t('save') + '</button>' + (force ? '<button class="pz-btn ghost" id="pzNo">' + t('skip') + '</button>' : '<button class="pz-btn ghost" id="pzNo">✕</button>') + '</div></div>';
    document.body.appendChild(m); setTimeout(function () { var i = m.querySelector('input'); i && i.focus(); }, 80);
    var close = function () { m.remove(); done && done(); };
    m.querySelector('#pzOk').onclick = function () { var v = String(m.querySelector('input').value || '').replace(/[<>]/g, '').trim().slice(0, 24); if (!v) return; if (n) n.setName(v); else store.s('tvnet_name', v); close(); };
    m.querySelector('#pzNo').onclick = close;
  }
  function needName(start) { var n = N(); if ((n && n.getName()) || (!n && store.g('tvnet_name'))) return start(); if (store.g('pz_skip')) return start(); askName(function () { if (!(N() && N().getName())) store.s('pz_skip', '1'); start(); }, true); }

  /* ---------- home ---------- */
  function home(b) {
    var n = N(), bests = ['memory', 'scramble', 'rush'].map(function (g) { return n ? n.localBest(g) : 0; });
    b.innerHTML = '<div class="pz-menu">' + ['memory', 'scramble', 'rush'].map(function (g, i) {
      return '<button class="pz-card pz-game" data-g="' + g + '" style="animation-delay:' + i * 80 + 'ms"><span class="ic">' + ICON[g] + '</span><h2>' + t(g) + '</h2><p>' + t('d' + g[0].toUpperCase() + g.slice(1)) + '</p><span class="best">' + t('best') + ': ' + bn(bests[i]) + '</span></button>';
    }).join('') + '</div>';
    b.onclick = function (e) { var c = e.target.closest('[data-g]'); if (c) needName(function () { go(c.dataset.g); }); };
  }

  /* ---------- result ---------- */
  function finish(b, game, score, extra) {
    clearTimers();
    var n = N(), prev = n ? n.localBest(game) : 0;
    b.innerHTML = '<div class="pz-card pz-res"><h2>' + t('done') + '</h2><p>' + t(game) + '</p><div class="big">' + bn(score) + '</div>' + (extra ? '<p>' + extra + '</p>' : '') +
      (score > prev ? '<p class="pz-msg ok">' + t('newbest') + '</p>' : '<p>' + t('best') + ': ' + bn(Math.max(prev, score)) + '</p>') + '<div class="pz-msg" id="pzSv">' + t('loading') + '</div>' +
      '<div class="pz-row" style="justify-content:center;margin-top:12px"><button class="pz-btn" id="pzAg">' + t('again') + '</button><button class="pz-btn ghost" id="pzSh">' + t('share') + '</button><button class="pz-btn ghost" id="pzLb">🏆</button></div></div>';
    $('#pzAg').onclick = function () { go(game); }; $('#pzLb').onclick = function () { lbGame = game; go('lb'); };
    $('#pzSh').onclick = function () {
      var txt = t('shareT').replace('{s}', score).replace('{g}', t(game)), url = location.href.split('#')[0];
      if (navigator.share) navigator.share({ title: document.title, text: txt, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(txt + ' ' + url).then(function () { $('#pzSh').textContent = t('copied'); });
    };
    var sv = $('#pzSv');
    if (!n) { sv.className = 'pz-msg er'; sv.textContent = t('offline'); return; }
    if (!n.getName()) { sv.textContent = t('nonick'); n.submit(game, score); return; }
    n.submit(game, score).then(function (r) { sv.className = 'pz-msg ' + (r.online ? 'ok' : 'er'); sv.textContent = r.online ? t('saved') : t('offline') + (r.error ? ' [' + r.error + ']' : ''); });
  }

  /* ---------- Memory Match ---------- */
  function memory(b) {
    var L = lang(), pairs = rnd(D.pairs).slice(0, 6), cards = [];
    pairs.forEach(function (p, i) { cards.push({ id: i, tx: p[0][L] }); cards.push({ id: i, tx: p[1][L] }); }); cards = rnd(cards);
    var open = [], moves = 0, matched = 0, sec = 0, started = false, lock = false;
    b.innerHTML = '<div class="pz-card"><div class="pz-hud"><span>⏱ <i id="mT">0</i>s</span><span>' + t('moves') + ': <i id="mM">0</i></span><span>✔ <i id="mP">0</i>/6</span></div><div class="pz-grid">' +
      cards.map(function (c, i) { return '<button class="mc" data-i="' + i + '" aria-label="card"><div><span class="fr">?</span><span class="bk">' + esc(c.tx) + '</span></div></button>'; }).join('') + '</div></div>';
    b.onclick = function (e) {
      var el = e.target.closest('.mc'); if (!el || lock) return;
      var i = +el.dataset.i; if (el.classList.contains('f') || el.classList.contains('m')) return;
      if (!started) { started = true; timers.push(setInterval(function () { sec++; $('#mT').textContent = sec; }, 1000)); }
      el.classList.add('f'); open.push(i);
      if (open.length === 2) {
        moves++; $('#mM').textContent = moves; lock = true;
        var a = open[0], c = open[1], A = b.querySelectorAll('.mc');
        if (cards[a].id === cards[c].id) {
          setTimeout(function () { A[a].classList.add('m'); A[c].classList.add('m'); matched++; $('#mP').textContent = matched; open = []; lock = false; navigator.vibrate && navigator.vibrate(30);
            if (matched === 6) { var sc = Math.max(50, 700 - moves * 15 - sec * 3); setTimeout(function () { finish(b, 'memory', sc, t('time') + ': ' + bn(sec) + 's · ' + t('moves') + ': ' + bn(moves)); }, 600); } }, 350);
        } else timers.push(setTimeout(function () { A[a].classList.remove('f'); A[c].classList.remove('f'); open = []; lock = false; }, 750));
      }
    };
  }

  /* ---------- Word Scramble ---------- */
  function scramble(b) {
    var list = rnd(D.words), idx = 0, score = 0, solved = 0, left = 90, ans = [], word, tiles;
    function scr(w) { var a, tries = 0; do { a = rnd(w.split('')); tries++; } while (a.join('') === w && tries < 10); return a; }
    function next() { if (idx >= list.length) { idx = 0; list = rnd(list); } word = list[idx++]; tiles = scr(word.w); ans = []; draw(); }
    function draw() {
      var used = {}; ans.forEach(function (k) { used[k] = 1; });
      $('#sw').innerHTML = '<div class="pz-hint">💡 ' + esc(word[lang()]) + '</div><div class="pz-ans">' + word.w.split('').map(function (_, i) { return '<span class="' + (ans[i] != null ? 'f' : '') + '">' + (ans[i] != null ? esc(tiles[ans[i]]) : '') + '</span>'; }).join('') + '</div>' +
        '<div class="pz-tiles">' + tiles.map(function (c, i) { return '<button class="pz-tile' + (used[i] ? ' used' : '') + '" data-k="' + i + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
        '<div class="pz-row" style="justify-content:center"><button class="pz-btn ghost" data-a="back">' + t('back') + '</button><button class="pz-btn ghost" data-a="clear">' + t('clear') + '</button><button class="pz-btn ghost" data-a="skip">' + t('skipW') + '</button></div>';
    }
    b.innerHTML = '<div class="pz-card"><div class="pz-hud"><span>⏱ <i id="sT">90</i>s</span><span>' + t('words') + ': <i id="sN">0</i></span><span>' + t('score') + ': <i id="sS">0</i></span></div><div class="pz-bar"><i id="sB"></i></div><div id="sw"></div></div>';
    next();
    timers.push(setInterval(function () { left--; $('#sT').textContent = left; $('#sB').style.width = (left / 90 * 100) + '%'; if (left <= 0) finish(b, 'scramble', score, t('words') + ': ' + bn(solved)); }, 1000));
    b.onclick = function (e) {
      var k = e.target.closest('[data-k]'), a = e.target.closest('[data-a]');
      if (k) { ans.push(+k.dataset.k); draw();
        if (ans.length === word.w.length) {
          if (ans.map(function (i) { return tiles[i]; }).join('') === word.w) { solved++; score += 100 + Math.min(30, left > 60 ? 30 : left > 30 ? 15 : 5); $('#sN').textContent = solved; $('#sS').textContent = score; navigator.vibrate && navigator.vibrate(30); next(); }
          else { var box = $('.pz-ans'); box.classList.add('shake'); timers.push(setTimeout(function () { ans = []; draw(); }, 420)); }
        }
      } else if (a) { if (a.dataset.a === 'back') ans.pop(); else if (a.dataset.a === 'clear') ans = []; else { next(); return; } draw(); }
    };
  }

  /* ---------- True / False Rush ---------- */
  function rush(b) {
    var list = rnd(D.tf), idx = 0, score = 0, left = 45, ok = 0, run = 0, q;
    function next() { if (idx >= list.length) { idx = 0; list = rnd(list); } q = list[idx++]; $('#rq').textContent = q[lang()]; }
    b.innerHTML = '<div class="pz-card"><div class="pz-hud"><span>⏱ <i id="rT">45</i>s</span><span>' + t('streak') + ': <i id="rK">0</i></span><span>' + t('score') + ': <i id="rS">0</i></span></div><div class="pz-bar"><i id="rB"></i></div><div class="pz-q" id="rq"></div><div class="pz-tf"><button class="pz-t" data-v="1">✔ ' + t('t') + '</button><button class="pz-f" data-v="0">✖ ' + t('f') + '</button></div></div>';
    next();
    timers.push(setInterval(function () { left--; $('#rT').textContent = left; $('#rB').style.width = (left / 45 * 100) + '%'; if (left <= 0) finish(b, 'rush', score, '✔ ' + bn(ok)); }, 1000));
    b.onclick = function (e) {
      var v = e.target.closest('[data-v]'); if (!v) return; var card = $('.pz-card', b);
      if ((v.dataset.v === '1') === q.a) { ok++; run++; score += 10 + (run % 5 === 0 ? 20 : 0); card.classList.remove('flash-no'); void card.offsetWidth; card.classList.add('flash-ok'); navigator.vibrate && navigator.vibrate(20); }
      else { run = 0; score = Math.max(0, score - 5); card.classList.remove('flash-ok'); void card.offsetWidth; card.classList.add('flash-no'); }
      $('#rS').textContent = score; $('#rK').textContent = run; next();
    };
  }

  /* ---------- Leaderboard ---------- */
  function board(b) {
    var n = N();
    b.innerHTML = '<div class="pz-card"><h2>🏆 ' + t('lb') + '</h2><div class="pz-sub">' + ['memory', 'scramble', 'rush'].map(function (g) { return '<button class="pz-pill' + (lbGame === g ? ' on' : '') + '" data-g="' + g + '">' + ICON[g] + ' ' + t(g) + '</button>'; }).join('') + '</div>' +
      '<div class="pz-sub"><button class="pz-pill' + (lbScope === 'all' ? ' on' : '') + '" data-s="all">🌐 ' + t('all') + '</button><button class="pz-pill' + (lbScope === 'here' ? ' on' : '') + '" data-s="here">📍 ' + t('here') + '</button></div><div id="lbList"><p>' + t('loading') + '</p></div></div>';
    b.onclick = function (e) { var g = e.target.closest('[data-g]'), s = e.target.closest('[data-s]'); if (g) { lbGame = g.dataset.g; board(b); } if (s) { lbScope = s.dataset.s; board(b); } };
    if (!n) { $('#lbList').innerHTML = '<p>' + t('offline') + '</p>'; return; }
    Promise.all([n.top(lbGame, 100), n.getSites(), n.myUid()]).then(function (r) {
      var rows = r[0], sites = {}; r[1].forEach(function (s) { sites[s.id] = s; });
      if (lbScope === 'here') rows = rows.filter(function (x) { return x.siteId === n.siteId; });
      rows = rows.slice(0, 50); var box = $('#lbList'); if (!box) return;
      box.innerHTML = rows.length ? rows.map(function (x, i) { var s = sites[x.siteId] || {}, me = r[2] && x.uid === r[2]; return '<div class="pz-lbrow' + (me ? ' me' : '') + '"><span class="pz-rk">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : bn(i + 1)) + '</span><span class="pz-nm"><b>' + esc(x.name) + (me ? ' (' + t('you') + ')' : '') + '</b><small><span class="pz-dot" style="background:' + esc(s.color || '#5b9bff') + '"></span>' + esc(s.name || x.siteId) + '</small></span><span class="pz-sc">' + bn(x.score) + '</span></div>'; }).join('') : '<p>' + t('empty') + '</p>';
    });
  }

  /* ---------- Our Network ---------- */
  function network(b) {
    b.innerHTML = '<div class="pz-card"><h2>🌐 ' + t('netT') + '</h2><p>' + t('netD') + '</p><div class="pz-sites" id="pzSites" style="margin-top:12px"><p>' + t('loading') + '</p></div></div>';
    var n = N(); if (!n) return;
    if (n.latestTop) n.latestTop().then(function (tp) {
      if (!tp) return; var box = $('#pzSites'); if (!box || !box.parentNode) return;
      n.getSites().then(function (ss) {
        var st = ss.filter(function (z) { return z.id === tp.siteId; })[0] || {};
        var card = document.createElement('div'); card.className = 'pz-topm';
        card.innerHTML = (tp.photo && /^https?:/i.test(tp.photo) ? '<img src="' + esc(tp.photo) + '" alt="">' : '<span class="pz-topav">🏅</span>') + '<div><small>🏅 ' + t('topT') + ' · ' + esc(tp.month) + '</small><b>' + esc(tp.name) + '</b><small>' + esc(st.name || tp.siteId || '') + (tp.note ? ' — ' + esc(tp.note) : '') + '</small></div>';
        box.parentNode.insertBefore(card, box.parentNode.querySelector('p').nextSibling);
      });
    });
    n.getSites().then(function (s) {
      var box = $('#pzSites'); if (!box) return;
      box.innerHTML = s.length ? s.map(function (x) {
        var here = x.id === n.siteId;
        return '<a class="pz-site" href="' + esc(x.url || '#') + '"' + (here ? '' : ' target="_blank" rel="noopener"') + '>' + (x.logo ? '<img src="' + esc(x.logo) + '" alt="" loading="lazy">' : '<span class="lg" style="background:' + esc(x.color || '#1f6bf2') + '">' + esc((x.name || '?')[0]) + '</span>') + '<span><b>' + esc(x.name) + '</b><small>' + esc(x.desc || '') + '</small>' + (here ? '<div class="pz-here">● ' + t('hereTag') + '</div>' : '') + '</span></a>';
      }).join('') : '<p>' + t('empty') + '</p>';
    });
  }

  /* ---------- boot ---------- */
  function warm() { try { var n = N(); if (n) { n.myUid(); n.getSites(); } } catch (e) {} }
  function boot() { go('home'); }
  if (window.TVNet) { warm(); boot(); } else { boot(); addEventListener('tvnet-ready', function () { warm(); go(cur); }, { once: true }); }
  var ol = window.applyLanguage; if (typeof ol === 'function') window.applyLanguage = function () { ol.apply(this, arguments); if (cur === 'home' || cur === 'lb' || cur === 'net') go(cur); };
  window.PZ = { go: go, setLang: function (l) { store.s('pz_lang', l); go(cur); }, lang: lang };
})();
