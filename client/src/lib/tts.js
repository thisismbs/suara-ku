 // Helper Mesin Suara (Text-to-Speech) Bahasa Indonesia

let cachedVoices = [];

// Pre-load voices jika tersedia
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Mencari suara Bahasa Indonesia terbaik dari sistem (Web Speech API)
 * Prioritaskan suara lokal (offline) jika tersedia
 * @returns {{ voice: SpeechSynthesisVoice | null, isLocal: boolean }}
 */
export function getIndonesianVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, isLocal: false };
  }

  const voices = window.speechSynthesis.getVoices().length > 0
    ? window.speechSynthesis.getVoices()
    : cachedVoices;

  if (!voices || voices.length === 0) {
    return { voice: null, isLocal: false };
  }

  // Cari semua suara dengan kode bahasa yang diawali 'id' (misal: id-ID, id_ID)
  const indonesianVoices = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    return lang.startsWith('id');
  });

  if (indonesianVoices.length === 0) {
    return { voice: null, isLocal: false };
  }

  // Prioritaskan suara offline / localService === true
  const localVoice = indonesianVoices.find((v) => v.localService === true);
  const selectedVoice = localVoice || indonesianVoices[0];

  return {
    voice: selectedVoice,
    isLocal: Boolean(selectedVoice?.localService)
  };
}

// Menyimpan referensi aktif agar tidak terkena Garbage Collection (GC) dini di Chromium
let currentUtterance = null;

/**
 * Mengucapkan kalimat dengan suara Indonesia dan artikulasi yang dapat disesuaikan
 * @param {string} text - Kalimat yang akan diucapkan
 * @param {Function} [onStart] - Callback saat mulai berbicara
 * @param {Function} [onEnd] - Callback saat selesai atau error
 * @param {number} [rate=0.9] - Kecepatan artikulasi suara (0.7 - 1.2)
 */
export function speakSentence(text, onStart, onEnd, rate = 0.9) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis API tidak didukung di peramban ini');
    onEnd?.();
    return;
  }

  // Batalkan ujaran sebelumnya jika masih berjalan
  window.speechSynthesis.cancel();

  const trimmed = (text || '').trim();
  if (!trimmed) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = 'id-ID';
  utterance.rate = typeof rate === 'number' && !isNaN(rate) ? rate : 0.9;

  // Pasang suara Indonesia jika tersedia
  const { voice } = getIndonesianVoice();
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  const cleanup = () => {
    currentUtterance = null;
    onEnd?.();
  };

  utterance.onend = cleanup;
  utterance.onerror = (e) => {
    console.error('TTS speech error:', e);
    cleanup();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/**
 * Membatalkan proses bicara saat ini
 */
export function cancelSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

/**
 * Memeriksa apakah mesin suara sedang aktif
 * @returns {boolean}
 */
export function isSpeaking() {
  return Boolean(currentUtterance);
}

export default {
  getIndonesianVoice,
  speakSentence,
  cancelSpeech,
  isSpeaking
};
