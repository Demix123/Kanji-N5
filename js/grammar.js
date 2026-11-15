// Ngữ pháp bài 1–3 (theo file TÓM TẮT NGỮ PHÁP của từng bài).
// Each point: p = mẫu câu, m = ý nghĩa, n = ghi chú (optional),
// ex = [[câu hỏi, nghĩa câu hỏi, câu trả lời, nghĩa câu trả lời], ...]; the answer uses the grammar point.
// Japanese is written in kana only (no kanji): hiragana, katakana for loanwords and foreign names.

const GRAMMAR = {
  1: [
    { p: 'N1 は N2 です。', m: 'N1 là N2',
      ex: [
        ['パクさんの しごとは なんですか。', 'Công việc của bạn Park là gì?', 'パクさんは がくせいです。', 'Bạn Park là học sinh.'],
        ['なにじんですか。', 'Bạn là người nước nào?', 'わたしは ちゅうごくじんです。', 'Tôi là người Trung Quốc.'],
        ['なんさいですか。', 'Bạn bao nhiêu tuổi?', 'わたしは 26さいです。', 'Tôi 26 tuổi.'],
      ] },
    { p: 'N1 は N2 ではありません／じゃありません。', m: 'N1 không phải là N2',
      ex: [
        ['マリーさんは アメリカじんですか。', 'Bạn Mari là người Mỹ phải không?', 'いいえ、アメリカじんではありません。イギリスじんです。', 'Không, bạn ấy không phải người Mỹ. Bạn ấy là người Anh.'],
        ['カルロスさんは がくせいですか。', 'Anh Carlos là học sinh phải không?', 'いいえ、がくせいじゃありません。かいしゃいんです。', 'Không, anh ấy không phải học sinh. Anh ấy là nhân viên văn phòng.'],
      ] },
    { p: 'N1 は N2 ですか。', m: 'N1 có phải là N2 không?',
      n: 'Trả lời: はい、(A は) B です。／いいえ、(A は) B ではありません。',
      ex: [
        ['ワンさんは がくせいですか。', 'Bạn Wan là học sinh phải không?', 'はい、がくせいです。', 'Vâng, là học sinh.'],
        ['ワンさんは せんせいですか。', 'Bạn Wan là giáo viên phải không?', 'いいえ、せんせいではありません。がくせいです。', 'Không, không phải giáo viên. Là học sinh.'],
      ] },
    { p: 'N は どちら／いつ／なん ですか。', m: 'N ở đâu / khi nào / là gì?',
      ex: [
        ['おくには どちらですか。', 'Đất nước của bạn ở đâu?', 'ベトナムです。', 'Là Việt Nam.'],
        ['たんじょうびは いつですか。', 'Sinh nhật của bạn là khi nào?', '5がつ とおかです。', 'Ngày 10 tháng 5.'],
        ['しゅみは なんですか。', 'Sở thích của bạn là gì?', 'どくしょです。', 'Là đọc sách.'],
      ] },
    { p: 'N1 の N2', m: 'N2 của N1',
      n: 'Nói nghề nghiệp: Tên tổ chức の nghề (ふしみだいがくの がくせい). Với かいしゃいん: Tên công ty の しゃいん.',
      ex: [
        ['きょうは だれの たんじょうびですか。', 'Hôm nay là sinh nhật của ai?', 'わたしの たんじょうびです。', 'Là sinh nhật của tôi.'],
        ['リンさんは がくせいですか。', 'Bạn Linh là sinh viên phải không?', 'はい、ふしみだいがくの がくせいです。', 'Vâng, là sinh viên trường đại học Fushimi.'],
        ['やまださんは かいしゃいんですか。', 'Anh Yamada là nhân viên công ty phải không?', 'はい、ふじつうの しゃいんです。', 'Vâng, là nhân viên công ty Fujitsu.'],
      ] },
    { p: 'N1 と N2', m: 'N1 và N2',
      ex: [
        ['アンナさんの しゅみは なんですか。', 'Sở thích của bạn Anna là gì?', 'りょこうと えいがです。', 'Là du lịch và phim ảnh.'],
      ] },
    { p: 'A1 は B です。A2 も B です。', m: 'A2 cũng là B',
      ex: [
        ['ワンさんの しゅみは なんですか。', 'Sở thích của bạn Wan là gì?', 'ワンさんの しゅみは りょうりです。', 'Sở thích của bạn Wan là nấu ăn.'],
        ['ナタポンさんの しゅみは なんですか。', 'Sở thích của bạn Natapon là gì?', 'ナタポンさんの しゅみも りょうりです。', 'Sở thích của bạn Natapon cũng là nấu ăn.'],
      ] },
  ],
  2: [
    { p: 'これ・それ・あれ', m: 'Cái này / cái đó / cái kia (hoặc: đây là / đó là / kia là)',
      n: 'Chọn theo vị trí của người nói và người nghe: người hỏi cầm vật thì hỏi これ, người trả lời đứng xa vật nên đáp それ. Đứng một mình, không đi kèm danh từ.',
      ex: [
        ['これは なんですか。', 'Cái này là gì?', 'それは かばんです。', 'Cái đó là cái túi xách.'],
        ['これは いくらですか。', 'Cái này bao nhiêu tiền?', 'それは 10,000えんです。', 'Cái đó 10.000 yên.'],
      ] },
    { p: 'この・その・あの ＋ N', m: 'Cái N này / N đó / N kia',
      n: 'Luôn đi kèm danh từ phía sau.',
      ex: [
        ['この ティーシャツは いくらですか。', 'Cái áo thun này bao nhiêu tiền?', 'その ティーシャツは 3,000えんです。', 'Cái áo thun đó giá 3.000 yên.'],
      ] },
    { p: 'ここ・そこ・あそこ・どこ', m: 'Chỗ này / chỗ đó / chỗ kia / ở đâu',
      n: 'Cách lịch sự hơn: こちら・そちら・あちら・どちら (hướng này / đó / kia / nào).',
      ex: [
        ['すみません、トイレは どこですか。', 'Xin lỗi, nhà vệ sinh ở đâu?', 'あそこです。', 'Ở đằng kia.'],
        ['カメラは どこですか。', 'Máy ảnh ở đâu ạ?', 'カメラは そちらです。', 'Máy ảnh ở phía đó ạ.'],
      ] },
    { p: 'N を (〜つ) ください。', m: 'Cho tôi (số lượng) N',
      ex: [
        ['ごちゅうもんは？', '(Nhân viên) Quý khách gọi món gì ạ?', 'カレーを ひとつ ください。', 'Cho tôi 1 phần cà ri.'],
        ['ごちゅうもんは？', '(Nhân viên) Quý khách gọi món gì ạ?', 'ハンバーグを ふたつと とんかつを ひとつ ください。', 'Cho tôi 2 phần hamburg và 1 phần tonkatsu.'],
      ] },
    { p: 'いくら ですか。', m: 'Bao nhiêu tiền?',
      ex: [
        ['この とけいは いくらですか。', 'Cái đồng hồ này bao nhiêu tiền?', 'それは 8,500えんです。', 'Cái đó 8.500 yên.'],
      ] },
    { p: 'どこの N', m: 'N của nước nào, hãng nào (xuất xứ)',
      n: 'A の B: A là nơi chốn, cho biết B đến từ đâu.',
      ex: [
        ['これは どこの ビールですか。', 'Đây là bia nước nào?', 'ドイツの ビールです。', 'Bia Đức ạ.'],
        ['これは どこの ワインですか。', 'Đây là rượu vang nước nào?', 'フランスの ワインです。', 'Rượu vang Pháp ạ.'],
      ] },
    { p: 'なんの N', m: 'N loại gì, về cái gì (tính chất, nguyên liệu, lĩnh vực)',
      ex: [
        ['これは なんの カレーですか。', 'Đây là cà ri gì?', 'えびの カレーです。', 'Cà ri tôm ạ.'],
        ['これは なんの ざっしですか。', 'Đây là tạp chí gì?', 'コンピューターの ざっしです。', 'Tạp chí máy tính.'],
      ] },
    { p: 'だれの N', m: 'N của ai (chủ sở hữu)',
      n: 'Có thể bỏ danh từ phía sau: たなかせんせいのです (của thầy Tanaka).',
      ex: [
        ['これは だれの パソコンですか。', 'Đây là máy tính của ai?', 'たなかせんせいのです。', 'Của thầy Tanaka.'],
        ['この さいふは あなたのですか。', 'Cái ví này là của bạn à?', 'いいえ、わたしのではありません。リーさんのです。', 'Không, không phải của tôi. Là của chị Lee.'],
      ] },
    { p: 'Ngôn ngữ で', m: 'Trong (ngôn ngữ) ... là gì',
      ex: [
        ['「ぶたにく」は えいごで なんですか。', '"Butaniku" tiếng Anh là gì?', '「pork」です。', 'Là "pork".'],
        ['「やさい」は ベトナムごで なんですか。', '"Yasai" tiếng Việt là gì?', '「rau củ」です。', 'Là "rau củ".'],
      ] },
  ],
  3: [
    { p: 'V-ます／V-ません', m: 'Động từ khẳng định / phủ định (hiện tại, tương lai)',
      ex: [
        ['まいにち、あさごはんを たべますか。', 'Mỗi ngày bạn có ăn sáng không?', 'はい、たべます。', 'Có, tôi ăn.'],
        ['まいばん、テレビを みますか。', 'Mỗi tối bạn có xem tivi không?', 'いいえ、みません。', 'Không, tôi không xem.'],
      ] },
    { p: 'Nơi chốn へ いきます・きます・かえります', m: 'Đi / đến / về (nơi nào đó)',
      n: 'へ đọc là "e".',
      ex: [
        ['ふゆやすみ、どこへ いきますか。', 'Kỳ nghỉ đông bạn đi đâu?', 'ほっかいどうへ いきます。', 'Tôi đi Hokkaido.'],
        ['なつやすみ、くにへ かえりますか。', 'Kỳ nghỉ hè bạn có về nước không?', 'いいえ、かえりません。', 'Không, tôi không về.'],
      ] },
    { p: 'N を V', m: 'Làm (cái gì)',
      n: 'を đọc là "o".',
      ex: [
        ['がっこうで なにを べんきょうしますか。', 'Ở trường bạn học gì?', 'にほんごを べんきょうします。', 'Tôi học tiếng Nhật.'],
        ['なにを のみますか。', 'Bạn uống gì?', 'ビールを のみます。', 'Tôi uống bia.'],
      ] },
    { p: 'Thời điểm に V', m: 'Làm gì vào lúc ...',
      n: 'Dùng に với thời gian có số cụ thể (8じ, 5がつ とおか, げつようび). KHÔNG dùng に với: きのう, きょう, あした, こんしゅう, らいしゅう, こんげつ, ことし, らいねん… Với mùa (はる, なつ…) có hoặc không có に đều được.',
      ex: [
        ['まいあさ、なんじに おきますか。', 'Mỗi sáng bạn dậy lúc mấy giờ?', '8じに おきます。', 'Tôi dậy lúc 8 giờ.'],
        ['まいばん、なんじに ねますか。', 'Mỗi tối bạn ngủ lúc mấy giờ?', '11じはんに ねます。', 'Tôi ngủ lúc 11 giờ rưỡi.'],
        ['いつ とうきょうへ いきますか。', 'Khi nào bạn đi Tokyo?', '5がつ とおかに いきます。', 'Tôi đi vào ngày 10/5.'],
        ['いつ おはなみを しますか。', 'Khi nào bạn đi ngắm hoa?', 'あした します。', 'Ngày mai (あした không đi với に).'],
      ] },
    { p: 'Nơi chốn で V', m: 'Làm gì ở (nơi nào)',
      ex: [
        ['どこで ほんを よみますか。', 'Bạn đọc sách ở đâu?', 'としょかんで よみます。', 'Tôi đọc ở thư viện.'],
      ] },
    { p: 'Phương tiện で V', m: 'Làm gì bằng (phương tiện)',
      n: 'Hỏi phương tiện: なんで いきますか (đi bằng gì?).',
      ex: [
        ['なんで はかたへ いきますか。', 'Bạn đi Hakata bằng gì?', 'タクシーで いきます。', 'Tôi đi bằng taxi.'],
        ['なんで がっこうへ いきますか。', 'Bạn đến trường bằng gì?', 'バスで いきます。', 'Tôi đi bằng xe buýt.'],
      ] },
    { p: 'Thời điểm から Thời điểm まで', m: 'Từ ... đến ...',
      ex: [
        ['まいにち、なんじから なんじまで べんきょうしますか。', 'Mỗi ngày bạn học từ mấy giờ đến mấy giờ?', '8じから 10じまで べんきょうします。', 'Tôi học từ 8 giờ đến 10 giờ.'],
        ['なんようびから なんようびまで アルバイトを しますか。', 'Bạn làm thêm từ thứ mấy đến thứ mấy?', 'げつようびから もくようびまで コンビニで アルバイトを します。', 'Từ thứ Hai đến thứ Năm tôi làm thêm ở cửa hàng tiện lợi.'],
      ] },
    { p: 'N1 や N2 など', m: 'Nào là N1, N2…, v.v. (liệt kê vài ví dụ)',
      ex: [
        ['まいあさ、なにを たべますか。', 'Mỗi sáng bạn ăn gì?', 'パンや サラダなどを たべます。', 'Tôi ăn bánh mì, salad, v.v.'],
        ['がっこうで なにを べんきょうしますか。', 'Ở trường bạn học gì?', 'えいごや にほんごなどを べんきょうします。', 'Tôi học tiếng Anh, tiếng Nhật, v.v.'],
      ] },
    { p: 'なにも／どこ(へ)も ＋ V-ません', m: 'Không (làm) gì cả / không đi đâu cả',
      ex: [
        ['にちようび、どこへ いきますか。', 'Chủ Nhật bạn đi đâu?', 'どこ(へ)も いきません。うちで べんきょうします。', 'Tôi không đi đâu cả. Tôi học ở nhà.'],
        ['まいばん、なにを たべますか。', 'Mỗi tối bạn ăn gì?', 'なにも たべません。ぎゅうにゅうを のみます。', 'Tôi không ăn gì cả. Tôi uống sữa.'],
      ] },
  ],
};
