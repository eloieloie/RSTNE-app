const {onRequest} = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

// Middleware
app.use(cors({origin: true}));
app.use(express.json());

// Database configuration
const dbConfig = {
  host: "n1nlmysql41plsk.secureserver.net",
  port: 3306,
  user: "eloiadmin1",
  password: "Honor@new2025",
  database: "ph10653097099_rstnedb",
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// ============= BOOKS ENDPOINTS =============

// Get all books
app.get("/api/books", async (req, res) => {
  try {
    const [books] = await pool.execute(
        `SELECT 
           b.book_id,
           b.book_name,
           b.book_abbr,
           b.hebrew_book_name,
           b.telugu_book_name,
           b.book_description,
           b.book_header,
           b.book_footer,
           b.book_index,
           b.category_id,
           b.dt_added,
           COUNT(c.chapter_id) as chapter_count 
         FROM books_tbl b
         LEFT JOIN chapters_tbl c ON b.book_id = c.book_id
         GROUP BY b.book_id, b.book_name, b.book_abbr, b.hebrew_book_name, 
                  b.telugu_book_name, b.book_description, b.book_header, 
                  b.book_footer, b.book_index, b.category_id, b.dt_added
         ORDER BY b.book_index, b.dt_added DESC`,
    );
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({error: error.message});
  }
});

// Get book by ID
app.get("/api/books/:id", async (req, res) => {
  try {
    const [books] = await pool.execute(
        "SELECT * FROM books_tbl WHERE book_id = ?",
        [req.params.id],
    );
    if (books.length === 0) {
      return res.status(404).json({error: "Book not found"});
    }
    res.json(books[0]);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Create book
app.post("/api/books", async (req, res) => {
  try {
    const {
      book_name,
      book_abbr,
      hebrew_book_name,
      telugu_book_name,
      book_description,
      book_header,
      book_footer,
      book_index,
      category_id,
    } = req.body;

    const [result] = await pool.execute(
        `INSERT INTO books_tbl (book_name, book_abbr, hebrew_book_name, 
         telugu_book_name, book_description, book_header, book_footer, book_index, category_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          book_name,
          book_abbr || null,
          hebrew_book_name || null,
          telugu_book_name || null,
          book_description || null,
          book_header || null,
          book_footer || null,
          book_index || null,
          category_id || null,
        ],
    );
    res.status(201).json({id: result.insertId, message: "Book created successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Update book
app.put("/api/books/:id", async (req, res) => {
  try {
    console.log("=== Backend: Update Book ===");
    console.log("Book ID:", req.params.id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      book_name,
      book_abbr,
      hebrew_book_name,
      telugu_book_name,
      book_description,
      book_header,
      book_footer,
      book_index,
      category_id,
    } = req.body;

    await pool.execute(
        `UPDATE books_tbl SET book_name = ?, book_abbr = ?, hebrew_book_name = ?, 
         telugu_book_name = ?, book_description = ?, book_header = ?, book_footer = ?, 
         book_index = ?, category_id = ? WHERE book_id = ?`,
        [
          book_name,
          book_abbr || null,
          hebrew_book_name || null,
          telugu_book_name || null,
          book_description || null,
          book_header || null,
          book_footer || null,
          book_index || null,
          category_id || null,
          req.params.id,
        ],
    );

    console.log("✅ Backend: Book updated successfully");
    res.json({message: "Book updated successfully"});
  } catch (error) {
    console.error("❌ Backend: Update failed:", error);
    res.status(500).json({error: error.message});
  }
});

// Delete book
app.delete("/api/books/:id", async (req, res) => {
  try {
    await pool.execute("DELETE FROM books_tbl WHERE book_id = ?", [req.params.id]);
    res.json({message: "Book deleted successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// ============= BOOK CATEGORIES ENDPOINTS =============

// Get all book categories
app.get("/api/book-categories", async (req, res) => {
  try {
    const [categories] = await pool.execute(
        "SELECT * FROM book_categories_tbl ORDER BY category_order ASC",
    );
    res.json(categories);
  } catch (error) {
    console.error("Error fetching book categories:", error);
    res.status(500).json({error: error.message});
  }
});

// ============= CHAPTERS ENDPOINTS =============

// Get all chapters
app.get("/api/chapters", async (req, res) => {
  try {
    const [chapters] = await pool.execute(
        "SELECT * FROM chapters_tbl ORDER BY dt_modified DESC",
    );
    res.json(chapters);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Get chapters by book ID
app.get("/api/books/:id/chapters", async (req, res) => {
  try {
    const [chapters] = await pool.execute(
        "SELECT * FROM chapters_tbl WHERE book_id = ? ORDER BY dt_added ASC",
        [req.params.id],
    );
    res.json(chapters);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Get chapter by ID
app.get("/api/chapters/:id", async (req, res) => {
  try {
    const [chapters] = await pool.execute(
        "SELECT * FROM chapters_tbl WHERE chapter_id = ?",
        [req.params.id],
    );
    if (chapters.length === 0) {
      return res.status(404).json({error: "Chapter not found"});
    }
    res.json(chapters[0]);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Create chapter
app.post("/api/chapters", async (req, res) => {
  try {
    const {book_id, chapter_number, chapter_description, chapter_notes} = req.body;
    const [result] = await pool.execute(
        "INSERT INTO chapters_tbl (book_id, chapter_number, chapter_description, chapter_notes) VALUES (?, ?, ?, ?)",
        [book_id, chapter_number, chapter_description || null, chapter_notes || null],
    );
    res.status(201).json({id: result.insertId, message: "Chapter created successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Update chapter
app.put("/api/chapters/:id", async (req, res) => {
  try {
    const {book_id, chapter_number, chapter_description, chapter_notes} = req.body;
    await pool.execute(
        "UPDATE chapters_tbl SET book_id = ?, chapter_number = ?, chapter_description = ?, chapter_notes = ? WHERE chapter_id = ?",
        [book_id, chapter_number, chapter_description || null, chapter_notes || null, req.params.id],
    );
    res.json({message: "Chapter updated successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Delete chapter
app.delete("/api/chapters/:id", async (req, res) => {
  try {
    await pool.execute("DELETE FROM chapters_tbl WHERE chapter_id = ?", [req.params.id]);
    res.json({message: "Chapter deleted successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// ============= VERSES ENDPOINTS =============

// Search verses for linking (MUST be before /api/verses/:id)
app.get("/api/verses/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({error: "Search query required"});
    }

    // Check if query is a verse reference pattern (e.g., #bare1:1)
    const verseRefPattern = /^#([a-z]+)(\d+):(\d+)$/i;
    const match = query.match(verseRefPattern);

    if (match) {
      // Search for verses containing this reference pattern
      const searchPattern = `%${query}%`;

      const sql = `SELECT DISTINCT v.verse_id, v.chapter_id, v.verse_index,
           v.verse, v.telugu_verse,
           c.chapter_number, c.chapter_id,
           b.book_name, b.book_id
           FROM verses_tbl v
           INNER JOIN chapters_tbl c ON v.chapter_id = c.chapter_id
           INNER JOIN books_tbl b ON c.book_id = b.book_id
           LEFT JOIN verse_notes_tbl vn ON v.verse_id = vn.verse_id
           LEFT JOIN notes_tbl n ON vn.note_id = n.note_id
           WHERE v.verse LIKE ? OR v.telugu_verse LIKE ? OR n.note_content LIKE ?
           ORDER BY b.book_id, CAST(c.chapter_number AS UNSIGNED), v.verse_index
           LIMIT 100`;

      const [verses] = await pool.execute(sql, [searchPattern, searchPattern, searchPattern]);
      res.json(verses);
    } else {
      // Original search by book name and chapter
      const parts = query.trim().split(/\s+/);
      const bookPattern = parts[0];
      const chapterNum = parts[1] ? parts[1] : null;

      let sql = `SELECT v.verse_id, v.chapter_id, v.verse_index,
           SUBSTRING(v.verse, 1, 100) as verse,
           c.chapter_number, b.book_name, b.book_index
           FROM verses_tbl v
           INNER JOIN chapters_tbl c ON v.chapter_id = c.chapter_id
           INNER JOIN books_tbl b ON c.book_id = b.book_id
           WHERE b.book_name LIKE ?`;

      const params = [`${bookPattern}%`];

      // If chapter number is provided, filter by it
      if (chapterNum && !isNaN(chapterNum)) {
        sql += ` AND c.chapter_number = ?`;
        params.push(chapterNum);
      }

      sql += ` ORDER BY b.book_index, CAST(c.chapter_number AS UNSIGNED),
           v.verse_index LIMIT 50`;

      const [verses] = await pool.execute(sql, params);
      res.json(verses);
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Full-text verse search (for search feature)
app.get("/api/verses/text-search", async (req, res) => {
  console.log("========== TEXT SEARCH ENDPOINT CALLED ==========");
  console.log("Query params:", req.query);

  try {
    const {q} = req.query;

    console.log("Search query 'q':", q);

    if (!q || typeof q !== "string") {
      console.log("ERROR: Search query is missing or invalid");
      return res.status(400).json({error: "Search query is required"});
    }

    // Build the LIKE pattern: "not My people" -> "%not My people%"
    const pattern = "%" + q.trim() + "%";

    console.log("Searching for query:", q);
    console.log("LIKE pattern:", pattern);

    const [results] = await pool.execute(
        `SELECT DISTINCT
           v.verse_id,
           v.chapter_id,
           v.verse_index,
           v.verse,
           v.telugu_verse,
           c.chapter_number,
           c.book_id,
           b.book_name,
           b.book_index,
           n.note_content
         FROM verses_tbl v
         JOIN chapters_tbl c ON v.chapter_id = c.chapter_id
         JOIN books_tbl b ON c.book_id = b.book_id
         LEFT JOIN verse_notes_tbl vn ON v.verse_id = vn.verse_id
         LEFT JOIN notes_tbl n ON vn.note_id = n.note_id
         WHERE LOWER(v.verse) LIKE LOWER(?)
            OR LOWER(v.telugu_verse) LIKE LOWER(?)
            OR LOWER(n.note_content) LIKE LOWER(?)
         ORDER BY b.book_index, c.chapter_number, v.verse_index
         LIMIT 500`,
        [pattern, pattern, pattern],
    );

    console.log(`Found ${results.length} verses`);

    res.json({
      results: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({error: error.message});
  }
});

// Get verses by chapter ID
app.get("/api/chapters/:id/verses", async (req, res) => {
  try {
    // Get all verses for the chapter
    const [verses] = await pool.execute(
        "SELECT * FROM verses_tbl WHERE chapter_id = ? ORDER BY verse_index ASC",
        [req.params.id],
    );

    // Get all linked verses for this chapter in one query
    const [links] = await pool.execute(
        `SELECT 
          vl.link_id,
          vl.source_verse_id,
          vl.target_verse_id,
          tv.verse_index as target_verse_index,
          tc.chapter_number as target_chapter_number,
          tb.book_name as target_book_name,
          tb.book_id as target_book_id,
          tc.chapter_id as target_chapter_id
        FROM verse_links_tbl vl
        INNER JOIN verses_tbl tv ON vl.target_verse_id = tv.verse_id
        INNER JOIN chapters_tbl tc ON tv.chapter_id = tc.chapter_id
        INNER JOIN books_tbl tb ON tc.book_id = tb.book_id
        WHERE vl.source_verse_id IN (
          SELECT verse_id FROM verses_tbl WHERE chapter_id = ?
        )
        UNION
        SELECT 
          vl.link_id,
          vl.target_verse_id as source_verse_id,
          vl.source_verse_id as target_verse_id,
          sv.verse_index as target_verse_index,
          sc.chapter_number as target_chapter_number,
          sb.book_name as target_book_name,
          sb.book_id as target_book_id,
          sc.chapter_id as target_chapter_id
        FROM verse_links_tbl vl
        INNER JOIN verses_tbl sv ON vl.source_verse_id = sv.verse_id
        INNER JOIN chapters_tbl sc ON sv.chapter_id = sc.chapter_id
        INNER JOIN books_tbl sb ON sc.book_id = sb.book_id
        WHERE vl.target_verse_id IN (
          SELECT verse_id FROM verses_tbl WHERE chapter_id = ?
        )`,
        [req.params.id, req.params.id],
    );

    // Get all notes for verses in this chapter
    const [notes] = await pool.execute(
        `SELECT vn.verse_note_id, vn.verse_id, n.note_id, n.note_title, n.note_content, n.dt_modified
        FROM verse_notes_tbl vn
        INNER JOIN notes_tbl n ON vn.note_id = n.note_id
        WHERE vn.verse_id IN (
          SELECT verse_id FROM verses_tbl WHERE chapter_id = ?
        )
        ORDER BY n.dt_modified DESC`,
        [req.params.id],
    );

    // Group links and notes by source verse
    const versesWithData = verses.map((verse) => ({
      ...verse,
      links: links.filter((link) => link.source_verse_id === verse.verse_id),
      notes: notes.filter((note) => note.verse_id === verse.verse_id),
    }));

    res.json(versesWithData);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Search for text in verses (for find & replace) - MUST be before /api/verses/:id
app.get("/api/verses/search-text", async (req, res) => {
  try {
    const {searchWord, searchInEnglish, searchInTelugu, caseSensitive} = req.query;

    if (!searchWord) {
      return res.status(400).json({error: "Search word is required"});
    }

    const results = [];
    const searchInEng = searchInEnglish === "true";
    const searchInTel = searchInTelugu === "true";
    const isCaseSensitive = caseSensitive === "true";

    // Build SQL query based on options
    const whereConditions = [];
    if (searchInEng) {
      if (isCaseSensitive) {
        whereConditions.push("BINARY v.verse LIKE ?");
      } else {
        whereConditions.push("v.verse LIKE ?");
      }
    }
    if (searchInTel) {
      if (isCaseSensitive) {
        whereConditions.push("BINARY v.telugu_verse LIKE ?");
      } else {
        whereConditions.push("v.telugu_verse LIKE ?");
      }
    }

    if (whereConditions.length === 0) {
      return res.json([]);
    }

    const searchPattern = `%${searchWord}%`;
    const params = [];
    const fieldsToCheck = [];

    if (searchInEng) {
      params.push(searchPattern);
      fieldsToCheck.push("verse");
    }
    if (searchInTel) {
      params.push(searchPattern);
      fieldsToCheck.push("telugu_verse");
    }

    const query = `
      SELECT v.verse_id, v.verse, v.telugu_verse, v.verse_index,
             c.chapter_number, b.book_name
      FROM verses_tbl v
      INNER JOIN chapters_tbl c ON v.chapter_id = c.chapter_id
      INNER JOIN books_tbl b ON c.book_id = b.book_id
      WHERE ${whereConditions.join(" OR ")}
      ORDER BY b.book_index, CAST(c.chapter_number AS UNSIGNED), v.verse_index
    `;

    const [verses] = await pool.execute(query, params);

    // Separate results by field (verse or telugu_verse)
    verses.forEach((verse) => {
      if (searchInEng && verse.verse) {
        const matches = isCaseSensitive ?
          verse.verse.includes(searchWord) :
          verse.verse.toLowerCase().includes(searchWord.toLowerCase());

        if (matches) {
          results.push({
            verse_id: verse.verse_id,
            book_name: verse.book_name,
            chapter_number: verse.chapter_number,
            verse_index: verse.verse_index,
            content: verse.verse,
            field: "verse",
          });
        }
      }

      if (searchInTel && verse.telugu_verse) {
        const matches = isCaseSensitive ?
          verse.telugu_verse.includes(searchWord) :
          verse.telugu_verse.toLowerCase().includes(searchWord.toLowerCase());

        if (matches) {
          results.push({
            verse_id: verse.verse_id,
            book_name: verse.book_name,
            chapter_number: verse.chapter_number,
            verse_index: verse.verse_index,
            content: verse.telugu_verse,
            field: "telugu_verse",
          });
        }
      }
    });

    res.json(results);
  } catch (error) {
    console.error("Error searching verses:", error);
    res.status(500).json({error: error.message});
  }
});

// Replace text in verses - MUST be before /api/verses/:id
app.post("/api/verses/replace-text", async (req, res) => {
  try {
    const {searchWord, replaceWord, verseIds, caseSensitive} = req.body;

    if (!searchWord || !replaceWord || !verseIds || !Array.isArray(verseIds)) {
      return res.status(400).json({error: "Invalid request data"});
    }

    let replacedCount = 0;

    for (const item of verseIds) {
      const {verse_id, field} = item;

      // Get current verse content
      const [verses] = await pool.execute(
          `SELECT ${field} FROM verses_tbl WHERE verse_id = ?`,
          [verse_id],
      );

      if (verses.length === 0) continue;

      const currentContent = verses[0][field];
      if (!currentContent) continue;

      // Perform replacement
      let newContent;
      if (caseSensitive) {
        newContent = currentContent.split(searchWord).join(replaceWord);
      } else {
        const regex = new RegExp(searchWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        newContent = currentContent.replace(regex, replaceWord);
      }

      // Update verse if content changed
      if (newContent !== currentContent) {
        await pool.execute(
            `UPDATE verses_tbl SET ${field} = ? WHERE verse_id = ?`,
            [newContent, verse_id],
        );
        replacedCount++;
      }
    }

    res.json({
      success: true,
      replacedCount,
    });
  } catch (error) {
    console.error("Error replacing text:", error);
    res.status(500).json({error: error.message});
  }
});

// Get verse by ID
app.get("/api/verses/:id", async (req, res) => {
  try {
    const [verses] = await pool.execute(
        "SELECT * FROM verses_tbl WHERE verse_id = ?",
        [req.params.id],
    );
    if (verses.length === 0) {
      return res.status(404).json({error: "Verse not found"});
    }
    res.json(verses[0]);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Create verse
app.post("/api/verses", async (req, res) => {
  try {
    const {chapter_id, verse_index, verse, telugu_verse} = req.body;
    const [result] = await pool.execute(
        "INSERT INTO verses_tbl (chapter_id, verse_index, verse, telugu_verse) VALUES (?, ?, ?, ?)",
        [chapter_id, verse_index || null, verse, telugu_verse || null],
    );
    res.status(201).json({id: result.insertId, message: "Verse created successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Update verse
app.put("/api/verses/:id", async (req, res) => {
  try {
    const {verse_index, verse, telugu_verse} = req.body;
    await pool.execute(
        "UPDATE verses_tbl SET verse_index = ?, verse = ?, telugu_verse = ? WHERE verse_id = ?",
        [verse_index || null, verse, telugu_verse || null, req.params.id],
    );
    res.json({message: "Verse updated successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Delete verse
app.delete("/api/verses/:id", async (req, res) => {
  try {
    await pool.execute("DELETE FROM verses_tbl WHERE verse_id = ?", [req.params.id]);
    res.json({message: "Verse deleted successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// ============= NOTES ENDPOINTS =============

// Get all notes
app.get("/api/notes", async (req, res) => {
  try {
    const [notes] = await pool.execute(
        "SELECT * FROM notes_tbl ORDER BY dt_modified DESC",
    );
    res.json(notes);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Get note by ID
app.get("/api/notes/:id", async (req, res) => {
  try {
    const [notes] = await pool.execute(
        "SELECT * FROM notes_tbl WHERE note_id = ?",
        [req.params.id],
    );
    if (notes.length === 0) {
      return res.status(404).json({error: "Note not found"});
    }
    res.json(notes[0]);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Create new note
app.post("/api/notes", async (req, res) => {
  try {
    const {note_title, note_content} = req.body;
    const [result] = await pool.execute(
        "INSERT INTO notes_tbl (note_title, note_content) VALUES (?, ?)",
        [note_title || null, note_content],
    );
    res.status(201).json({note_id: result.insertId});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Update note
app.put("/api/notes/:id", async (req, res) => {
  try {
    const {note_title, note_content} = req.body;
    const updates = [];
    const values = [];

    if (note_title !== undefined) {
      updates.push("note_title = ?");
      values.push(note_title);
    }
    if (note_content !== undefined) {
      updates.push("note_content = ?");
      values.push(note_content);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: "No fields to update"});
    }

    values.push(req.params.id);
    await pool.execute(
        `UPDATE notes_tbl SET ${updates.join(", ")} WHERE note_id = ?`,
        values,
    );
    res.json({message: "Note updated successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Delete note
app.delete("/api/notes/:id", async (req, res) => {
  try {
    await pool.execute("DELETE FROM notes_tbl WHERE note_id = ?", [req.params.id]);
    res.json({message: "Note deleted successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Get verses linked to a note
app.get("/api/notes/:id/verses", async (req, res) => {
  try {
    const [verses] = await pool.execute(
        "SELECT verse_id FROM verse_notes_tbl WHERE note_id = ?",
        [req.params.id],
    );
    res.json(verses.map((v) => v.verse_id));
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// ============= VERSE NOTES ENDPOINTS =============

// Get notes for a verse
app.get("/api/verses/:id/notes", async (req, res) => {
  try {
    const [notes] = await pool.execute(
        `SELECT vn.verse_note_id, n.* FROM notes_tbl n
         INNER JOIN verse_notes_tbl vn ON n.note_id = vn.note_id
         WHERE vn.verse_id = ?
         ORDER BY n.dt_modified DESC`,
        [req.params.id],
    );
    res.json(notes);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Link note to verse
app.post("/api/verse-notes", async (req, res) => {
  try {
    const {verse_id, note_id} = req.body;
    const [result] = await pool.execute(
        "INSERT INTO verse_notes_tbl (verse_id, note_id) VALUES (?, ?)",
        [verse_id, note_id],
    );
    res.status(201).json({verse_note_id: result.insertId});
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({error: "Note already linked to this verse"});
    }
    res.status(500).json({error: error.message});
  }
});

// Unlink note from verse
app.delete("/api/verse-notes/:id", async (req, res) => {
  try {
    await pool.execute(
        "DELETE FROM verse_notes_tbl WHERE verse_note_id = ?",
        [req.params.id],
    );
    res.json({message: "Note unlinked from verse successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// ============= VERSE LINKS ENDPOINTS =============

// Get linked verses (source and target)
app.get("/api/verses/:id/links", async (req, res) => {
  try {
    const [sourceLinks] = await pool.execute(
        "SELECT target_verse_id FROM verse_links_tbl WHERE source_verse_id = ?",
        [req.params.id],
    );
    const [targetLinks] = await pool.execute(
        "SELECT source_verse_id FROM verse_links_tbl WHERE target_verse_id = ?",
        [req.params.id],
    );
    res.json({
      source: sourceLinks.map((l) => l.target_verse_id),
      target: targetLinks.map((l) => l.source_verse_id),
    });
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Get link details
app.get("/api/verse-links/:id", async (req, res) => {
  try {
    const [links] = await pool.execute(
        "SELECT * FROM verse_links_tbl WHERE link_id = ?",
        [req.params.id],
    );
    if (links.length === 0) {
      return res.status(404).json({error: "Link not found"});
    }
    res.json(links[0]);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Create verse link
app.post("/api/verse-links", async (req, res) => {
  try {
    const {source_verse_id, target_verse_id, link_type, link_description} = req.body;
    const [result] = await pool.execute(
        `INSERT INTO verse_links_tbl 
         (source_verse_id, target_verse_id, link_type, link_description) 
         VALUES (?, ?, ?, ?)`,
        [source_verse_id, target_verse_id, link_type || null, link_description || null],
    );
    res.status(201).json({link_id: result.insertId});
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({error: "Link already exists"});
    }
    res.status(500).json({error: error.message});
  }
});

// Delete verse link
app.delete("/api/verse-links/:id", async (req, res) => {
  try {
    await pool.execute(
        "DELETE FROM verse_links_tbl WHERE link_id = ?",
        [req.params.id],
    );
    res.json({message: "Link deleted successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// ============= TAGS ENDPOINTS =============

// Get all tags
app.get("/api/tags", async (req, res) => {
  try {
    const [tags] = await pool.execute(
        "SELECT * FROM tags_tbl ORDER BY tag_name",
    );
    res.json(tags);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Get tag by ID
app.get("/api/tags/:id", async (req, res) => {
  try {
    const [tags] = await pool.execute(
        "SELECT * FROM tags_tbl WHERE tag_id = ?",
        [req.params.id],
    );
    if (tags.length === 0) {
      return res.status(404).json({error: "Tag not found"});
    }
    res.json(tags[0]);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Create tag
app.post("/api/tags", async (req, res) => {
  try {
    const {tag_name, tag_description} = req.body;
    const [result] = await pool.execute(
        "INSERT INTO tags_tbl (tag_name, tag_description) VALUES (?, ?)",
        [tag_name, tag_description || null],
    );
    res.status(201).json({tag_id: result.insertId});
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({error: "Tag name already exists"});
    }
    res.status(500).json({error: error.message});
  }
});

// Update tag
app.put("/api/tags/:id", async (req, res) => {
  try {
    const {tag_name, tag_description} = req.body;
    const updates = [];
    const values = [];

    if (tag_name !== undefined) {
      updates.push("tag_name = ?");
      values.push(tag_name);
    }
    if (tag_description !== undefined) {
      updates.push("tag_description = ?");
      values.push(tag_description);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: "No fields to update"});
    }

    values.push(req.params.id);
    await pool.execute(
        `UPDATE tags_tbl SET ${updates.join(", ")} WHERE tag_id = ?`,
        values,
    );
    res.json({message: "Tag updated successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Delete tag
app.delete("/api/tags/:id", async (req, res) => {
  try {
    await pool.execute("DELETE FROM tags_tbl WHERE tag_id = ?", [req.params.id]);
    res.json({message: "Tag deleted successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Get verses for a tag
app.get("/api/tags/:id/verses", async (req, res) => {
  try {
    const [verses] = await pool.execute(
        "SELECT verse_id FROM verse_tags_tbl WHERE tag_id = ?",
        [req.params.id],
    );
    res.json(verses.map((v) => v.verse_id));
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// ============= VERSE TAGS ENDPOINTS =============

// Get tags for a verse
app.get("/api/verses/:id/tags", async (req, res) => {
  try {
    const [tags] = await pool.execute(
        `SELECT t.* FROM tags_tbl t
         INNER JOIN verse_tags_tbl vt ON t.tag_id = vt.tag_id
         WHERE vt.verse_id = ?
         ORDER BY t.tag_name`,
        [req.params.id],
    );
    res.json(tags);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Link tag to verse
app.post("/api/verse-tags", async (req, res) => {
  try {
    const {verse_id, tag_id} = req.body;
    const [result] = await pool.execute(
        "INSERT INTO verse_tags_tbl (verse_id, tag_id) VALUES (?, ?)",
        [verse_id, tag_id],
    );
    res.status(201).json({verse_tag_id: result.insertId});
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({error: "Tag already linked to this verse"});
    }
    res.status(500).json({error: error.message});
  }
});

// Unlink tag from verse
app.delete("/api/verse-tags/:id", async (req, res) => {
  try {
    await pool.execute(
        "DELETE FROM verse_tags_tbl WHERE verse_tag_id = ?",
        [req.params.id],
    );
    res.json({message: "Tag unlinked from verse successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// ============= CROSS-REFERENCES ENDPOINTS =============

// Get cross-references for a verse by book ID, chapter, and verse
app.get("/api/cross-references", async (req, res) => {
  try {
    const {bookId, chapter, verse} = req.query;

    if (!bookId || !chapter || !verse) {
      return res.status(400).json({error: "bookId, chapter, and verse parameters are required"});
    }

    // Query for cross-references matching the from verse
    const [crossRefs] = await pool.execute(
        `SELECT 
          cr.cross_ref_id,
          cr.from_book_name,
          cr.from_chapter,
          cr.from_verse,
          cr.to_book_name,
          cr.to_chapter,
          cr.to_verse,
          cr.votes,
          frb.book_abbr as from_book_abbr,
          frb.book_id as from_book_id,
          tob.book_abbr as to_book_abbr,
          tob.book_id as to_book_id
        FROM cross_references_tbl cr
        LEFT JOIN books_tbl frb ON frb.book_id = cr.from_book_id
        LEFT JOIN books_tbl tob ON tob.book_id = cr.to_book_id
        WHERE cr.from_book_id = ? 
          AND cr.from_chapter = ? 
          AND cr.from_verse = ?
        ORDER BY cr.votes DESC`,
        [bookId, chapter, verse],
    );

    res.json(crossRefs);
  } catch (error) {
    console.error("Error fetching cross-references:", error);
    res.status(500).json({error: error.message});
  }
});

// ============= STATS ENDPOINT =============

app.get("/api/stats", async (req, res) => {
  try {
    const [bookCount] = await pool.execute("SELECT COUNT(*) as count FROM books_tbl");
    const [chapterCount] = await pool.execute("SELECT COUNT(*) as count FROM chapters_tbl");

    res.json({
      totalBooks: bookCount[0].count,
      totalChapters: chapterCount[0].count,
    });
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Export the Express app as a Cloud Function
exports.api = onRequest(app);
