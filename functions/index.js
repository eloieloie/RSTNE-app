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
        "SELECT * FROM books_tbl ORDER BY dt_added DESC",
    );
    res.json(books);
  } catch (error) {
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
    const {book_name, hebrew_book_name, telugu_book_name, book_description, book_index} = req.body;
    const [result] = await pool.execute(
        "INSERT INTO books_tbl (book_name, hebrew_book_name, telugu_book_name, book_description, book_index) VALUES (?, ?, ?, ?, ?)",
        [book_name, hebrew_book_name || null, telugu_book_name || null, book_description || null, book_index || null],
    );
    res.status(201).json({id: result.insertId, message: "Book created successfully"});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Update book
app.put("/api/books/:id", async (req, res) => {
  try {
    const {book_name, hebrew_book_name, telugu_book_name, book_description, book_index} = req.body;
    await pool.execute(
        "UPDATE books_tbl SET book_name = ?, hebrew_book_name = ?, telugu_book_name = ?, book_description = ?, book_index = ? WHERE book_id = ?",
        [book_name, hebrew_book_name || null, telugu_book_name || null, book_description || null, book_index || null, req.params.id],
    );
    res.json({message: "Book updated successfully"});
  } catch (error) {
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
