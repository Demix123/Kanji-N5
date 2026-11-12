// Lesson data for Kanji JPD113 (bài 1–3) and the random-number generator used by "Đọc số".
// Word line format: kanji|reading|meaning|flags|common wrong reading|note  (flags: ! = biến âm, * = có trong đề mẫu)

const GROUPS = [
{id:'thu',title:'Thứ trong tuần',sub:'曜日 = ようび',sample:'曜',tip:'曜日 luôn đọc ようび. Chỉ cần nhớ chữ đứng trước.',data:`月曜日|げつようび|Thứ Hai|*
火曜日|かようび|Thứ Ba|
水曜日|すいようび|Thứ Tư|
木曜日|もくようび|Thứ Năm|*
金曜日|きんようび|Thứ Sáu|*
土曜日|どようび|Thứ Bảy|*
日曜日|にちようび|Chủ Nhật|*
何曜日|なんようび|Thứ mấy|`},
{id:'gio',title:'Giờ',sub:'時 = じ · 半 = はん',sample:'時',tip:'Ba giờ phải nhớ riêng: 四時 よじ, 七時 しちじ, 九時 くじ.',data:`一時|いちじ|1 giờ|
二時|にじ|2 giờ|
三時|さんじ|3 giờ|*
四時|よじ|4 giờ|!|よんじ|Không đọc よんじ
五時|ごじ|5 giờ|*
六時|ろくじ|6 giờ|*
七時|しちじ|7 giờ|!|ななじ|Không đọc ななじ
八時|はちじ|8 giờ|*
九時|くじ|9 giờ|!*|きゅうじ|Không đọc きゅうじ
十時|じゅうじ|10 giờ|*
十一時|じゅういちじ|11 giờ|*
十二時|じゅうにじ|12 giờ|*
何時|なんじ|Mấy giờ|
半|はん|Rưỡi|
三時半|さんじはん|3 giờ rưỡi|*
五時半|ごじはん|5 giờ rưỡi|*`},
{id:'phut',title:'Phút',sub:'分 = ふん / ぷん',sample:'分',tip:'Số 1, 3, 4, 6, 8, 10 + 分 đọc ぷん (kèm âm ngắt っ ở 1, 6, 8, 10). Các số còn lại đọc ふん.',data:`一分|いっぷん|1 phút|!|いちふん
二分|にふん|2 phút|
三分|さんぷん|3 phút|!|さんふん
四分|よんぷん|4 phút|!|よんふん
五分|ごふん|5 phút|
六分|ろっぷん|6 phút|!|ろくふん
七分|ななふん|7 phút|
八分|はっぷん|8 phút|!|はちふん
九分|きゅうふん|9 phút|
十分|じゅっぷん|10 phút|!|じゅうふん|Nghĩa “đủ” thì đọc じゅうぶん
十五分|じゅうごふん|15 phút|
三十分|さんじゅっぷん|30 phút|!|さんじゅうふん
四十分|よんじゅっぷん|40 phút|!|よんじゅうふん
何分|なんぷん|Mấy phút|`},
{id:'thang',title:'Tháng',sub:'月 = がつ',sample:'月',tip:'Ba tháng phải nhớ riêng: 四月 しがつ, 七月 しちがつ, 九月 くがつ.',data:`一月|いちがつ|Tháng 1|
二月|にがつ|Tháng 2|
三月|さんがつ|Tháng 3|
四月|しがつ|Tháng 4|!|よんがつ|Không đọc よんがつ
五月|ごがつ|Tháng 5|
六月|ろくがつ|Tháng 6|*
七月|しちがつ|Tháng 7|!*|なながつ|Không đọc なながつ
八月|はちがつ|Tháng 8|
九月|くがつ|Tháng 9|!*|きゅうがつ|Không đọc きゅうがつ
十月|じゅうがつ|Tháng 10|*
十一月|じゅういちがつ|Tháng 11|
十二月|じゅうにがつ|Tháng 12|
何月|なんがつ|Tháng mấy|
今月|こんげつ|Tháng này|
来月|らいげつ|Tháng sau|`},
{id:'ngay',title:'Ngày trong tháng',sub:'日 = か / にち',sample:'日',tip:'Ngày 1–10, 14, 20, 24 đọc riêng. Các ngày còn lại = số + にち (十一日 じゅういちにち).',data:`一日|ついたち|Ngày mùng 1|!|いちにち|いちにち = “1 ngày” (khoảng thời gian)
二日|ふつか|Ngày 2|!|ににち|Đừng nhầm với はつか (ngày 20)
三日|みっか|Ngày 3|!|さんにち
四日|よっか|Ngày 4|!|よんにち
五日|いつか|Ngày 5|!|ごにち
六日|むいか|Ngày 6|!|ろくにち
七日|なのか|Ngày 7|!|しちにち
八日|ようか|Ngày 8|!|はちにち
九日|ここのか|Ngày 9|!|くにち
十日|とおか|Ngày 10|!*|じゅうにち
十一日|じゅういちにち|Ngày 11|
十四日|じゅうよっか|Ngày 14|!*|じゅうよんにち
二十日|はつか|Ngày 20|!*|にじゅうにち|Đừng nhầm với ふつか (ngày 2)
二十四日|にじゅうよっか|Ngày 24|!|にじゅうよんにち
三十日|さんじゅうにち|Ngày 30|`},
{id:'dem',title:'Đếm cái',sub:'〜つ',sample:'九',tip:'Đếm 1–9 dùng 〜つ. Số 10 đọc とお, không có つ.',data:`一つ|ひとつ|1 cái|
二つ|ふたつ|2 cái|
三つ|みっつ|3 cái|*
四つ|よっつ|4 cái|*
五つ|いつつ|5 cái|*
六つ|むっつ|6 cái|*
七つ|ななつ|7 cái|
八つ|やっつ|8 cái|
九つ|ここのつ|9 cái|*
十|とお|10 cái|`},
{id:'nguoi',title:'Người & tuổi',sub:'人 = にん / じん · 才 = さい',sample:'人',tip:'1–2 người đọc ひとり, ふたり; 4 người よにん. 20 tuổi đọc はたち.',data:`一人|ひとり|1 người|!*|いちにん
二人|ふたり|2 người|!*|ににん
三人|さんにん|3 người|
四人|よにん|4 người|!|よんにん
五人|ごにん|5 người|
八人|はちにん|8 người|
何人|なんにん|Mấy người|
人|ひと|Người|
日本人|にほんじん|Người Nhật|
ベトナム人|ベトナムじん|Người Việt Nam|
ブラジル人|ブラジルじん|Người Brazil|*
一才|いっさい|1 tuổi|!|いちさい
八才|はっさい|8 tuổi|!|はちさい
十才|じゅっさい|10 tuổi|!|じゅうさい
二十才|はたち|20 tuổi|!|にじゅっさい
28才|にじゅうはっさい|28 tuổi|*
30才|さんじゅっさい|30 tuổi|*
何才|なんさい|Mấy tuổi|`},
{id:'so',title:'Trăm · nghìn · vạn · yên',sub:'百 千 万 円',sample:'円',tip:'Số 3 và 8 đi với 百/千 bị biến âm (6 với 百 cũng vậy). Số dài thì tách từng khúc: 八十万 / 三千 / 円.',data:`百|ひゃく|100|
三百|さんびゃく|300|!|さんひゃく
六百|ろっぴゃく|600|!|ろくひゃく
八百|はっぴゃく|800|!|はちひゃく
千|せん|1.000|
三千|さんぜん|3.000|!|さんせん
八千|はっせん|8.000|!|はちせん
一万|いちまん|10.000|||Không nói 万 trơn, luôn là いちまん
十万|じゅうまん|100.000|
百万|ひゃくまん|1.000.000|
円|えん|Yên|
四円|よえん|4 yên|!|よんえん
五百円|ごひゃくえん|500 yên|*
三百円|さんびゃくえん|300 yên|!*|さんひゃくえん
八百円|はっぴゃくえん|800 yên|!*|はちひゃくえん
三千円|さんぜんえん|3.000 yên|!*|さんせんえん
四千円|よんせんえん|4.000 yên|*
六千八百円|ろくせんはっぴゃくえん|6.800 yên|*
七万円|ななまんえん|70.000 yên|*
九万七千円|きゅうまんななせんえん|97.000 yên|*
八十万三千円|はちじゅうまんさんぜんえん|803.000 yên|*`},
{id:'khac',title:'Người, trường & khác',sub:'私 学 校 先 生 …',sample:'学',tip:'何 đọc なに khi đứng riêng (何を), đọc なん khi đi với đơn vị (何時, 何で).',data:`私|わたし|Tôi|*
日本|にほん|Nhật Bản|*
日本語|にほんご|Tiếng Nhật|*
学校|がっこう|Trường học|*
大学|だいがく|Đại học|*
大学生|だいがくせい|Sinh viên|*
学生|がくせい|Học sinh|*
留学生|りゅうがくせい|Du học sinh|*
先生|せんせい|Giáo viên|*
時間|じかん|Thời gian|*
本|ほん|Sách|*
月|つき|Mặt trăng|
火|ひ|Lửa|
火事|かじ|Hỏa hoạn|
水|みず|Nước|
木|き|Cây|
お金|おかね|Tiền|
土|つち|Đất|
何|なに|Cái gì||なん|Đi với đơn vị thì đọc なん
年|とし|Năm, tuổi|
一年|いちねん|1 năm|
四年|よねん|4 năm|!|よんねん
何年|なんねん|Mấy năm|
時|とき|Lúc, khi|
間|あいだ|Giữa, khoảng|
十分|じゅうぶん|Đủ||じゅっぷん|Cùng chữ với 10 phút (じゅっぷん)`}
];
const WORDS = [];
GROUPS.forEach(g => { g.words = g.data.trim().split('\n').map((l, i) => { const [w, r, m, f = '', wrong = '', note = ''] = l.split('|'); const o = { id: g.id + i, g: g.id, w, r, m, warn: f.includes('!'), exam: f.includes('*'), wrong: wrong.trim(), note }; WORDS.push(o); return o; }); });
const KANJI = `日|Nhật|ニチ・ジツ|ひ・か|Mặt trời, ngày|4
月|Nguyệt|ゲツ・ガツ|つき|Mặt trăng, tháng|4
火|Hỏa|カ|ひ|Lửa|4
水|Thủy|スイ|みず|Nước|4
木|Mộc|モク・ボク|き|Cây|4
金|Kim|キン・コン|かね|Vàng, tiền|8
土|Thổ|ド・ト|つち|Đất|3
曜|Diệu|ヨウ|—|Ngày trong tuần|18
何|Hà|カ|なに・なん|Cái gì|7
時|Thời|ジ|とき|Giờ, lúc|10
半|Bán|ハン|なか(ば)|Một nửa|5
分|Phân|ブン・フン・プン|わ(ける)|Phút, phần|4
間|Gian|カン・ケン|あいだ・ま|Khoảng, giữa|12
年|Niên|ネン|とし|Năm|6
今|Kim|コン・キン|いま|Bây giờ|4
来|Lai|ライ|く(る)|Đến|7
一|Nhất|イチ・イツ|ひと(つ)|Một|1
二|Nhị|ニ|ふた(つ)|Hai|2
三|Tam|サン|み(っつ)|Ba|3
四|Tứ|シ|よ・よん・よっ(つ)|Bốn|5
五|Ngũ|ゴ|いつ(つ)|Năm|4
六|Lục|ロク|む(っつ)|Sáu|4
七|Thất|シチ|なな(つ)|Bảy|2
八|Bát|ハチ|や(っつ)|Tám|2
九|Cửu|キュウ・ク|ここの(つ)|Chín|2
十|Thập|ジュウ・ジッ|とお|Mười|2
百|Bách|ヒャク|—|Trăm|6
千|Thiên|セン|ち|Nghìn|3
万|Vạn|マン・バン|—|Vạn (10.000)|3
円|Viên|エン|まる(い)|Yên; tròn|4
人|Nhân|ジン・ニン|ひと|Người|2
才|Tài|サイ|—|Tuổi; tài năng|3
私|Tư|シ|わたし|Tôi; riêng tư|7
本|Bản|ホン|もと|Sách; gốc|5
語|Ngữ|ゴ|かた(る)|Ngôn ngữ|14
学|Học|ガク|まな(ぶ)|Học|8
校|Hiệu|コウ|—|Trường|10
大|Đại|ダイ・タイ|おお(きい)|Lớn|3
生|Sinh|セイ・ショウ|い(きる)・う(まれる)|Sống, sinh ra|5
先|Tiên|セン|さき|Trước|6
留|Lưu|リュウ・ル|と(める)|Giữ lại, ở lại|10
事|Sự|ジ|こと|Việc|8`.split('\n').map(l => { const [k, hv, on, kun, m, s] = l.split('|'); return { k, hv, HV: hv.toUpperCase(), on, kun, m, s: +s }; });
const KMAP = {}; KANJI.forEach(x => KMAP[x.k] = x);
const TABS = [['home','Tổng quan'],['lesson','Bài học'],['kanji','Kanji'],['flash','Thẻ ghi nhớ'],['quiz','Kiểm tra'],['number','Đọc số'],['passage','Đoạn văn mẫu']];
const DECKS = [{id:'all',label:'Tất cả'},{id:'weak',label:'Chưa thuộc'},{id:'warn',label:'⚠ Biến âm'},{id:'exam',label:'Có trong đề mẫu'}].concat(GROUPS.map(g => ({ id: g.id, label: g.title })));
const ONE = ['','いち','に','さん','よん','ご','ろく','なな','はち','きゅう'];
const TEN = ['','じゅう','にじゅう','さんじゅう','よんじゅう','ごじゅう','ろくじゅう','ななじゅう','はちじゅう','きゅうじゅう'];
const HUN = ['','ひゃく','にひゃく','さんびゃく','よんひゃく','ごひゃく','ろっぴゃく','ななひゃく','はっぴゃく','きゅうひゃく'];
const THO = ['','せん','にせん','さんぜん','よんせん','ごせん','ろくせん','ななせん','はっせん','きゅうせん'];
const KD = '〇一二三四五六七八九';
const HOUR = ['','いちじ','にじ','さんじ','よじ','ごじ','ろくじ','しちじ','はちじ','くじ','じゅうじ','じゅういちじ','じゅうにじ'];
const MONTH = ['','いちがつ','にがつ','さんがつ','しがつ','ごがつ','ろくがつ','しちがつ','はちがつ','くがつ','じゅうがつ','じゅういちがつ','じゅうにがつ'];
const DAYSP = {1:'ついたち',2:'ふつか',3:'みっか',4:'よっか',5:'いつか',6:'むいか',7:'なのか',8:'ようか',9:'ここのか',10:'とおか',14:'じゅうよっか',20:'はつか',24:'にじゅうよっか'};
const MINO = ['','いっぷん','にふん','さんぷん','よんぷん','ごふん','ろっぷん','ななふん','はっぷん','きゅうふん'];
const k4 = n => { const a = Math.floor(n/1000), b = Math.floor(n/100)%10, c = Math.floor(n/10)%10, d = n%10; return (a ? (a>1?KD[a]:'')+'千' : '') + (b ? (b>1?KD[b]:'')+'百' : '') + (c ? (c>1?KD[c]:'')+'十' : '') + (d ? KD[d] : ''); };
const r4 = n => THO[Math.floor(n/1000)] + HUN[Math.floor(n/100)%10] + TEN[Math.floor(n/10)%10] + ONE[n%10];
const rnd = n => Math.floor(Math.random()*n);
const shuffle = a => { a = a.slice(); for (let i = a.length-1; i > 0; i--) { const j = rnd(i+1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
const clean = s => (s||'').replace(/[\s　、。・]/g,'');

function genNum(mode) {
  if (mode === 'time') {
    const h = 1 + rnd(12); const segs = [{ k: k4(h)+'時', r: HOUR[h], warn: [4,7,9].includes(h) }];
    const mm = [0,5,10,15,20,30,30,40,45,1,3,6,8,11,23,36,48,54][rnd(18)]; let label = h + ':' + String(mm).padStart(2,'0');
    if (mm === 30 && Math.random() < .5) { segs.push({ k: '半', r: 'はん' }); label = h + ' giờ rưỡi'; }
    else if (mm) { const t = Math.floor(mm/10), o = mm%10; let r, warn;
      if (!o) { r = (t>1 ? ONE[t] : '') + 'じゅっぷん'; warn = true; }
      else { r = (t ? (t>1?ONE[t]:'') + 'じゅう' : '') + MINO[o]; warn = [1,3,4,6,8].includes(o); }
      segs.push({ k: k4(mm)+'分', r, warn }); }
    return { segs, label };
  }
  if (mode === 'date') {
    const m = 1 + rnd(12); const pool = [1,2,3,4,5,6,7,8,9,10,14,20,24,11,17,19,25,30]; const d = Math.random()<.7 ? pool[rnd(pool.length)] : 1+rnd(31);
    let dr = DAYSP[d]; if (!dr) { const t = Math.floor(d/10), o = d%10; dr = TEN[t] + (o===7?'しち':o===9?'く':o===4?'よん':ONE[o]) + 'にち'; }
    return { segs: [{ k: k4(m)+'月', r: MONTH[m], warn: [4,7,9].includes(m) }, { k: k4(d)+'日', r: dr, warn: !!DAYSP[d] }], label: 'Ngày ' + d + ' tháng ' + m };
  }
  const D = [1,2,3,3,4,5,6,6,7,8,8,9]; const pos = shuffle([100000,10000,1000,100,10]).slice(0, 1+rnd(3)); let n = 0; pos.forEach(p => n += p*D[rnd(D.length)]);
  const segs = []; const man = Math.floor(n/10000), rest = n%10000;
  if (man) segs.push({ k: k4(man)+'万', r: r4(man)+'まん' });
  const a = Math.floor(rest/1000), b = Math.floor(rest/100)%10, c = Math.floor(rest/10)%10, d = rest%10;
  if (a) segs.push({ k: (a>1?KD[a]:'')+'千', r: THO[a], warn: a===3||a===8 });
  if (b) segs.push({ k: (b>1?KD[b]:'')+'百', r: HUN[b], warn: b===3||b===6||b===8 });
  if (c) segs.push({ k: (c>1?KD[c]:'')+'十', r: TEN[c] });
  if (d) segs.push({ k: KD[d], r: d===4?'よ':ONE[d], warn: d===4 });
  segs.push({ k: '円', r: 'えん' });
  return { segs, label: fmt(n) + ' yên' };
}
