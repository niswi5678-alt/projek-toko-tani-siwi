import { supabase } from './supabase-client.js';
import { showToast, fmtRp, today } from './app.js';

let cart = [];
let produkCache = [];

export async function initKasir() {
  await loadProdukGrid();
  renderCart();
  document.getElementById('btn-kasir-bayar')?.addEventListener('click', prosesPembayaran);
}

async function loadProdukGrid() {
  const { data } = await supabase.from('produk').select('*').order('nama');
  produkCache = data || [];
  document.getElementById('kasir-produk-list').innerHTML = produkCache.map(p => `
    <div class="produk-card" onclick="tambahKeCart(${p.id})">
      <div class="p-nama">${p.nama}</div><div class="p-harga">${fmtRp(p.harga_jual)}</div>
      <div class="muted" style="font-size:.8rem;">Stok: ${p.stok}</div>
    </div>
  `).join('');
}

window.tambahKeCart = function(id) {
  const p = produkCache.find(x => x.id === id);
  if (p.stok <= 0) return showToast('Stok habis!', 'error');
  const existing = cart.find(c => c.produk_id === id);
  if (existing) {
    if (existing.qty >= p.stok) return showToast('Melebihi stok', 'error');
    existing.qty++; existing.subtotal = existing.qty * existing.harga;
  } else {
    cart.push({ produk_id: p.id, nama: p.nama, qty: 1, harga: p.harga_jual, subtotal: p.harga_jual });
  }
  renderCart();
};

function renderCart() {
  const list = document.getElementById('kasir-cart-list');
  list.innerHTML = cart.map((c, i) => `
    <div style="display:flex; justify-content:space-between; margin-bottom: 1rem; border-bottom: 1px dashed #ccc; padding-bottom: .5rem;">
      <div><strong>${c.nama}</strong><br><span class="muted">${c.qty} x ${fmtRp(c.harga)}</span></div>
      <div style="text-align:right;"><strong>${fmtRp(c.subtotal)}</strong><br><button class="btn-icon" style="color: red;" onclick="hapusCart(${i})">🗑️</button></div>
    </div>
  `).join('') || '<div class="empty-state">Belum ada item</div>';
  const total = cart.reduce((s, c) => s + c.subtotal, 0);
  document.getElementById('kasir-subtotal').textContent = fmtRp(total);
  document.getElementById('kasir-total').textContent = fmtRp(total);
}

window.hapusCart = function(index) { cart.splice(index, 1); renderCart(); };

async function prosesPembayaran() {
  if (!cart.length) return showToast('Keranjang kosong', 'error');
  const metode = prompt("
