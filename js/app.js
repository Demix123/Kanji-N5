// Demix · JPD113 — app state, rendering and interactions.
// Depends on globals from data.js (GROUPS, WORDS, KANJI, KMAP, TABS, DECKS, genNum, shuffle, norm, clean),
// vocab.js (VOCAB, VOCAB_TYPES), grammar.js (GRAMMAR), reading.js (PASSAGES, PRACTICE_SENTENCES)
// and speaking.js (SPEAK_KINDS, SPEAK_SETS).

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
    // Từ vựng
    vLesson: 1, vTopic: 'all', vHide: 'none', vRevealed: {},
    // Ngữ pháp
    gLesson: 1, gHideVi: false,
    // Speaking
    spMode: 'passage', psg: 1, furi: true, breaks: false, showVi: false,
    qaKind: 'person', qaSet: 'p1', qaShow: {}, qaAll: false, qaFocus: -1,
    recording: false, recUrl: '',
  };
  const strokeCache = {};
  const LESSONS = [1, 2, 3];
  const VOCAB_DECKS = LESSONS.map(l => ({ id: 'v' + l, label: 'Từ vựng bài ' + l })).concat([{ id: 'vall', label: 'Từ vựng 1–3' }]);
  const ALL_DECKS = DECKS.concat(VOCAB_DECKS);
  const ALL_ITEMS = WORDS.concat(VOCAB);
  // Deck for the vocab page's current lesson and group.
  const vocabDeck = () => 'v' + S.vLesson + (S.vTopic === 'all' ? '' : ':' + S.vTopic);

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
  // Topic decks look like 'v3:day' (lesson 3, group "day" in VOCAB_TOPICS).
  const topicOf = id => { const [g, t] = String(id).split(':'); const tp = t && (VOCAB_TOPICS[g.slice(1)] || []).find(x => x[0] === t); return tp ? { g, t, lesson: g.slice(1), label: tp[1] } : null; };
  const deckTitle = g => { const G = groupById(g); if (G) return G.title; const tp = topicOf(g); if (tp) return `Bài ${tp.lesson} · ${tp.label}`; const d = ALL_DECKS.find(x => x.id === g); return d ? d.label : ''; };
  // Katakana → hiragana, so typed answers match either script.
  const toHira = s => (s || '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const same = (a, b) => toHira(clean(a)) === toHira(clean(b));
  // {漢字|かんじ} markup: ruby() renders it (with or without furigana), plain() gives the reading for speech.
  const ruby = (s, furi = true) => esc(s).replace(/\{([^|}]+)\|([^}]+)\}/g, (_, k, r) => furi ? `<ruby>${k}<rt>${r}</rt></ruby>` : k);
  const plain = s => String(s).replace(/\{([^|}]+)\|([^}]+)\}/g, '$2');
  const withBreaks = (html, on) => on ? html.replace(/　/g, '<span class="pause" aria-hidden="true">／</span>') : html;

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
    if (id === 'vall') return VOCAB;
    const tp = topicOf(id);
    if (tp) return VOCAB.filter(w => w.g === tp.g && w.topic === tp.t);
    if (id[0] === 'v') return VOCAB.filter(w => w.g === id);
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
      const src = w.kind === 'vocab' ? VOCAB : WORDS;
      const same = src.filter(x => x.g === w.g && x.r !== w.r);
      const opts = [w.r];
      if (w.wrong && w.wrong !== w.r) opts.push(w.wrong);
      // Vocab: wrong options come from the same topic first (verbs vs verbs), then the rest of the lesson.
      const near = w.topic ? shuffle(same.filter(x => x.topic === w.topic)) : [];
      [...near, ...shuffle(same)].forEach(x => { if (opts.length < 4 && !opts.includes(x.r)) opts.push(x.r); });
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
    answer(t, same(t, z.qs[z.i].w.r));
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

  // A topic deck ('v3:day') keeps its lesson chip ('v3') selected.
  const deckChips = (cur, action) => ALL_DECKS.map(d =>
    `<button class="chip" ${pressed(cur === d.id || (topicOf(cur) || {}).g === d.id)} ${attr({ action, id: d.id })}>${esc(d.label)}</button>`).join('');
  // Second row under the deck chips: the topic groups of the chosen vocab lesson (empty for other decks).
  function topicChips(cur, action) {
    const tp = topicOf(cur), g = tp ? tp.g : /^v\d$/.test(cur) ? cur : null;
    if (!g) return '';
    const words = VOCAB.filter(v => v.g === g);
    const opts = [[g, 'Cả bài', words.length]].concat((VOCAB_TOPICS[g.slice(1)] || []).map(([id, label]) => [g + ':' + id, label, words.filter(v => v.topic === id).length]));
    return `<div class="stack" style="gap:8px"><span class="label">Nhóm trong bài ${g.slice(1)}</span>
      <div class="wrap" style="gap:6px">${opts.map(([id, label, n]) => `<button class="chip chip--square" ${pressed(cur === id)} ${attr({ action, id })}>${esc(label)} <span style="opacity:.6">${n}</span></button>`).join('')}</div></div>`;
  }

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
          <div class="eyebrow">JPD113 · Bài 1–3</div>
          <h1>Kanji, từ vựng, ngữ pháp và Speaking trong một chỗ.</h1>
          <p>Kanji trong đề chủ yếu là thứ, giờ, tiền và ngày, lặp đi lặp lại. Học theo nhóm, tập trung vào chỗ biến âm <span style="color:var(--warn);font-weight:700">⚠</span>, rồi luyện đọc đoạn văn và trả lời câu hỏi theo tranh.</p>
        </div>
        <div class="wrap" style="gap:10px">
          <button class="btn btn--primary" ${attr({ action: 'open-group', id: next.id })}>Học tiếp: ${esc(next.title)}</button>
          <button class="btn" ${attr({ action: 'go', id: 'speaking' })}>Luyện Speaking</button>
        </div>
      </div>
      <section class="stack" style="gap:14px">
        <h2 style="font-size:20px">Các phần học</h2>
        <div class="section-grid">
          ${[
            ['lesson', '漢', 'Đọc kanji', `${WORDS.length} từ · ${GROUPS.length} nhóm`],
            ['vocab', '語', 'Từ vựng', `${VOCAB.length} từ · ${VOCAB.filter(v => S.known[v.id]).length} đã thuộc`],
            ['grammar', '文', 'Ngữ pháp', `${LESSONS.reduce((n, l) => n + GRAMMAR[l].length, 0)} mẫu câu`],
            ['speaking', '話', 'Speaking', `${PASSAGES.length} đoạn văn · ${SPEAK_SETS.length} tranh`],
          ].map(([id, k, t, sub]) => `<button class="card section-card" ${attr({ action: 'go', id })}>
            <span class="kj section-k" aria-hidden="true">${k}</span>
            <span class="stack" style="gap:2px"><span class="title">${t}</span><span class="muted" style="font-size:13px">${sub}</span></span>
          </button>`).join('')}
        </div>
      </section>
      <div class="card overall">
        <div style="display:flex;align-items:baseline;gap:8px"><span class="overall-pct">${Math.round(pct)}%</span><span style="font-size:14px;color:var(--muted)">kanji đã thuộc</span></div>
        <div class="bar" role="progressbar" aria-label="Tiến độ" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
        <div style="font-size:14px;color:var(--ink-3)">${knownTotal} / ${WORDS.length} từ · ${WORDS.filter(w => w.warn).length} chỗ ⚠</div>
      </div>
      <section class="stack" style="gap:14px">
        <h2 style="font-size:20px">Nhóm kanji</h2>
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
          <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted)"><span>Thẻ ${i + 1} / ${deck.length}</span><span>${esc(deckTitle(card.g))}</span></div>
          <button class="flip${S.fcFlip ? ' is-flipped' : ''}" data-action="fc-flip" ${pressed(S.fcFlip)} aria-label="Lật thẻ">
            <span class="flip-inner" style="display:block">
              <span class="face face--front">
                ${card.warn ? '<span class="pill-warn" style="position:absolute;top:16px;left:16px;font-weight:700">⚠ Biến âm</span>' : ''}
                <span class="${rev ? 'jp' : 'kj'}" lang="ja" style="font-weight:700;font-size:${size};line-height:1.15">${esc(front)}</span>
                <span style="font-size:13px;color:var(--faint)">Chạm để lật · phím cách</span>
              </span>
              <span class="face face--back">
                <span class="kj" lang="ja" style="font-weight:700;font-size:30px;color:var(--deep-muted)">${rev || card.w === card.r ? '' : esc(card.w)}</span>
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
      <div class="chip-row">${deckChips(S.fcDeck, 'fc-deck')}</div>
      ${topicOf(S.fcDeck) || /^v\d$/.test(S.fcDeck) ? `<div style="align-self:stretch">${topicChips(S.fcDeck, 'fc-deck')}</div>` : ''}${body}</div>`;
  }

  function viewQuiz() {
    const z = S.quiz;
    if (!z) {
      const modes = [['choice', 'Chọn đáp án'], ['type', 'Gõ hiragana']].map(([id, label]) =>
        `<button ${pressed(S.qMode === id)} ${attr({ action: 'q-mode', id })}>${label}</button>`).join('');
      return `<div class="stack narrow"><div class="stack" style="gap:22px">
        <div><h2 style="margin-bottom:6px;font-size:26px">Kiểm tra</h2><p style="color:var(--ink-3);font-size:15px">10 câu mỗi lượt. Bộ kanji: nhìn chữ, chọn hoặc gõ cách đọc. Bộ từ vựng: nhìn nghĩa tiếng Việt, chọn hoặc gõ từ tiếng Nhật.</p></div>
        <div class="stack" style="gap:10px"><span class="label">Bộ câu hỏi</span><div class="wrap" style="gap:6px">${deckChips(S.qDeck, 'q-deck')}</div></div>
        ${topicChips(S.qDeck, 'q-deck')}
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
          <input id="q-type" class="input jp" lang="ja" value="${esc(z.typed)}" placeholder="${w.kind === 'vocab' ? 'Gõ hiragana/katakana' : 'Gõ hiragana, vd: くじ'}" autocomplete="off" ${z.checked ? 'readonly' : ''}
            style="height:54px;padding:0 16px;border-width:1.5px;border-radius:12px;font-weight:500;font-size:20px">
          <button class="btn btn--dark" style="height:54px;border-radius:12px" data-action="q-submit">Kiểm tra</button>
        </div>`;
    const fbTitle = z.ok ? 'Chính xác!' : (z.mode === 'type' && z.picked ? 'Chưa đúng. Bạn gõ: ' + z.picked : 'Chưa đúng');
    const feedback = z.checked ? `<div class="feedback ${z.ok ? 'is-ok' : 'is-bad'}" role="status">
        <div class="stack" style="flex:1 1 240px;gap:4px">
          <span style="font-size:16px;font-weight:700">${esc(fbTitle)}</span>
          <span style="font-size:15px">${w.w === w.r ? '' : `<span class="kj" lang="ja">${esc(w.w)}</span> = `}<span class="jp" lang="ja" style="font-weight:700">${esc(w.r)}</span>${w.kind === 'vocab' ? ` = ${esc(w.m)}` : ''}</span>
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
      ${w.kind === 'vocab' ? `<div class="card prompt">
        <span class="muted" style="font-size:13px">Từ này tiếng Nhật là gì?</span>
        <span style="font-weight:700;font-size:clamp(28px,6vw,44px);line-height:1.25;text-align:center">${esc(w.m)}</span>
        <span class="muted" style="font-size:14px">${esc(VOCAB_TYPES[w.t] || '')}</span>
      </div>` : `<div class="card prompt">
        <span class="muted" style="font-size:13px">Đọc từ này thế nào?</span>
        <span class="kj" lang="ja" style="font-weight:700;font-size:clamp(48px,10vw,76px);line-height:1.2;text-align:center">${esc(w.w)}</span>
        <span class="muted" style="font-size:14px">${esc(w.m)}</span>
      </div>`}
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

  const lessonChips = (cur, action) => LESSONS.map(l =>
    `<button class="chip" ${pressed(cur === l)} ${attr({ action, id: l })}>Bài ${l}</button>`).join('');

  // ---------- Từ vựng ----------
  function viewVocab() {
    const all = VOCAB.filter(v => v.lesson === S.vLesson);
    const list = S.vTopic === 'all' ? all : all.filter(v => v.topic === S.vTopic);
    const kc = all.filter(v => S.known[v.id]).length;
    const topics = [['all', 'Tất cả', all.length]].concat((VOCAB_TOPICS[S.vLesson] || []).map(([id, label]) => [id, label, all.filter(v => v.topic === id).length]));
    const topicLabel = S.vTopic === 'all' ? '' : (topics.find(t => t[0] === S.vTopic) || [])[1] || '';
    const scope = S.vTopic === 'all' ? 'bài này' : 'nhóm này';
    const hideModes = [['none', 'Hiện hết'], ['jp', 'Ẩn tiếng Nhật'], ['vi', 'Ẩn nghĩa']];
    const rows = list.map(v => {
      const kn = !!S.known[v.id];
      const open = S.vRevealed[v.id];
      const hideJp = S.vHide === 'jp' && !open, hideVi = S.vHide === 'vi' && !open;
      const reveal = `<button class="reveal" ${attr({ action: 'v-reveal', id: v.id })}>Chạm để xem</button>`;
      return `<div class="word-row">
        <div class="stack" style="flex:1 1 200px;gap:2px;min-width:0">
          ${hideJp ? reveal : `<span class="jp" lang="ja" style="font-weight:700;font-size:21px">${esc(v.r)}</span>`}
        </div>
        <div class="stack" style="flex:2 1 200px;gap:2px;min-width:0">
          ${hideVi ? reveal : `<span style="font-size:15px">${esc(v.m)}</span>`}
          <span style="font-size:12px;color:var(--muted)">${esc(VOCAB_TYPES[v.t] || '')}${v.note ? ' · ' + esc(v.note) : ''}</span>
        </div>
        <div style="flex:none;display:flex;gap:6px">
          <button class="btn btn--icon" title="Nghe" aria-label="Nghe ${esc(v.r)}" ${attr({ action: 'speak', text: v.r })}>▶</button>
          <button class="known-btn" ${pressed(kn)} ${attr({ action: 'toggle-known', id: v.id })}>${kn ? '✓ Đã thuộc' : 'Đánh dấu thuộc'}</button>
        </div>
      </div>`;
    }).join('');
    return `<div class="stack" style="gap:20px">
      <div class="wrap" style="gap:16px;align-items:flex-end;justify-content:space-between">
        <div class="stack" style="gap:6px">
          <h2 style="font-size:clamp(24px,3vw,32px)">Từ vựng bài ${S.vLesson}${topicLabel ? ` · ${esc(topicLabel)}` : ''}</h2>
          <span class="muted" style="font-size:14px">${topicLabel ? `${list.length} từ trong nhóm · đã thuộc ${list.filter(v => S.known[v.id]).length}` : `${all.length} từ · đã thuộc ${kc}`}</span>
        </div>
        <div class="wrap" style="gap:8px">
          <button class="btn btn--md" data-action="vocab-flash">Luyện thẻ ${scope}</button>
          <button class="btn btn--md btn--primary" data-action="vocab-quiz">Kiểm tra ${scope}</button>
        </div>
      </div>
      <div class="chip-row">${lessonChips(S.vLesson, 'v-lesson')}</div>
      <div class="stack" style="gap:8px">
        <span class="label">Ôn theo nhóm</span>
        <div class="wrap" style="gap:6px">${topics.map(([id, label, n]) => `<button class="chip chip--square" ${pressed(S.vTopic === id)} ${attr({ action: 'v-topic', id })}>${esc(label)} <span style="opacity:.6">${n}</span></button>`).join('')}</div>
      </div>
      <div class="wrap" style="gap:12px;align-items:center;justify-content:flex-end">
        <div class="segmented">${hideModes.map(([id, label]) => `<button ${pressed(S.vHide === id)} ${attr({ action: 'v-hide', id })}>${label}</button>`).join('')}</div>
      </div>
      <div class="list">${rows}</div>
    </div>`;
  }

  // ---------- Ngữ pháp ----------
  function viewGrammar() {
    const pts = GRAMMAR[S.gLesson] || [];
    const cards = pts.map((g, i) => `<article class="card grammar">
      <div class="wrap" style="gap:10px;align-items:baseline">
        <span class="g-num">${i + 1}</span>
        <h3 class="jp" lang="ja">${esc(g.p)}</h3>
      </div>
      <p class="g-mean">${esc(g.m)}</p>
      ${g.n ? `<p class="note-box" style="font-size:14px">${esc(g.n)}</p>` : ''}
      <ul class="g-ex">${g.ex.map(([jp, vi]) => `<li>
        <button class="btn btn--icon" title="Nghe" aria-label="Nghe ví dụ" ${attr({ action: 'speak', text: jp })}>▶</button>
        <span class="stack" style="gap:2px;min-width:0">
          <span class="jp" lang="ja" style="font-size:17px">${esc(jp)}</span>
          ${S.gHideVi ? '' : `<span class="muted" style="font-size:14px">${esc(vi)}</span>`}
        </span></li>`).join('')}</ul>
    </article>`).join('');
    return `<div class="stack" style="gap:20px;max-width:860px">
      <div class="wrap" style="gap:16px;align-items:flex-end;justify-content:space-between">
        <div class="stack" style="gap:6px">
          <h2 style="font-size:clamp(24px,3vw,32px)">Ngữ pháp bài ${S.gLesson}</h2>
          <span class="muted" style="font-size:14px">${pts.length} mẫu câu · theo file tóm tắt ngữ pháp</span>
        </div>
        <button class="chip chip--square" ${pressed(S.gHideVi)} data-action="g-hide">Ẩn nghĩa ví dụ (tự dịch)</button>
      </div>
      <div class="chip-row">${lessonChips(S.gLesson, 'g-lesson')}</div>
      <div class="stack" style="gap:14px">${cards}</div>
    </div>`;
  }

  // ---------- Speaking ----------
  function recorderUi() {
    return `<div class="wrap rec" style="gap:10px;align-items:center">
      <button class="btn btn--md${S.recording ? ' btn--rec' : ''}" data-action="rec">${S.recording ? '■ Dừng ghi âm' : '● Ghi âm mình đọc'}</button>
      ${S.recUrl && !S.recording ? `<audio controls src="${S.recUrl}" style="height:40px;max-width:100%"></audio>` : ''}
    </div>`;
  }

  function viewPassages() {
    const P = PASSAGES.find(p => p.n === S.psg);
    const picker = PASSAGES.map(p => `<button class="chip" ${pressed(S.psg === p.n)} ${attr({ action: 'psg', id: p.n })}>Đoạn ${p.n}</button>`).join('');
    const lines = P.s.map((s, i) => `<li>
      <button class="btn btn--icon" title="Nghe câu này" aria-label="Nghe câu ${i + 1}" ${attr({ action: 'speak', text: plain(s) })}>▶</button>
      <span class="jp passage-line" lang="ja">${withBreaks(ruby(s, S.furi), S.breaks)}</span></li>`).join('');
    return `<div class="stack" style="gap:18px">
      <div class="chip-row">${picker}</div>
      <div class="wrap" style="gap:12px;align-items:flex-end;justify-content:space-between">
        <div class="stack" style="gap:4px"><span class="label">No.${P.n}</span><h3 style="font-size:22px">${esc(P.title)}</h3></div>
        <div class="wrap" style="gap:6px">
          <button class="chip chip--square" ${pressed(S.furi)} data-action="sp-furi">Furigana</button>
          <button class="chip chip--square" ${pressed(S.breaks)} data-action="sp-breaks">Ngắt hơi ／</button>
          <button class="chip chip--square" ${pressed(S.showVi)} data-action="sp-vi">Bản dịch</button>
        </div>
      </div>
      <div class="card passage"><ol>${lines}</ol></div>
      ${S.showVi ? `<p class="note-box" style="color:var(--ink-3)">${esc(P.vi)}</p>` : ''}
      <div class="wrap" style="gap:10px;align-items:center">
        <button class="btn btn--md btn--primary" ${attr({ action: 'speak', text: P.s.map(plain).join('') })}>▶ Nghe cả đoạn</button>
        ${recorderUi()}
      </div>
      <p class="muted" style="font-size:13px">Cách luyện: đọc với furigana 2–3 lần, rồi tắt furigana và đọc lại. Ghi âm, nghe lại chỗ nào bị khựng.</p>
    </div>`;
  }

  function viewSentences() {
    const rows = PRACTICE_SENTENCES.map(([s, vi], i) => `<li>
      <span class="g-num">${i + 1}</span>
      <button class="btn btn--icon" title="Nghe" aria-label="Nghe câu ${i + 1}" ${attr({ action: 'speak', text: plain(s) })}>▶</button>
      <span class="stack" style="gap:2px;min-width:0">
        <span class="jp passage-line" lang="ja">${ruby(s, S.furi)}</span>
        ${S.showVi ? `<span class="muted" style="font-size:14px">${esc(vi)}</span>` : ''}
      </span></li>`).join('');
    return `<div class="stack" style="gap:18px">
      <div class="wrap" style="gap:12px;align-items:flex-end;justify-content:space-between">
        <p style="color:var(--ink-3);font-size:15px;max-width:560px">Đi thi sẽ đọc đoạn văn, nhưng luyện thêm 15 câu này để nhớ mặt chữ số, tiền và ngày.</p>
        <div class="wrap" style="gap:6px">
          <button class="chip chip--square" ${pressed(S.furi)} data-action="sp-furi">Furigana</button>
          <button class="chip chip--square" ${pressed(S.showVi)} data-action="sp-vi">Bản dịch</button>
        </div>
      </div>
      <div class="card passage"><ol class="numbered">${rows}</ol></div>
    </div>`;
  }

  function viewQA() {
    const kindSets = SPEAK_SETS.filter(s => s.kind === S.qaKind);
    const set = SPEAK_SETS.find(s => s.id === S.qaSet) || kindSets[0];
    const kind = SPEAK_KINDS.find(k => k.id === S.qaKind);
    const qa = set.qa.map(([q, a, tip], i) => {
      const open = S.qaAll || S.qaShow[i];
      return `<li class="${S.qaFocus === i ? 'is-focus' : ''}">
        <div class="wrap" style="gap:8px;align-items:center">
          <span class="g-num">${i + 1}</span>
          <button class="btn btn--icon" title="Nghe câu hỏi" aria-label="Nghe câu hỏi ${i + 1}" ${attr({ action: 'speak', text: plain(q) })}>▶</button>
          <span class="jp" lang="ja" style="font-size:18px;flex:1 1 220px">${ruby(q)}</span>
        </div>
        ${open ? `<div class="answer">
          <button class="ghost-round" style="width:36px;height:36px" title="Nghe câu trả lời" aria-label="Nghe câu trả lời" ${attr({ action: 'speak', text: plain(a) })}>▶</button>
          <span class="stack" style="gap:2px"><span class="jp" lang="ja" style="font-size:18px;font-weight:500">${ruby(a)}</span>
          ${tip ? `<span style="font-size:13px;color:var(--warn)">${esc(tip)}</span>` : ''}</span>
        </div>` : `<button class="reveal" style="margin-left:44px" ${attr({ action: 'qa-show', id: i })}>Tự trả lời trước, rồi chạm để xem đáp án</button>`}
      </li>`;
    }).join('');
    return `<div class="stack" style="gap:18px">
      <div class="segmented" style="flex-wrap:wrap">${SPEAK_KINDS.map(k => `<button ${pressed(S.qaKind === k.id)} ${attr({ action: 'qa-kind', id: k.id })}>${esc(k.label)}</button>`).join('')}</div>
      <p class="muted" style="font-size:14px">${esc(kind.hint)}</p>
      <div class="chip-row">${kindSets.map(s => `<button class="chip" ${pressed(set.id === s.id)} ${attr({ action: 'qa-set', id: s.id })}><span lang="ja">${esc(s.title)}</span></button>`).join('')}</div>
      <div class="qa-layout">
        <figure class="card pic">
          <div class="pic-emoji" aria-hidden="true">${set.pic}</div>
          <figcaption class="pic-info">
            <span class="jp" lang="ja" style="font-weight:700;font-size:20px">${esc(set.title)}</span>
            ${set.info.map(t => `<span lang="ja">${esc(t)}</span>`).join('')}
          </figcaption>
        </figure>
        <div class="stack" style="gap:12px;min-width:0">
          <div class="wrap" style="gap:8px">
            <button class="btn btn--md btn--primary" data-action="qa-random">🎲 Câu hỏi ngẫu nhiên</button>
            <button class="btn btn--md" data-action="qa-all">${S.qaAll ? 'Ẩn đáp án' : 'Hiện tất cả đáp án'}</button>
          </div>
          <ol class="card qa-list">${qa}</ol>
        </div>
      </div>
      ${recorderUi()}
    </div>`;
  }

  function viewSpeaking() {
    const modes = [['passage', 'Đọc đoạn văn'], ['sentences', '15 câu luyện đọc'], ['qa', 'Hỏi đáp theo tranh']];
    const body = S.spMode === 'passage' ? viewPassages() : S.spMode === 'sentences' ? viewSentences() : viewQA();
    return `<div class="stack" style="gap:20px">
      <div class="stack" style="gap:6px">
        <h2 style="font-size:clamp(24px,3vw,32px)">Luyện thi Speaking</h2>
        <p style="color:var(--ink-3);font-size:15px">Phần 1 đọc đoạn văn, phần 2 trả lời câu hỏi theo tranh. Bấm ▶ để nghe mẫu.</p>
      </div>
      <div class="segmented">${modes.map(([id, label]) => `<button ${pressed(S.spMode === id)} ${attr({ action: 'sp-mode', id })}>${label}</button>`).join('')}</div>
      ${body}
    </div>`;
  }

  // ---------- Recorder ----------
  let mediaRec = null;
  function toggleRec() {
    if (S.recording && mediaRec) { mediaRec.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { alert('Trình duyệt này không hỗ trợ ghi âm.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const chunks = [];
      mediaRec = new MediaRecorder(stream);
      mediaRec.ondataavailable = e => chunks.push(e.data);
      mediaRec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (S.recUrl) URL.revokeObjectURL(S.recUrl);
        set({ recording: false, recUrl: URL.createObjectURL(new Blob(chunks, { type: mediaRec.mimeType })) });
      };
      mediaRec.start();
      set({ recording: true });
    }).catch(() => alert('Không mở được micro. Hãy cho phép trình duyệt dùng micro.'));
  }
  function clearRec() { if (S.recording && mediaRec) mediaRec.stop(); if (S.recUrl) URL.revokeObjectURL(S.recUrl); S.recUrl = ''; }

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
    const htq = toHira(qt);
    const vocab = VOCAB.filter(v => toHira(v.r).includes(htq) || (v.kj && v.kj.includes(qt)) || norm(v.m).includes(nq)).slice(0, 30);
    const vHtml = vocab.map(v => `<button class="word-row word-row--link" ${attr({ action: 'open-vocab', id: v.lesson })}>
      <span class="jp" lang="ja" style="font-weight:700;font-size:20px;min-width:140px">${esc(v.r)}</span>
      <span style="flex:1;font-size:14px;color:var(--ink-3)">${esc(v.m)}</span>
      <span class="muted" style="font-size:12px">Từ vựng bài ${v.lesson} →</span>
    </button>`).join('');
    return `<div class="stack" style="gap:24px">
      <h2 style="font-size:22px">Kết quả cho “${esc(qt)}”</h2>
      ${!words.length && !kanji.length && !vocab.length ? '<p class="muted">Không tìm thấy. Thử gõ Hán Việt không dấu (vd: “nhat”), hiragana hoặc nghĩa tiếng Việt.</p>' : ''}
      ${vocab.length ? `<div class="stack" style="gap:10px"><div class="label">Từ vựng bài 1–3</div><div class="list">${vHtml}</div></div>` : ''}
      ${kanji.length ? `<div class="stack" style="gap:10px"><div class="label">Kanji</div><div class="wrap" style="gap:10px">${kHtml}</div></div>` : ''}
      ${words.length ? `<div class="stack" style="gap:10px"><div class="label">Từ có kanji</div><div class="list">${wHtml}</div></div>` : ''}
    </div>`;
  }

  // ---------- Render ----------
  const VIEWS = { home: viewHome, lesson: viewLesson, kanji: viewKanji, vocab: viewVocab, grammar: viewGrammar, flash: viewFlash, quiz: viewQuiz, number: viewNumber, speaking: viewSpeaking };

  function render() {
    const qt = S.q.trim();
    const knownTotal = ALL_ITEMS.filter(w => S.known[w.id]).length;
    $('#known-total').textContent = knownTotal;
    $('#known-of').textContent = `/ ${ALL_ITEMS.length} từ đã thuộc`;
    $('#q-clear').hidden = !qt;
    $('#tabs').innerHTML = TABS.map(([id, label]) =>
      `<button class="tab" ${attr({ action: 'go', id })} ${S.screen === id && !qt ? 'aria-current="page"' : ''}>${label}</button>`).join('');
    $('#app').innerHTML = qt ? viewSearch(qt) : VIEWS[S.screen]();
    // Re-rendering resets horizontal scroll, so bring the selected chip of each scrolling row back into view.
    document.querySelectorAll('#app .chip-row').forEach(row => {
      const on = row.querySelector('[aria-pressed="true"]');
      if (on && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - row.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
    });
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
    // Từ vựng
    'open-vocab': d => { $('#q').value = ''; set({ screen: 'vocab', vLesson: +d.id, q: '', vRevealed: {} }); window.scrollTo(0, 0); },
    'v-lesson': d => set({ vLesson: +d.id, vTopic: 'all', vRevealed: {} }),
    'v-topic': d => set({ vTopic: d.id, vRevealed: {} }),
    'v-hide': d => set({ vHide: d.id, vRevealed: {} }),
    'v-reveal': d => set({ vRevealed: { ...S.vRevealed, [d.id]: true } }),
    'vocab-flash': () => set({ screen: 'flash', fcDeck: vocabDeck(), fcIdx: 0, fcFlip: false }),
    'vocab-quiz': () => { set({ screen: 'quiz', qDeck: vocabDeck() }); startQuiz(); },
    // Ngữ pháp
    'g-lesson': d => set({ gLesson: +d.id }),
    'g-hide': () => set({ gHideVi: !S.gHideVi }),
    // Speaking
    'sp-mode': d => { clearRec(); set({ spMode: d.id }); },
    'psg': d => { clearRec(); set({ psg: +d.id }); },
    'sp-furi': () => set({ furi: !S.furi }),
    'sp-breaks': () => set({ breaks: !S.breaks }),
    'sp-vi': () => set({ showVi: !S.showVi }),
    'qa-kind': d => { const first = SPEAK_SETS.find(s => s.kind === d.id); set({ qaKind: d.id, qaSet: first.id, qaShow: {}, qaAll: false, qaFocus: -1 }); },
    'qa-set': d => set({ qaSet: d.id, qaShow: {}, qaAll: false, qaFocus: -1 }),
    'qa-show': d => set({ qaShow: { ...S.qaShow, [d.id]: true } }),
    'qa-all': () => set({ qaAll: !S.qaAll, qaShow: {} }),
    'qa-random': () => {
      const s = SPEAK_SETS[Math.floor(Math.random() * SPEAK_SETS.length)];
      const i = Math.floor(Math.random() * s.qa.length);
      set({ qaKind: s.kind, qaSet: s.id, qaShow: {}, qaAll: false, qaFocus: i });
      speak(plain(s.qa[i][0]));
      document.querySelector('.qa-list li.is-focus')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
    'rec': () => toggleRec(),
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
