// Từ vựng bài 1–3 (theo file TỪ VỰNG của từng bài).
// Line format: kana|kanji (bỏ trống nếu không có)|nghĩa|loại (n = danh từ, v = động từ, a = tính từ, x = khác)

const VOCAB_RAW = {
  1: `にほん|日本|Nhật Bản|n
かんこく|韓国|Hàn Quốc|n
ちゅうごく|中国|Trung Quốc|n
タイ||Thái Lan|n
ベトナム||Việt Nam|n
オーストラリア||Úc|n
アメリカ||Mỹ|n
イタリア||Ý|n
ロシア||Nga|n
インド||Ấn Độ|n
ブラジル||Brazil|n
しごと|仕事|Công việc|n
きょうし|教師|Giáo viên (nghề)|n
かいしゃいん|会社員|Nhân viên văn phòng|n
がくせい|学生|Học sinh, sinh viên|n
せんせい|先生|Thầy / cô (gọi người khác)|n
だいがく|大学|Trường đại học|n
こうこう|高校|Trường cấp ba|n
にほんごがっこう|日本語学校|Trường tiếng Nhật|n
たんじょうび|誕生日|Sinh nhật|n
スポーツ||Thể thao|n
テニス||Tennis|n
すいえい|水泳|Bơi lội|n
サッカー||Bóng đá|n
えいが|映画|Phim ảnh|n
どくしょ|読書|Đọc sách|n
おんがく|音楽|Âm nhạc|n
りょこう|旅行|Du lịch|n
りょうり|料理|Nấu ăn, món ăn|n
なまえ|名前|Tên|n|Bổ sung từ đề Speaking
くに|国|Đất nước (お国: nước của bạn)|n|Bổ sung từ đề Speaking
しゅみ|趣味|Sở thích|n|Bổ sung từ đề Speaking
〜じん|〜人|Người nước ~|x|Bổ sung từ đề Speaking
〜さい|〜才|~ tuổi|x|Bổ sung từ đề Speaking`,
  2: `インフォメーション||Quầy thông tin|n
エーティーエム|ATM|Cây ATM|n
エスカレーター||Thang cuốn|n
エレベーター||Thang máy|n
トイレ||Nhà vệ sinh|n
レジ||Quầy thu ngân|n
スーパー||Siêu thị|n
ひゃくえんショップ|100円ショップ|Cửa hàng đồng giá 100 yên|n
レストラン||Nhà hàng|n
きっさてん|喫茶店|Quán cà phê|n
きつえんじょ|喫煙所|Nơi hút thuốc|n
ちか|地下|Tầng hầm, dưới mặt đất|n
カメラ||Máy ảnh|n
けいたいでんわ|携帯電話|Điện thoại di động|n
じしょ|辞書|Từ điển|n
でんしじしょ|電子辞書|Từ điển điện tử|n
パソコン||Máy tính|n
くつ|靴|Giày dép|n
けしゴム|消しゴム|Cục tẩy|n
ペン||Bút mực|n
トイレットペーパー||Giấy vệ sinh|n
ほん|本|Sách|n
あぶら|油|Dầu ăn|n
ケーキ||Bánh ngọt|n
こめ|米|Gạo|n
たまご|卵|Trứng|n
パン||Bánh mì|n
みず|水|Nước|n
てんいん|店員|Nhân viên cửa hàng|n
〜や|〜屋|Cửa hàng ~ (くつや, ケーキや, パンや)|x
かばん||Cặp, túi xách|n
ズボン||Quần dài|n
ティーシャツ|Tシャツ|Áo thun|n
とけい|時計|Đồng hồ|n
イチゴ||Dâu tây|n
リンゴ||Táo|n
バナナ||Chuối|n
えび||Tôm|n
さかな|魚|Cá|n
ぶたにく|豚肉|Thịt heo|n
とりにく|鶏肉|Thịt gà|n
ぎゅうにく|牛肉|Thịt bò|n
やさい|野菜|Rau|n
りょうり|料理|Món ăn|n
カレー||Cà ri|n
スープ||Súp|n
おやこどん|親子丼|Cơm gà trứng (oyakodon)|n
とんかつ||Thịt heo chiên xù|n
ハンバーグ||Thịt băm viên (hamburg)|n
ごはん|ご飯|Cơm|n
ライス||Cơm (đĩa)|n
（お）ちゃ|（お）茶|Trà|n
こうちゃ|紅茶|Hồng trà|n
コーヒー||Cà phê|n
ジュース||Nước ép|n
ビール||Bia|n
ワイン||Rượu vang|n
ドイツ||Đức|n
フランス||Pháp|n
さいふ|財布|Ví|n
えいご|英語|Tiếng Anh|n`,
  3: `ごぜん|午前|Buổi sáng (A.M.)|n
ごご|午後|Buổi chiều (P.M.)|n
あさ|朝|Buổi sáng|n
ひる|昼|Buổi trưa|n
よる|夜|Buổi tối, ban đêm|n
ばん|晩|Buổi tối|n
ぎんこう|銀行|Ngân hàng|n
たいいくかん|体育館|Nhà thi đấu thể thao|n
としょかん|図書館|Thư viện|n
びょういん|病院|Bệnh viện|n
ゆうびんきょく|郵便局|Bưu điện|n
きょうしつ|教室|Phòng học|n
じゅぎょう|授業|Giờ học, tiết học|n
テスト||Bài kiểm tra|n
やすみ|休み|Nghỉ, ngày nghỉ|n
じかん|時間|Thời gian|n
〜ようび|〜曜日|Thứ ~|n
にちようび|日曜日|Chủ Nhật|n
げつようび|月曜日|Thứ Hai|n
かようび|火曜日|Thứ Ba|n
すいようび|水曜日|Thứ Tư|n
もくようび|木曜日|Thứ Năm|n
きんようび|金曜日|Thứ Sáu|n
どようび|土曜日|Thứ Bảy|n
スケジュール||Lịch trình|n
アルバイト||Việc làm thêm|n
スキー||Trượt tuyết|n
パーティー||Bữa tiệc|n
バーベキュー||Tiệc nướng BBQ|n
はなび|花火|Pháo hoa|n
おはなみ|お花見|Ngắm hoa anh đào|n
ホームステイ||Homestay|n
おまつり|お祭り|Lễ hội|n
うみ|海|Biển|n
こうえん|公園|Công viên|n
さくら|桜|Hoa anh đào|n
おさけ|お酒|Rượu|n
おすし||Sushi|n
バス||Xe buýt|n
おべんとう|お弁当|Cơm hộp|n
りゅうがくせい|留学生|Du học sinh|n
いちねん|一年|Một năm|n
はる|春|Mùa xuân|n
なつ|夏|Mùa hè|n
あき|秋|Mùa thu|n
ふゆ|冬|Mùa đông|n
なつやすみ|夏休み|Kỳ nghỉ hè|n
ゴールデンウイーク||Tuần lễ vàng (cuối 4 – đầu 5)|n
まいにち|毎日|Mỗi ngày|n
あさごはん|朝ご飯|Bữa sáng|n
ひるごはん|昼ご飯|Bữa trưa|n
ばんごはん|晩ご飯|Bữa tối|n
うち||Nhà|n
コンビニ||Cửa hàng tiện lợi|n
かいしゃ|会社|Công ty|n
がっこう|学校|Trường học|n
ぎゅうにゅう|牛乳|Sữa bò|n
くだもの|果物|Trái cây|n
サラダ||Salad|n
チーズ||Phô mai|n
インターネット||Internet|n
しんぶん|新聞|Báo|n
テレビ||Tivi|n
シーディー|CD|Đĩa CD|n
ディーブイディー|DVD|Đĩa DVD|n
いきます|行きます|Đi|v
きます|来ます|Đến|v
かえります|帰ります|Về|v
たべます|食べます|Ăn|v
のみます|飲みます|Uống|v
みます|見ます|Xem, nhìn|v
〜します||Chơi (thể thao), làm ~|v
おきます|起きます|Thức dậy|v
ねます|寝ます|Ngủ|v
ききます|聞きます|Nghe|v
かいます|買います|Mua|v
よみます|読みます|Đọc|v
べんきょうします|勉強します|Học|v
はたらきます|働きます|Làm việc|v`,
};

