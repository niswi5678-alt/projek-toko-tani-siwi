// ============================================
// JOURNAL.JS — Modul Jurnal / Buku Kas
// ============================================
import { supabase } from './supabase-client.js';
import { showToast, fmtRp, fmtDate, today } from './app.js';

export async function initJournal() {
  await loadJournal();
  document.getElementById('form-jurnal')?.addEventListener('submit', tambahJurnalManual);
}

async function loadJournal() {
  const tbody = document.getElementById('tbody-jurnal');
  if (!tbody) return;

  const { data, error } = await supabase
    .from('jurnal')
    .select('*')
    .order('id', { ascending: false })
    .limit(100);

  if (error) return showToast(error.message, 'error');

  if (!data?.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada mutasi</td></tr>`;
    document.getElementById('jurnal-saldo') && (document.getElementById('jurnal-saldo').textContent = fmtRp(0));
    return;
  }

  tbody.innerHTML = data.map(k => `
    <tr>
      <td>${fmtDate(k.tanggal)}</td>
      <td>${k.keterangan || '-'}</td>
      <td><span class="badge ${k.tipe === 'masuk' ? 'badge-success' : 'badge-danger'}">${k.tipe}</span></td>
      <td class="${k.tipe === 'masuk' ? 'text-green' : 'text-red'}">
        ${k.tipe === 'masuk' ? '+' : '-'}${fmtRp(k.jumlah)}
      </td>
      <td><strong>${fmtRp(k.saldo)}</strong></td>
    </tr>`).join('');

  const saldoEl = document.getElementById('jurnal-saldo');
  if (saldoEl) saldoEl.textContent = fmtRp(data[0].saldo);
}

async function tambahJurnalManual(e) {
  e.preventDefault();
  const ket = document.getElementById('jurnal-ket').value;
  const tipe = document.getElementById('jurnal-tipe').value;
  const jumlah = Number(document.getElementById('jurnal-jumlah').value);

  const { data: last } = await supabase
    .from('jurnal').select('saldo').order('id', { ascending: false }).limit(1);
  const saldoLama = Number(last?.[0]?.saldo || 0);
  const saldoBaru = tipe === 'masuk' ? saldoLama + jumlah : saldoLama - jumlah;

  const { error } = await supabase.from('jurnal').insert({
    tanggal: today(), keterangan: ket, tipe, jumlah, saldo: saldoBaru
  });

  if (error) return showToast(error.message, 'error');
  showToast('Mutasi jurnal tersimpan', 'success');
  e.target.reset();
  loadJournal();
}
