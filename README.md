# store_fidia — Interactive Product Dashboard

Mini project front-end untuk PTS Pemrograman Web, Program Studi Teknik Komputer, Universitas Borneo Tarakan (2026).

## 1. Identitas

- **Nama aplikasi:** store_fidia
- **Nama mahasiswa:** Fidiani
- **NIM:** 2440304022
- **Kelas:** isi sesuai kelas yang terdaftar
- **Teknologi:** HTML5, CSS3, Vanilla JavaScript, Fetch API, JSON, Web Storage API

## 2. Deskripsi

`store_fidia` adalah dashboard katalog produk umum yang mengambil data dari DummyJSON Products. Pengguna dapat melihat produk, mencari dan mengurutkan daftar, menandai produk favorit, menyimpan catatan produk, melihat ringkasan hasil pengolahan data, serta mengganti Light/Dark Mode.

Data katalog tidak diubah menjadi produk fiktif. Nilai harga dasar berasal dari DummyJSON. Untuk memenuhi tampilan nominal Rupiah, website menampilkan **konversi ilustratif dengan asumsi nilai angka `price` dianggap USD** menggunakan kurs jual Bank Indonesia sebesar **Rp18.037,74 per USD pada 16 Oktober 2026**. DummyJSON tidak memberikan properti currency pada setiap objek produk, sehingga asumsi ini hanya untuk demonstrasi tampilan dan bukan harga lokal resmi produk. Kurs merupakan nilai referensi tetap, bukan kurs otomatis yang diperbarui. Sumber: <https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/Default.aspx>. Ketersediaan data dan gambar bergantung pada layanan eksternal serta koneksi internet.

## 3. Perhitungan variasi NIM

Tiga digit terakhir NIM adalah `022`.

| Variabel | Perhitungan | Hasil / ketentuan |
|---|---|---|
| X | digit pertama dari 022 | 0 — Products |
| Y | digit kedua dari 022 | 2 — Favorite/Bookmark dengan `localStorage` |
| Z | digit ketiga dari 022 | 2 — validasi catatan minimum 30 karakter |
| S | X + Y + Z = 0 + 2 + 2 | 4 |
| C | S mod 4 = 4 mod 4 | 0 — Light/Dark Mode, Retry Fetch, dan waktu terakhir berhasil dimuat |

## 4. API dan sumber data

- Endpoint: <https://dummyjson.com/products?limit=0> (dataset tetap Products; parameter `limit=0` meminta seluruh produk yang tersedia).
- HTTP method: `GET`
- Implementasi: `fetch(API_URL)`, pemeriksaan `response.ok`, `response.json()`, dan penanganan `try...catch`.
- Nilai `price` dari JSON tidak ditimpa. Konversi Rupiah hanya dipakai ketika harga ditampilkan dan statistik harga dihitung.

## 5. Fitur

- Pengambilan dan rendering produk dari API.
- Loading state, error state, dan tombol Retry.
- Waktu terakhir data berhasil dimuat.
- Statistik dihitung dari respons API: jumlah produk yang diterima, rata-rata harga, harga tertinggi, dan jumlah kategori unik.
- Favorit dapat ditambahkan/dihapus dan disimpan menggunakan `localStorage`.
- Filter katalog untuk semua produk atau favorit.
- Filter kelompok kategori berdasarkan produk dari API: kosmetik & perawatan, barang pokok & makanan, elektronik, pakaian & aksesori, rumah & perabot, otomotif, olahraga & outdoor, serta lainnya ketika kategori tersebut tersedia.
- Pencarian real-time dan pengurutan menggunakan dropdown kustom yang lebih mudah dibaca.
- Form catatan yang terkait dengan produk, validasi minimal 30 karakter, penghitung karakter, pesan error, dan pesan berhasil.
- Catatan tersimpan dalam `localStorage` dan dapat dihapus.
- Light/Dark Mode dengan preferensi tema yang disimpan dalam `localStorage`.
- Layout responsive memakai CSS Grid/Flexbox dan HTML semantik.

## 6. Struktur folder

```text
store_fidia/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── assets/
│   └── favicon.svg
├── README.md
├── AI_USAGE_LOG.md
└── .gitignore
```

## 7. Cara menjalankan melalui Laragon

1. Ekstrak folder `store_fidia` ke `C:\laragon\www\store_fidia`.
2. Buka Laragon dan nyalakan layanan web server (Apache/Nginx).
3. Buka browser dan kunjungi `http://localhost/store_fidia/`.
4. Pastikan internet aktif agar Fetch API dan gambar produk dari DummyJSON bisa dimuat.
5. Jika API gagal, baca pesan error di halaman dan tekan **Coba lagi**. Buka Developer Tools → Network untuk memeriksa request ke `dummyjson.com/products`.

Jangan hanya membuka `index.html` melalui `file://`. Jalankan melalui Laragon agar perilaku browser lebih menyerupai server lokal.

## 8. Analisis data

Semua analisis dihitung dari produk yang benar-benar diterima dari API:

