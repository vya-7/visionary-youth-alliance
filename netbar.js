/* TalentVerse Network notice bar — identical file on every site.
   Shows notices published in Network Admin. Very light: one small web request, cached for 5 minutes.
   Optional: set  window.TVNET_SITE='your-site-id'  before this script (otherwise it is guessed from the address). */
(function () {
  try {
    var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (/^(admin|form-admin|election-admin|network-admin|network-test|404|offline|google)/.test(f) || /admin/.test(f)) return;
    var h = location.hostname;
    var site = String(window.TVNET_SITE || (h.indexOf('talentversebd') === 0 ? 'tvbd' : h.indexOf('vya-7') === 0 ? 'vya' : h.indexOf('fahad-abdur') === 0 ? 'fahad' : '')).toLowerCase();
    if (!site) return;
    var KEY = 'AIzaSyCa0pO6ZYJfCeIzqdfMpJmBAA3-qpnM5cw';
    var URL_ = 'https://firestore.googleapis.com/v1/projects/tv-network-hub/databases/(default)/documents/notices?pageSize=40&key=' + KEY;
    var CK = 'tvnet_notices_v1', CT = 5 * 60 * 1000;
    function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
    function val(f) { if (!f) return null; if ('stringValue' in f) return f.stringValue; if ('booleanValue' in f) return f.booleanValue; if ('integerValue' in f) return Number(f.integerValue); if ('doubleValue' in f) return f.doubleValue; if ('arrayValue' in f) return (f.arrayValue.values || []).map(val); return null; }
    function parse(j) {
      return (j.documents || []).map(function (d) {
        var o = { id: d.name.split('/').pop() }, F = d.fields || {};
        for (var k in F) o[k] = val(F[k]);
        return o;
      });
    }
    function lang() { try { if (typeof getLang === 'function') return getLang(); } catch (e) { } return ls('lang') || ls('tv_lang') || 'en'; }
    function show(list) {
      var now = Date.now(), seen = {};
      try { seen = JSON.parse(ls('tvnet_nb_closed') || '{}'); } catch (e) { }
      var items = list.filter(function (n) {
        if (n.active === false || !n.title && !n.text) return false;
        if (n.expiresAt && n.expiresAt < now) return false;
        var t = n.targets || ['all'];
        if (t.indexOf('all') < 0 && t.indexOf(site) < 0) return false;
        if (seen[n.id + ':' + (n.createdAt || 0)]) return false;
        return true;
      }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).slice(0, 3);
      if (!items.length || document.getElementById('tvnet-bar')) return;
      var css = document.createElement('style');
      css.textContent = '#tvnet-bar{position:fixed;top:0;left:0;right:0;z-index:2147483000;height:36px;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:0 6px 0 12px;background:linear-gradient(90deg,#0b1d44,#14306b);color:#fff;border-bottom:1px solid rgba(91,155,255,.4);font:600 .82rem/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
        '#tvnet-bar .tb-tag{flex:0 0 auto;background:rgba(91,155,255,.22);border:1px solid rgba(91,155,255,.5);border-radius:99px;padding:2px 9px;font-size:.7rem;font-weight:800;letter-spacing:.3px;color:#bfdbfe;white-space:nowrap}' +
        '#tvnet-bar .tb-txt{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
        'html.tvnb body{margin-top:36px !important}html.tvnb [data-tvnb=fixed]{margin-top:36px !important}html.tvnb [data-tvnb=sticky]{top:36px !important}'+
        '#tvnet-bar .tb-txt b{font-weight:800}#tvnet-bar a{color:#fcd34d;font-weight:800;text-decoration:none;margin-left:6px;white-space:nowrap}' +
        '#tvnet-bar .tb-x{flex:0 0 auto;background:none;border:0;color:#cbd5e1;font-size:1.25rem;line-height:1;padding:4px 6px;cursor:pointer;min-width:32px;min-height:32px}';
      document.head.appendChild(css);
      var bar = document.createElement('div'); bar.id = 'tvnet-bar'; bar.setAttribute('role', 'status');
      var bn = lang() === 'bn';
      var n0 = items[0], title = (bn && n0.title_bn) || n0.title || '', text = (bn && n0.text_bn) || n0.text || '';
      var tag = document.createElement('span'); tag.className = 'tb-tag'; tag.textContent = '🌐 ' + (n0.origin ? n0.origin.toUpperCase() : 'NETWORK');
      var tx = document.createElement('span'); tx.className = 'tb-txt';
      if (title) { var b = document.createElement('b'); b.textContent = title; tx.appendChild(b); }
      if (text) tx.appendChild(document.createTextNode((title ? ' — ' : '') + text));
      if (n0.link && /^https?:\/\//i.test(n0.link)) { var a = document.createElement('a'); a.href = n0.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = bn ? 'দেখো →' : 'View →'; tx.appendChild(a); }
      var x = document.createElement('button'); x.className = 'tb-x'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
      bar.appendChild(tag); bar.appendChild(tx); bar.appendChild(x);
      document.body.appendChild(bar);
      document.documentElement.classList.add('tvnb');
      /* push down fixed / sticky things that sit at the very top (headers, the site's own notice bar) */
      function mark() {
        var all = document.body.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var e = all[i]; if (e === bar || bar.contains(e) || e.hasAttribute('data-tvnb')) continue;
          var id = e.id; var cs = getComputedStyle(e);
          if ((cs.position === 'fixed' || cs.position === 'sticky') && (id === 'site-header' || id === 'notice-bar' || (parseFloat(cs.top) <= 1 && cs.bottom !== '0px' && e.offsetHeight < 140))) e.setAttribute('data-tvnb', cs.position === 'sticky' ? 'sticky' : 'fixed');
        }
      }
      mark(); setTimeout(mark, 1500);
      x.onclick = function () { seen[n0.id + ':' + (n0.createdAt || 0)] = 1; ls('tvnet_nb_closed', JSON.stringify(seen)); document.documentElement.classList.remove('tvnb'); bar.remove(); };
    }
    function go() {
      var c = null; try { c = JSON.parse(ls(CK) || 'null'); } catch (e) { }
      if (c && Date.now() - c.t < CT) { show(c.d); return; }
      fetch(URL_).then(function (r) { return r.ok ? r.json() : { documents: [] }; }).then(function (j) {
        var d = parse(j); ls(CK, JSON.stringify({ t: Date.now(), d: d })); show(d);
      }).catch(function () { if (c) show(c.d); });
    }
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  } catch (e) { }
})();
