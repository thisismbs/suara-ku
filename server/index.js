import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 5000;

// Konfigurasi Database Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// ==========================================
// RUTE / ENDPOINTS
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

// GET /api/logs - Mengambil data log terbaru (Maksimal 100 baris)
app.get('/api/logs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM logs ORDER BY created_at DESC LIMIT 100;'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error on GET /api/logs:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/logs/sync - Sinkronisasi batch log (Idempoten via transaksi)
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
      INSERT INTO logs (id, text, words, created_at, received_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    for (const item of items) {
      const wordsValue = typeof item.words === 'object' && item.words !== null
        ? JSON.stringify(item.words)
        : (item.words ?? null);

      await client.query(query, [
        item.id,
        item.text ?? null,
        wordsValue,
        item.created_at || new Date()
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

// Inisialisasi Server
app.listen(PORT, () => {
  console.log(`Server SUARA-KU berjalan pada port ${PORT}`);
});
