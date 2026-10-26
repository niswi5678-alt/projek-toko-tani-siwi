// ============================================
// SUPPLIERS.JS — Modul Supplier
// ============================================
import { supabase } from './supabase-client.js';
import { showToast } from './app.js';

export async function initSuppliers() {
  await loadSuppliers();
  document.getElementById('form-supplier')?.addEventListener('submit', simpanSupplier);
}

async function loadSuppliers() {
  const tbody = document.getElementById('tbody-supplier');
  if (!tbody) return;

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('nama');

  if (error) return showToast(error.message, 'error');

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada supplier</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(s => `
    <tr>
      <td><strong>${s.nama}</strong></td>
      <td>${s.kontak || '-'}</td>
      <td>${s.alamat || '-'}</td>
      <td>${new Date(s.created_at).toLocaleDateString('id-ID')}</td>
      <td>
        <button class="btn-icon" data-edit="${s.id}">✏️</button>
        <button class="btn-icon" data-del="${s.id}">🗑️</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => editSupplier(Number(b.dataset.edit))));
  tbody.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => hapusSupplier(Number(b.dataset.del))));
}

async function simpanSupplier(e) {
  e.preventDefault();
  const id = document.getElementById('supplier-id').value;
  const payload = {
    nama: document.getElementById('supplier-nama').value,
    kontak: document.getElementById('supplier-kontak').value,
    alamat: document.getElementById('supplier-alamat').value
  };

  const { error } = id
    ? await supabase.from('suppliers').update(payload).eq('id', id)
    : await supabase.from('suppliers').insert(payload);

  if (error) return showToast(error.message, 'error');
  showToast('Supplier tersimpan', 'success');
  e.target.reset();
  document.getElementById('supplier-id').value = '';
  loadSuppliers();
}

async function editSupplier(id) {
  const { data } = await supabase.from('suppliers').select('*').eq('id', id).single();
  if (!data) return;
  document.getElementById('supplier-id').value = data.id;
  document.getElementById('supplier-nama').value = data.nama;
  document.getElementById('supplier-kontak').value = data.kontak || '';
  document.getElementById('supplier-alamat').value = data.alamat || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function hapusSupplier(id) {
  if (!confirm('Hapus supplier ini?')) return;
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  showToast('Supplier dihapus', 'success');
  loadSuppliers();
}
