import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: 'n1nlmysql41plsk.secureserver.net',
  port: 3306,
  user: 'eloiadmin1',
  password: 'Honor@new2025',
  database: 'ph10653097099_rstnedb'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// ============= BOOKS ENDPOINTS =============

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const [books] = await pool.execute('SELECT * FROM books_tbl ORDER BY dt_added DESC');
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get book by ID
app.get('/api/books/:id', async (req, res) => {
  try {
    const [books] = await pool.execute('SELECT * FROM books_tbl WHERE book_id = ?', [req.params.id]);
    if (books.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(books[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create book
app.post('/api/books', async (req, res) => {
  try {
    const {
      book_name, book_abbr, hebrew_book_abbr, telugu_book_abbr, hebrew_book_name, telugu_book_name,
      book_description, book_header, book_footer, book_link,
      book_index, category_id
    } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO books_tbl (book_name, book_abbr, hebrew_book_abbr, telugu_book_abbr, hebrew_book_name,
       telugu_book_name, book_description, book_header, book_footer, book_link,
       book_index, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        book_name, book_abbr || null, hebrew_book_abbr || null, telugu_book_abbr || null,
        hebrew_book_name || null, telugu_book_name || null,
        book_description || null, book_header || null, book_footer || null, book_link || null,
        book_index || null, category_id || null
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Book created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update book
app.put('/api/books/:id', async (req, res) => {
  try {
    const {
      book_name, book_abbr, hebrew_book_abbr, telugu_book_abbr, hebrew_book_name, telugu_book_name,
      book_description, book_header, book_footer, book_link,
      book_index, category_id
    } = req.body;
    await pool.execute(
      `UPDATE books_tbl SET book_name = ?, book_abbr = ?, hebrew_book_abbr = ?, telugu_book_abbr = ?,
       hebrew_book_name = ?, telugu_book_name = ?, book_description = ?, book_header = ?,
       book_footer = ?, book_link = ?, book_index = ?, category_id = ? WHERE book_id = ?`,
      [
        book_name, book_abbr || null, hebrew_book_abbr || null, telugu_book_abbr || null,
        hebrew_book_name || null, telugu_book_name || null,
        book_description || null, book_header || null, book_footer || null, book_link || null,
        book_index || null, category_id || null, req.params.id
      ]
    );
    res.json({ message: 'Book updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete book
app.delete('/api/books/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM books_tbl WHERE book_id = ?', [req.params.id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= CHAPTERS ENDPOINTS =============

// Get all chapters
app.get('/api/chapters', async (req, res) => {
  try {
    const [chapters] = await pool.execute('SELECT * FROM chapters_tbl ORDER BY dt_modified DESC');
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chapters by book ID
app.get('/api/books/:id/chapters', async (req, res) => {
  try {
    const [chapters] = await pool.execute(
      'SELECT * FROM chapters_tbl WHERE book_id = ? ORDER BY dt_added ASC',
      [req.params.id]
    );
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chapter by ID
app.get('/api/chapters/:id', async (req, res) => {
  try {
    const [chapters] = await pool.execute(
      'SELECT * FROM chapters_tbl WHERE chapter_id = ?',
      [req.params.id]
    );
    if (chapters.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.json(chapters[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create chapter
app.post('/api/chapters', async (req, res) => {
  try {
    const { book_id, chapter_number, chapter_description, chapter_notes } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO chapters_tbl (book_id, chapter_number, chapter_description, chapter_notes) VALUES (?, ?, ?, ?)',
      [book_id, chapter_number, chapter_description || null, chapter_notes || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Chapter created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update chapter
app.put('/api/chapters/:id', async (req, res) => {
  try {
    const { book_id, chapter_number, chapter_description, chapter_notes } = req.body;
    await pool.execute(
      'UPDATE chapters_tbl SET book_id = ?, chapter_number = ?, chapter_description = ?, chapter_notes = ? WHERE chapter_id = ?',
      [book_id, chapter_number, chapter_description || null, chapter_notes || null, req.params.id]
    );
    res.json({ message: 'Chapter updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete chapter
app.delete('/api/chapters/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM chapters_tbl WHERE chapter_id = ?', [req.params.id]);
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TIMELINE EVENTS ENDPOINTS =============

const TIMELINE_SEED = [
  { title: 'Creation, Spring Equinox', description: 'The beginning of creation on Nisan 1, the spring equinox.', am_year: 1, bc_ad_year: 3925, is_bc: 1, month_name: 'Nisan', day_number: 1, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y1 S1 J1 O1', category: 'creation', bible_ref: 'Genesis 1:1' },
  { title: 'Seth Born', description: 'Adam\'s son Seth is born at 130 AM.', am_year: 130, bc_ad_year: 3796, is_bc: 1, month_name: null, day_number: null, is_shemittah: 0, is_jubilee: 0, jubilee_ref: null, category: 'patriarchs', bible_ref: 'Genesis 5:3' },
  { title: 'Enos Born', description: 'Seth\'s son Enos is born at 235 AM.', am_year: 235, bc_ad_year: 3691, is_bc: 1, month_name: null, day_number: null, is_shemittah: 0, is_jubilee: 0, jubilee_ref: null, category: 'patriarchs', bible_ref: 'Genesis 5:6' },
  { title: 'Enos (65) becomes King', description: 'Enos becomes king at age 65, at 300 AM — a Jubilee year.', am_year: 300, bc_ad_year: 3626, is_bc: 1, month_name: null, day_number: null, is_shemittah: 0, is_jubilee: 1, jubilee_ref: 'J6', category: 'kings', bible_ref: null },
  { title: 'Cainan Born', description: 'Enos\'s son Cainan is born at 325 AM.', am_year: 325, bc_ad_year: 3601, is_bc: 1, month_name: null, day_number: null, is_shemittah: 0, is_jubilee: 0, jubilee_ref: null, category: 'patriarchs', bible_ref: 'Genesis 5:9' },
  { title: 'Cainan (40) becomes King', description: 'Cainan becomes king at age 40, at 365 AM.', am_year: 365, bc_ad_year: 3561, is_bc: 1, month_name: null, day_number: null, is_shemittah: 0, is_jubilee: 0, jubilee_ref: null, category: 'kings', bible_ref: null },
  { title: 'Mahalaleel Born', description: 'Cainan\'s son Mahalaleel is born at 395 AM.', am_year: 395, bc_ad_year: 3531, is_bc: 1, month_name: null, day_number: null, is_shemittah: 0, is_jubilee: 0, jubilee_ref: null, category: 'patriarchs', bible_ref: 'Genesis 5:12' },
  { title: 'The Flood', description: 'The great flood begins on Iyar 17, 1656 AM. Genesis 7:11 states the flood was 1,656 years after Creation.', am_year: 1656, bc_ad_year: 2268, is_bc: 1, month_name: 'Iyar', day_number: 17, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y6 S1 J4 O4', category: 'judgment', bible_ref: 'Genesis 7:11' },
  { title: 'Abraham Born', description: 'Abraham is born at 1948 AM on Nisan 1. Genesis 10 traces the genealogy to Abraham.', am_year: 1948, bc_ad_year: 1978, is_bc: 1, month_name: 'Nisan', day_number: 1, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y4 S7 J9 O4', category: 'patriarchs', bible_ref: 'Genesis 11:26' },
  { title: 'Abrahamic Covenant Established', description: 'The covenant with Abraham is established on Nisan 15, 2018 AM.', am_year: 2018, bc_ad_year: 1908, is_bc: 1, month_name: 'Nisan', day_number: 15, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y4 S3 J1 O5', category: 'covenant', bible_ref: 'Galatians 3:16-17' },
  { title: 'The Exodus', description: 'The Exodus from Egypt on Nisan 15, 2448 AM — exactly 430 years after the Abrahamic Covenant.', am_year: 2448, bc_ad_year: 1478, is_bc: 1, month_name: 'Nisan', day_number: 15, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y6 S7 J9 O5', category: 'exodus', bible_ref: 'Exodus 12:40-41' },
  { title: "Solomon's Temple Dedicated", description: "Solomon's Temple is dedicated in Iyar, 2935 AM. 1 Kings 6:1 & 38 give us 430 years from the Exodus.", am_year: 2935, bc_ad_year: 990, is_bc: 1, month_name: 'Iyar', day_number: null, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y- S6 J9 O6', category: 'temple', bible_ref: '1 Kings 6:1' },
  { title: "Solomon's Temple Destroyed", description: "Solomon's Temple is destroyed on Av 9, 3338 AM. The Seder Olam records 403 years from dedication to destruction.", am_year: 3338, bc_ad_year: 587, is_bc: 1, month_name: 'Av', day_number: 9, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y2 S6 J7 O7', category: 'judgment', bible_ref: '2 Kings 25:8-9' },
  { title: 'Messiah Died', description: 'The Messiah dies on Nisan 14, 3957 AM (AD 32). DSS 11Q13 states this was exactly one Shemittah after the end of the ninth Jubilee of their age (the 8th Onah).', am_year: 3957, bc_ad_year: 32, is_bc: 0, month_name: 'Nisan', day_number: 14, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y1 S1 J10 O8', category: 'messiah', bible_ref: 'Matthew 27:50' },
  { title: "Israel's 2nd Birth", description: 'The modern State of Israel is born in Iyar, 5873 AM (1948 AD).', am_year: 5873, bc_ad_year: 1948, is_bc: 0, month_name: 'Iyar', day_number: null, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y1 S4 J8 O12', category: 'israel', bible_ref: 'Isaiah 66:8' },
  { title: 'Israel Takes Temple Mount', description: 'Israel recaptures the Temple Mount in Sivan, 5892 AM (1967 AD).', am_year: 5892, bc_ad_year: 1967, is_bc: 0, month_name: 'Sivan', day_number: null, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y7 S6 J8 O12', category: 'israel', bible_ref: null },
  { title: 'Year 6000', description: 'The 6000th year AM — Nisan 1, 2075 AD. The end of the 6,000 years of human history before the Kingdom Age.', am_year: 6000, bc_ad_year: 2075, is_bc: 0, month_name: 'Nisan', day_number: 1, is_shemittah: 0, is_jubilee: 1, jubilee_ref: 'J10 O12', category: 'prophecy', bible_ref: null },
  { title: 'First Kingdom Year', description: 'The first year of the Messianic Kingdom — Nisan 1, 6001 AM (2076 AD).', am_year: 6001, bc_ad_year: 2076, is_bc: 0, month_name: 'Nisan', day_number: 1, is_shemittah: 0, is_jubilee: 0, jubilee_ref: 'Y1 S1 J1 O13', category: 'prophecy', bible_ref: null },
];

async function initTimelineTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS timeline_events_tbl (
      event_id     INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(255) NOT NULL,
      description  TEXT         NULL,
      am_year      INT          NOT NULL,
      bc_ad_year   INT          NULL,
      is_bc        TINYINT(1)   NOT NULL DEFAULT 1,
      month_name   VARCHAR(50)  NULL,
      day_number   INT          NULL,
      is_shemittah TINYINT(1)   NOT NULL DEFAULT 0,
      is_jubilee   TINYINT(1)   NOT NULL DEFAULT 0,
      jubilee_ref  VARCHAR(50)  NULL,
      category     VARCHAR(100) NULL,
      bible_ref    VARCHAR(255) NULL,
      sort_order   INT          NULL,
      dt_added     DATETIME     DEFAULT CURRENT_TIMESTAMP,
      dt_modified  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM timeline_events_tbl');
  if (rows[0].count === 0) {
    for (const ev of TIMELINE_SEED) {
      await pool.execute(
        `INSERT INTO timeline_events_tbl
         (title, description, am_year, bc_ad_year, is_bc, month_name, day_number,
          is_shemittah, is_jubilee, jubilee_ref, category, bible_ref)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ev.title, ev.description, ev.am_year, ev.bc_ad_year, ev.is_bc, ev.month_name,
         ev.day_number, ev.is_shemittah, ev.is_jubilee, ev.jubilee_ref, ev.category, ev.bible_ref]
      );
    }
    console.log(`Seeded ${TIMELINE_SEED.length} timeline events`);
  }
}

// Get all timeline events
app.get('/api/timeline-events', async (req, res) => {
  try {
    const [events] = await pool.execute(
      'SELECT * FROM timeline_events_tbl ORDER BY am_year ASC, sort_order ASC'
    );
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get timeline event by ID
app.get('/api/timeline-events/:id', async (req, res) => {
  try {
    const [events] = await pool.execute(
      'SELECT * FROM timeline_events_tbl WHERE event_id = ?', [req.params.id]
    );
    if (events.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(events[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create timeline event
app.post('/api/timeline-events', async (req, res) => {
  try {
    const { title, description, am_year, bc_ad_year, is_bc, month_name, day_number,
            is_shemittah, is_jubilee, jubilee_ref, category, bible_ref, sort_order } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO timeline_events_tbl
       (title, description, am_year, bc_ad_year, is_bc, month_name, day_number,
        is_shemittah, is_jubilee, jubilee_ref, category, bible_ref, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, am_year, bc_ad_year ?? null, is_bc ?? 1,
       month_name || null, day_number ?? null, is_shemittah ?? 0, is_jubilee ?? 0,
       jubilee_ref || null, category || null, bible_ref || null, sort_order ?? null]
    );
    res.status(201).json({ id: result.insertId, message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update timeline event
app.put('/api/timeline-events/:id', async (req, res) => {
  try {
    const { title, description, am_year, bc_ad_year, is_bc, month_name, day_number,
            is_shemittah, is_jubilee, jubilee_ref, category, bible_ref, sort_order } = req.body;
    await pool.execute(
      `UPDATE timeline_events_tbl SET
       title = ?, description = ?, am_year = ?, bc_ad_year = ?, is_bc = ?,
       month_name = ?, day_number = ?, is_shemittah = ?, is_jubilee = ?,
       jubilee_ref = ?, category = ?, bible_ref = ?, sort_order = ?
       WHERE event_id = ?`,
      [title, description || null, am_year, bc_ad_year ?? null, is_bc ?? 1,
       month_name || null, day_number ?? null, is_shemittah ?? 0, is_jubilee ?? 0,
       jubilee_ref || null, category || null, bible_ref || null, sort_order ?? null, req.params.id]
    );
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete timeline event
app.delete('/api/timeline-events/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM timeline_events_tbl WHERE event_id = ?', [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= STATS ENDPOINT =============

app.get('/api/stats', async (req, res) => {
  try {
    const [bookCount] = await pool.execute('SELECT COUNT(*) as count FROM books_tbl');
    const [chapterCount] = await pool.execute('SELECT COUNT(*) as count FROM chapters_tbl');
    
    res.json({
      totalBooks: bookCount[0].count,
      totalChapters: chapterCount[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  await initTimelineTable().catch(err => console.error('Timeline table init failed:', err));
});
