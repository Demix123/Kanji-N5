// Kanji JPD113 — app state, rendering and interactions.
// Depends on globals from data.js (GROUPS, WORDS, KANJI, KMAP, TABS, DECKS, genNum, shuffle, norm, clean).

(() => {
  'use strict';

  // Settings (the design's tweakable props).
  const CONFIG = {
    cardFront: 'kanji',      // 'kanji' | 'reading'
    autoSpeak: true,
    quizFeedback: 'instant', // 'instant' | 'end'
    strokeSpeed: 0.6,        // seconds per stroke
    strokeNumbers: true,
  };
  const STORAGE_KEY = 'kanji-jpd113-v1';

  // ---------- State ----------
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) {}
  const S = {
    screen: 'home', group: 'thu', kanji: '日', q: '', hideR: false, examOnly: false, revealed: {},
    known: saved.known || {}, best: saved.best || {},
    fcDeck: 'all', fcIdx: 0, fcFlip: false,
    qDeck: 'all', qMode: 'choice', quiz: null,
    nMode: 'price', num: genNum('price'), numShown: false,
    strokes: null,
  };
  const strokeCache = {};

  function set(patch, opts = {}) {
    Object.assign(S, patch);
    if (opts.persist) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ known: S.known, best: S.best })); } catch (e) {}
    }
    render();
  }

  // ---------- Helpers ----------
  const $ = sel => document.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const attr = obj => Object.entries(obj).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  const pressed = on => `aria-pressed="${on ? 'true' : 'false'}"`;
  const groupById = id => GROUPS.find(g => g.id === id);

  function speak(text) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ja-JP'; u.rate = 0.85;
      const v = speechSynthesis.getVoices().find(v => /^ja/i.test(v.lang));
      if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }

  function pool(id) {
    if (id === 'all') return WORDS;
    if (id === 'weak') return WORDS.filter(w => !S.known[w.id]);
    if (id === 'warn') return WORDS.filter(w => w.warn);
    if (id === 'exam') return WORDS.filter(w => w.exam);
    return WORDS.filter(w => w.g === id);
  }

  function toggleKnown(id, val) {
    const known = { ...S.known };
    const v = val === undefined ? !known[id] : val;
    if (v) known[id] = true; else delete known[id];
    set({ known }, { persist: true });
  }

  function go(id) {
    set({ screen: id, q: '' });
    $('#q').value = '';
    if (id === 'kanji') loadStrokes(S.kanji);
    window.scrollTo(0, 0);
  }

  function openKanji(k) {
    $('#q').value = '';
    set({ screen: 'kanji', kanji: k, q: '' });
    loadStrokes(k);
    window.scrollTo(0, 0);
  }

  function openGroup(id) {
    $('#q').value = '';
    set({ screen: 'lesson', group: id, q: '', revealed: {} });
    window.scrollTo(0, 0);
  }

  // Stroke order from KanjiVG (CC BY-SA 3.0).
  function loadStrokes(k) {
    if (strokeCache[k]) { set({ strokes: strokeCache[k] }); return; }
    set({ strokes: null });
    const code = k.codePointAt(0).toString(16).padStart(5, '0');
    fetch('https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/' + code + '.svg')
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(t => {
        const paths = [...t.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1]);
        const nums = [...t.matchAll(/<text transform="matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)">(\d+)<\/text>/g)].map(m => ({ x: +m[1], y: +m[2], n: m[3] }));
        strokeCache[k] = { paths, nums };
      })
      .catch(() => { strokeCache[k] = { paths: [], nums: [] }; })
      .finally(() => { if (S.kanji === k) set({ strokes: strokeCache[k] }); });
  }

  // ---------- Flashcards ----------
  function fcMove(d) { set({ fcIdx: Math.max(0, S.fcIdx + d), fcFlip: false }); }
  function fcCurrent() { const deck = pool(S.fcDeck); return deck.length ? deck[S.fcIdx % deck.length] : null; }
  function fcFlip() {
    const card = fcCurrent(); if (!card) return;
    if (!S.fcFlip && CONFIG.autoSpeak) speak(card.r);
    S.fcFlip = !S.fcFlip;
    const el = $('.flip');
    if (el) { el.classList.toggle('is-flipped', S.fcFlip); el.setAttribute('aria-pressed', S.fcFlip); } else render();
  }
  function fcMark(v) {
    const card = fcCurrent(); if (!card) return;
    toggleKnown(card.id, v);
    if (S.fcDeck === 'weak' && v) set({ fcFlip: false }); else fcMove(1);
  }

  // ---------- Quiz ----------
  function startQuiz() {
    const p = pool(S.qDeck);
    const qs = shuffle(p).slice(0, Math.min(10, p.length)).map(w => {
      const same = WORDS.filter(x => x.g === w.g && x.r !== w.r).map(x => x.r);
      const opts = [w.r];
      if (w.wrong && w.wrong !== w.r) opts.push(w.wrong);
      shuffle([...new Set(same)]).forEach(r => { if (opts.length < 4 && !opts.includes(r)) opts.push(r); });
      return { w, opts: shuffle(opts) };
    });
    set({ quiz: { deck: S.qDeck, mode: S.qMode, qs, i: 0, checked: false, picked: null, typed: '', ok: false, wrong: [], score: 0, done: false } });
  }
  function answer(val, ok) {
    const z = S.quiz; if (!z || z.checked) return;
    const w = z.qs[z.i].w;
    S.quiz = { ...z, checked: true, picked: val, ok, score: z.score + (ok ? 1 : 0), wrong: ok ? z.wrong : [...z.wrong, w] };
    if (CONFIG.quizFeedback === 'end') return nextQ();
    render();
    if (CONFIG.autoSpeak) speak(w.r);
  }
  function submitTyped() {
    const z = S.quiz; if (!z || z.checked) return;
    const t = clean(z.typed); if (!t) return;
    answer(t, t === clean(z.qs[z.i].w.r));
  }
  function nextQ() {
    const z = S.quiz;
    if (z.i + 1 >= z.qs.length) {
      const pct = Math.round(z.score / z.qs.length * 100);
      const best = { ...S.best, [z.deck]: Math.max(S.best[z.deck] || 0, pct) };
      set({ best, quiz: { ...z, done: true } }, { persist: true });
    } else {
      set({ quiz: { ...z, i: z.i + 1, checked: false, picked: null, typed: '', ok: false } });
    }
  }

  // ---------- Views ----------
  function groupStats(g) {
    const kc = g.words.filter(w => S.known[w.id]).length;
    return { kc, pct: kc / g.words.length, warn: g.words.filter(w => w.warn).length, best: S.best[g.id] != null ? S.best[g.id] + '%' : '—' };
  }

  const deckChips = (cur, action) => DECKS.map(d =>
    `<button class="chip" ${pressed(cur === d.id)} ${attr({ action, id: d.id })}>${esc(d.label)}</button>`).join('');

  function viewHome() {
    const knownTotal = WORDS.filter(w => S.known[w.id]).length;
    const pct = knownTotal / WORDS.length * 100;
    const next = GROUPS.slice().sort((a, b) => groupStats(a).pct - groupStats(b).pct)[0];
    const cards = GROUPS.map(g => {
      const st = groupStats(g);
      return `<button class="card group-card" ${attr({ action: 'open-group', id: g.id })}>
        <span style="display:flex;justify-content:space-between;align-items:flex-start;width:100%">
          <span class="sample">${esc(g.sample)}</span><span class="pill-warn">⚠ ${st.warn}</span>
        </span>
        <span class="stack" style="gap:3px"><span class="title">${esc(g.title)}</span><span class="sub">${esc(g.sub)}</span></span>
        <span class="stack" style="gap:6px;width:100%">
          <span class="bar"><span style="width:${Math.round(st.pct * 100)}%"></span></span>
          <span style="font-size:12px;color:var(--muted)">${st.kc}/${g.words.length} từ · điểm kiểm tra ${st.best}</span>
        </span>
      </button>`;
    }).join('');
    return `<div class="stack home">
      <div class="hero">
        <div class="stack hero-copy">
          <div class="eyebrow">Speaking JPD113 · Kanji bài 1–3</div>
          <h1>Thuộc cách đọc theo nhóm, đọc trôi cả 10 đoạn văn mẫu.</h1>
          <p>Kanji trong đề chủ yếu là thứ, giờ, tiền và ngày, lặp đi lặp lại. Học theo nhóm, không học từng chữ, và tập trung vào chỗ biến âm <span style="color:var(--warn);font-weight:700">⚠</span>. Giám khảo hay bắt lỗi nhất ở đó.</p>
        </div>
        <div class="wrap" style="gap:10px">
          <button class="btn btn--primary" ${attr({ action: 'open-group', id: next.id })}>Học tiếp: ${esc(next.title)}</button>
          <button class="btn" data-action="warn-quiz">Kiểm tra chỗ ⚠</button>
        </div>
      </div>
      <div class="card overall">
        <div style="display:flex;align-items:baseline;gap:8px"><span class="overall-pct">${Math.round(pct)}%</span><span style="font-size:14px;color:var(--muted)">đã thuộc</span></div>
        <div class="bar" role="progressbar" aria-label="Tiến độ" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
        <div style="font-size:14px;color:var(--ink-3)">${knownTotal} / ${WORDS.length} từ · ${WORDS.filter(w => w.warn).length} chỗ ⚠</div>
      </div>
      <section class="stack" style="gap:14px">
        <h2 style="font-size:20px">Nhóm bài</h2>
        <div class="group-grid">${cards}</div>
      </section>
      <div class="tips-grid">
        <div class="card tips stack">
          <h3>Cách ôn (3–4 buổi)</h3>
          <ol>
            <li>Học theo nhóm. Ví dụ <span class="kj">曜日</span> luôn đọc ようび, chỉ cần nhớ chữ đứng trước.</li>
            <li>Thuộc các chỗ biến âm ⚠. Đây là chỗ giám khảo hay bắt lỗi nhất.</li>
            <li>Viết furigana bằng bút chì lên đoạn văn in ra, đọc to 2–3 lần, rồi tẩy dần.</li>
            <li>Ghi âm mình đọc rồi nghe lại. Chỗ nào khựng là từ chưa thuộc.</li>
          </ol>
        </div>
        <div class="card tips tips--dark stack">
          <h3>Mẹo nhớ biến âm</h3>
          <ul>
            <li>Số 9 đi với giờ và tháng đọc く: <span class="kj">九時</span> くじ, <span class="kj">九月</span> くがつ.</li>
            <li>Số 3 và 8 đi với 百/千 bị biến âm: さんびゃく, はっぴゃく, さんぜん.</li>
            <li>Ngày 10 và 20 đọc riêng: とおか, はつか (đừng nhầm ふつか là ngày 2).</li>
            <li>Số dài thì tách từng khúc: <span class="kj">八十万 / 三千 / 円</span>.</li>
            <li>Trợ từ: は đọc “wa”, へ đọc “e”, を đọc “o”.</li>
          </ul>
        </div>
      </div>
    </div>`;
  }

  function viewLesson() {
    const G = groupById(S.group);
    const rows = G.words.filter(w => !S.examOnly || w.exam).map(w => {
      const shown = !S.hideR || S.revealed[w.id];
      const kn = !!S.known[w.id];
      const chars = [...w.w].map(c => KMAP[c]
        ? `<button class="kchar" ${attr({ action: 'open-kanji', id: c })} aria-label="Xem chữ ${esc(c)}">${esc(c)}</button>`
        : `<span>${esc(c)}</span>`).join('');
      return `<div class="word-row">
        <div style="flex:1 1 170px;display:flex;align-items:center;gap:8px;min-width:0">
          ${w.warn ? '<span class="warn-badge" title="Biến âm" aria-label="Biến âm">⚠</span>' : ''}
          <span class="word-kanji" lang="ja">${chars}</span>
          ${w.exam ? '<span class="exam-tag">Đề mẫu</span>' : ''}
        </div>
        <div style="flex:1 1 170px;min-width:0">
          ${shown ? `<span class="jp" lang="ja" style="font-weight:500;font-size:19px">${esc(w.r)}</span>`
                  : `<button class="reveal" ${attr({ action: 'reveal', id: w.id })}>Chạm để xem</button>`}
        </div>
        <div class="stack" style="flex:2 1 200px;gap:2px;min-width:0">
          <span style="font-size:15px">${esc(w.m)}</span>
          <span style="font-size:13px;color:var(--warn)">${esc(w.note)}</span>
        </div>
        <div style="flex:none;display:flex;gap:6px">
          <button class="btn btn--icon" title="Nghe" aria-label="Nghe ${esc(w.w)}" ${attr({ action: 'speak', text: w.r })}>▶</button>
          <button class="known-btn" ${pressed(kn)} ${attr({ action: 'toggle-known', id: w.id })}>${kn ? '✓ Đã thuộc' : 'Đánh dấu thuộc'}</button>
        </div>
      </div>`;
    }).join('');
    const picker = GROUPS.map(g => `<button class="chip" ${pressed(S.group === g.id)} ${attr({ action: 'pick-group', id: g.id })}>${esc(g.title)}</button>`).join('');
    return `<div class="stack" style="gap:20px">
      <div class="chip-row">${picker}</div>
      <div class="wrap" style="gap:16px;align-items:flex-end;justify-content:space-between">
        <div class="stack" style="gap:6px">
          <h2 style="font-size:clamp(24px,3vw,32px)">${esc(G.title)}</h2>
          <span class="jp" style="font-weight:500;font-size:16px;color:var(--muted)">${esc(G.sub)}</span>
        </div>
        <div class="wrap" style="gap:8px">
          <button class="btn btn--md" data-action="lesson-flash">Luyện thẻ nhóm này</button>
          <button class="btn btn--md btn--primary" data-action="lesson-quiz">Kiểm tra nhóm này</button>
        </div>
      </div>
      <div class="note-box"><b>Quy tắc: </b>${esc(G.tip)}</div>
      <div class="wrap" style="gap:8px;align-items:center">
        <button class="chip chip--square" ${pressed(S.hideR)} data-action="toggle-hide">Ẩn cách đọc (tự kiểm tra)</button>
        <button class="chip chip--square" ${pressed(S.examOnly)} data-action="toggle-exam">Chỉ từ có trong đề mẫu</button>
        <span class="muted" style="font-size:13px">Bấm vào chữ kanji để xem chi tiết và thứ tự nét.</span>
      </div>
      <div class="list">${rows}</div>
    </div>`;
  }

  function strokeSvg() {
    const st = S.strokes;
    if (!st || !st.paths.length) {
      return `<div class="stroke-fallback kj" style="color:${st ? 'var(--ink)' : '#d1cdbd'}">${esc(S.kanji)}</div>`;
    }
    const sp = CONFIG.strokeSpeed;
    const guide = 'stroke="#e3dfd1" stroke-dasharray="2 2" stroke-width=".5"';
    const ghost = st.paths.map(d => `<path d="${d}" fill="none" stroke="#dedac9" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    const ink = st.paths.map((d, i) => `<path d="${d}" pathLength="1" fill="none" stroke="#1f2420" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:1;stroke-dashoffset:1;animation:kdraw ${sp}s ease-in-out ${(i * (sp + 0.1)).toFixed(2)}s forwards"/>`).join('');
    const nums = CONFIG.strokeNumbers ? st.nums.map(n => `<text x="${n.x}" y="${n.y}" font-size="7" fill="#1d4d35" font-family="Be Vietnam Pro, sans-serif" font-weight="600">${n.n}</text>`).join('') : '';
    return `<svg viewBox="0 0 109 109" role="img" aria-label="Thứ tự nét chữ ${esc(S.kanji)}" style="width:100%;height:100%;display:block">
      <line x1="54.5" y1="0" x2="54.5" y2="109" ${guide}/><line x1="0" y1="54.5" x2="109" y2="54.5" ${guide}/>${ghost}${ink}${nums}</svg>`;
  }

  function viewKanji() {
    const K = KMAP[S.kanji];
    const kwords = WORDS.filter(w => w.w.includes(S.kanji)).slice(0, 12).map(w =>
      `<button class="kword${w.warn ? ' is-warn' : ''}" ${attr({ action: 'speak', text: w.r })}>
        <span class="kj" style="font-weight:700;font-size:18px">${esc(w.w)}</span>
        <span class="jp" style="font-weight:500;font-size:13px;color:var(--ink-3)">${esc(w.r)}</span>
      </button>`).join('');
    const tiles = KANJI.map(x =>
      `<button class="ktile" ${pressed(x.k === S.kanji)} ${attr({ action: 'open-kanji', id: x.k })} aria-label="${esc(x.k)} ${esc(x.hv)}">
        <span class="k">${esc(x.k)}</span><span class="hv">${esc(x.HV)}</span></button>`).join('');
    return `<div class="kanji-layout">
      <div class="card kanji-detail stack">
        <div class="wrap" style="gap:20px;align-items:flex-start">
          <div class="stack" style="gap:8px;align-items:center">
            <div class="stroke-box" id="stroke-box">${strokeSvg()}</div>
            <div style="display:flex;gap:6px">
              <button class="btn btn--sm" data-action="replay">↻ Xem lại nét</button>
              <button class="btn btn--sm" data-action="speak-kanji">▶ Nghe</button>
            </div>
          </div>
          <div class="stack" style="flex:1 1 160px;gap:14px">
            <div class="stack" style="gap:2px">
              <span class="label">Hán Việt</span>
              <span class="hv-big">${esc(K.HV)}</span>
              <span style="font-size:16px">${esc(K.m)}</span>
            </div>
            <div class="facts">
              <span class="muted">Âm On</span><span class="jp" style="font-weight:500;font-size:17px">${esc(K.on)}</span>
              <span class="muted">Âm Kun</span><span class="jp" style="font-weight:500;font-size:17px">${esc(K.kun)}</span>
              <span class="muted">Số nét</span><span style="font-weight:600">${K.s}</span>
            </div>
          </div>
        </div>
        <div class="stack" style="gap:8px">
          <span class="label">Từ có chữ ${esc(K.k)} trong bài</span>
          <div class="wrap" style="gap:6px">${kwords}</div>
        </div>
      </div>
      <div class="stack" style="flex:1.3 1 340px;gap:12px">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="font-size:20px">Kanji bài 1–3</h2><span class="muted" style="font-size:13px">${KANJI.length} chữ</span></div>
        <div class="kanji-tiles">${tiles}</div>
      </div>
    </div>`;
  }

  function viewFlash() {
    const deck = pool(S.fcDeck);
    const body = !deck.length
      ? `<div style="padding:60px 20px;text-align:center;color:var(--ink-3);font-size:16px">Bạn đã thuộc hết thẻ trong bộ này. Chọn bộ khác để ôn tiếp.</div>`
      : (() => {
        const i = S.fcIdx % deck.length, card = deck[i];
        const rev = CONFIG.cardFront === 'reading';
        const front = rev ? card.r : card.w;
        const size = rev ? (front.length > 7 ? '40px' : '56px') : (front.length <= 2 ? '120px' : front.length <= 4 ? '84px' : '56px');
        return `<div class="stack" style="width:100%;max-width:540px;gap:16px">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted)"><span>Thẻ ${i + 1} / ${deck.length}</span><span>${esc(groupById(card.g).title)}</span></div>
          <button class="flip${S.fcFlip ? ' is-flipped' : ''}" data-action="fc-flip" ${pressed(S.fcFlip)} aria-label="Lật thẻ">
            <span class="flip-inner" style="display:block">
              <span class="face face--front">
                ${card.warn ? '<span class="pill-warn" style="position:absolute;top:16px;left:16px;font-weight:700">⚠ Biến âm</span>' : ''}
                <span class="${rev ? 'jp' : 'kj'}" lang="ja" style="font-weight:700;font-size:${size};line-height:1.15">${esc(front)}</span>
                <span style="font-size:13px;color:var(--faint)">Chạm để lật · phím cách</span>
              </span>
              <span class="face face--back">
                <span class="kj" lang="ja" style="font-weight:700;font-size:30px;color:var(--deep-muted)">${rev ? '' : esc(card.w)}</span>
                <span class="${rev ? 'kj' : 'jp'}" lang="ja" style="font-weight:500;font-size:40px;line-height:1.2">${esc(rev ? card.w : card.r)}</span>
                <span style="font-size:17px;color:var(--deep-text)">${esc(card.m)}</span>
                <span style="font-size:14px;color:#e8b9a2;max-width:380px">${esc(card.note)}</span>
              </span>
            </span>
          </button>
          <div class="fc-controls">
            <button class="btn sq" title="Thẻ trước" aria-label="Thẻ trước" data-action="fc-prev">←</button>
            <button class="btn" data-action="fc-no">Chưa thuộc</button>
            <button class="btn btn--success" data-action="fc-yes">Đã thuộc ✓</button>
            <button class="btn sq" style="font-size:14px" title="Nghe" aria-label="Nghe" ${attr({ action: 'speak', text: card.r })}>▶</button>
          </div>
          <div style="text-align:center;font-size:12px;color:var(--faint)">Phím cách: lật · → thẻ tiếp · ← thẻ trước</div>
        </div>`;
      })();
    return `<div class="stack" style="gap:20px;align-items:center">
      <div class="chip-row">${deckChips(S.fcDeck, 'fc-deck')}</div>${body}</div>`;
  }

  function viewQuiz() {
    const z = S.quiz;
    if (!z) {
      const modes = [['choice', 'Chọn đáp án'], ['type', 'Gõ hiragana']].map(([id, label]) =>
        `<button ${pressed(S.qMode === id)} ${attr({ action: 'q-mode', id })}>${label}</button>`).join('');
      return `<div class="stack narrow"><div class="stack" style="gap:22px">
        <div><h2 style="margin-bottom:6px;font-size:26px">Kiểm tra cách đọc</h2><p style="color:var(--ink-3);font-size:15px">10 câu mỗi lượt. Nhìn kanji, chọn hoặc gõ cách đọc bằng hiragana.</p></div>
        <div class="stack" style="gap:10px"><span class="label">Bộ câu hỏi</span><div class="wrap" style="gap:6px">${deckChips(S.qDeck, 'q-deck')}</div></div>
        <div class="stack" style="gap:10px"><span class="label">Cách trả lời</span><div class="segmented">${modes}</div></div>
        <div class="wrap" style="align-items:center;gap:16px">
          <button class="btn btn--primary btn--lg" data-action="q-start">Bắt đầu</button>
          <span class="muted" style="font-size:14px">Điểm cao nhất bộ này: ${S.best[S.qDeck] != null ? S.best[S.qDeck] + '%' : 'chưa có'}</span>
        </div>
      </div></div>`;
    }
    if (z.done) {
      const pct = z.score / z.qs.length;
      const verdict = pct >= 0.9 ? 'Rất tốt! Sẵn sàng cho bài thi.' : pct >= 0.6 ? 'Khá ổn. Ôn lại mấy từ dưới đây.' : 'Cần ôn thêm. Thử học lại nhóm này trước.';
      const wrong = z.wrong.map(w => `<div class="word-row" style="gap:6px 18px;padding:12px 18px">
        <span class="kj" lang="ja" style="font-weight:700;font-size:22px;min-width:110px">${esc(w.w)}</span>
        <span class="jp" lang="ja" style="font-weight:500;font-size:17px;flex:1">${esc(w.r)}</span>
        <span style="font-size:13px;color:var(--warn)">${esc(w.note)}</span></div>`).join('');
      return `<div class="stack narrow">
        <div class="card stack" style="border-radius:var(--r-xl);padding:32px;align-items:center;gap:6px;text-align:center">
          <span class="muted" style="font-size:14px">Kết quả</span>
          <span style="font-size:56px;font-weight:700;line-height:1.1">${z.score}<span style="font-size:24px;color:var(--faint)"> / ${z.qs.length}</span></span>
          <span style="font-size:16px;color:var(--ink-3)">${verdict}</span>
        </div>
        ${z.wrong.length ? `<div class="stack" style="gap:8px"><span class="label">Cần ôn lại</span><div class="list">${wrong}</div></div>` : ''}
        <div class="wrap" style="gap:10px">
          <button class="btn btn--primary" data-action="q-start">Làm lượt mới</button>
          <button class="btn" data-action="q-quit">Chọn bộ khác</button>
        </div>
      </div>`;
    }
    const q = z.qs[z.i], w = q.w;
    const prog = (z.i + (z.checked ? 1 : 0)) / z.qs.length * 100;
    const answerUi = z.mode === 'choice'
      ? `<div class="options">${q.opts.map(o => {
          let cls = '';
          if (z.checked) cls = o === w.r ? ' is-right' : o === z.picked ? ' is-wrong' : ' is-dim';
          return `<button class="option${cls}" lang="ja" ${attr({ action: 'q-pick', text: o })}>${esc(o)}</button>`;
        }).join('')}</div>`
      : `<div style="display:flex;gap:8px">
          <label class="sr-only" for="q-type">Cách đọc</label>
          <input id="q-type" class="input jp" lang="ja" value="${esc(z.typed)}" placeholder="Gõ hiragana, vd: くじ" autocomplete="off" ${z.checked ? 'readonly' : ''}
            style="height:54px;padding:0 16px;border-width:1.5px;border-radius:12px;font-weight:500;font-size:20px">
          <button class="btn btn--dark" style="height:54px;border-radius:12px" data-action="q-submit">Kiểm tra</button>
        </div>`;
    const fbTitle = z.ok ? 'Chính xác!' : (z.mode === 'type' && z.picked ? 'Chưa đúng. Bạn gõ: ' + z.picked : 'Chưa đúng');
    const feedback = z.checked ? `<div class="feedback ${z.ok ? 'is-ok' : 'is-bad'}" role="status">
        <div class="stack" style="flex:1 1 240px;gap:4px">
          <span style="font-size:16px;font-weight:700">${esc(fbTitle)}</span>
          <span style="font-size:15px"><span class="kj" lang="ja">${esc(w.w)}</span> = <span class="jp" lang="ja" style="font-weight:700">${esc(w.r)}</span></span>
          <span style="font-size:13px">${esc(w.note)}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="ghost-round" aria-label="Nghe" ${attr({ action: 'speak', text: w.r })}>▶</button>
          <button class="btn btn--dark" style="height:44px;padding:0 18px" data-action="q-next" id="q-next">Tiếp →</button>
        </div>
      </div>` : '';
    return `<div class="stack narrow"><div class="stack" style="gap:18px">
      <div style="display:flex;align-items:center;gap:12px">
        <span class="muted" style="font-size:13px;white-space:nowrap">Câu ${z.i + 1} / ${z.qs.length}</span>
        <div class="bar" style="flex:1"><span style="width:${prog}%;background:var(--ink)"></span></div>
        <button class="link-btn" data-action="q-quit">Thoát</button>
      </div>
      <div class="card prompt">
        <span class="muted" style="font-size:13px">Đọc từ này thế nào?</span>
        <span class="kj" lang="ja" style="font-weight:700;font-size:clamp(48px,10vw,76px);line-height:1.2;text-align:center">${esc(w.w)}</span>
        <span class="muted" style="font-size:14px">${esc(w.m)}</span>
      </div>
      ${answerUi}${feedback}
    </div></div>`;
  }

  function viewNumber() {
    const NT = {
      price: 'Tách số thành từng khúc (vạn / nghìn / trăm / chục) rồi đọc lần lượt. 3 và 8 trước 百/千 luôn biến âm; 4円 đọc よえん.',
      time: '四時 よじ, 七時 しちじ, 九時 くじ. Phút: 1, 3, 4, 6, 8, 10 đọc ぷん.',
      date: 'Ngày 1–10, 14, 20, 24 đọc riêng. 四月 しがつ, 七月 しちがつ, 九月 くがつ.',
    };
    const modes = [['price', 'Giá tiền'], ['time', 'Giờ : phút'], ['date', 'Ngày tháng']].map(([id, label]) =>
      `<button ${pressed(S.nMode === id)} ${attr({ action: 'n-mode', id })}>${label}</button>`).join('');
    const num = S.num;
    const segs = num.segs.map(s => `<div class="seg${s.warn ? ' is-warn' : ''}">
      <span class="kj" lang="ja" style="font-weight:700;font-size:22px">${esc(s.k)}</span>
      <span class="jp" lang="ja" style="font-weight:500;font-size:18px">${esc(s.r)}</span></div>`).join('');
    return `<div class="stack" style="max-width:760px;margin:0 auto;gap:20px">
      <div><h2 style="margin-bottom:6px;font-size:26px">Đọc số ngẫu nhiên</h2><p style="color:var(--ink-3);font-size:15px">Đề thi có thể đổi số. Đọc to trước, rồi mới hiện đáp án để so.</p></div>
      <div class="segmented">${modes}</div>
      <div class="card stack" style="border-radius:var(--r-xl);padding:36px 20px;align-items:center;gap:22px">
        <span class="muted" style="font-size:14px">${esc(num.label)}</span>
        <span class="kj" lang="ja" style="font-weight:700;font-size:clamp(40px,8vw,68px);line-height:1.2;text-align:center;word-break:keep-all">${esc(num.segs.map(s => s.k).join(''))}</span>
        ${S.numShown ? `<div class="wrap" style="justify-content:center;gap:8px">${segs}</div>` : ''}
        <div class="wrap" style="justify-content:center;gap:8px">
          <button class="btn" data-action="n-reveal">${S.numShown ? 'Ẩn cách đọc' : 'Hiện cách đọc'}</button>
          <button class="btn" ${attr({ action: 'speak', text: num.segs.map(s => s.r).join('') })}>▶ Nghe</button>
          <button class="btn btn--primary" data-action="n-next">Số khác →</button>
        </div>
      </div>
      <div class="note-box" style="font-size:14px;line-height:1.6;color:var(--ink-3)"><b style="color:var(--accent-ink)">Mẹo: </b>${esc(NT[S.nMode])}</div>
    </div>`;
  }

  function viewPassage() {
    return `<div class="stack" style="max-width:640px;margin:40px auto;text-align:center;align-items:center;gap:14px">
      <div aria-hidden="true" class="kj" style="width:64px;height:64px;border-radius:14px;background:var(--track);display:grid;place-items:center;font-weight:700;font-size:30px;color:var(--muted)">読</div>
      <h2 style="font-size:24px">10 đoạn văn mẫu</h2>
      <p style="color:var(--ink-3);font-size:15px;line-height:1.65;text-wrap:pretty">Luyện đọc to từng đoạn: bật/tắt furigana, đánh dấu ngắt hơi, nghe mẫu từng câu, và ẩn dần furigana như cách tẩy bút chì.</p>
      <span style="font-size:13px;color:var(--faint);border:1px dashed var(--dashed);padding:6px 12px;border-radius:8px">Nội dung đoạn văn đang được bổ sung</span>
    </div>`;
  }

  function viewSearch(qt) {
    const nq = norm(qt);
    const words = WORDS.filter(w => w.w.includes(qt) || w.r.includes(qt) || norm(w.m).includes(nq)).slice(0, 30);
    const kanji = KANJI.filter(x => qt.includes(x.k) || norm(x.hv) === nq || (nq.length > 1 && (norm(x.hv).includes(nq) || norm(x.m).includes(nq))) || x.on.includes(qt) || x.kun.includes(qt));
    const kHtml = kanji.map(x => `<button class="card kchip" ${attr({ action: 'open-kanji', id: x.k })}>
      <span class="kj" lang="ja" style="font-weight:700;font-size:34px;line-height:1">${esc(x.k)}</span>
      <span class="stack" style="gap:2px"><span style="font-size:12px;font-weight:700;letter-spacing:.06em;color:var(--accent)">${esc(x.HV)}</span><span style="font-size:13px;color:var(--ink-3)">${esc(x.m)}</span></span>
    </button>`).join('');
    const wHtml = words.map(w => `<button class="word-row word-row--link" ${attr({ action: 'open-group', id: w.g })}>
      <span class="kj" lang="ja" style="font-weight:700;font-size:24px;min-width:120px">${esc(w.w)}</span>
      <span class="jp" lang="ja" style="font-weight:500;font-size:17px;min-width:140px">${esc(w.r)}</span>
      <span style="flex:1;font-size:14px;color:var(--ink-3)">${esc(w.m)}</span>
      <span class="muted" style="font-size:12px">${esc(groupById(w.g).title)} →</span>
    </button>`).join('');
    return `<div class="stack" style="gap:24px">
      <h2 style="font-size:22px">Kết quả cho “${esc(qt)}”</h2>
      ${!words.length && !kanji.length ? '<p class="muted">Không tìm thấy. Thử gõ Hán Việt không dấu (vd: “nhat”), hiragana hoặc nghĩa tiếng Việt.</p>' : ''}
      ${kanji.length ? `<div class="stack" style="gap:10px"><div class="label">Kanji</div><div class="wrap" style="gap:10px">${kHtml}</div></div>` : ''}
      ${words.length ? `<div class="stack" style="gap:10px"><div class="label">Từ vựng</div><div class="list">${wHtml}</div></div>` : ''}
    </div>`;
  }

  // ---------- Render ----------
  const VIEWS = { home: viewHome, lesson: viewLesson, kanji: viewKanji, flash: viewFlash, quiz: viewQuiz, number: viewNumber, passage: viewPassage };

  function render() {
    const qt = S.q.trim();
    const knownTotal = WORDS.filter(w => S.known[w.id]).length;
    $('#known-total').textContent = knownTotal;
    $('#known-of').textContent = `/ ${WORDS.length} từ đã thuộc`;
    $('#q-clear').hidden = !qt;
    $('#tabs').innerHTML = TABS.map(([id, label]) =>
      `<button class="tab" ${attr({ action: 'go', id })} ${S.screen === id && !qt ? 'aria-current="page"' : ''}>${label}</button>`).join('');
    $('#app').innerHTML = qt ? viewSearch(qt) : VIEWS[S.screen]();
    const typeInput = $('#q-type');
    if (typeInput && !S.quiz.checked) typeInput.focus();
    else if (S.quiz && S.quiz.checked && S.quiz.mode === 'type') $('#q-next')?.focus();
  }

  // ---------- Events ----------
  const ACTIONS = {
    'go': d => go(d.id),
    'open-group': d => openGroup(d.id),
    'pick-group': d => set({ group: d.id, revealed: {} }),
    'open-kanji': d => openKanji(d.id),
    'speak': d => speak(d.text),
    'speak-kanji': () => { const K = KMAP[S.kanji]; speak(K.kun !== '—' ? K.kun.split('・')[0].replace(/[()]/g, '') : K.on.split('・')[0]); },
    'replay': () => { const box = $('#stroke-box'); if (box) box.innerHTML = strokeSvg(); },
    'reveal': d => set({ revealed: { ...S.revealed, [d.id]: true } }),
    'toggle-known': d => toggleKnown(d.id),
    'toggle-hide': () => set({ hideR: !S.hideR, revealed: {} }),
    'toggle-exam': () => set({ examOnly: !S.examOnly }),
    'lesson-flash': () => set({ screen: 'flash', fcDeck: S.group, fcIdx: 0, fcFlip: false }),
    'lesson-quiz': () => { set({ screen: 'quiz', qDeck: S.group }); startQuiz(); },
    'warn-quiz': () => { set({ screen: 'quiz', qDeck: 'warn' }); startQuiz(); },
    'fc-deck': d => set({ fcDeck: d.id, fcIdx: 0, fcFlip: false }),
    'fc-flip': () => fcFlip(),
    'fc-prev': () => fcMove(-1),
    'fc-no': () => fcMark(false),
    'fc-yes': () => fcMark(true),
    'q-deck': d => set({ qDeck: d.id }),
    'q-mode': d => set({ qMode: d.id }),
    'q-start': () => startQuiz(),
    'q-quit': () => set({ quiz: null }),
    'q-pick': d => answer(d.text, d.text === S.quiz.qs[S.quiz.i].w.r),
    'q-submit': () => submitTyped(),
    'q-next': () => nextQ(),
    'n-mode': d => set({ nMode: d.id, num: genNum(d.id), numShown: false }),
    'n-reveal': () => set({ numShown: !S.numShown }),
    'n-next': () => set({ num: genNum(S.nMode), numShown: false }),
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) fn(el.dataset);
  });

  $('#q').addEventListener('input', e => set({ q: e.target.value }));
  $('#q-clear').addEventListener('click', () => { $('#q').value = ''; set({ q: '' }); $('#q').focus(); });

  // Typed quiz answers: keep the value without re-rendering, so the input keeps focus.
  document.addEventListener('input', e => { if (e.target.id === 'q-type' && S.quiz) S.quiz.typed = e.target.value; });
  document.addEventListener('keydown', e => {
    if (e.target.id === 'q-type' && e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      if (S.quiz.checked) nextQ(); else submitTyped();
      return;
    }
    if (/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName) && e.code === 'Space') return;
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (S.screen !== 'flash' || S.q.trim()) return;
    if (e.code === 'Space') { e.preventDefault(); fcFlip(); }
    else if (e.key === 'ArrowRight') fcMove(1);
    else if (e.key === 'ArrowLeft') fcMove(-1);
  });

  try { speechSynthesis.getVoices(); } catch (e) {}
  render();
})();
