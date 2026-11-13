# Demix · JPD113

Ôn JPD113 bài 1–3: đọc kanji theo nhóm, thứ tự nét, từ vựng, ngữ pháp, thẻ ghi nhớ, kiểm tra, đọc số ngẫu nhiên và luyện thi Speaking (đọc 10 đoạn văn mẫu, hỏi đáp theo tranh, ghi âm giọng đọc).

Static site, no build step. Open `index.html` through any static server (or GitHub Pages: Settings → Pages → deploy from `main`, root).

- `index.html` – header, tabs and the `<main>` the app renders into
- `css/styles.css` – color tokens (`:root`: washi paper, sumi ink, deep 常磐 tokiwa green, 弁柄 for ⚠, faint 麻の葉 asanoha background) and component classes
- `assets/logo.svg` – Demix frog mark, also the favicon (the header wordmark puts a tiny frog on the "i")
- `js/data.js` – kanji word groups, kanji list, number-reading tables
- `js/vocab.js` – từ vựng bài 1–3 (one line per word: kana|kanji|nghĩa|loại)
- `js/grammar.js` – ngữ pháp bài 1–3 with examples
- `js/reading.js` – 10 đoạn văn mẫu + 15 câu luyện đọc (`{漢字|かんじ}` = furigana)
- `js/speaking.js` – hỏi đáp theo tranh with model answers
- `js/app.js` – state, views and event handling; settings live in `CONFIG` at the top

Progress (“đã thuộc”, best quiz scores) is saved in `localStorage`. Stroke order comes from [KanjiVG](https://kanjivg.tagaini.net/) (CC BY-SA 3.0), and audio uses the browser's Japanese speech voice.