const VOCAB_TYPES = { n: 'Danh từ', v: 'Động từ', a: 'Tính từ', x: 'Khác' };

// Nhóm chủ đề để ôn theo nhóm. Each group: [id, label, kana list separated by spaces].
// '@v' means every verb of the lesson. Every word must be in exactly one group.
const VOCAB_TOPICS = {
  1: [
    ['country', 'Quốc gia & người', 'にほん かんこく ちゅうごく タイ ベトナム オーストラリア アメリカ イタリア ロシア インド ブラジル くに 〜じん'],
    ['job', 'Nghề nghiệp & trường', 'しごと きょうし かいしゃいん がくせい せんせい だいがく こうこう にほんごがっこう'],
    ['hobby', 'Sở thích', 'しゅみ スポーツ テニス すいえい サッカー えいが どくしょ おんがく りょこう りょうり'],
    ['self', 'Giới thiệu bản thân', 'なまえ たんじょうび 〜さい'],
  ],
  2: [
    ['floor', 'Chỗ trong cửa hàng', 'インフォメーション エーティーエム エスカレーター エレベーター トイレ レジ きつえんじょ ちか'],
    ['shop', 'Cửa hàng & nhân viên', 'スーパー ひゃくえんショップ レストラン きっさてん 〜や てんいん'],
    ['thing', 'Đồ vật', 'カメラ けいたいでんわ じしょ でんしじしょ パソコン くつ けしゴム ペン トイレットペーパー ほん かばん ズボン ティーシャツ とけい さいふ'],
    ['food', 'Thực phẩm', 'あぶら ケーキ こめ たまご パン みず イチゴ リンゴ バナナ えび さかな ぶたにく とりにく ぎゅうにく やさい'],
    ['menu', 'Món ăn & đồ uống', 'りょうり カレー スープ おやこどん とんかつ ハンバーグ ごはん ライス （お）ちゃ こうちゃ コーヒー ジュース ビール ワイン'],
    ['country', 'Nước & ngôn ngữ', 'ドイツ フランス えいご'],
  ],
  3: [
    ['verb', 'Động từ', '@v'],
    ['day', 'Thứ trong tuần', '〜ようび にちようび げつようび かようび すいようび もくようび きんようび どようび'],
    ['time', 'Thời gian trong ngày', 'ごぜん ごご あさ ひる よる ばん じかん まいにち いちねん'],
    ['season', 'Mùa, lễ hội & sự kiện', 'はる なつ あき ふゆ なつやすみ ゴールデンウイーク さくら おはなみ はなび おまつり パーティー バーベキュー スキー ホームステイ'],
    ['place', 'Địa điểm', 'ぎんこう たいいくかん としょかん びょういん ゆうびんきょく きょうしつ うみ こうえん うち コンビニ かいしゃ がっこう'],
    ['school', 'Học tập & công việc', 'じゅぎょう テスト やすみ スケジュール アルバイト りゅうがくせい'],
    ['food', 'Đồ ăn & đồ uống', 'あさごはん ひるごはん ばんごはん おべんとう おすし おさけ ぎゅうにゅう くだもの サラダ チーズ'],
    ['media', 'Đồ vật & phương tiện', 'バス インターネット しんぶん テレビ シーディー ディーブイディー'],
  ],
};
// Parsed list. Each item works like a kanji word (w, r, m, g, id) so flashcards and the quiz can use it.
// Vocab is studied by its kana only: w = kana. kj is kept so a search for 日本 still finds にほん.
const VOCAB = [];
Object.entries(VOCAB_RAW).forEach(([lesson, raw]) => {
  raw.trim().split('\n').forEach((line, i) => {
    const [kana, kanji = '', m = '', t = 'x', note = ''] = line.split('|');
    const tp = (VOCAB_TOPICS[lesson] || []).find(([, , list]) => list === '@' + t || list.split(' ').includes(kana));
    if (!tp) console.warn('Từ chưa có nhóm:', lesson, kana);
    VOCAB.push({ id: `v${lesson}-${i}`, g: `v${lesson}`, lesson: +lesson, kind: 'vocab', r: kana, kj: kanji, w: kana, m, t, note, topic: tp ? tp[0] : '', warn: false, exam: false });
  });
});
