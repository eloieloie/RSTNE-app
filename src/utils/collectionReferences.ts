// Table Names
export const TABLES = {
  BOOKS: 'books_tbl',
  BOOK_CATEGORIES: 'book_categories_tbl',
  CHAPTERS: 'chapters_tbl',
  VERSES: 'verses_tbl',
  NOTES: 'notes_tbl',
  VERSE_NOTES: 'verse_notes_tbl',
  PERSONAL_NOTES: 'personal_notes_tbl',
  PERSONAL_VERSE_NOTES: 'personal_verse_notes_tbl',
  ADMIN_USERS: 'admin_users_tbl',
  VERSE_LINKS: 'verse_links_tbl',
  TAGS: 'tags_tbl',
  VERSE_TAGS: 'verse_tags_tbl',
  CROSS_REFERENCES: 'cross_references_tbl',
  APP_VERSION: 'app_version_tbl',
  VERSE_AUDIO: 'verse_audio_tbl',
} as const;

export const VERSE_AUDIO_COLUMNS = {
  ID: 'audio_id',
  VERSE_ID: 'verse_id',
  LANGUAGE: 'language',
  STORAGE_PATH: 'storage_path',
  AUDIO_URL: 'audio_url',
  CONTENT_HASH: 'content_hash',
  DURATION_MS: 'duration_ms',
  VOICE_NAME: 'voice_name',
  STATUS: 'status',
  ERROR_MESSAGE: 'error_message',
  DATE_GENERATED: 'dt_generated',
  DATE_ADDED: 'dt_added',
  DATE_MODIFIED: 'dt_modified',
} as const;

export type VerseAudioLanguage = 'en' | 'te' | 'he';
export type VerseAudioStatus = 'pending' | 'ready' | 'stale' | 'failed';

export interface VerseAudio {
  audio_id: number;
  verse_id: number;
  language: VerseAudioLanguage;
  storage_path: string | null;
  audio_url: string | null;
  content_hash: string;
  duration_ms: number | null;
  voice_name: string | null;
  status: VerseAudioStatus;
  error_message: string | null;
  dt_generated: string | null;
  dt_added: string;
  dt_modified: string;
}

// Type Definitions
export interface Book {
  book_id: number;
  book_name: string;
  book_abbr: string | null;
  hebrew_book_abbr: string | null;
  telugu_book_abbr: string | null;
  hebrew_book_name: string | null;
  telugu_book_name: string | null;
  book_description: string | null;
  book_header: string | null;
  book_footer: string | null;
  book_link: string | null;
  book_index: number | null;
  category_id: number | null;
  chapter_count?: number;
  dt_added: Date;
}

export interface BookInsert {
  book_name: string;
  book_abbr?: string;
  hebrew_book_abbr?: string;
  telugu_book_abbr?: string;
  hebrew_book_name?: string;
  telugu_book_name?: string;
  book_description?: string;
  book_header?: string;
  book_footer?: string;
  book_link?: string;
  book_index?: number;
  category_id?: number;
}

