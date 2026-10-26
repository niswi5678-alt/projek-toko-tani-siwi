// ============================================
// PRODUCTS.JS — Modul Produk
// ============================================
import { supabase } from './supabase-client.js';
import { showToast, fmtRp } from './app.js';

let supplierCache = [];

export async function initProduk() {
  await loadSuppliers();
  await loadProduk();
  document.getElementById('form-produk')?.addEventListener('submit', simpanProduk);
}

async function loadSuppliers() {
  const { data } = await supabase.from('suppliers').select('id, nama').order('nama');
  supplierCache = data || [];
  const sel = document.getElementById('produk-supplier');
  if (sel) {
    sel.innerHTML = '<option value="">-- Tanpa Supplier --</option>' +
      supplierCache.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');
  }
}

async function loadProduk() {
  const tbody = document.getElementById('tbody-produk');
  if (!tbody) return;

  const { data, error } = await supabase
    .from('produk')
    .select('*, suppliers(nama)')
    .order('nama');

  if (error) return showToast(error.message, 'error');

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Belum ada produk</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(p => {
    const low = p.stok <= p.stok_minimum;
    return `
      <tr class="${low ? 'row-warning' : ''}">
        <td><strong>${p.nama}</strong></td>
        <td><span class="badge">${p.kategori}</span></td>
        <td>${p.satuan}</td>
        <td>${fmtRp(p.harga_beli)}</td>
        <td>${fmtRp(p.harga_jual)}</td>
        <td>${p.stok} ${low ? '⚠️' : ''}</td>
        <td>${p.suppliers?.nama || '-'}</td>
        <td>
          <button class="btn-icon" data-edit="${p.id}">✏️</button>
          <button class="btn-icon" data-del="${p.id}">🗑️</button>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => editProduk(Number(b.dataset.edit))));
  tbody.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => hapusProduk(Number(b.dataset.del))));
}

async function simpanProduk(e) {
  e.preventDefault();
  const id = document.getElementById('produk-id').value;
  const payload = {
    nama: document.getElementById('produk-nama').value,
    kategori: document.getElementById('produk-kategori').value,
    satuan: document.getElementById('produk-satuan').value,
    harga_beli: Number(document.getElementById('produk-beli').value),
    harga_jual: Number(document.getElementById('produk-jual').value),
    stok: Number(document.getElementById('produk-stok').value),
    stok_minimum: Number(document.getElementById('produk-min').value),
    supplier_id: document.getElementById('produk-supplier').value || null
  };

  const { error } = id
    ? await supabase.from('produk').update(payload).eq('id', id)
    : await supabase.from('produk').insert(payload);

  if (error) return showToast(error.message, 'error');
  showToast('Produk tersimpan', 'success');
  e.target.reset();
  document.getElementById('produk-id').value = '';
  loadProduk();
}

async function editProduk(id) {
  const { data } = await supabase.from('produk').select('*').eq('id', id).single();
  if (!data) return;
  document.getElementById('produk-id').value = data.id;
  document.getElementById('produk-nama').value = data.nama;
  document.getElementById('produk-kategori').value = data.kategori;
  document.getElementById('produk-satuan').value = data.satuan;
  document.getElementById('produk-beli').value = data.harga_beli;
  document.getElementById('produk-jual').value = data.harga_jual;
  document.getElementById('produk-stok').value = data.stok;
  document.getElementById('produk-min').value = data.stok_minimum;
  document.getElementById('produk-supplier').value = data.supplier_id || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function hapusProduk(id) {
  if (!confirm('Hapus produk ini?')) return;
  const { error } = await supabase.from('produk').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  showToast('Produk dihapus', 'success');
  loadProduk();
}
