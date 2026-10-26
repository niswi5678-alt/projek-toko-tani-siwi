-- ============================================
-- SCHEMA SISTEM AKUNTANSI TOKO PERTANIAN (4 TABEL)
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. SUPPLIER
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    nama TEXT NOT NULL,
    kontak TEXT,
    alamat TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUK
CREATE TABLE IF NOT EXISTS produk (
    id BIGSERIAL PRIMARY KEY,
    nama TEXT NOT NULL,
    kategori TEXT DEFAULT 'Umum',
    satuan TEXT DEFAULT 'pcs',
    harga_beli NUMERIC(12,2) DEFAULT 0,
    harga_jual NUMERIC(12,2) DEFAULT 0,
    stok INT DEFAULT 0,
    stok_minimum INT DEFAULT 5,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRANSAKSI (Detail disimpan sebagai JSONB)
CREATE TABLE IF NOT EXISTS transaksi (
    id BIGSERIAL PRIMARY KEY,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    tipe TEXT NOT NULL CHECK (tipe IN ('penjualan', 'pembelian')),
    total NUMERIC(12,2) DEFAULT 0,
    keterangan TEXT,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    items JSONB DEFAULT '[]'::jsonb, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. JURNAL (Buku Kas)
CREATE TABLE IF NOT EXISTS jurnal (
    id BIGSERIAL PRIMARY KEY,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    keterangan TEXT,
    tipe TEXT NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
    jumlah NUMERIC(12,2) NOT NULL,
    saldo NUMERIC(12,2) NOT NULL,
    ref_transaksi_id BIGINT REFERENCES transaksi(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- SEED DATA ----------
INSERT INTO suppliers (nama, kontak, alamat) VALUES
('CV Tani Makmur', '0812-1111-2222', 'Jl. Raya Sawah No. 10'),
('PT Pupuk Nusantara', '0813-3333-4444', 'Jl. Industri No. 5'),
('UD Benih Unggul', '0814-5555-6666', 'Jl. Pasar Tani No. 3');

INSERT INTO produk (nama, kategori, satuan, harga_beli, harga_jual, stok, stok_minimum, supplier_id) VALUES
('Pupuk Urea 50kg', 'Pupuk', 'karung', 85000, 100000, 20, 5, 2),
('Pupuk NPK 25kg', 'Pupuk', 'karung', 55000, 65000, 3, 5, 2),
('Benih Padi IR64', 'Benih', 'kg', 12000, 18000, 15, 10, 3),
('Pestisida Roundup 1L', 'Pestisida', 'botol', 45000, 55000, 4, 5, 1),
('Pakan Ayam 50kg', 'Pakan', 'karung', 350000, 400000, 8, 3, 1),
('Cangkul Baja', 'Alat', 'pcs', 50000, 75000, 10, 2, 1),
('Benih Jagung', 'Benih', 'kg', 15000, 22000, 2, 5, 3);

INSERT INTO jurnal (tanggal, keterangan, tipe, jumlah, saldo) VALUES
(CURRENT_DATE, 'Saldo awal kas Siwi Jaya', 'masuk', 5000000, 5000000);

-- ---------- RLS (Development Only) ----------
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all produk"    ON produk    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all transaksi" ON transaksi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all jurnal"    ON jurnal    FOR ALL USING (true) WITH CHECK (true);
