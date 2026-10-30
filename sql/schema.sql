-- ============================================
-- 1. TABEL PROFILES (Terhubung ke Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    nama_lengkap TEXT,
    role TEXT CHECK (role IN ('admin', 'kasir'))
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);

-- Trigger: Otomatis buat profil saat user baru didaftarkan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama_lengkap, role)
  VALUES (
    new.id, new.email, 
    new.raw_user_meta_data->>'nama_lengkap',
    COALESCE(new.raw_user_meta_data->>'role', 'kasir')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 2. TABEL MASTER (Pelanggan, Supplier, Produk)
-- ============================================
CREATE TABLE IF NOT EXISTS pelanggan (
    id BIGSERIAL PRIMARY KEY, nama TEXT NOT NULL, telepon TEXT, alamat TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY, nama TEXT NOT NULL, kontak TEXT, alamat TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produk (
    id BIGSERIAL PRIMARY KEY, barcode TEXT UNIQUE, nama TEXT NOT NULL, kategori TEXT DEFAULT 'Umum', satuan TEXT DEFAULT 'pcs',
    harga_beli NUMERIC(12,2) DEFAULT 0, harga_jual NUMERIC(12,2) DEFAULT 0, stok INT DEFAULT 0, stok_minimum INT DEFAULT 5, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABEL TRANSAKSI (Header, Detail, Pembayaran)
-- ============================================
CREATE TABLE IF NOT EXISTS transaksi (
    id BIGSERIAL PRIMARY KEY, no_ref TEXT UNIQUE NOT NULL, tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    tipe TEXT NOT NULL CHECK (tipe IN ('penjualan', 'pembelian', 'opname')),
    subtotal NUMERIC(12,2) DEFAULT 0, diskon NUMERIC(12,2) DEFAULT 0, pajak NUMERIC(12,2) DEFAULT 0, total NUMERIC(12,2) DEFAULT 0,
    keterangan TEXT, pelanggan_id BIGINT REFERENCES pelanggan(id) ON DELETE SET NULL, supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaksi_detail (
    id BIGSERIAL PRIMARY KEY, transaksi_id BIGINT REFERENCES transaksi(id) ON DELETE CASCADE,
    produk_id BIGINT REFERENCES produk(id) ON DELETE RESTRICT, qty INT NOT NULL, harga NUMERIC(12,2) NOT NULL, subtotal NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS pembayaran (
    id BIGSERIAL PRIMARY KEY, transaksi_id BIGINT REFERENCES transaksi(id) ON DELETE CASCADE,
    metode TEXT NOT NULL CHECK (metode IN ('tunai', 'qris', 'transfer')), jumlah_bayar NUMERIC(12,2) NOT NULL, kembalian NUMERIC(12,2) DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABEL JURNAL (Buku Kas)
-- ============================================
CREATE TABLE IF NOT EXISTS jurnal (
    id BIGSERIAL PRIMARY KEY, tanggal DATE NOT NULL DEFAULT CURRENT_DATE, no_ref TEXT, keterangan TEXT,
    tipe TEXT NOT NULL CHECK (tipe IN ('masuk', 'keluar')), jumlah NUMERIC(12,2) NOT NULL, saldo NUMERIC(12,2) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. SEED DATA (Data Awal)
-- ============================================
INSERT INTO pelanggan (nama, telepon) VALUES ('Umum', '-');
INSERT INTO suppliers (nama, kontak) VALUES ('CV Tani Makmur', '0812-1111');
INSERT INTO produk (barcode, nama, kategori, satuan, harga_beli, harga_jual, stok, stok_minimum) VALUES
('8991234567890', 'Pupuk Urea 50kg', 'Pupuk', 'karung', 85000, 100000, 20, 5),
('8991234567891', 'Pupuk NPK 25kg', 'Pupuk', 'karung', 55000, 65000, 3, 5),
('8991234567892', 'Benih Padi IR64', 'Benih', 'kg', 12000, 18000, 15, 10);
INSERT INTO jurnal (tanggal, no_ref, keterangan, tipe, jumlah, saldo) VALUES (CURRENT_DATE, 'SALDO-AWAL', 'Saldo Awal Kas (Modal)', 'masuk', 5000000, 5000000);

-- ============================================
-- 6. AKTIFKAN RLS (Bebas Akses untuk Development)
-- ============================================
ALTER TABLE pelanggan ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON pelanggan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON produk FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transaksi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transaksi_detail FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON pembayaran FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON jurnal FOR ALL USING (true) WITH CHECK (true);
