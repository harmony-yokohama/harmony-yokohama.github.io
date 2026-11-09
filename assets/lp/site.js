/* Harmony LP — shared behaviour for every page.
   - Events come from the same Google Apps Script as before (?action=events),
     so new Meetup events appear here automatically.
   - Sign-ups POST to the same Apps Script with the same fields as the old LP. */
(function () {
  'use strict';

  var API_URL = 'https://script.google.com/macros/s/AKfycbzJaz5SpcfpzhapigC04ESz-leYx9uOM_rkGx_CYesB_Tg-JcPsuA7dlnKF1fX362Kq/exec';
  var WINDOW_DAYS = 62;          // how far ahead to show events
  var TOP_MAX = 10;              // max cards on the top page carousel
  var TOP_SP_FIRST = 3;          // cards shown on phones before "See all"

  /* Shown instantly while the live list loads (and if it can't load). */
  var SNAPSHOT = [
    { id: 'event_316995010@meetup.com', type: 'language', start: '2026-11-08T02:00:00.000Z', end: '2026-11-08T04:00:00.000Z', venue: 'Cafe Harmony（横浜・鶴見）', meetupUrl: 'https://www.meetup.com/yokohama-meetup-group-harmony/events/316995010/', capacity: null, spotsLeft: null, full: false },
    { id: 'event_317007201@meetup.com', type: 'boardgame', start: '2026-11-08T05:30:00.000Z', end: '2026-11-08T08:00:00.000Z', venue: 'Cafe Harmony（横浜・鶴見）', meetupUrl: 'https://www.meetup.com/yokohama-meetup-group-harmony/events/317007201/', capacity: 25, spotsLeft: null, full: false },
    { id: 'event_317145742@meetup.com', type: 'language', start: '2026-11-15T02:00:00.000Z', end: '2026-11-15T04:00:00.000Z', venue: 'Cafe Harmony（横浜・鶴見）', meetupUrl: 'https://www.meetup.com/yokohama-meetup-group-harmony/events/317145742/', capacity: null, spotsLeft: null, full: false },
    { id: 'event_317283571@meetup.com', type: 'boardgame', start: '2026-11-15T05:30:00.000Z', end: '2026-11-15T08:00:00.000Z', venue: 'Cafe Harmony（横浜・鶴見）', meetupUrl: 'https://www.meetup.com/yokohama-meetup-group-harmony/events/317283571/', capacity: 25, spotsLeft: null, full: false },
    { id: 'event_317321741@meetup.com', type: 'matcha', start: '2026-11-28T05:30:00.000Z', end: '2026-11-28T07:30:00.000Z', venue: '神奈川近代文学館 和室（山手）', meetupUrl: 'https://www.meetup.com/yokohama-meetup-group-harmony/events/317321741/', capacity: 16, spotsLeft: null, full: false },
    { id: 'event_317250367@meetup.com', type: 'language', start: '2026-11-29T02:00:00.000Z', end: '2026-11-29T04:00:00.000Z', venue: 'Cafe Harmony（横浜・鶴見）', meetupUrl: 'https://www.meetup.com/yokohama-meetup-group-harmony/events/317250367/', capacity: null, spotsLeft: null, full: false }
  ];

  var TYPES = {
    language: { page: 'language-exchange.html', ja: '言語交換', en: 'Language Exchange',
      priceJa: '1,000円（1ドリンク込み）', priceEn: '¥1,000 · one drink included',
      photos: [['assets/lp/20db2baf04.jpg', '50% 40%'], ['assets/lp/f44f46e51d.jpg', '60% 40%'], ['assets/lp/13f392bb9e.jpg', '50% 45%']],
      alt: 'Participants chatting at a language exchange' },
    boardgame: { page: 'board-games.html', ja: 'ボードゲーム', en: 'Board Games',
      priceJa: '1,000円（1ドリンク込み）', priceEn: '¥1,000 · one drink included',
      photos: [['assets/lp/702c9a0c63.jpg', '50% 60%'], ['assets/lp/e45b80f59a.jpg', '50% 45%'], ['assets/lp/5672ab8e17.jpg', '50% 50%']],
      alt: 'Participants playing a board game' },
    sake: { page: 'sake.html', ja: '日本酒テイスティング', en: 'Sake Tasting',
      priceJa: '3,000円（日本酒テイスティング込み）', priceEn: '¥3,000 · sake tasting included',
      photos: [['assets/lp/0b401dc971.jpg', '50% 50%']], alt: 'Sake glasses on the table at the sake night' },
    matcha: { page: 'matcha.html', ja: '抹茶・和菓子・書道', en: 'Matcha, Sweets & Calligraphy',
      priceJa: '3,000円（材料込み）', priceEn: '¥3,000 · materials included', photos: [], alt: '' }
  };

  var MSG = {
    ja: {
      pick: '参加する日を1つ以上選んでください。', name_required: 'お名前を入力してください。', email_invalid: 'メールアドレスの形式を確認してください。',
      consent_required: '同意のチェックを入れてください。', over20_required: 'このイベントは20歳以上の方のみ参加できます。',
      event_not_found: 'このイベントは受付を終了しました。別の日程を選んでください。', network: '送信できませんでした。通信状況を確認して、もう一度お試しください。',
      sending: '送信中…', ok: 'お申し込みありがとうございます！確認メールをお送りしました。届かない場合は迷惑メールフォルダもご確認ください。',
      waitlist: '満席のため、キャンセル待ちで受け付けました。空きが出たらメールでご連絡します。',
      duplicate: 'このイベントにはすでにお申し込み済みです。', event_full: 'このイベントは満席になりました。別の日程を選んでください。',
      full: '満席', left: function (n) { return '残り' + n + '席'; }, soon: '近日公開', soonSub: '決まりしだいInstagramでお知らせします',
      igCta: 'Instagramで日程を受け取る', applyDay: 'この日に申し込む', noEvents: '現在、受付中のイベントはありません。最新情報はInstagramでお知らせします。',
      skOpen: 'NOW BOOKING', skFee: '参加費3,000円（日本酒テイスティング込み）',
      multiOk: function (d) { return d.length + '日程のお申し込みを受け付けました（' + d.join('・') + '）。日程ごとに確認メールをお送りします。'; },
      multiWait: function (d) { return '満席のため、キャンセル待ちで受け付けました：' + d.join('・'); },
      multiDup: function (d) { return 'すでにお申し込み済みでした：' + d.join('・'); }
    },
    en: {
      pick: 'Please choose at least one date.', name_required: 'Please enter your name.', email_invalid: 'Please check your email address.',
      consent_required: 'Please tick the consent box.', over20_required: 'This event is for guests aged 20 and over.',
      event_not_found: 'Sign-ups for this event have closed. Please choose another date.', network: "We couldn't send your form. Check your connection and try again.",
      sending: 'Sending…', ok: "You're signed up! We've sent a confirmation email. If you don't see it, check your spam folder.",
      waitlist: "The event is full, so you're on the waitlist. We'll email you if a spot opens.",
      duplicate: "You've already signed up for this event.", event_full: 'This event is now full. Please choose another date.',
      full: 'Full', left: function (n) { return n + (n === 1 ? ' spot left' : ' spots left'); }, soon: 'Coming soon', soonSub: "We'll announce the date on Instagram",
      igCta: 'Get the date on Instagram', applyDay: 'Sign up for this date', noEvents: 'No events are open right now. Follow us on Instagram for the next dates.',
      skOpen: 'NOW BOOKING', skFee: '¥3,000 (sake tasting included)',
      multiOk: function (d) { return "You're signed up for " + d.length + ' dates (' + d.join(', ') + '). We\'ll send a confirmation email for each.'; },
      multiWait: function (d) { return "These dates are full, so you're on the waitlist: " + d.join(', '); },
      multiDup: function (d) { return "You'd already signed up for: " + d.join(', '); }
    }
  };

  var PAGE = window.HARMONY_PAGE || {};
  var I18N = window.HARMONY_I18N || {};
  var SRC_LANG = PAGE.slug === 'index' ? 'en' : 'ja';
  var lang = SRC_LANG;
  var events = [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- dates */
  function fmt(iso, opts, l) {
    var o = { timeZone: 'Asia/Tokyo' };
    for (var k in opts) o[k] = opts[k];
    return new Intl.DateTimeFormat((l || lang) === 'ja' ? 'ja-JP' : 'en-US', o).format(new Date(iso));
  }
  function md(e) { return fmt(e.start, { month: 'numeric', day: 'numeric' }, 'ja').replace(/月/, '/').replace(/日/, ''); }
  function dow(e) { return fmt(e.start, { weekday: 'short' }); }
  function dateLabel(e) { return lang === 'ja' ? md(e) + '（' + dow(e) + '）' : fmt(e.start, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function hm(iso) { return fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false }, 'ja'); }
  function timeRange(e) { return hm(e.start) + (e.end ? '–' + hm(e.end) : ''); }
  function place(e) {
    var v = e.venue || '';
    if (/Cafe Harmony/i.test(v) || !v) return lang === 'ja' ? 'Cafe Harmony（横浜・鶴見）' : 'Cafe Harmony, Tsurumi';
    if (/文学館|Yamate|山手/.test(v)) return lang === 'ja' ? '神奈川近代文学館 和室（山手）' : 'Japanese-style room, Yamate';
    return v;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isFull(e) { return !!(e.full || e.spotsLeft === 0); }
  function spotsNote(e) {
    if (isFull(e)) return MSG[lang].full;
    if (e.spotsLeft != null && e.spotsLeft <= 8) return MSG[lang].left(e.spotsLeft);
    return '';
  }

  /* --------------------------------------------------------------- events */
  function fixType(e) {
    if (/board\s*games?|ボードゲーム/i.test(e.title || '')) e.type = 'boardgame';
    else if (/matcha|抹茶/i.test(e.title || '')) e.type = 'matcha';
    else if (/sake|日本酒/i.test(e.title || '') && e.type === 'language') e.type = 'sake';
    return e;
  }
  function inWindow(e) {
    var t = new Date(e.start).getTime(), now = Date.now();
    return t >= now - 2 * 3600e3 && t <= now + WINDOW_DAYS * 86400e3;
  }
  function prepare(list) {
    return (list || []).map(function (e) { var c = {}; for (var k in e) c[k] = e[k]; return fixType(c); })
      .filter(function (e) { return TYPES[e.type] && inWindow(e); })
      .sort(function (a, b) { return new Date(a.start) - new Date(b.start); });
  }
  function ofType(t) { return events.filter(function (e) { return e.type === t; }); }

  function initialEvents() {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('harmony-events') || 'null'); } catch (e) {}
    events = prepare(cached && cached.length ? cached : SNAPSHOT);
    if (!events.length) events = prepare(SNAPSHOT);
  }
  function loadEvents() {
    if (!window.fetch) return;
    fetch(API_URL + '?action=events').then(function (r) { return r.json(); }).then(function (data) {
      if (!data || !data.ok) return;
      try { localStorage.setItem('harmony-events', JSON.stringify(data.events || [])); } catch (e) {}
      events = prepare(data.events || []);
      renderAll();
    }).catch(function () {});
  }

  /* ----------------------------------------------------------------- i18n */
  /* Text nodes are swapped using a dictionary (source text -> other language).
     Originals are kept so switching back restores the exact design text. */
  var ORIG = (typeof WeakMap === 'function') ? new WeakMap() : null;
  var DICT_KEYS = Object.keys(I18N).length;
  function applyI18n(root) {
    if (!ORIG || !DICT_KEYS || !root) return;
    var walker = document.createTreeWalker(root, 4 /* SHOW_TEXT */, null);
    var n, list = [];
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (node) {
      var p = node.parentNode;
      if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return;
      if (p.closest && p.closest('.m-ja,[data-noi18n]')) return;
      var src = ORIG.get(node);
      if (src == null) {
        var key = node.nodeValue.replace(/\s+/g, ' ').trim();
        if (!key || !Object.prototype.hasOwnProperty.call(I18N, key)) return;
        src = node.nodeValue;
        ORIG.set(node, src);
      }
      var k = src.replace(/\s+/g, ' ').trim();
      var out = lang === SRC_LANG ? src : src.replace(k, I18N[k]);
      if (node.nodeValue !== out) node.nodeValue = out;
    });
  }
  var TITLE_SRC = document.title;
  function applyTitle() {
    var alt = I18N.__title;
    if (alt) document.title = lang === SRC_LANG ? TITLE_SRC : alt;
  }

  function initToggles() {
    var groups = [];
    $$('[data-set-lang]').forEach(function (b) {
      var g = b.parentNode;
      if (groups.indexOf(g) < 0) groups.push(g);
    });
    groups.forEach(function (g) {
      var bs = $$('[data-set-lang]', g);
      var act = bs.filter(function (b) { return b.getAttribute('data-set-lang') === SRC_LANG; })[0];
      var ina = bs.filter(function (b) { return b !== act; })[0];
      if (!act || !ina || g.closest('.site-menu')) return;
      g.__styles = { on: act.getAttribute('style') || '', off: ina.getAttribute('style') || '' };
    });
    return groups;
  }
  var toggleGroups = [];
  function paintToggles() {
    toggleGroups.forEach(function (g) {
      $$('[data-set-lang]', g).forEach(function (b) {
        var on = b.getAttribute('data-set-lang') === lang;
        b.setAttribute('aria-pressed', String(on));
        if (g.__styles) b.setAttribute('style', on ? g.__styles.on : g.__styles.off);
      });
    });
  }

  function detectLang() {
    try { var s = localStorage.getItem('harmony-lang'); if (s === 'ja' || s === 'en') return s; } catch (e) {}
    return (navigator.language || 'ja').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en';
  }
  function setLang(l, save) {
    lang = l === 'en' ? 'en' : 'ja';
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    if (save) { try { localStorage.setItem('harmony-lang', lang); } catch (e) {} }
    applyI18n(document.body);
    applyTitle();
    paintToggles();
    renderAll();
    if (typeof fitText === 'function') fitText();
  }

  /* ------------------------------------------------------------ top page */
  function fillCard(tpl, e, i) {
    var t = TYPES[e.type], node = tpl.content.firstElementChild.cloneNode(true);
    var f = function (k) { return $('[data-f="' + k + '"]', node); };
    var link = t.page + '?event=' + encodeURIComponent(e.id);
    if (f('img') && t.photos.length) {
      var ph = t.photos[i % t.photos.length];
      f('img').src = ph[0]; f('img').style.objectPosition = ph[1]; f('img').alt = t.alt;
      f('img').removeAttribute('loading');
    }
    var note = spotsNote(e);
    var price = (lang === 'ja' ? t.priceJa : t.priceEn) + (note ? ' · ' + note : '');
    if (f('date')) f('date').textContent = dateLabel(e);
    if (f('time')) f('time').textContent = '🕒 ' + timeRange(e);
    if (f('place')) f('place').textContent = '📍 ' + place(e);
    if (f('price')) f('price').textContent = price;
    if (f('badge')) f('badge').textContent = (lang === 'ja' ? 'NEW · ' : 'New · ') + (lang === 'ja' ? md(e) + '（' + dow(e) + '）' : fmt(e.start, { month: 'short', day: 'numeric' }));
    if (f('info')) f('info').innerHTML = esc(timeRange(e) + ' · ' + place(e)) + '<br>' + esc(price);
    if (f('link')) f('link').setAttribute('href', link);
    applyI18n(node);
    return node;
  }

  function renderTop() {
    $$('[data-top-events]').forEach(function (box) {
      var sec = box.closest('section');
      var tpls = {};
      $$('template[data-tpl]', sec).forEach(function (t) { tpls[t.getAttribute('data-tpl')] = t; });
      var counters = {};
      var list = events.filter(function (e) { return tpls[e.type]; }).slice(0, TOP_MAX);
      box.innerHTML = '';
      if (!list.length) {
        var p = document.createElement('p');
        p.style.cssText = 'margin:0;padding:28px;border-radius:24px;background:#F7F3EC;font-size:15px;line-height:1.8;color:#5B6470;max-width:520px';
        p.innerHTML = esc(MSG[lang].noEvents) + ' <a href="https://www.instagram.com/harmony_community_/" target="_blank" rel="noopener" style="color:#1E3A5F;font-weight:700">Instagram →</a>';
        box.appendChild(p);
      }
      list.forEach(function (e) {
        counters[e.type] = (counters[e.type] || 0);
        var card = fillCard(tpls[e.type], e, counters[e.type]++);
        box.appendChild(card);
      });
      var more = $('[data-see-all]', sec);
      if (more) {
        var expanded = box.__expanded;
        var first = box.closest('.v-pc') ? 8 : TOP_SP_FIRST;
        Array.prototype.forEach.call(box.children, function (c, i) { c.hidden = !expanded && i >= first; });
        more.hidden = expanded || box.children.length <= first;
      }
    });
  }

  /* ------------------------------------------------------- LP date cards */
  function rememberOriginal(el) {
    if (el && el.__orig == null) el.__orig = { html: el.innerHTML, href: el.getAttribute('href'), hidden: el.hidden };
  }
  function restore(el) {
    if (!el || el.__orig == null) return;
    el.innerHTML = el.__orig.html;
    if (el.__orig.href != null) el.setAttribute('href', el.__orig.href);
    el.hidden = el.__orig.hidden;
    applyI18n(el);
  }

  function renderDates() {
    $$('[data-dates]').forEach(function (sec) {
      var type = sec.getAttribute('data-dates');
      var list = ofType(type);
      if (type === 'sake') return renderSake(sec, list);
      var slots = $$('[data-slot]', sec);
      var filler = $('[data-filler]', sec);
      slots.forEach(function (slot, i) {
        rememberOriginal(slot);
        var e = list[i];
        var dEl = $('[data-f="date"]', slot), tEl = $('[data-f="time"]', slot);
        rememberOriginal(dEl); rememberOriginal(tEl); restore(dEl); restore(tEl);
        if (e) {
          slot.hidden = false;
          slot.setAttribute('data-event-id', e.id);
          slot.setAttribute('href', slot.__orig.href);
          if (dEl) {
            var small = dEl.querySelector('span');
            dEl.firstChild.nodeValue = md(e) + ' ';
            if (small) small.textContent = lang === 'ja' ? '（' + dow(e) + '）' : '(' + dow(e) + ')';
          }
          if (tEl) tEl.textContent = tEl.__orig.html.replace(/^\d\d:\d\d–\d\d:\d\d/, timeRange(e)).replace(/<[^>]+>/g, '');
          if (tEl && lang === 'en') tEl.textContent = tEl.textContent.replace(/Cafe Harmony（横浜・鶴見）/, 'Cafe Harmony, Tsurumi').replace(/鶴見/, 'Tsurumi').replace(/山手/, 'Yamate').replace(/神奈川近代文学館 和室（山手）/, 'Japanese-style room, Yamate');
          var full = isFull(e);
          slot.style.opacity = full ? '.55' : '';
          slot.style.pointerEvents = full ? 'none' : '';
        } else if (i === 0 && list.length === 0 && !filler) {
          slot.hidden = false;
          slot.removeAttribute('data-event-id');
          slot.setAttribute('href', 'https://www.instagram.com/harmony_community_/');
          if (dEl) { dEl.textContent = MSG[lang].soon; dEl.style.fontSize = ''; }
          if (tEl) tEl.textContent = MSG[lang].soonSub;
        } else {
          slot.hidden = true;
        }
      });
      if (filler) filler.hidden = list.length > slots.length;
    });
  }

  function renderSake(sec, list) {
    var title = $('[data-f="sk-title"]', sec), text = $('[data-f="sk-text"]', sec), cta = $('[data-f="sk-cta"]', sec), soon = $('[data-f="sk-soon"]', sec);
    [title, text, cta, soon].forEach(rememberOriginal);
    var e = list[0];
    if (!e) { [title, text, cta, soon].forEach(restore); return; }
    if (title) title.textContent = dateLabel(e) + ' ' + timeRange(e);
    if (text) {
      var more = list.slice(1, 3).map(dateLabel).join(' / ');
      text.textContent = place(e) + ' · ' + MSG[lang].skFee + (spotsNote(e) ? ' · ' + spotsNote(e) : '') + (more ? (lang === 'ja' ? '　次回：' : ' · Also: ') + more : '');
    }
    if (soon) soon.textContent = MSG[lang].skOpen;
    if (cta) {
      cta.innerHTML = esc(MSG[lang].applyDay) + ' <i>→</i>';
      var pc = !!cta.closest('.v-pc');
      cta.setAttribute('href', pc ? '#join-pc' : '#join');
      cta.removeAttribute('target');
      cta.setAttribute('data-event-id', e.id);
    }
  }

  /* ------------------------------------------------------------- forms */
  var preselect = null;
  try { preselect = new URLSearchParams(location.search).get('event'); } catch (e) {}

  /* Dates are checkboxes: guests can sign up for several dates at once. */
  function checkedIds(form) { return $$('input[name="eventId"]:checked', form).map(function (i) { return i.value; }); }

  function renderForms() {
    $$('[data-form]').forEach(function (form) {
      var box = $('[data-date-options]', form), none = $('[data-no-dates]', form);
      var list = ofType(PAGE.type);
      var cur = form.__picked || (preselect ? [preselect] : null);
      box.innerHTML = list.map(function (e) {
        var full = isFull(e), note = spotsNote(e);
        var small = lang === 'ja' ? '（' + dow(e) + '）' : ' ' + dow(e);
        return '<label class="hf-date"><input type="checkbox" name="eventId" value="' + esc(e.id) + '"' + (full ? ' disabled' : '') + '>' +
          '<span class="hf-date__in"><span class="hf-date__dot"></span><span><span class="hf-date__md">' + esc(md(e)) + '<small>' + esc(small) + '</small></span>' +
          '<span class="hf-date__time">' + esc(timeRange(e)) + '</span>' + (note ? '<span class="hf-date__left">' + esc(note) + '</span>' : '') + '</span></span></label>';
      }).join('');
      box.hidden = !list.length;
      if (none) none.hidden = !!list.length;
      var boxes = $$('input[name="eventId"]', form).filter(function (r) { return !r.disabled; });
      var any = false;
      if (cur) boxes.forEach(function (r) { if (cur.indexOf(r.value) >= 0) { r.checked = true; any = true; } });
      if (!any && !cur && boxes[0]) boxes[0].checked = true;
      var btn = $('button[type="submit"]', form);
      if (btn) btn.disabled = !list.some(function (e) { return !isFull(e); });
    });
  }

  /* A "sign up for this date" card adds that date to the selection. */
  function pickEvent(id) {
    $$('[data-form]').forEach(function (form) {
      var all = $$('input[name="eventId"]', form);
      var r = all.filter(function (x) { return x.value === id && !x.disabled; })[0];
      if (!form.__picked) all.forEach(function (x) { x.checked = false; });
      if (r) r.checked = true;
      var cur = form.__picked ? form.__picked.slice() : [];  /* untouched form: replace the default pick */
      if (cur.indexOf(id) < 0) cur.push(id);
      form.__picked = cur;
    });
  }

  function say(form, kind, text) {
    var box = $('[data-form-msg]', form);
    box.className = 'hf-msg ' + kind;
    box.textContent = text;
    box.hidden = false;
  }

  function submitForm(ev) {
    ev.preventDefault();
    var form = ev.target, m = MSG[lang];
    var g = function (n) { return form.elements[n]; };
    var ids = checkedIds(form);
    var base = {
      name: (g('name').value || '').trim(), email: (g('email').value || '').trim(), country: (g('country').value || '').trim(),
      ageRange: g('ageRange').value,
      practice: $$('input[name="reason"]:checked', form).map(function (i) { return i.value; }).join(' / '),
      firstTime: (form.querySelector('input[name="firstTime"]:checked') || {}).value || '',
      source: g('source').value, message: (g('message').value || '').trim(),
      over20: g('over20') ? g('over20').checked : false, consent: g('consent').checked,
      website: g('website').value, lang: lang
    };
    var evs = ids.map(function (id) { return events.filter(function (x) { return x.id === id; })[0]; });
    var err = null;
    if (!ids.length) err = m.pick;
    else if (!base.name) err = m.name_required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(base.email)) err = m.email_invalid;
    else if (evs.some(function (e) { return e && isFull(e); })) err = m.event_full;
    else if (evs.some(function (e) { return e && e.type === 'sake'; }) && !base.over20) err = m.over20_required;
    else if (!base.consent) err = m.consent_required;
    if (err) { say(form, 'err', err); return; }
    var btn = $('button[type="submit"]', form);
    btn.disabled = true;
    say(form, 'ok', m.sending);
    var label = function (id) { var e = events.filter(function (x) { return x.id === id; })[0]; return e ? dateLabel(e) : ''; };
    var results = [];
    /* one request per date, in order, so each gets its own row and confirmation */
    ids.reduce(function (chain, id) {
      return chain.then(function () {
        var data = {}; for (var k in base) data[k] = base[k]; data.eventId = id;
        return fetch(API_URL, { method: 'POST', body: JSON.stringify(data) })
          .then(function (r) { return r.json(); })
          .then(function (out) { results.push({ id: id, out: out }); })
          .catch(function () { results.push({ id: id, out: { ok: false, error: 'network' } }); });
      });
    }, Promise.resolve()).then(function () {
      var good = results.filter(function (r) { return r.out.ok; });
      var bad = results.filter(function (r) { return !r.out.ok; });
      if (results.length === 1) {
        var o = results[0].out;
        if (!o.ok) { say(form, 'err', m[o.error] || m.network); if (o.error === 'event_full') loadEvents(); return; }
        say(form, 'ok', o.status === 'waitlist' ? m.waitlist : o.status === 'duplicate' ? m.duplicate : m.ok);
      } else {
        var lines = [];
        var by = function (st) { return good.filter(function (r) { return (r.out.status || 'ok') === st; }).map(function (r) { return label(r.id); }); };
        if (by('ok').length) lines.push(m.multiOk(by('ok')));
        if (by('waitlist').length) lines.push(m.multiWait(by('waitlist')));
        if (by('duplicate').length) lines.push(m.multiDup(by('duplicate')));
        bad.forEach(function (r) { lines.push(label(r.id) + '：' + (m[r.out.error] || m.network)); });
        say(form, bad.length && !good.length ? 'err' : 'ok', lines.join('\n'));
        if (bad.some(function (r) { return r.out.error === 'event_full'; })) loadEvents();
      }
      if (good.length) {
        var keep = good.map(function (r) { return r.id; });
        form.reset();
        applySource();
        $$('input[name="eventId"]', form).forEach(function (r) { r.checked = keep.indexOf(r.value) >= 0; });
        form.__picked = keep;
      }
    }).then(function () { btn.disabled = false; });
  }

  /* ?from=ig etc. -> "How did you hear about us?" */
  var FROM = { ig: 'Instagram', instagram: 'Instagram', threads: 'Threads', th: 'Threads', meetup: 'Meetup', google: 'Google', friend: 'Friend' };
  function applySource() {
    var from = '';
    try { from = (new URLSearchParams(location.search).get('from') || '').toLowerCase(); } catch (e) {}
    if (!FROM[from]) return;
    $$('select[name="source"]').forEach(function (s) { s.value = FROM[from]; });
  }

  /* -------------------------------------------------------------- misc UI */
  function renderAll() { renderTop(); renderDates(); renderForms(); propagateFrom(); }

  function openMenu() {
    var m = $('#site-menu'); if (!m) return;
    m.hidden = false; document.documentElement.classList.add('menu-open');
    var c = $('[data-menu-close]', m); if (c) c.focus();
  }
  function closeMenu() {
    var m = $('#site-menu'); if (!m || m.hidden) return;
    m.hidden = true; document.documentElement.classList.remove('menu-open');
  }

  function visibleTarget(hash) {
    if (!hash || hash.length < 2) return null;
    var id = decodeURIComponent(hash.slice(1));
    var a = document.getElementById(id), b = document.getElementById(id + '-pc');
    var vis = function (el) { return el && el.getClientRects().length > 0; };
    if (vis(a)) return a;
    if (vis(b)) return b;
    var base = id.replace(/-pc$/, ''), c = document.getElementById(base);
    if (vis(c)) return c;
    if (base === 'join' || base === 'signup') return visibleTarget('#events');  /* old links to the top page form */
    return null;
  }

  function shuffleMarquee() {
    $$('.marq-track').forEach(function (track) {
      var items = Array.prototype.slice.call(track.children);
      var half = items.length / 2;
      if (half !== Math.floor(half) || half < 2) return;
      var order = [];
      for (var i = 0; i < half; i++) order.push(i);
      for (var j = order.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = order[j]; order[j] = order[k]; order[k] = t; }
      var imgs = items.map(function (it) { var im = it.querySelector('img'); return im ? { src: im.getAttribute('src'), alt: im.getAttribute('alt') } : null; });
      items.forEach(function (it, idx) {
        var im = it.querySelector('img'), src = imgs[order[idx % half]];
        if (im && src) { im.setAttribute('src', src.src); im.setAttribute('alt', idx < half ? (imgs[order[idx]].alt || src.alt || '') : ''); }
      });
    });
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var l = t.closest('[data-set-lang]');
    if (l) { setLang(l.getAttribute('data-set-lang'), true); return; }
    if (t.closest('[data-menu]')) { ev.preventDefault(); openMenu(); return; }
    if (t.closest('[data-menu-close]') || t.classList.contains('site-menu')) { closeMenu(); return; }
    var more = t.closest('[data-see-all]');
    if (more) {
      var box = $('[data-top-events]', more.closest('section'));
      box.__expanded = true; renderTop(); return;
    }
    var nav = t.closest('[data-carousel-prev],[data-carousel-next]');
    if (nav) {
      var car = $('[data-carousel]', nav.closest('section'));
      if (car) {
        var card = car.firstElementChild, step = card ? card.getBoundingClientRect().width + 24 : 324;
        car.scrollBy({ left: nav.hasAttribute('data-carousel-prev') ? -step : step, behavior: 'smooth' });
      }
      return;
    }
    var withEvent = t.closest('[data-event-id]');
    if (withEvent) pickEvent(withEvent.getAttribute('data-event-id'));
    var a = t.closest('a[href^="#"]');
    if (a) {
      var target = visibleTarget(a.getAttribute('href'));
      if (target) { ev.preventDefault(); closeMenu(); target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); history.replaceState(null, '', '#' + target.id.replace(/-pc$/, '')); }
      return;
    }
    if (t.closest('.site-menu a')) closeMenu();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeMenu(); });
  document.addEventListener('submit', function (ev) { if (ev.target.matches('[data-form]')) submitForm(ev); });
  document.addEventListener('change', function (ev) {
    if (ev.target.name === 'eventId') { var f = ev.target.closest('[data-form]'); if (f) f.__picked = checkedIds(f); }
  });

  /* Keep ?from=ig (etc.) when moving between our pages, so sign-ups are attributed. */
  function propagateFrom() {
    var from = '';
    try { from = new URLSearchParams(location.search).get('from') || ''; } catch (e) {}
    if (!from) return;
    $$('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!/^(index|language-exchange|board-games|sake|matcha)\.html/.test(h) || /[?&]from=/.test(h)) return;
      var parts = h.split('#');
      parts[0] += (parts[0].indexOf('?') < 0 ? '?' : '&') + 'from=' + encodeURIComponent(from);
      a.setAttribute('href', parts.join('#'));
    });
  }

  /* Play the sake video only when the visible copy scrolls into view. */
  function initVideos() {
    var vids = $$('video[data-autoplay]');
    if (!vids.length) return;
    var play = function (v) { if (!v.getClientRects().length) return; v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); };
    if (!('IntersectionObserver' in window)) { vids.forEach(play); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) play(en.target); else if (!en.target.paused) en.target.pause(); });
    }, { rootMargin: '200px' });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* Choose Your Experience: hovering (or first tap on phones) shows the details and photo. */
  function initExperiences() {
    var touch = window.matchMedia && matchMedia('(hover: none)').matches;
    $$('.xsec').forEach(function (sec) {
      $$('.xp', sec).forEach(function (li) {
        var k = li.getAttribute('data-x'), a = li.querySelector('a');
        li.addEventListener('mouseenter', function () { sec.setAttribute('data-x', k); });
        li.addEventListener('focusin', function () { sec.setAttribute('data-x', k); });
        if (a) a.addEventListener('click', function (ev) {
          if (touch && sec.getAttribute('data-x') !== k) { ev.preventDefault(); sec.setAttribute('data-x', k); }
        });
      });
      sec.addEventListener('mouseleave', function () { sec.removeAttribute('data-x'); });
    });
  }

  /* Hero catch: size each line group so the longest line spans the full width. */
  function fitText() {
    $$('[data-fit-group]').forEach(function (g) {
      if (!g.getClientRects().length) return;
      var lines = $$('[data-fit-line]', g), max = +g.getAttribute('data-fit-group') || 200;
      var avail = Math.min(g.clientWidth, +g.getAttribute('data-fit-width') || Infinity);
      if (!avail || !lines.length) return;
      var scale = Infinity;
      lines.forEach(function (l) {
        l.style.fontSize = '100px';
        var r = document.createRange(); r.selectNodeContents(l);
        var w = r.getBoundingClientRect().width;
        if (w) scale = Math.min(scale, avail / w);
      });
      if (!isFinite(scale)) return;
      var size = Math.min(max, Math.floor(100 * scale * 0.985));
      lines.forEach(function (l) { l.style.fontSize = size + 'px'; });
    });
  }
  var fitTimer;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(fitText, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitText);
  window.addEventListener('load', fitText);

  /* ------------------------------------------------------------------ go */
  toggleGroups = initToggles();
  shuffleMarquee();
  initialEvents();
  setLang(detectLang(), false);
  applySource();
  loadEvents();
  if (preselect) pickEvent(preselect);
  propagateFrom();
  initVideos();
  initExperiences();
  if (location.hash) {
    var go = function () { var t = visibleTarget(location.hash); if (t) t.scrollIntoView(); };
    if (document.readyState === 'complete') setTimeout(go, 50); else window.addEventListener('load', function () { setTimeout(go, 50); });
  }
})();
