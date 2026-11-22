import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

// Muat variabel lingkungan dari .env atau fallback server/.env
dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: './server/.env' });
}

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 5000;

// Konfigurasi Database Connection Pool Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Inisialisasi skema tabel otomatis (idempoten)
let isDbInitialized = false;
const ensureTables = async () => {
  if (isDbInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vocabularies (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        symbol_path TEXT,
        icon_name VARCHAR(100),
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS logs (
        id VARCHAR(255) PRIMARY KEY,
        sentence TEXT,
        text TEXT,
        words JSONB,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        received_at TIMESTAMPTZ DEFAULT NOW(),
        notes TEXT
      );

      ALTER TABLE logs ADD COLUMN IF NOT EXISTS sentence TEXT;
      ALTER TABLE logs ADD COLUMN IF NOT EXISTS text TEXT;
      ALTER TABLE logs ADD COLUMN IF NOT EXISTS words JSONB;
      ALTER TABLE logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE logs ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE logs ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    isDbInitialized = true;
  } catch (err) {
    console.warn('Database schema ensure warning:', err.message);
  }
};

// Middleware verifikasi skema database sebelum menangani rute /api
app.use(async (req, res, next) => {
  if (!isDbInitialized && req.path.startsWith('/api')) {
    await ensureTables();
  }
  next();
});

// Helper formatting respon log agar kompatibel dengan field sentence/text & timestamp/created_at
const formatLogRow = (row) => {
  if (!row) return row;
  let parsedWords = row.words;
  if (typeof parsedWords === 'string') {
    try {
      parsedWords = JSON.parse(parsedWords);
    } catch {
      // biarkan tetap string jika bukan JSON valid
    }
  }

  const sentenceVal = row.sentence || row.text || '';
  const timeVal = row.timestamp || row.created_at || null;

  return {
    id: row.id,
    sentence: sentenceVal,
    text: sentenceVal,
    words: parsedWords,
    timestamp: timeVal,
    created_at: timeVal,
    received_at: row.received_at || null,
    notes: row.notes || null
  };
};

// ==========================================
// RUTE HEALTH CHECK
// ==========================================

// GET /health - Pemanasan Cold-Start & Verifikasi Koneksi Database
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error on GET /health:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RUTE CRUD LOGS (RIWAYAT KOMUNIKASI)
// ==========================================

// 1. GET /api/logs - Mengambil seluruh riwayat log diurutkan descending berdasarkan timestamp
app.get('/api/logs', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        COALESCE(sentence, text) AS sentence,
        COALESCE(text, sentence) AS text,
        words,
        COALESCE(timestamp, created_at) AS timestamp,
        COALESCE(created_at, timestamp) AS created_at,
        received_at,
        notes
      FROM logs
      ORDER BY COALESCE(timestamp, created_at) DESC;
    `;
    const result = await pool.query(query);
    const formatted = result.rows.map(formatLogRow);
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Error on GET /api/logs:', err);
    return res.status(500).json({ error: err.message || 'Gagal mengambil data logs' });
  }
});

// 2. GET /api/logs/:id - Mengambil detail satu log berdasarkan id
app.get('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        id,
        COALESCE(sentence, text) AS sentence,
        COALESCE(text, sentence) AS text,
        words,
        COALESCE(timestamp, created_at) AS timestamp,
        COALESCE(created_at, timestamp) AS created_at,
        received_at,
        notes
      FROM logs
      WHERE id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log tidak ditemukan' });
    }

    return res.status(200).json(formatLogRow(result.rows[0]));
  } catch (err) {
    console.error(`Error on GET /api/logs/${req.params.id}:`, err);
    return res.status(500).json({ error: err.message || 'Gagal mengambil detail log' });
  }
});

// 3. POST /api/logs - Menambahkan log kalimat baru (Upsert idempoten via ON CONFLICT)
app.post('/api/logs', async (req, res) => {
  try {
    const { id, sentence, text, words, timestamp, created_at, notes } = req.body || {};

    const sentenceValue = (sentence ?? text ?? '').trim();
    if (!sentenceValue && !words) {
      return res.status(400).json({ error: 'sentence atau text wajib diisi' });
    }

    const logId = id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`);
    const timeValue = timestamp || created_at || new Date().toISOString();

    const wordsValue = typeof words === 'object' && words !== null
      ? JSON.stringify(words)
      : (words ?? null);

    const query = `
      INSERT INTO logs (id, sentence, text, words, timestamp, created_at, received_at, notes)
      VALUES ($1, $2, $3, $4, $5, $5, NOW(), $6)
      ON CONFLICT (id) DO UPDATE SET
        sentence = EXCLUDED.sentence,
        text = EXCLUDED.text,
        words = EXCLUDED.words,
        timestamp = EXCLUDED.timestamp,
        notes = COALESCE(EXCLUDED.notes, logs.notes),
        received_at = NOW()
      RETURNING 
        id,
        COALESCE(sentence, text) AS sentence,
        COALESCE(text, sentence) AS text,
        words,
        COALESCE(timestamp, created_at) AS timestamp,
        COALESCE(created_at, timestamp) AS created_at,
        received_at,
        notes;
    `;

    const values = [
      logId,
      sentenceValue,
      sentenceValue,
      wordsValue,
      timeValue,
      notes ?? null
    ];

    const result = await pool.query(query, values);
    return res.status(201).json(formatLogRow(result.rows[0]));
  } catch (err) {
    console.error('Error on POST /api/logs:', err);
    return res.status(500).json({ error: err.message || 'Gagal menyimpan log baru' });
  }
});

