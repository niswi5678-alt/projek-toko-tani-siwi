// ============================================
// TRANSACTIONS.JS — Modul Transaksi (JSONB)
// ============================================
import { supabase } from './supabase-client.js';
import { showToast, fmtRp, fmtDate, today } from './app.js';

let cart = [];
let produkCache = [];
let supplierCache = [];

export async function initTransactions() {
  await Promise.all([loadProdukCache(), loadSupplierCache()]);
  renderProdukOptions();
  renderSupplierOptions();
  await loadRiwayat();
  renderCart();

  document.getElementById('btn-tambah-cart')?.addEventListener('click', tambahKeCart);
  document.getElementById('btn-simpan-trx')?.addEventListener('click', simpanTransaksi);
}

async function loadProdukCache() {
  const { data } = await supabase.from('produk').select('id, nama, stok, harga_beli, harga_jual, satuan').order('nama');
  produkCache = data || [];
}

async function loadSupplierCache() {
  const { data } = await supabase.from('suppliers').select('id, nama').order('nama');
  supplierCache = data || [];
}

function renderProdukOptions() {
  const sel = document.getElementById('trx-produk');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Produk --</option>' +
    produkCache.map(p => `<option value="${p.id}">${p.nama} (stok: ${p.stok})</option>`).join('');
}

function renderSupplierOptions() {
  const sel = document.getElementById('trx-supplier');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Tanpa Supplier --</option>' +
    supplierCache.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');
}

async function tambahKeCart() {
  const produkId = Number(document.getElementById('trx-produk').value);
  const qty = Number(document.getElementById('trx-qty').value);
  const tipe = document.getElementById('trx-tipe').value;

  if (!produkId || !qty) return showToast('Pilih produk & qty', 'error');

  const p = produkCache.find(x => x.id === produkId);
  if (!p) return;

  if (tipe === 'penjualan' && p.stok < qty) {
    return showToast(`Stok tidak cukup (tersedia ${p.stok})`, 'error');
  }

  const harga = tipe === 'penjualan' ? p.harga_jual : p.harga_beli;
  cart.push({ produk_id: p.id, nama: p.nama, qty, harga, subtotal: Number(harga) * qty });
  renderCart();
}

function renderCart() {
  const tbody = document.getElementById('tbody-cart');
  if (!tbody) return;
  if (!cart.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Keranjang kosong</td></tr>`;
    document.getElementById('trx-total').textContent = fmtRp(0);
    return;
  }
  tbody.innerHTML = cart.map((c, i) => `
    <tr>
      <td>${c.nama}</td>
      <td>${c.qty}</td>
      <td>${fmtRp(c.harga)}</td>
      <td>${fmtRp(c.subtotal)} <button class="btn-icon" data-del="${i}">❌</button></td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => { cart.splice(Number(b.dataset.del), 1); renderCart(); }));

  const total = cart.reduce((s, c) => s + c.subtotal, 0);
  document.getElementById('trx-total').textContent = fmtRp(total);
}

async function simpanTransaksi() {
  if (!cart.length) return showToast('Keranjang kosong', 'error');

  const tipe = document.getElementById('trx-tipe').value;
  const ket = document.getElementById('trx-ket').value;
  const supplierId = document.getElementById('trx-supplier').value || null;
  const total = cart.reduce((s, c) => s + c.subtotal, 0);

  // 1. Insert transaksi header + items (JSONB)
  const { data: trx, error: e1 } = await supabase
    .from('transaksi')
    .insert({ 
      tanggal: today(), 
      tipe, 
      total, 
      keterangan: ket, 
      supplier_id: supplierId,
      items: cart 
    })
    .select().single();
  if (e1) return showToast(e1.message, 'error');

  // 2. Update stok
  for (const c of cart) {
    const p = produkCache.find(x => x.id === c.produk_id);
    const newStok = tipe === 'penjualan' ? p.stok - c.qty : p.stok + c.qty;
    await supabase.from('produk').update({ stok: newStok }).eq('id', c.produk_id);
  }

  // 3. Catat ke jurnal
  const { data: last } = await supabase.from('jurnal').select('saldo').order('id', { ascending: false }).limit(1);
  const saldoLama = Number(last?.[0]?.saldo || 0);
  const saldoBaru = tipe === 'penjualan' ? saldoLama + total : saldoLama - total;

  await supabase.from('jurnal').insert({
    tanggal: today(),
    keterangan: `${tipe === 'penjualan' ? 'Penjualan' : 'Pembelian'}: ${ket || '-'}`,
    tipe: tipe === 'penjualan' ? 'masuk' : 'keluar',
    jumlah: total,
    saldo: saldoBaru,
    ref_transaksi_id: trx.id
  });

  showToast('Transaksi tersimpan', 'success');
  cart = [];
  renderCart();
  document.getElementById('trx-ket').value = '';

  await loadProdukCache();
  renderProdukOptions();
  await loadRiwayat();
}

async function loadRiwayat() {
  const tbody = document.getElementById('tbody-transaksi');
  if (!tbody) return;

  const { data, error } = await supabase
    .from('transaksi')
    .select('*, suppliers(nama)')
    .order('id', { ascending: false })
    .limit(50);

  if (error) return showToast(error.message, 'error');

  if (!data?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Belum ada transaksi</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(t => `
    <tr>
      <td>${fmtDate(t.tanggal)}</td>
      <td><span class="badge ${t.tipe === 'penjualan' ? 'badge-success' : 'badge-warning'}">${t.tipe}</span></td>
      <td>${t.keterangan || '-'}</td>
      <td>${t.suppliers?.nama || '-'}</td>
      <td>${(t.items || []).map(d => `${d.nama} ×${d.qty}`).join(', ')}</td>
      <td><strong>${fmtRp(t.total)}</strong></td>
    </tr>`).join('');
}
