# Demix · Kanji JPD113

Ôn đọc kanji bài 1–3 cho bài Speaking JPD113: nhóm bài, thứ tự nét, thẻ ghi nhớ, kiểm tra cách đọc và đọc số ngẫu nhiên.

Static site, no build step. Open `index.html` through any static server (or GitHub Pages: Settings → Pages → deploy from `main`, root).

- `index.html` – header, tabs and the `<main>` the app renders into
- `css/styles.css` – color tokens (`:root`: washi paper, sumi ink, deep 常磐 tokiwa green, 弁柄 for ⚠, faint 麻の葉 asanoha background) and component classes
- `assets/logo.svg` – Demix frog mark, also the favicon (the header wordmark puts a tiny frog on the "i")
- `js/data.js` – word groups, kanji list, number-reading tables
- `js/app.js` – state, views and event handling; settings live in `CONFIG` at the top

Progress (“đã thuộc”, best quiz scores) is saved in `localStorage`. Stroke order comes from [KanjiVG](https://kanjivg.tagaini.net/) (CC BY-SA 3.0), and audio uses the browser's Japanese speech voice.
