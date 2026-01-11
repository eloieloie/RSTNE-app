// Table Names
export const TABLES = {
  BOOKS: 'books_tbl',
  BOOK_CATEGORIES: 'book_categories_tbl',
  CHAPTERS: 'chapters_tbl',
  VERSES: 'verses_tbl',
  NOTES: 'notes_tbl',
  VERSE_NOTES: 'verse_notes_tbl',
  VERSE_LINKS: 'verse_links_tbl',
  TAGS: 'tags_tbl',
  VERSE_TAGS: 'verse_tags_tbl',
} as const;

// Type Definitions
export interface Book {
  book_id: number;
  book_name: string;
  book_abbr: string | null;
  hebrew_book_name: string | null;
  telugu_book_name: string | null;
  book_description: string | null;
  book_header: string | null;
  book_footer: string | null;
  book_index: number | null;
  category_id: number | null;
  chapter_count?: number;
  dt_added: Date;
}

export interface BookInsert {
  book_name: string;
  book_abbr?: string;
  hebrew_book_name?: string;
  telugu_book_name?: string;
  book_description?: string;
  book_header?: string;
  book_footer?: string;
  book_index?: number;
  category_id?: number;
}

export interface BookUpdate {
  book_name?: string;
  book_abbr?: string;
  hebrew_book_name?: string;
  telugu_book_name?: string;
  book_description?: string;
  book_header?: string;
  book_footer?: string;
  book_index?: number;
  category_id?: number;
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

export interface Note {
  note_id: number;
  note_title: string | null;
  note_content: string;
  dt_added: Date;
  dt_modified: Date;
}

export interface NoteInsert {
  note_title?: string;
  note_content: string;
}

export interface NoteUpdate {
  note_title?: string;
  note_content?: string;
}

export interface VerseNote {
  verse_note_id: number;
  verse_id: number;
  note_id: number;
  dt_added: Date;
}

export interface VerseNoteInsert {
  verse_id: number;
  note_id: number;
}

export interface VerseLink {
  link_id: number;
  source_verse_id: number;
  target_verse_id: number;
  link_type: string | null;
  link_description: string | null;
  dt_added: Date;
}

export interface VerseLinkInsert {
  source_verse_id: number;
  target_verse_id: number;
  link_type?: string;
  link_description?: string;
}

export interface Tag {
  tag_id: number;
  tag_name: string;
  tag_description: string | null;
  dt_added: Date;
}

export interface TagInsert {
  tag_name: string;
  tag_description?: string;
}

export interface TagUpdate {
  tag_name?: string;
  tag_description?: string;
}

export interface VerseTag {
  verse_tag_id: number;
  verse_id: number;
  tag_id: number;
  dt_added: Date;
}

export interface VerseTagInsert {
  verse_id: number;
  tag_id: number;
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

export const NOTE_COLUMNS = {
  ID: 'note_id',
  TITLE: 'note_title',
  CONTENT: 'note_content',
  DATE_ADDED: 'dt_added',
  DATE_MODIFIED: 'dt_modified',
} as const;

export const VERSE_NOTE_COLUMNS = {
  ID: 'verse_note_id',
  VERSE_ID: 'verse_id',
  NOTE_ID: 'note_id',
  DATE_ADDED: 'dt_added',
} as const;

export const VERSE_LINK_COLUMNS = {
  ID: 'link_id',
  SOURCE_VERSE_ID: 'source_verse_id',
  TARGET_VERSE_ID: 'target_verse_id',
  LINK_TYPE: 'link_type',
  LINK_DESCRIPTION: 'link_description',
  DATE_ADDED: 'dt_added',
} as const;

export const TAG_COLUMNS = {
  ID: 'tag_id',
  NAME: 'tag_name',
  DESCRIPTION: 'tag_description',
  DATE_ADDED: 'dt_added',
} as const;

export const VERSE_TAG_COLUMNS = {
  ID: 'verse_tag_id',
  VERSE_ID: 'verse_id',
  TAG_ID: 'tag_id',
  DATE_ADDED: 'dt_added',
} as const;
