import Dexie from 'dexie';

export const db = new Dexie('SuaraKuDB');

// Deklarasi skema Dexie version 1
db.version(1).stores({
  vocabularies: 'id, label, category, symbolPath, iconName, isCustom',
  logs: 'id, text, timestamp, syncStatus',
  outbox: 'id, action, entity, payload, timestamp'
});

// Daftar 12 kata dasar AAC esensial
export const defaultVocabularies = [
  { id: 'v-1', label: 'Saya', category: 'subjek', symbolPath: '/symbols/saya.png', iconName: 'User', isCustom: 0 },
  { id: 'v-2', label: 'Mau', category: 'aksi', symbolPath: '/symbols/mau.png', iconName: 'Hand', isCustom: 0 },
  { id: 'v-3', label: 'Makan', category: 'kebutuhan', symbolPath: '/symbols/makan.png', iconName: 'Utensils', isCustom: 0 },
  { id: 'v-4', label: 'Minum', category: 'kebutuhan', symbolPath: '/symbols/minum.png', iconName: 'CupSoda', isCustom: 0 },
  { id: 'v-5', label: 'Toilet', category: 'kebutuhan', symbolPath: '/symbols/toilet.png', iconName: 'Bath', isCustom: 0 },
  { id: 'v-6', label: 'Sakit', category: 'kebutuhan', symbolPath: '/symbols/sakit.png', iconName: 'HeartPulse', isCustom: 0 },
  { id: 'v-7', label: 'Tolong', category: 'sosial', symbolPath: '/symbols/tolong.png', iconName: 'LifeBuoy', isCustom: 0 },
  { id: 'v-8', label: 'Tidak', category: 'respon', symbolPath: '/symbols/tidak.png', iconName: 'XCircle', isCustom: 0 },
  { id: 'v-9', label: 'Senang', category: 'emosi', symbolPath: '/symbols/senang.png', iconName: 'Smile', isCustom: 0 },
  { id: 'v-10', label: 'Sedih', category: 'emosi', symbolPath: '/symbols/sedih.png', iconName: 'Frown', isCustom: 0 },
  { id: 'v-11', label: 'Tidur', category: 'aktivitas', symbolPath: '/symbols/tidur.png', iconName: 'Bed', isCustom: 0 },
  { id: 'v-12', label: 'Selesai', category: 'respon', symbolPath: '/symbols/selesai.png', iconName: 'CheckCircle', isCustom: 0 }
];

// Seeder otomatis untuk inisialisasi tabel vocabularies saat kosong
export async function populateDefaultVocabularies() {
  try {
    const count = await db.vocabularies.count();
    if (count === 0) {
      await db.vocabularies.bulkAdd(defaultVocabularies);
      console.log('Seeder: 12 kosakata AAC dasar berhasil dimasukkan ke IndexedDB');
    }
  } catch (error) {
    console.error('Gagal menjalankan seeder kosakata default:', error);
  }
}

export default db;