// 4. PUT /api/logs/:id - Memperbarui data log tertentu (misal catatan terapis 'notes')
app.put('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sentence, text, words, notes, timestamp } = req.body || {};

    const sentenceValue = sentence ?? text ?? null;
    const wordsValue = typeof words === 'object' && words !== null
      ? JSON.stringify(words)
      : (words ?? null);

    const query = `
      UPDATE logs
      SET
        sentence = COALESCE($1, sentence),
        text = COALESCE($2, text),
        words = COALESCE($3, words),
        notes = COALESCE($4, notes),
        timestamp = COALESCE($5, timestamp),
        received_at = NOW()
      WHERE id = $6
      RETURNING 
        id,
        COALESCE(sentence, text) AS sentence,
        COALESCE(text, sentence) AS text,
        words,
        COALESCE(timestamp, created_at) AS timestamp,
        COALESCE(created_at, timestamp) AS created_at,
        received_at,
        notes;
    `;

    const values = [
      sentenceValue,
      sentenceValue,
      wordsValue,
      notes ?? null,
      timestamp ?? null,
      id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log tidak ditemukan' });
    }

    return res.status(200).json(formatLogRow(result.rows[0]));
  } catch (err) {
    console.error(`Error on PUT /api/logs/${req.params.id}:`, err);
    return res.status(500).json({ error: err.message || 'Gagal memperbarui log' });
  }
});

// 5. DELETE /api/logs/:id - Menghapus log berdasarkan id
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM logs WHERE id = $1;', [id]);
    return res.status(200).json({ message: 'Log berhasil dihapus', id });
  } catch (err) {
    console.error(`Error on DELETE /api/logs/${req.params.id}:`, err);
    return res.status(500).json({ error: err.message || 'Gagal menghapus log' });
  }
});

// 6. POST /api/logs/sync - Sinkronisasi batch log (Idempoten via transaksi)
app.post('/api/logs/sync', async (req, res) => {
  const items = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Body must be a non-empty array of logs' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const query = `
      INSERT INTO logs (id, sentence, text, words, timestamp, created_at, received_at, notes)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      ON CONFLICT (id) DO UPDATE SET
        sentence = COALESCE(EXCLUDED.sentence, logs.sentence),
        text = COALESCE(EXCLUDED.text, logs.text),
        words = COALESCE(EXCLUDED.words, logs.words),
        timestamp = COALESCE(EXCLUDED.timestamp, logs.timestamp),
        notes = COALESCE(EXCLUDED.notes, logs.notes),
        received_at = NOW();
    `;

    for (const item of items) {
      const sentenceText = (item.sentence || item.text || '').trim();
      const wordsValue = typeof item.words === 'object' && item.words !== null
        ? JSON.stringify(item.words)
        : (item.words ?? null);
      const timeValue = item.timestamp || item.created_at || new Date();

      await client.query(query, [
        item.id,
        sentenceText,
        sentenceText,
        wordsValue,
        timeValue,
        timeValue,
        item.notes ?? null
      ]);
    }

    await client.query('COMMIT');
    return res.status(200).json({ success: true, count: items.length });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error rolling back transaction:', rollbackErr);
      }
    }
    console.error('Error on POST /api/logs/sync:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// ==========================================
// RUTE CRUD VOCABULARIES (KOSAKATA)
// ==========================================

// GET /api/vocabularies - Mengambil seluruh data vocabulary
app.get('/api/vocabularies', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vocabularies ORDER BY category ASC, label ASC;'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error on GET /api/vocabularies:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/vocabularies - Menambah atau memperbarui vocabulary (Idempoten)
app.post('/api/vocabularies', async (req, res) => {
  try {
    const { id, label, category, symbol_path, icon_name, note } = req.body || {};

    if (!id || !label) {
      return res.status(400).json({ error: 'id and label are required' });
    }

    const query = `
      INSERT INTO vocabularies (id, label, category, symbol_path, icon_name, note, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        category = EXCLUDED.category,
        symbol_path = EXCLUDED.symbol_path,
        icon_name = EXCLUDED.icon_name,
        note = EXCLUDED.note,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      id,
      label,
      category ?? null,
      symbol_path ?? null,
      icon_name ?? null,
      note ?? null
    ];

    const result = await pool.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error on POST /api/vocabularies:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/vocabularies/:id - Memperbarui vocabulary berdasarkan id
app.put('/api/vocabularies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { label, category, symbol_path, icon_name, note } = req.body || {};

    const query = `
      UPDATE vocabularies
      SET
        label = COALESCE($1, label),
        category = COALESCE($2, category),
        symbol_path = COALESCE($3, symbol_path),
        icon_name = COALESCE($4, icon_name),
        note = COALESCE($5, note),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;

    const values = [
      label ?? null,
      category ?? null,
      symbol_path ?? null,
      icon_name ?? null,
      note ?? null,
      id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Vocabulary with id '${id}' not found` });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error on PUT /api/vocabularies/:id:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vocabularies/:id - Menghapus vocabulary berdasarkan id (Idempoten)
app.delete('/api/vocabularies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM vocabularies WHERE id = $1;', [id]);
    return res.status(200).json({ message: 'Deleted successfully', id });
  } catch (err) {
    console.error('Error on DELETE /api/vocabularies/:id:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Jalankan server jika tidak berada di lingkungan serverless Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server SUARA-KU berjalan pada port ${PORT}`);
  });
}

export default app;
