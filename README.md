# 🌱 Siwi Jaya - Sistem Akuntansi Toko Pertanian

Aplikasi web sistem akuntansi sederhana untuk Toko Pertanian Siwi Jaya. Dibangun dengan HTML, CSS, dan Vanilla JS murni untuk Frontend, serta **Supabase (PostgreSQL)** sebagai Backend.

Aplikasi ini menggunakan **Murni 4 Tabel** (tanpa tabel pivot) dengan memanfaatkan fitur `JSONB` pada PostgreSQL untuk menyimpan rincian item transaksi. Tampilan dibuat modern, responsif, dan dilengkapi fitur manajemen produk, supplier, transaksi, jurnal kas, serta peringatan stok.

## ✨ Fitur

- 📊 **Dashboard** — Statistik saldo kas, total produk, stok menipis, dan transaksi hari ini.
- 📦 **Produk** — CRUD produk dengan relasi supplier & peringatan stok.
- 🏭 **Supplier** — CRUD data pemasok.
- 💳 **Transaksi** — Penjualan & pembelian multi-item (keranjang) yang otomatis memotong/menambah stok.
- 📔 **Jurnal** — Buku kas yang mencatat mutasi masuk/keluar secara otomatis dari transaksi maupun manual.

## 🗂️ Struktur Folder

```text
siwi-jaya-app/
│
├── index.html
├── README.md
│
├── css/
│   └── style.css
│
├── js/
│   ├── supabase-client.js
│   ├── app.js
│   ├── products.js
│   ├── suppliers.js
│   ├── transactions.js
│   └── journal.js
│
└── sql/
    └── schema.sql