export interface BookUpdate {
  book_name?: string;
  book_abbr?: string;
  hebrew_book_abbr?: string;
  telugu_book_abbr?: string;
  hebrew_book_name?: string;
  telugu_book_name?: string;
  book_description?: string;
  book_header?: string;
  book_footer?: string;
  book_link?: string;
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
  citation_required?: number;
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

export interface PersonalNote {
  personal_note_id: number;
  firebase_uid: string;
  note_title: string | null;
  note_content: string;
  dt_added: Date;
  dt_modified: Date;
}

export interface PersonalNoteInsert {
  note_title?: string;
  note_content: string;
}

export interface PersonalNoteUpdate {
  note_title?: string;
  note_content?: string;
}

export interface PersonalVerseNote {
  personal_verse_note_id: number;
  verse_id: number;
  personal_note_id: number;
  firebase_uid: string;
  dt_added: Date;
}

export interface PersonalVerseNoteInsert {
  verse_id: number;
  note_id: number;
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

export interface CrossReference {
  cross_ref_id: number;
  from_book_name: string;
  from_chapter: string;
  from_verse: string;
  to_book_name: string;
  to_chapter: string;
  to_verse: string;
  votes: number;
  dt_added: Date;
}

export interface CrossReferenceInsert {
  from_book_name: string;
  from_chapter: string;
  from_verse: string;
  to_book_name: string;
  to_chapter: string;
  to_verse: string;
  votes: number;
}

export interface BookCategory {
  category_id: number;
  category_name: string;
  category_order: number;
  dt_added: Date;
}

export const BOOK_CATEGORY_COLUMNS = {
  ID: 'category_id',
  NAME: 'category_name',
  ORDER: 'category_order',
  DATE_ADDED: 'dt_added',
} as const;

// Column Names
export const BOOK_COLUMNS = {
  ID: 'book_id',
  NAME: 'book_name',
  ABBR: 'book_abbr',
  HEBREW_ABBR: 'hebrew_book_abbr',
  TELUGU_ABBR: 'telugu_book_abbr',
  HEBREW_NAME: 'hebrew_book_name',
  TELUGU_NAME: 'telugu_book_name',
  DESCRIPTION: 'book_description',
  HEADER: 'book_header',
  FOOTER: 'book_footer',
  LINK: 'book_link',
  INDEX: 'book_index',
  CATEGORY_ID: 'category_id',
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

export const PERSONAL_NOTE_COLUMNS = {
  ID: 'personal_note_id',
  FIREBASE_UID: 'firebase_uid',
  TITLE: 'note_title',
  CONTENT: 'note_content',
  DATE_ADDED: 'dt_added',
  DATE_MODIFIED: 'dt_modified',
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

export const CROSS_REFERENCE_COLUMNS = {
  ID: 'cross_ref_id',
  FROM_BOOK_NAME: 'from_book_name',
  FROM_CHAPTER: 'from_chapter',
  FROM_VERSE: 'from_verse',
  TO_BOOK_NAME: 'to_book_name',
  TO_CHAPTER: 'to_chapter',
  TO_VERSE: 'to_verse',
  VOTES: 'votes',
  DATE_ADDED: 'dt_added',
} as const;

export interface AppVersion {
  id: number;
  min_version: string;
  max_version: string;
}

export const APP_VERSION_COLUMNS = {
  ID: 'id',
  MIN_VERSION: 'min_version',
  MAX_VERSION: 'max_version',
} as const;

export interface TimelineEvent {
  event_id: number;
  title: string;
  description: string | null;
  am_year: number;
  bc_ad_year: number | null;
  is_bc: number; // 1 = BC, 0 = AD
  month_name: string | null;
  day_number: number | null;
  is_shemittah: number; // 1 = yes, 0 = no
  is_jubilee: number;   // 1 = yes, 0 = no
  jubilee_ref: string | null;
  category: string | null;
  bible_ref: string | null;
  sort_order: number | null;
  dt_added: string;
  dt_modified: string;
}

export interface TimelineEventInsert {
  title: string;
  description?: string;
  am_year: number;
  bc_ad_year?: number;
  is_bc?: number;
  month_name?: string;
  day_number?: number;
  is_shemittah?: number;
  is_jubilee?: number;
  jubilee_ref?: string;
  category?: string;
  bible_ref?: string;
  sort_order?: number;
}

export interface TimelineEventUpdate {
  title?: string;
  description?: string;
  am_year?: number;
  bc_ad_year?: number;
  is_bc?: number;
  month_name?: string;
  day_number?: number;
  is_shemittah?: number;
  is_jubilee?: number;
  jubilee_ref?: string;
  category?: string;
  bible_ref?: string;
  sort_order?: number;
}

export const TIMELINE_EVENT_COLUMNS = {
  ID: 'event_id',
  TITLE: 'title',
  DESCRIPTION: 'description',
  AM_YEAR: 'am_year',
  BC_AD_YEAR: 'bc_ad_year',
  IS_BC: 'is_bc',
  MONTH_NAME: 'month_name',
  DAY_NUMBER: 'day_number',
  IS_SHEMITTAH: 'is_shemittah',
  IS_JUBILEE: 'is_jubilee',
  JUBILEE_REF: 'jubilee_ref',
  CATEGORY: 'category',
  BIBLE_REF: 'bible_ref',
  SORT_ORDER: 'sort_order',
  DATE_ADDED: 'dt_added',
  DATE_MODIFIED: 'dt_modified',
} as const;
