/* VYA Chat Assistant — rule-based, runs fully in the browser (no API, no cost).
   Answers come from the site's own content (Firestore 'site/content', fallback data.json).
   Understands Bangla, English and Banglish. */
(function () {
  'use strict';
  if (window.__vyaChat) return;
  window.__vyaChat = true;

  var DATA = null;
  var isBn = false; // language of the last user message

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isPlaceholder(v) {
    v = String(v == null ? '' : v).trim();
    return !v || /^add\b/i.test(v) || /your-form-link|your-link|example\.com/i.test(v);
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (isPlaceholder(u)) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[a-z0-9\-_]+\.html(#[\w-]*)?$/i.test(u) || /^#[\w-]+$/.test(u)) return u;
    return '';
  }
  function link(url, label) {
    var u = safeUrl(url);
    if (!u) return '';
    var ext = /^https?:/i.test(u);
    return '<a href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(label) + '</a>';
  }
  function hasBn(s) { return /[ঀ-৿]/.test(s); }
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[‌‍]/g, '')
      .replace(/[^a-z0-9ঀ-৿\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function t(en, bn) { return isBn ? bn : en; }

  /* ---------- data ---------- */
  function load() {
    var done = false;
    function ok(d) { if (!done && d) { done = true; DATA = d; } }
    function fromJson() {
      return fetch('data.json?v=' + Date.now()).then(function (r) { return r.json(); }).then(ok).catch(function () {});
    }
    try {
      if (typeof db !== 'undefined' && db && db.collection) {
        return db.collection('site').doc('content').get().then(function (s) {
          if (s && s.exists) ok(s.data()); else return fromJson();
        }).catch(fromJson);
      }
    } catch (e) {}
    return fromJson();
  }

  /* ---------- knowledge ---------- */
  function programsList() {
    var ps = (DATA && DATA.programs && DATA.programs.pillars) || [];
    return ps.filter(function (p) { return p && p.title; });
  }
  function joinLink() {
    var ps = programsList();
    for (var i = 0; i < ps.length; i++) { var u = safeUrl(ps[i].link); if (u) return u; }
    return 'index.html#join';
  }

  var INTENTS = [
    { id: 'greet', k: ['hi', 'hello', 'hey', 'salam', 'assalamu', 'assalamualaikum', 'নমস্কার', 'হ্যালো', 'হাই', 'সালাম', 'আসসালামু', 'সালাম'],
      a: function () {
        return t('Hello! 👋 I\'m the VYA assistant. Ask me about joining, programs, events, certificates or the quiz.',
          'আসসালামু আলাইকুম! 👋 আমি VYA সহকারী। জয়েন, প্রোগ্রাম, ইভেন্ট, সার্টিফিকেট বা কুইজ নিয়ে জিজ্ঞেস করুন।');
      } },
    { id: 'about', k: ['what is vya', 'about', 'who are you', 'visionary youth', 'vya', 'mission', 'vision', 'কী', 'সম্পর্কে', 'পরিচয়', 'ভিশনারি', 'সংগঠন', 'songothon', 'songstha', 'কি এটা'],
      a: function () {
        var lead = DATA && DATA.about && DATA.about.lead;
        return (isBn
          ? 'Visionary Youth Alliance (VYA) বাংলাদেশের তরুণদের নিয়ে গড়া একটি যুব-নেতৃত্বাধীন সংগঠন। আমরা নেতৃত্ব, সৃজনশীলতা ও নাগরিক দায়িত্ববোধ গড়ে তুলি।'
          : esc(lead || 'Visionary Youth Alliance (VYA) is a youth-led organization in Bangladesh building leadership, creativity and civic responsibility.'))
          + '<br>' + link('index.html#about', t('Read more →', 'আরও পড়ুন →'));
      } },
    { id: 'join', k: ['join', 'apply', 'application', 'register', 'registration', 'member', 'membership', 'become', 'sign up', 'signup', 'জয়েন', 'যোগ', 'আবেদন', 'রেজিস্ট্রেশন', 'সদস্য', 'মেম্বার', 'ভর্তি', 'kivabe join', 'kibhabe', 'jog dibo'],
      a: function () {
        return t('To join: press <b>Apply to Join</b> at the bottom of the home page, fill in the short form, and our team will contact you. Joining is free.',
          'জয়েন করতে হোমপেজের নিচে <b>Apply to Join</b> চাপুন, ছোট ফর্মটি পূরণ করুন — আমাদের টিম আপনার সাথে যোগাযোগ করবে। জয়েন করা সম্পূর্ণ ফ্রি।')
          + '<br>' + link('index.html#join', t('Go to the form →', 'ফর্মে যান →'));
      } },
    { id: 'fee', k: ['fee', 'free', 'cost', 'price', 'charge', 'paid', 'money', 'taka', 'ফি', 'ফ্রি', 'টাকা', 'খরচ', 'মূল্য', 'বিনামূল্যে', 'দাম'],
      a: function () {
        return t('No fee. Joining VYA and our core programs is free.', 'কোনো ফি নেই। VYA-তে জয়েন এবং আমাদের মূল প্রোগ্রামগুলো সম্পূর্ণ ফ্রি।');
      } },
    { id: 'eligible', k: ['eligible', 'eligibility', 'who can', 'age', 'student', 'school', 'college', 'university', 'যোগ্য', 'বয়স', 'কারা', 'শিক্ষার্থী', 'স্কুল', 'কলেজ', 'বিশ্ববিদ্যালয়'],
      a: function () {
        return t('Any young person in Bangladesh who wants to learn, lead and serve — students of schools, colleges and universities are all welcome.',
          'বাংলাদেশের যেকোনো তরুণ, যে শিখতে, নেতৃত্ব দিতে ও সেবা করতে চায় — স্কুল, কলেজ ও বিশ্ববিদ্যালয়ের সব শিক্ষার্থী স্বাগত।');
      } },
    { id: 'programs', k: ['program', 'programs', 'programme', 'activity', 'activities', 'workshop', 'leadership', 'community service', 'campus', 'ambassador', 'প্রোগ্রাম', 'কার্যক্রম', 'কর্মসূচি', 'ওয়ার্কশপ', 'কাজ', 'ক্যাম্পাস', 'অ্যাম্বাসেডর'],
      a: function () {
        var ps = programsList();
        if (!ps.length) return t('Programs will be announced soon.', 'প্রোগ্রাম শীঘ্রই ঘোষণা করা হবে।') + '<br>' + link('programs.html', 'Programs →');
        var out = t('Our programs:', 'আমাদের প্রোগ্রামসমূহ:') + '<ul>';
        ps.forEach(function (p) {
          out += '<li><b>' + esc(p.title) + '</b>' + (p.status ? ' <span class="vc-tag">' + esc(p.status) + '</span>' : '') +
            (p.text ? '<br>' + esc(p.text) : '') + '</li>';
        });
        return out + '</ul>' + link('programs.html', t('See all programs →', 'সব প্রোগ্রাম দেখুন →'));
      } },
    { id: 'events', k: ['event', 'events', 'upcoming', 'next', 'when', 'schedule', 'date', 'ইভেন্ট', 'অনুষ্ঠান', 'কবে', 'তারিখ', 'আসন্ন', 'সময়সূচি'],
      a: function () {
        var ev = (DATA && DATA.events) || [];
        if (!ev.length) {
          return t('No events are announced right now. Follow our notices and social pages — we will post the next one soon!',
            'এই মুহূর্তে কোনো ইভেন্ট ঘোষণা করা হয়নি। আমাদের নোটিশ ও সোশ্যাল পেজ দেখুন — শীঘ্রই পরবর্তী ইভেন্ট জানানো হবে!');
        }
        var out = t('Upcoming events:', 'আসন্ন ইভেন্ট:') + '<ul>';
        ev.slice(0, 5).forEach(function (e) {
          var title = e.title || e.name || 'Event';
          out += '<li><b>' + esc(title) + '</b>' + (e.date ? ' — ' + esc(e.date) : '') + (e.place || e.location ? ' · ' + esc(e.place || e.location) : '') + '</li>';
        });
        return out + '</ul>' + link('index.html#events', t('All events →', 'সব ইভেন্ট →'));
      } },
    { id: 'cert', k: ['certificate', 'certificates', 'verify', 'verification', 'genuine', 'fake', 'সার্টিফিকেট', 'সনদ', 'যাচাই', 'ভেরিফাই', 'সার্টিফিকেট'],
      a: function () {
        return t('Participants receive a certificate with a unique ID. Anyone can check it on our Verify page by entering that ID.',
          'অংশগ্রহণকারীরা একটি ইউনিক আইডি সহ সার্টিফিকেট পান। যে কেউ আইডি দিয়ে আমাদের Verify পেজে যাচাই করতে পারবেন।')
          + '<br>' + link('verify.html', t('Verify a certificate →', 'সার্টিফিকেট যাচাই করুন →'));
      } },
    { id: 'quiz', k: ['quiz', 'quize', 'test', 'question', 'competition', 'score', 'কুইজ', 'পরীক্ষা', 'প্রতিযোগিতা', 'স্কোর'],
      a: function () {
        var s = (DATA && DATA.quizSectors) || [];
        var names = s.map(function (x) { return x.name; }).filter(Boolean).join(', ');
        return t('Test your knowledge with our quiz' + (names ? ' — sectors: ' + esc(names) : '') + '.',
          'আমাদের কুইজে নিজের জ্ঞান যাচাই করুন' + (names ? ' — বিভাগ: ' + esc(names) : '') + '।')
          + '<br>' + link('quiz.html', t('Play the quiz →', 'কুইজ খেলুন →'));
      } },
    { id: 'contact', k: ['contact', 'email', 'mail', 'phone', 'call', 'number', 'address', 'reach', 'whatsapp', 'যোগাযোগ', 'ইমেইল', 'ফোন', 'নম্বর', 'ঠিকানা', 'হোয়াটসঅ্যাপ', 'jogajog'],
      a: function () {
        var c = (DATA && DATA.contact) || {}, s = (DATA && DATA.social) || {}, parts = [];
        if (!isPlaceholder(c.email)) parts.push('✉️ ' + esc(c.email));
        if (!isPlaceholder(c.phone)) parts.push('📞 ' + esc(c.phone));
        if (!isPlaceholder(c.address)) parts.push('📍 ' + esc(c.address));
        ['facebook', 'instagram', 'whatsapp', 'youtube'].forEach(function (k) { var l = link(s[k], k.charAt(0).toUpperCase() + k.slice(1)); if (l) parts.push(l); });
        if (!parts.length) return t('You can reach us through the Apply to Join form on the home page.', 'হোমপেজের Apply to Join ফর্মের মাধ্যমে আমাদের সাথে যোগাযোগ করতে পারেন।') + '<br>' + link('index.html#join', t('Open form →', 'ফর্ম খুলুন →'));
        var hasDirect = !isPlaceholder(c.email) || !isPlaceholder(c.phone);
        return t('You can reach us here:', 'আমাদের সাথে যোগাযোগ:') + '<br>' + parts.join('<br>') + (hasDirect ? '' : '<br>' + t('For questions, use the Apply to Join form and our team will reply. ', 'প্রশ্ন থাকলে Apply to Join ফর্ম ব্যবহার করুন, টিম উত্তর দেবে। ') + link('index.html#join', t('Open form →', 'ফর্ম খুলুন →')));
      } },
    { id: 'team', k: ['team', 'founder', 'president', 'leader', 'leaders', 'who runs', 'committee', 'টিম', 'প্রতিষ্ঠাতা', 'সভাপতি', 'নেতৃত্ব', 'কমিটি', 'কে চালায়'],
      a: function () {
        var tm = ((DATA && DATA.team) || []).filter(function (m) { return m && !isPlaceholder(m.name); });
        if (!tm.length) return t('Our team is led by young founding members. Meet them on the Team page.', 'আমাদের টিম তরুণ প্রতিষ্ঠাতা সদস্যদের নেতৃত্বে চলে।') + '<br>' + link('team.html', t('Team page →', 'টিম পেজ →'));
        return t('Our team:', 'আমাদের টিম:') + '<ul>' + tm.slice(0, 8).map(function (m) { return '<li><b>' + esc(m.name) + '</b> — ' + esc(m.role || '') + '</li>'; }).join('') + '</ul>' + link('team.html', t('Full team →', 'পুরো টিম →'));
      } },
    { id: 'blog', k: ['blog', 'news', 'article', 'post', 'story', 'update', 'ব্লগ', 'খবর', 'নিউজ', 'লেখা', 'আপডেট'],
      a: function () {
        var b = ((DATA && DATA.blog) || []).slice().sort(function (a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
        var out = t('Read our latest posts on the blog.', 'আমাদের ব্লগে সর্বশেষ লেখা পড়ুন।');
        if (b.length && b[0].title) out += '<br>' + t('Latest: ', 'সর্বশেষ: ') + '<b>' + esc(b[0].title) + '</b>';
        return out + '<br>' + link('blog.html', t('Open blog →', 'ব্লগ খুলুন →'));
      } },
    { id: 'thanks', k: ['thanks', 'thank', 'thx', 'ok thanks', 'ধন্যবাদ', 'শুকরিয়া', 'জাযাকাল্লাহ'],
      a: function () { return t('You\'re welcome! 😊 Anything else?', 'আপনাকেও ধন্যবাদ! 😊 আর কিছু জানতে চান?'); } },
    { id: 'bye', k: ['bye', 'goodbye', 'allah hafez', 'khoda hafez', 'বিদায়', 'আল্লাহ হাফেজ', 'খোদা হাফেজ'],
      a: function () { return t('Goodbye! Stay visionary. 🌟', 'আল্লাহ হাফেজ! ভালো থাকবেন। 🌟'); } }
  ];

  var STOP = /^(the|a|an|is|are|do|does|i|me|my|you|your|we|our|to|of|and|or|in|on|for|how|what|can|will|there|any|it|be|get|with)$/;

  function words(s) { return norm(s).split(' ').filter(function (w) { return w.length > 2 && !STOP.test(w); }); }

  function matchIntent(q) {
    var nq = ' ' + norm(q) + ' ', best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var sc = 0;
      it.k.forEach(function (kw) {
        var nk = norm(kw);
        if (!nk) return;
        var hit = nk.indexOf(' ') > -1 || hasBn(nk) ? nq.indexOf(nk) > -1 : nq.indexOf(' ' + nk + ' ') > -1;
        // allow simple plurals / suffixes for english words
        if (!hit && !hasBn(nk) && nk.length > 3) hit = nq.indexOf(' ' + nk) > -1;
        if (hit) sc += nk.length > 4 ? 2 : 1;
      });
      if (sc > bestScore) { bestScore = sc; best = it; }
    });
    return { intent: best, score: bestScore };
  }

  function matchFaq(q) {
    var faq = (DATA && DATA.faq) || [], qw = words(q), best = null, bs = 0;
    if (!qw.length) return null;
    faq.forEach(function (f) {
      var fw = words(f.q + ' ' + f.a), sc = 0;
      qw.forEach(function (w) { if (fw.indexOf(w) > -1) sc += 1; });
      var fq = words(f.q);
      qw.forEach(function (w) { if (fq.indexOf(w) > -1) sc += 1; });
      if (sc > bs) { bs = sc; best = f; }
    });
    return bs >= 3 ? best : null;
  }

  var GEN = /^(program|programs|programme|about|tell|please|join|apply|more|info|information|details|open|registration|ongoing|upcoming|students|student|young|people|youth|bangladesh|open|all|build|local|events|skills|skill)$/;
  var lastProgScore = 0;
  function matchProgram(q) {
    var qw = words(q).filter(function (w) { return !GEN.test(w); });
    if (!qw.length) return null;
    var ps = programsList(), best = null, bs = 0;
    ps.forEach(function (p) {
      var tw = words(p.title), ow = words((p.text || '') + ' ' + (p.highlights || []).join(' ')), sc = 0;
      qw.forEach(function (w) {
        if (GEN.test(w)) return;
        if (tw.indexOf(w) > -1) sc += 2; else if (ow.indexOf(w) > -1) sc += 1;
      });
      if (sc > bs) { bs = sc; best = p; }
    });
    lastProgScore = bs;
    return bs >= 2 ? best : null;
  }

  function programAnswer(p) {
    var out = '<b>' + esc(p.title) + '</b>' + (p.status ? ' <span class="vc-tag">' + esc(p.status) + '</span>' : '') + '<br>' + esc(p.text || '');
    if (p.meta) out += '<br>' + esc(p.meta);
    if (p.highlights && p.highlights.length) out += '<ul>' + p.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>';
    if (p.price) out += t('Fee: ', 'ফি: ') + esc(p.price) + '<br>';
    if (p.eligibility) out += t('Eligibility: ', 'যোগ্যতা: ') + esc(p.eligibility) + '<br>';
    var l = link(p.link, t('Apply for this →', 'এখানে আবেদন করুন →'));
    return out + (l || link('index.html#join', t('Apply to Join →', 'জয়েন করুন →')));
  }

  function answer(q) {
    isBn = hasBn(q);
    if (!DATA) return t('Loading site info… please try again in a moment.', 'সাইটের তথ্য লোড হচ্ছে… একটু পরে আবার চেষ্টা করুন।');
    var m = matchIntent(q);
    // a specific program name beats the generic "programs" intent
    var prog = matchProgram(q);
    if (prog && (lastProgScore >= 3 || !m.intent || m.intent.id === 'programs' || m.intent.id === 'join' || m.score < 3)) return programAnswer(prog);
    // FAQ wording beats weak intent guesses
    var faq = matchFaq(q);
    if (faq && m.score < 3 && !hasBn(q)) return '<b>' + esc(faq.q) + '</b><br>' + esc(faq.a);
    if (m.intent && m.score > 0) return m.intent.a();
    if (faq) return '<b>' + esc(faq.q) + '</b><br>' + esc(faq.a);
    return t('Sorry, I\'m not sure about that. I can help with joining, programs, events, certificates, the quiz and contact info. For anything else, please use the Apply to Join form and our team will reply.',
      'দুঃখিত, এটি আমি নিশ্চিত নই। আমি জয়েন, প্রোগ্রাম, ইভেন্ট, সার্টিফিকেট, কুইজ ও যোগাযোগের তথ্য নিয়ে সাহায্য করতে পারি। অন্য কিছুর জন্য Apply to Join ফর্ম ব্যবহার করুন, আমাদের টিম উত্তর দেবে।');
  }

  /* ---------- UI ---------- */
  var CSS = '' +
    '#vc-btn{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:9998;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;color:#fff;font-size:1.5rem;background:linear-gradient(135deg,#2b6cf6,#7b2ff7);box-shadow:0 12px 30px rgba(43,60,160,.4);display:flex;align-items:center;justify-content:center;transition:transform .2s}' +
    '#vc-btn:hover{transform:scale(1.06)}' +
    '#to-top{bottom:calc(86px + env(safe-area-inset-bottom,0px)) !important}' +
    '#vc-box{position:fixed;right:18px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:9999;width:min(370px,calc(100vw - 24px));height:min(540px,calc(100vh - 120px));background:#fff;color:#0f1533;border-radius:18px;box-shadow:0 24px 60px rgba(15,21,51,.35);display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif;font-size:.93rem;line-height:1.5}' +
    '#vc-box.open{display:flex}' +
    '#vc-head{background:linear-gradient(135deg,#0b1330,#2b3fa8);color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between}' +
    '#vc-head b{font-family:Poppins,system-ui,sans-serif;font-size:1rem}#vc-head small{display:block;opacity:.75;font-size:.75rem}' +
    '#vc-x{background:none;border:0;color:#fff;font-size:1.4rem;cursor:pointer;line-height:1}' +
    '#vc-msgs{flex:1;overflow-y:auto;padding:14px;background:#f5f7fd;display:flex;flex-direction:column;gap:10px}' +
    '.vc-m{max-width:88%;padding:10px 13px;border-radius:14px;word-wrap:break-word;overflow-wrap:anywhere}' +
    '.vc-m.bot{background:#fff;border:1px solid #e2e6f5;align-self:flex-start;border-bottom-left-radius:4px}' +
    '.vc-m.me{background:linear-gradient(135deg,#2b6cf6,#7b2ff7);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '.vc-m a{color:#2b6cf6;font-weight:600;text-decoration:underline}.vc-m ul{margin:6px 0 6px 18px}.vc-m li{margin:3px 0}' +
    '.vc-tag{display:inline-block;font-size:.7rem;padding:1px 8px;border-radius:99px;background:#e8edff;color:#2b3fa8;font-weight:600}' +
    '#vc-chips{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;background:#f5f7fd;border-top:1px solid #e2e6f5}' +
    '#vc-chips button{border:1px solid #cfd6f5;background:#fff;color:#2b3fa8;border-radius:99px;padding:5px 11px;font-size:.8rem;cursor:pointer;font-family:inherit}' +
    '#vc-chips button:hover{background:#eef2ff}' +
    '#vc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e6f5;background:#fff}' +
    '#vc-in{flex:1;border:1px solid #cfd6f5;border-radius:12px;padding:10px 12px;font-size:16px;font-family:inherit;outline:none}#vc-in:focus{border-color:#7b6bff}' +
    '#vc-send{border:0;border-radius:12px;padding:0 16px;color:#fff;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#2b6cf6,#7b2ff7)}' +
    '.vc-dots span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:#99a3d6;animation:vcb 1s infinite}.vc-dots span:nth-child(2){animation-delay:.15s}.vc-dots span:nth-child(3){animation-delay:.3s}' +
    '@keyframes vcb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}' +
    '@media(max-width:480px){#vc-box{right:8px;left:8px;width:auto;bottom:calc(84px + env(safe-area-inset-bottom,0px))}}';

  function build() {
    var st = document.createElement('style'); st.id = 'vya-chat-css'; st.textContent = CSS; document.head.appendChild(st);

    var btn = document.createElement('button');
    btn.id = 'vc-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Open chat assistant'); btn.textContent = '💬';

    var box = document.createElement('div');
    box.id = 'vc-box'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'VYA assistant');
    box.innerHTML = '<div id="vc-head"><div><b>VYA Assistant</b><small>সাহায্য লাগলে জিজ্ঞেস করুন · Ask me anything</small></div><button id="vc-x" type="button" aria-label="Close">×</button></div>' +
      '<div id="vc-msgs"></div><div id="vc-chips"></div>' +
      '<form id="vc-form" autocomplete="off"><input id="vc-in" type="text" placeholder="প্রশ্ন লিখুন… / Type a question…" maxlength="200"><button id="vc-send" type="submit">➤</button></form>';
    document.body.appendChild(box); document.body.appendChild(btn);

    var msgs = box.querySelector('#vc-msgs'), chips = box.querySelector('#vc-chips'), input = box.querySelector('#vc-in');
    var greeted = false;

    function add(html, who) {
      var d = document.createElement('div'); d.className = 'vc-m ' + who;
      if (who === 'me') d.textContent = html; else d.innerHTML = html;
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
    }
    function ask(q) {
      q = String(q || '').trim(); if (!q) return;
      add(q, 'me');
      var dots = add('<span class="vc-dots"><span></span><span></span><span></span></span>', 'bot');
      setTimeout(function () {
        var a; try { a = answer(q); } catch (e) { a = 'Sorry, something went wrong.'; }
        dots.innerHTML = a; msgs.scrollTop = msgs.scrollHeight;
      }, 450);
    }
    var QUICK = [['কীভাবে জয়েন করব?', 'How do I join?'], ['প্রোগ্রাম', 'Programs'], ['ইভেন্ট', 'Events'], ['সার্টিফিকেট যাচাই', 'Verify certificate'], ['কুইজ', 'Quiz'], ['যোগাযোগ', 'Contact']];
    QUICK.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = c[0];
      b.addEventListener('click', function () { ask(c[0]); });
      chips.appendChild(b);
    });

    function open() {
      box.classList.add('open'); btn.textContent = '×';
      if (!greeted) {
        greeted = true;
        add('আসসালামু আলাইকুম! 👋 আমি VYA সহকারী। বাংলা বা English — যেটায় খুশি প্রশ্ন করুন।<br><small>Hi! I\'m the VYA assistant. Ask in Bangla or English.</small>', 'bot');
      }
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 50);
    }
    function close() { box.classList.remove('open'); btn.textContent = '💬'; }
    btn.addEventListener('click', function () { box.classList.contains('open') ? close() : open(); });
    box.querySelector('#vc-x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    box.querySelector('#vc-form').addEventListener('submit', function (e) {
      e.preventDefault(); var v = input.value; input.value = ''; ask(v);
    });
  }

  function start() { try { build(); } catch (e) { console.warn('VYA chat', e); } load(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
