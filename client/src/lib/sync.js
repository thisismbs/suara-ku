import { db } from '../db';

/**
 * Mendapatkan basis URL API dengan membersihkan trailing slash
 */
const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return url.replace(/\/$/, '');
};

/**
 * Mengirim data log kalimat lokal berstatus 'pending' ke backend server PostgreSQL
 * @returns {Promise<{ success: boolean, count: number, error?: string }>}
 */
export async function syncLogsToServer() {
  try {
    const pendingLogs = await db.logs.where('syncStatus').equals('pending').toArray();

    if (!pendingLogs || pendingLogs.length === 0) {
      return { success: true, count: 0 };
    }

    const API_BASE = getApiBaseUrl();

    // Sesuaikan payload dengan skema kolom backend (created_at)
    const payload = pendingLogs.map((l) => ({
      id: l.id,
      text: l.text,
      words: l.words,
      created_at: l.timestamp || new Date().toISOString()
    }));

    const response = await fetch(`${API_BASE}/api/logs/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    // Perbarui status log di Dexie menjadi 'synced'
    const ids = pendingLogs.map((l) => l.id);
    await db.logs.where('id').anyOf(ids).modify({ syncStatus: 'synced' });

    return { success: true, count: pendingLogs.length };
  } catch (err) {
    console.warn('Gagal menyinkronkan log ke server:', err.message);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Mengirim antrean mutasi outbox (create, update, delete vocabulary) ke server
 * @returns {Promise<{ success: boolean, count: number, error?: string }>}
 */
export async function syncOutboxToServer() {
  try {
    const outboxItems = await db.outbox.toArray();

    if (!outboxItems || outboxItems.length === 0) {
      return { success: true, count: 0 };
    }

    const API_BASE = getApiBaseUrl();
    let processedCount = 0;

    for (const item of outboxItems) {
      try {
        let res;
        const payload = item.payload || {};

        if (item.action === 'create') {
          res = await fetch(`${API_BASE}/api/vocabularies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: payload.id,
              label: payload.label,
              category: payload.category,
              symbol_path: payload.symbolPath || null,
              icon_name: payload.iconName || null,
              note: payload.note || null
            })
          });
        } else if (item.action === 'update') {
          res = await fetch(`${API_BASE}/api/vocabularies/${payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: payload.label,
              category: payload.category,
              symbol_path: payload.symbolPath || null,
              icon_name: payload.iconName || null,
              note: payload.note || null
            })
          });
        } else if (item.action === 'delete') {
          res = await fetch(`${API_BASE}/api/vocabularies/${payload.id}`, {
            method: 'DELETE'
          });
        }

        if (res && res.ok) {
          await db.outbox.delete(item.id);
          processedCount++;
        } else {
          console.warn(`Mutasi outbox ${item.id} gagal diproses server: HTTP ${res?.status}`);
          break; // Hentikan iterasi jika offline atau server gagal
        }
      } catch (itemErr) {
        console.warn(`Koneksi terputus saat mutasi outbox ${item.id}:`, itemErr.message);
        break; // Hentikan bila ada gangguan konektivitas
      }
    }

    return { success: true, count: processedCount };
  } catch (err) {
    console.warn('Gagal sinkronisasi outbox:', err.message);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Menjalankan sinkronisasi penuh (Logs & Outbox) secara berurutan
 * @returns {Promise<{ success: boolean, logsCount: number, outboxCount: number, message: string }>}
 */
export async function triggerFullSync() {
  const logsResult = await syncLogsToServer();
  const outboxResult = await syncOutboxToServer();

  const success = logsResult.success && outboxResult.success;
  let message = '';

  if (success) {
    const total = (logsResult.count || 0) + (outboxResult.count || 0);
    message = total > 0
      ? `Sinkronisasi berhasil (${logsResult.count} log, ${outboxResult.count} mutasi kosakata).`
      : 'Semua data lokal telah tersinkron.';
  } else {
    message = `Sinkronisasi tertunda: ${logsResult.error || outboxResult.error || 'Server offline'}`;
  }

  return {
    success,
    logsCount: logsResult.count || 0,
    outboxCount: outboxResult.count || 0,
    message
  };
}

export default {
  syncLogsToServer,
  syncOutboxToServer,
  triggerFullSync
};
