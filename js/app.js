import { supabase } from './supabase-client.js';

// --- Utilitas ---
export const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
export const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
export const today = () => new Date().toISOString().split('T')[0];

export function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

// --- Fungsi Cetak Struk ---
window.printStruk = function(trx, items, pelanggan, metode, bayar, kembalian) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html><head><title>Struk ${trx.no_ref}</title>
    <style>body{font-family:monospace;width:300px;padding:10px}.text-center{text-align:center}.text-right{text-align:right}.line{border-bottom:1px dashed #000;margin:5px 0}table{width:100%;font-size:12px}</style>
    </head><body>
      <div class="text-center"><h3>TOKO PERTANIAN SIWI JAYA</h3><p>Jl. Raya Pertanian No. 1<br>Telp: 0812-3456-7890</p></div>
      <div class="line"></div><p>No: ${trx.no_ref}<br>Tanggal: ${trx.tanggal}<br>Pelanggan: ${pelanggan}</p><div class="line"></div>
      <table>${items.map(i => `<tr><td>${i.nama}</td><td>${i.qty}x</td><td class="text-right">${i.subtotal}</td></tr>`).join('')}</table>
      <div class="line"></div><p>Subtotal: ${trx.subtotal}<br>Diskon: -${trx.diskon}<br>PPN: ${trx.pajak}<br><b>Total: ${trx.total}</b></p>
      <p>Bayar (${metode}): ${bayar}<br>Kembali: ${kembalian}</p><div class="line"></div>
      <div class="text-center"><p>Terima Kasih<br>Selamat Bertani!</p></div>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
};

// --- Sistem Login ---
window.handleLogin = async function() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login');

  if (!email || !password) return showToast('Isi email & password', 'error');
  btn.textContent = 'Memuat...'; btn.disabled = true;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    showToast('Login Gagal: ' + authError.message, 'error');
    btn.textContent = 'Masuk Sistem'; btn.disabled = false; return;
  }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();

  if (profileError || !profile) {
    showToast('Profil tidak ditemukan!', 'error');
    await supabase.auth.signOut();
    btn.textContent = 'Masuk Sistem'; btn.disabled = false; return;
  }

  showToast(`Selamat datang, ${profile.nama_lengkap}`, 'success');
  tampilkanLayar(profile.role, profile.nama_lengkap);
};

window.logout = async function() { await supabase.auth.signOut(); location.reload(); };

async function cekSesi() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) { tampilkanLayar(profile.role, profile.nama_lengkap); return; }
  }
  document.getElementById('login-screen').style.display = 'block';
  document.getElementById('kasir-screen').style.display = 'none';
  document.getElementById('admin-screen').style.display = 'none';
}

async function tampilkanLayar(role, nama) {
  document.getElementById('login-screen').style.display = 'none';
  if (role === 'kasir') {
    document.getElementById('kasir-screen').style.display = 'flex';
    document.getElementById('admin-screen').style.display = 'none';
    document.getElementById('kasir-nama-user').textContent = nama;
    const m = await import('./kasir.js'); m.initKasir();
  } else if (role === 'admin') {
    document.getElementById('kasir-screen').style.display = 'none';
    document.getElementById('admin-screen').style.display = 'grid';
    document.getElementById('admin-nama-user').textContent = nama;
    initAdminRouter();
  }
}

// --- Router Admin ---
function initAdminRouter() {
  const label = document.getElementById('today-label');
  if (label) label.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const page = location.hash.replace('#', '') || 'dashboard';
  showPage(page);
  window.addEventListener('hashchange', () => showPage(location.hash.replace('#', '') || 'dashboard'));
}

async function showPage(page) {
  document.querySelectorAll('[data-section]').forEach(s => s.hidden = s.dataset.section !== page);
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === page));
  const titles = { dashboard: 'Dashboard', produk: 'Produk', pelanggan: 'Pelanggan', supplier: 'Supplier', jurnal: 'Buku Kas', laporan: 'Laporan' };
  document.getElementById('page-title').textContent = titles[page] || page;

  try {
    if (page === 'dashboard') { const m = await import('./app.js'); m.loadDashboard(); }
    else if (page === 'produk') { const m = await import('./produk.js'); m.initProduk(); }
    else if (page === 'pelanggan') { const m = await import('./pelanggan.js'); m.initPelanggan(); }
    else if (page === 'supplier') { const m = await import('./supplier.js'); m.initSupplier(); }
    else if (page === 'jurnal') { const m = await import('./journal.js'); m.initJournal(); }
    else if (page === 'laporan') { const m = await import('./laporan.js'); m.initLaporan(); }
  } catch (err) { console.error(err); showToast(err.message, 'error'); }
}

// --- Load Dashboard ---
export async function loadDashboard() {
  const { data: jurnal } = await supabase.from('jurnal').select('saldo').order('id', { ascending: false }).limit(1);
  const { count: totalProduk } = await supabase.from('produk').select('*', { count: 'exact', head: true });
  const { data: produkList } = await supabase.from('produk').select('id, nama, stok, stok_minimum, satuan').order('stok', { ascending: true });
  const menipis = (produkList || []).filter(p => p.stok <= p.stok_minimum);
  const { data: trxToday } = await supabase.from('transaksi').select('total').eq('tanggal', today());

  document.getElementById('stat-saldo').textContent = fmtRp(jurnal?.[0]?.saldo || 0);
  document.getElementById('stat-produk').textContent = totalProduk || 0;
  document.getElementById('stat-menipis').textContent = menipis.length;
  document.getElementById('stat-hari-ini').textContent = fmtRp((trxToday || []).reduce((s, t) => s + Number(t.total), 0));

  document.getElementById('warning-list').innerHTML = menipis.length ? menipis.map(p => `
    <div class="warning-item"><div class="warning-icon">⚠️</div><div class="warning-info"><strong>${p.nama}</strong><span>Stok: ${p.stok} (min. ${p.stok_minimum})</span></div></div>
  `).join('') : '<div class="empty-state">✅ Semua stok aman</div>';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-login')?.addEventListener('click', handleLogin);
  cekSesi();
});
