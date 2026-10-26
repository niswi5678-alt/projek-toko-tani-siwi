// ============================================
// APP.JS — Orchestrator & Dashboard
// ============================================
import { supabase } from './supabase-client.js';

// ---------- Utilities ----------
export const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
export const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', {
  day: '2-digit', month: 'short', year: 'numeric'
});
export const today = () => new Date().toISOString().split('T')[0];

export function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// ---------- Dashboard ----------
export async function loadDashboard() {
  try {
    // Saldo kas
    const { data: jurnal } = await supabase
      .from('jurnal')
      .select('saldo')
      .order('id', { ascending: false })
      .limit(1);
    const saldo = jurnal?.[0]?.saldo || 0;

    // Total produk
    const { count: totalProduk } = await supabase
      .from('produk')
      .select('*', { count: 'exact', head: true });

    // Stok menipis
    const { data: produkList } = await supabase
      .from('produk')
      .select('id, nama, stok, stok_minimum, satuan')
      .order('stok', { ascending: true });
    const menipis = (produkList || []).filter(p => p.stok <= p.stok_minimum);

    // Transaksi hari ini
    const { data: trxToday } = await supabase
      .from('transaksi')
      .select('tipe, total')
      .eq('tanggal', today());
    const totalHariIni = (trxToday || []).reduce((s, t) => s + Number(t.total), 0);

    // Render
    document.getElementById('stat-saldo')     && (document.getElementById('stat-saldo').textContent = fmtRp(saldo));
    document.getElementById('stat-produk')    && (document.getElementById('stat-produk').textContent = totalProduk || 0);
    document.getElementById('stat-menipis')   && (document.getElementById('stat-menipis').textContent = menipis.length);
    document.getElementById('stat-hari-ini')  && (document.getElementById('stat-hari-ini').textContent = fmtRp(totalHariIni));

    renderWarningStok(menipis);

    // Transaksi terbaru
    const { data: recent } = await supabase
      .from('transaksi')
      .select('id, tanggal, tipe, total, keterangan')
      .order('id', { ascending: false })
      .limit(5);
    renderRecentTrx(recent || []);
  } catch (err) {
    showToast('Dashboard error: ' + err.message, 'error');
  }
}

function renderWarningStok(list) {
  const el = document.getElementById('warning-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state">✅ Semua stok aman</div>`;
    return;
  }
  el.innerHTML = list.map(p => `
    <div class="warning-item">
      <div class="warning-icon">⚠️</div>
      <div class="warning-info">
        <strong>${p.nama}</strong>
        <span>Stok: ${p.stok} ${p.satuan} (min. ${p.stok_minimum})</span>
      </div>
      <span class="badge badge-danger">Menipis</span>
    </div>
  `).join('');
}

function renderRecentTrx(list) {
  const el = document.getElementById('recent-trx');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state">Belum ada transaksi</div>`;
    return;
  }
  el.innerHTML = list.map(t => `
    <div class="trx-item">
      <div class="trx-icon ${t.tipe === 'penjualan' ? 'in' : 'out'}">
        ${t.tipe === 'penjualan' ? '💰' : '🛒'}
      </div>
      <div class="trx-info">
        <strong>${t.keterangan || t.tipe}</strong>
        <span>${fmtDate(t.tanggal)}</span>
      </div>
      <span class="trx-amount ${t.tipe === 'penjualan' ? 'text-green' : 'text-red'}">
        ${t.tipe === 'penjualan' ? '+' : '-'}${fmtRp(t.total)}
      </span>
    </div>
  `).join('');
}

// ---------- Router ----------
document.addEventListener('DOMContentLoaded', async () => {
  const label = document.getElementById('today-label');
  if (label) {
    label.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  const page = location.hash.replace('#', '') || 'dashboard';
  showPage(page);

  window.addEventListener('hashchange', () => {
    showPage(location.hash.replace('#', '') || 'dashboard');
  });
});

async function showPage(page) {
  document.querySelectorAll('[data-section]').forEach(s =>
    s.hidden = s.dataset.section !== page);

  document.querySelectorAll('[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === page));

  const titles = {
    dashboard: 'Dashboard',
    produk: 'Manajemen Produk',
    supplier: 'Manajemen Supplier',
    transaksi: 'Transaksi',
    jurnal: 'Jurnal & Kas'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[page] || page;

  try {
    if (page === 'dashboard') {
      const m = await import('./app.js');
      m.loadDashboard();
    } else if (page === 'produk') {
      const m = await import('./products.js');
      m.initProduk();
    } else if (page === 'supplier') {
      const m = await import('./suppliers.js');
      m.initSuppliers();
    } else if (page === 'transaksi') {
      const m = await import('./transactions.js');
      m.initTransactions();
    } else if (page === 'jurnal') {
      const m = await import('./journal.js');
      m.initJournal();
    }
  } catch (err) {
    console.error(err);
    showToast(err.message, 'error');
  }
}

window.showToast = showToast;
