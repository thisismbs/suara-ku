import { db } from '../db';

/**
 * Mendapatkan basis URL API dengan membersihkan trailing slash
 */
const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return url.replace(/\/$/, '');
};

/**
 * Memeriksa apakah kesalahan disebabkan oleh kondisi offline / jaringan terputus
 */
function isNetworkOfflineError(err) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('abort') ||
    err?.name === 'TypeError'
  );
}

const OFFLINE_MESSAGE =
  'Perangkat sedang offline. Sambungkan ke internet untuk melakukan sinkronisasi.';

/**
 * Mengirim data log kalimat lokal berstatus 'pending' ke backend server PostgreSQL
 * @returns {Promise<{ success: boolean, count: number, error?: string }>}
 */
export async function syncLogsToServer() {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, count: 0, error: OFFLINE_MESSAGE };
    }

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
    const errorText = isNetworkOfflineError(err)
      ? OFFLINE_MESSAGE
      : 'Gagal menghubungi server database.';
    return { success: false, count: 0, error: errorText };
  }
}

/**
 * Mengirim antrean mutasi outbox (create, update, delete vocabulary) ke server
 * @returns {Promise<{ success: boolean, count: number, error?: string }>}
 */
export async function syncOutboxToServer() {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, count: 0, error: OFFLINE_MESSAGE };
    }

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
    const errorText = isNetworkOfflineError(err)
      ? OFFLINE_MESSAGE
      : 'Gagal menghubungi server database.';
    return { success: false, count: 0, error: errorText };
  }
}

/**
 * Menjalankan sinkronisasi penuh (Logs & Outbox) secara berurutan
 * @returns {Promise<{ success: boolean, logsCount: number, outboxCount: number, message: string }>}
 */
export async function triggerFullSync() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      logsCount: 0,
      outboxCount: 0,
      message: OFFLINE_MESSAGE
    };
  }

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
    const errText = logsResult.error || outboxResult.error || '';
    message = isNetworkOfflineError({ message: errText })
      ? OFFLINE_MESSAGE
      : errText || 'Sinkronisasi tertunda karena kendala jaringan.';
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
