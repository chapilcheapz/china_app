# ChinaApp - Ứng Dụng Học Từ Vựng Tiếng Trung HSK 1 - 6

Ứng dụng web hiện đại, mượt mà, hỗ trợ học và luyện thi từ vựng tiếng Trung từ HSK 1 đến HSK 6 với **5.002 từ vựng chuẩn**, phát âm bản ngữ Mandarin tự động và lưu trữ tiến độ offline hoàn toàn.

---

## 🌟 Tính Năng Nổi Bật

1. **🎴 Thẻ Flashcard (Anki / Quizlet Style)**
   - Lật thẻ 3D mượt mà (mặt trước: Chữ Hán, phát âm; mặt sau: Pinyin, nghĩa tiếng Việt, câu ví dụ có phiên dịch).
   - Phím tắt: `Space` (Lật thẻ), `←` / `→` (Chuyển thẻ trước/sau), `S` (Nghe phát âm).
   - Chế độ tự động chạy (`Auto-play`) kèm đọc từ vựng bản ngữ.
   - Trộn thẻ ngẫu nhiên (`Shuffle`), lọc từ chưa thuộc, đã thuộc, từ yêu thích ⭐.
   - Đánh dấu nhớ: "Chưa nhớ (Cần ôn lại)" & "Đã thuộc làu".

2. **🎮 Đấu Trường Trắc Nghiệm & Phản Xạ (Quiz Game)**
   - 4 chế độ chơi đa dạng:
     - **Chữ Hán → Nghĩa**: Nhìn Hán tự chọn nghĩa tiếng Việt.
     - **Nghĩa → Chữ Hán**: Nhìn nghĩa tiếng Việt chọn chữ Hán đúng.
     - **Luyện Pinyin**: Chọn phiên âm chuẩn có thanh điệu.
     - **Luyện Nghe phản xạ**: Nghe phát âm tiếng Trung và chọn chữ Hán.
   - Tính điểm, đếm ngược thời gian (12s), chuỗi Combo Streak nhân điểm và hiệu ứng pháo hoa ăn mừng 🎉.
   - Bảng tổng kết vòng thi & danh sách các từ sai kèm nút phát âm/gắn sao để ôn lại.

3. **⌨️ Luyện Gõ Hán Tự (Typing Practice)**
   - Hiện gợi ý Pinyin, nghĩa và câu ví dụ.
   - So khớp ký tự trực tiếp thời gian thực: gõ đúng ký tự đổi màu xanh lá, gõ sai đổi màu đỏ.
   - **Bàn phím ký tự ảo**: cho phép người dùng click chọn ký tự ngay cả khi máy tính/điện thoại chưa cài bộ gõ tiếng Trung (Pinyin IME).
   - Tự động chuyển từ tiếp theo khi gõ đúng kèm âm thanh chúc mừng và phát âm.

4. **📖 Từ Điển Tra Cứu HSK Offline (5.000 từ)**
   - Tra cứu tức thì bằng chữ Hán, Pinyin (có dấu hoặc không dấu như `nihao`), nghĩa tiếng Việt hoặc âm Hán-Việt.
   - Bộ lọc cấp độ từ HSK 1 đến HSK 6.
   - Xem chi tiết câu ví dụ minh họa và nghe phát âm từng câu.

5. **📊 Tiến Độ Học Tập & Sổ Tay Cá Nhân**
   - Thống kê tỷ lệ hoàn thành từng cấp độ HSK 1 - 6.
   - Quản lý danh sách từ vựng yêu thích (Starred words).
   - Hỗ trợ **Sao lưu (Export JSON)** và **Khôi phục (Import JSON)** dữ liệu học tập.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev Server):
```bash
npm run dev
```
Truy cập: `http://localhost:3000` (hoặc cổng hiển thị trên terminal).

### 3. Build sản phẩm (Production):
```bash
npm run build
```

---

## 📂 Cấu Trúc Dự Án

```
china_app/
├── public/
│   └── data/
│       ├── hsk1.json ~ hsk6.json   # Dữ liệu từ vựng từng cấp độ
│       ├── all_words.json          # 5.002 từ vựng toàn diện
│       └── summary.json            # Thống kê tổng quan
├── scripts/
│   └── extract_data.py             # Script trích xuất từ Excel sang JSON
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Thanh điều hướng, đổi cấp độ, dark mode
│   │   ├── FlashcardView.jsx       # Thẻ Flashcard 3D & tự động phát âm
│   │   ├── QuizView.jsx            # Trắc nghiệm 4 chế độ & combo streak
│   │   ├── TypingPracticeView.jsx  # Luyện gõ Hán tự kèm bàn phím ảo
│   │   ├── DictionaryView.jsx      # Từ điển tra cứu HSK offline
│   │   └── ProgressView.jsx        # Thống kê tiến độ & sao lưu dữ liệu
│   ├── utils/
│   │   ├── audio.js                # Web Speech API (TTS) & Web Audio SFX
│   │   ├── pinyinUtils.js          # Tìm kiếm & chuẩn hóa Pinyin/Tiếng Việt
│   │   └── storage.js              # Quản lý LocalStorage & Export/Import
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── từ vựng H1-H6.xlsx              # File Excel nguồn
└── package.json
```
