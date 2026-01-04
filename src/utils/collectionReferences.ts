// Table Names
export const TABLES = {
  BOOKS: 'books_tbl',
  CHAPTERS: 'chapters_tbl',
  VERSES: 'verses_tbl',
} as const;

// Type Definitions
export interface Book {
  book_id: number;
  book_name: string;
  hebrew_book_name: string | null;
  telugu_book_name: string | null;
  book_description: string | null;
  book_index: number | null;
  dt_added: Date;
}

export interface BookInsert {
  book_name: string;
  hebrew_book_name?: string;
  telugu_book_name?: string;
  book_description?: string;
  book_index?: number;
}

export interface BookUpdate {
  book_name?: string;
  hebrew_book_name?: string;
  telugu_book_name?: string;
  book_description?: string;
  book_index?: number;
}

export interface Chapter {
  chapter_id: number;
  book_id: number;
  chapter_number: string;
  chapter_description: string | null;
  chapter_notes: string | null;
  dt_added: Date;
  dt_modified: Date;
}

export interface ChapterInsert {
  book_id: number;
  chapter_number: string;
  chapter_description?: string;
  chapter_notes?: string;
}

export interface ChapterUpdate {
  chapter_number?: string;
  chapter_description?: string;
  chapter_notes?: string;
}

export interface Verse {
  verse_id: number;
  chapter_id: number;
  verse_index: number | null;
  verse: string;
  telugu_verse: string | null;
  dt_added: Date;
  dt_modified: Date;
}

export interface VerseInsert {
  chapter_id: number;
  verse_index?: number;
  verse: string;
  telugu_verse?: string;
}

export interface VerseUpdate {
  verse_index?: number;
  verse?: string;
  telugu_verse?: string;
}

// Column Names
export const BOOK_COLUMNS = {
  ID: 'book_id',
  NAME: 'book_name',
  HEBREW_NAME: 'hebrew_book_name',
  TELUGU_NAME: 'telugu_book_name',
  DESCRIPTION: 'book_description',
  INDEX: 'book_index',
  DATE_ADDED: 'dt_added',
} as const;

export const CHAPTER_COLUMNS = {
  ID: 'chapter_id',
  BOOK_ID: 'book_id',
  NUMBER: 'chapter_number',
  DESCRIPTION: 'chapter_description',
  NOTES: 'chapter_notes',
  DATE_ADDED: 'dt_added',
  DATE_MODIFIED: 'dt_modified',
} as const;

export const VERSE_COLUMNS = {
  ID: 'verse_id',
  CHAPTER_ID: 'chapter_id',
  INDEX: 'verse_index',
  VERSE: 'verse',
  TELUGU_VERSE: 'telugu_verse',
  DATE_ADDED: 'dt_added',
  DATE_MODIFIED: 'dt_modified',
} as const;