1. **Jumlah produk:** jumlah elemen pada `payload.products` yang memiliki ID valid.
2. **Rata-rata harga:** jumlah semua nilai harga numerik dibagi jumlah harga numerik yang valid.
3. **Harga tertinggi:** produk dengan harga numerik tertinggi menggunakan `reduce()`.
4. **Jumlah kategori unik:** jumlah nilai kategori unik setelah disaring dengan `Set`.

Harga yang ditampilkan dalam Rupiah dihitung dengan rumus `Math.round(Number(product.price) * 18037.74)`. Contohnya, nilai angka API 10 menjadi estimasi Rp180.377, karena `10 × 18.037,74 = 180.377,4`, dibulatkan ke Rupiah penuh. Ini hanya konversi ilustratif dengan asumsi nilai API merupakan USD agar antarmuka menggunakan nominal Rupiah; harga asli dari API tetap tersimpan sebagai `product.price`. Kurs tetap merujuk kurs jual BI tanggal 16 Oktober 2026 dan tidak diperbarui otomatis. Statistik harga menggunakan rumus yang sama sehingga konsisten dengan harga yang terlihat pada kartu produk.

## 9. Sepuluh pertanyaan penjelasan kode

### 1. Jelaskan alur dari halaman dibuka sampai data REST API tampil.

Ketika halaman selesai diparsing, `app.js` menjalankan `initializeApp()`. Fungsi tersebut memuat tema dan data lokal, memperbarui penghitung karakter, memasang event listener, lalu memanggil `loadProducts()`. `loadProducts()` menampilkan loading state, menjalankan `fetch(API_URL)`, memeriksa `response.ok`, membaca JSON, memeriksa struktur `payload.products`, menyimpan data di `state.products`, memperbarui waktu terakhir berhasil dimuat, memanggil `updateStatistics()`, lalu `renderProducts()` untuk membuat kartu produk di DOM.

### 2. Mengapa perlu memeriksa `response.ok` setelah `fetch()`?

`fetch()` tidak otomatis melempar error hanya karena server membalas status HTTP seperti 404 atau 500. Karena itu, `loadProducts()` memeriksa `response.ok`. Jika nilainya `false`, fungsi melempar error dengan status HTTP agar alur masuk ke `catch` dan menampilkan pesan yang sesuai.

### 3. Bagaimana data JSON menjadi elemen DOM?

Setelah `response.json()` selesai, data berada di `payload.products`. Fungsi `renderProducts()` mengambil hasil `getVisibleProducts()`, membuat elemen kartu dengan `createProductCard(product)`, kemudian menambahkan elemen tersebut ke `DocumentFragment` dan mengganti isi `#product-grid`. Data teks dimasukkan melalui `textContent` untuk menghindari memperlakukan judul/deskripsi dari API sebagai HTML.

### 4. Apa yang terjadi saat internet terputus atau server mengembalikan 404/500?

Kegagalan koneksi ditangani oleh `catch` di `loadProducts()`. Jika respons HTTP bukan sukses, pemeriksaan `response.ok` membuat error. Pesan ditampilkan di `#error-state`; tombol `#retry-button` menjalankan `loadProducts()` lagi. Loading indicator ditutup di blok `finally`. Waktu sukses hanya ditulis ulang setelah respons dan struktur data berhasil diperiksa.

### 5. Bagaimana fitur favorit bekerja?

Setiap kartu memuat tombol `favorite-button`. Tombol memanggil `toggleFavorite(product.id)`, yang menambahkan atau menghapus ID produk dari `state.favorites`. Daftar ID disimpan di `localStorage` melalui `writeStorage()`. Saat aplikasi dimulai, `initializeLocalData()` membaca daftar itu. Fungsi `getVisibleProducts()` menggunakan `filter()` untuk menampilkan favorit ketika tab Favorit dipilih.

### 6. Bagaimana validasi catatan bekerja?

Formulir `#note-form` ditangani oleh `saveNote(event)`. Fungsi ini mencegah submit default, memeriksa bahwa produk dipilih, lalu menghitung panjang teks yang telah di-trim. Jika teks kurang dari 30 karakter, fungsi menampilkan error dan tidak menyimpan catatan. Jika valid, catatan ditambahkan ke `state.notes`, disimpan ke `localStorage`, lalu daftar catatan dirender kembali.

### 7. Data apa yang disimpan di localStorage?

Aplikasi menyimpan empat kelompok data: tema (`store_fidia_theme`), ID favorit (`store_fidia_favorites`), catatan (`store_fidia_notes`), dan waktu terakhir API berhasil dimuat (`store_fidia_last_success`). Preferensi filter dan pencarian tidak wajib disimpan. Saat awal aplikasi, fungsi `readStorage()` membaca data ini. Setiap perubahan tema, favorit, catatan, atau waktu sukses diperbarui menggunakan `writeStorage()`. Data produk utama tetap diambil dari API, bukan digantikan oleh cache lokal.

### 8. Contoh fungsi penting (maksimal 15 baris) dan input-proses-output

```js
async function loadProducts() {
  if (state.loading) return;
  state.loading = true;
  elements.loadingState.hidden = false;
  elements.errorState.hidden = true;
  elements.productGrid.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Server mengembalikan HTTP ${response.status}.`);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.products)) throw new Error('Respons API tidak valid.');
    state.products = payload.products.filter((product) => product && Number.isInteger(product.id));
```

- **Input:** permintaan untuk memuat data dari `API_URL`.
- **Proses:** mencegah request ganda saat sedang loading, memperlihatkan indikator, memanggil Fetch, memeriksa status HTTP, membaca JSON, dan memvalidasi daftar produk.
- **Output:** data produk valid disimpan di `state.products` untuk diproses lebih lanjut, atau error diteruskan ke penanganan `catch`.

### 9. Bug/error paling sulit selama PTS

**Isi bagian ini setelah melakukan pengujian nyata; jangan menggunakan jawaban yang belum pernah terjadi.**

- Gejala error yang benar-benar ditemui: `[isi berdasarkan pengalaman]`
- Penyebab setelah diperiksa: `[isi penyebab]`
- Cara menemukan error: `[misalnya Console/Network, jika memang dilakukan]`
- Perbaikan yang diterapkan: `[isi perubahan]`
- Bukti pengujian setelah diperbaiki: `[isi hasil nyata]`

### 10. Dua perbaikan teknis jika memiliki satu minggu tambahan

1. Menambahkan pengujian otomatis untuk fungsi format harga, statistik, filter, dan validasi agar regresi lebih mudah dideteksi.
2. Meningkatkan aksesibilitas serta ketahanan jaringan, misalnya menguji kontras/fokus keyboard secara sistematis dan memberi pesan saat gambar tertentu gagal dimuat.

## 10. Checklist pengujian manual

Tandai setelah masing-masing pengujian benar-benar dijalankan:

- [ ] Data produk berhasil dimuat melalui Network.
- [ ] Loading state terlihat saat request berjalan.
- [ ] Statistik berubah mengikuti respons API.
- [ ] Harga tampil dalam Rupiah melalui konversi ilustratif yang diberi keterangan kurs dan tanggal sumbernya.
- [ ] Search real-time berfungsi.
- [ ] Pengurutan harga, nama, dan rating berfungsi.
- [ ] Favorit dapat ditambahkan dan dihapus.
- [ ] Favorit tetap tersimpan setelah reload.
- [ ] Tab Favorit menampilkan produk yang benar.
- [ ] Catatan di bawah 30 karakter ditolak dan menampilkan pesan.
- [ ] Catatan 30 karakter atau lebih diterima.
- [ ] Catatan tersimpan dan bisa dihapus.
- [ ] Tema bisa diganti dan tetap dipilih setelah reload.
- [ ] Saat Fetch gagal, tombol Retry muncul dan berfungsi.
- [ ] Waktu pemuatan hanya berubah setelah sukses.
- [ ] Tampilan diuji pada desktop (≥1024 px), tablet (~768 px), dan mobile (≤480 px).
- [ ] Fungsi keyboard/fokus, dropdown pengurutan kustom, pencarian produk pada dropdown catatan, serta filter kelompok kategori diperiksa.
- [ ] Console diperiksa untuk error yang mengganggu fungsi utama.

Status pengujian tidak otomatis dianggap lulus hanya karena checklist sudah dibuat. Isi checklist sesuai hasil yang benar-benar diamati.

## 11. Git history dan tag

Belum ada klaim bahwa repository telah dibuat, di-push, memiliki delapan commit, atau memiliki tag. Lakukan pengembangan dan pengujian bertahap, kemudian buat commit bermakna pada tahap yang benar-benar dikerjakan. Jangan membuat commit atau tanggal pengerjaan palsu hanya untuk memenuhi jumlah minimal.

Contoh tahapan kerja yang dapat menjadi commit setelah masing-masing perubahan benar-benar dilakukan:

1. `chore: initialize project structure`
2. `feat: create responsive dashboard layout`
3. `feat: fetch products from DummyJSON API`
4. `feat: render product cards and data statistics`
5. `feat: add product search and sorting`
6. `feat: persist favorite products in localStorage`
7. `feat: validate and save product notes`
8. `feat: persist light and dark theme`
9. `fix: improve API error and retry handling`
10. `docs: document setup and PTS requirements`

Setelah project benar-benar selesai dan diuji, tag yang diminta soal adalah `v0.1-PTS`. Perintahnya: `git tag v0.1-PTS`, lalu periksa dengan `git tag --list`.

## 12. Video demo dan berkas pengumpulan

Video demo disyaratkan berdurasi 6–10 menit. Tampilkan wajah dan perkenalkan nama, NIM, serta aplikasi; demonstrasikan tampilan responsif; tampilkan dataset/fitur Y/validasi Z/challenge C; tunjukkan API di Network; peragakan loading/error handling dan localStorage; tunjukkan repository/Git history; lalu jelaskan satu fungsi JavaScript utama.

Nama folder sesuai format soal: `PTS_PEMWEB_2440304022_NAMA`.

Berkas yang harus disiapkan: ZIP source code, README, screenshot desktop dan mobile, AI Usage Log, tautan repository, dan tautan video demo. Tautan dan bukti tersebut perlu dibuat serta diperiksa oleh mahasiswa sebelum pengumpulan.
