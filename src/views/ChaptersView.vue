<template>
  <div class="chapters-page" :class="{ 'broadcast-mode': broadcastMode }">
    <!-- Tint overlay when cross-ref tooltip is open -->
    <AnimatePresence>
      <motion.div
        v-if="crossRefTooltip.show"
        class="chapters-page-tint"
        :class="{ 'broadcast-mode': broadcastMode }"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: prefersReducedMotion ? 0 : 0.18 }"
        @click="closeCrossRefTooltip"
      ></motion.div>
    </AnimatePresence>

    <!-- Parasha flash notification -->
    <Transition name="parasha-flash">
      <div v-if="parashaFlash.visible" class="parasha-flash" @click="parashaFlash.visible = false">
        <div class="parasha-flash-inner">
          <div class="parasha-flash-week">Week {{ parashaFlash.week }}</div>
          <div class="parasha-flash-name">{{ parashaFlash.name }}</div>
          <div class="parasha-flash-readings">
            <span class="parasha-flash-torah">{{ parashaFlash.torahText }}</span>
            <span class="parasha-flash-divider">·</span>
            <span class="parasha-flash-nc">{{ parashaFlash.ncText }}</span>
          </div>
        </div>
        <button class="parasha-flash-close" @click.stop="parashaFlash.visible = false">✕</button>
      </div>
    </Transition>

    <!-- Initial Loading -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="content-wrapper" :class="{ 'broadcast-mode': broadcastMode }">
      <div class="content-layout">
        <nav class="top-nav">
          <div class="nav-container">
            <motion.button class="nav-back-btn" :while-hover="hoverLift" :while-tap="tapScale" @click="router.push({ name: 'books' })" title="Back to Books">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </motion.button>

            <motion.button class="verse-picker-button" :while-hover="hoverLift" :while-tap="tapScale" @click="showVersePicker = true">
              <div class="book-names">
                <span class="book-name">{{ displayButtonBookName }}</span>
              </div>
              <span v-if="displayChapterNumber" class="chapter-verse">
                {{ displayChapterNumber }}{{ displayVerseNumber }}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </motion.button>

            <div class="nav-right-group">
              <motion.button class="search-icon" :while-hover="hoverLift" :while-tap="tapScale" @click="openSearchModal" title="Search Verses">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </motion.button>
              <motion.button class="settings-icon" :while-hover="hoverLift" :while-tap="tapScale" @click="showSettingsModal = true" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </motion.button>
            </div>
          </div>
        </nav>

        <main class="chapter-content" ref="chapterContentRef">

          <!-- Loading spinner for verse navigation -->
          <div v-if="isNavigatingToVerseRef" class="content-loading-overlay">
            <div class="loading-spinner"></div>
            <p>Loading verse...</p>
          </div>
          
          <div v-if="chapters.length === 0" class="select-prompt">
            No chapters available for this book.
          </div>
          
          <div v-else-if="!selectedChapter" class="select-prompt">
            Please select a chapter from the dropdown above.
          </div>
          
          <div v-else class="continuous-scroll-container">
            <!-- Navigation Buttons -->
            <div class="chapter-nav-buttons top">
              <button 
                v-if="getPreviousChapter(Array.from(loadedChapters.keys()).sort((a, b) => {
                  const chA = chapters.find(ch => ch.chapter_id === a);
                  const chB = chapters.find(ch => ch.chapter_id === b);
                  return parseInt(chA?.chapter_number || '0') - parseInt(chB?.chapter_number || '0');
                })[0])"
                @click="loadPreviousChapterManually"
                class="nav-btn prev-btn"
                :disabled="isLoadingChapter"
                title="Load Previous Chapter"
              >
                <i class="bi bi-chevron-up"></i>
              </button>
            </div>
            <!-- Book Header (Introduction) -->
            <div v-if="book?.book_header" class="book-header-section">
              <div 
                class="book-header-content"
                :class="{ 'hide-superscript': !showSuperscript }"
                :style="{ fontSize: fontSize + 'px' }"
                v-html="formatVerseWithPaleoBora(book.book_header)"
              ></div>
            </div>

            <!-- Render loaded chapters in order -->
            <div 
              v-for="chapterData in orderedLoadedChapters" 
              :key="chapterData.chapter.chapter_id"
              :id="`chapter-${chapterData.chapter.chapter_id}`"
              :ref="el => setChapterRef(chapterData.chapter.chapter_id, el as HTMLElement)"
              :data-chapter-id="chapterData.chapter.chapter_id"
              class="chapter-section"
            >
              <div class="book-header">
                <h1>
                  <span class="chapter-indicator">{{ chapterData.chapter.chapter_number }}</span>
                </h1>
                <p v-if="chapterData.chapter.chapter_description" class="book-description">
                  {{ chapterData.chapter.chapter_description }}
                </p>
              </div>

              <div v-if="chapterData.verses.length === 0" class="no-verses">
                No verses found for this chapter.
              </div>
              
              <div v-else class="verses-list">
                <motion.div
                  v-for="(verse, verseIndex) in chapterData.verses"
                  :key="verse.verse_id"
                  :id="`verse-${verse.verse_id}`"
                  :data-verse-id="verse.verse_id"
                  class="verse-item"
                  :class="{ 'verse-selected': clickSelectedVerseId === verse.verse_id }"
                  :initial="prefersReducedMotion ? false : { opacity: 0, y: 8 }"
                  :animate="{ opacity: 1, y: clickSelectedVerseId === verse.verse_id ? -1 : 0 }"
                  :transition="verseEnterTransition(verseIndex)"
                  @click="selectVerse(verse, $event)"
                >
                  <div class="verse-main">
                    <span class="verse-number">{{ verse.verse_index }}</span>
                    <span v-if="showEnglish" class="verse-text" :class="{ 'hide-superscript': !showSuperscript, 'bold-text': boldVerseText }" :style="{ fontSize: fontSize + 'px' }" v-html="formatVerseWithPaleoBora(verse.verse)"></span>
                    <div v-if="!showEnglish && showTelugu && verse.telugu_verse" class="verse-telugu inline" :class="{ 'hide-superscript': !showSuperscript, 'bold-text': boldVerseText }" :style="{ fontSize: fontSize + 'px' }" v-html="formatVerseWithPaleoBora(verse.telugu_verse)"></div>
                  </div>
                  
                  <div v-if="showEnglish && showTelugu && verse.telugu_verse" class="verse-telugu" :class="{ 'hide-superscript': !showSuperscript, 'bold-text': boldVerseText }" :style="{ fontSize: fontSize + 'px' }" v-html="formatVerseWithPaleoBora(verse.telugu_verse)"></div>
                  
                  <div v-if="verse.links && verse.links.length > 0" class="verse-links">
                      <motion.a
                        v-for="link in verse.links"
                        :key="link.target_verse_id"
                        href="#"
                        class="link-badge"
                        :title="`Go to ${link.target_book_name} ${link.target_chapter_number}:${link.target_verse_index}`"
                        :while-hover="hoverLift"
                        :while-tap="tapScale"
                        @click.prevent="navigateToVerse(link.target_book_id, link.target_chapter_id, link.target_verse_id)"
                      >
                        {{ getBookName(allBooks.find(b => b.book_id === link.target_book_id) || { book_name: link.target_book_name }) }} {{ link.target_chapter_number }}:{{ link.target_verse_index }}
                      </motion.a>
                    </div>

                    <div v-if="showCrossReferences && !broadcastMode && verse.crossReferences && verse.crossReferences.length > 0" class="verse-cross-references">
                      <motion.a
                        v-for="crossRef in (expandedCrossRefs.has(verse.verse_id) ? verse.crossReferences : verse.crossReferences.slice(0, 10))"
                        :key="crossRef.cross_ref_id"
                        href="#"
                        class="cross-ref-badge"
                        :title="`Preview ${crossRef.to_book_name} ${crossRef.to_chapter}:${crossRef.to_verse} (${crossRef.votes} votes)`"
                        :while-hover="hoverLift"
                        :while-tap="tapScale"
                        @click="showCrossRefTooltip($event, crossRef)"
                      >
                        {{ getBookAbbr(allBooks.find(b => b.book_id === crossRef.to_book_id) || { book_name: crossRef.to_book_name, book_abbr: crossRef.to_book_abbr, hebrew_book_abbr: crossRef.to_hebrew_book_abbr, telugu_book_abbr: crossRef.to_telugu_book_abbr }) }} {{ crossRef.to_chapter }}:{{ crossRef.to_verse }}
                      </motion.a>
                      <motion.span
                        v-if="verse.crossReferences.length > 10"
                        class="cross-ref-more"
                        :while-tap="tapScale"
                        @click="toggleCrossRefs(verse.verse_id)"
                      >
                        {{ expandedCrossRefs.has(verse.verse_id) ? 'show less' : `+${verse.crossReferences.length - 10} more` }}
                      </motion.span>
                    </div>
                    
                    <div v-if="showAdminNotes && ((verse.notes && verse.notes.length > 0) || addingAdminNoteVerseId === verse.verse_id)" class="verse-notes admin-notes">
                      <div v-for="note in verse.notes" :key="note.note_id" class="note-item">
                        <template v-if="editingAdminNoteId === note.note_id">
                          <textarea v-model="editAdminNoteContent" class="note-edit-textarea" rows="3"></textarea>
                          <div class="note-edit-actions">
                            <button class="note-save-btn" @click.stop="saveEditAdminNote(verse.verse_id, note.note_id)">Save</button>
                            <button class="note-cancel-btn" @click.stop="cancelEditAdminNote">Cancel</button>
                            <button class="note-delete-btn" @click.stop="deleteAdminNoteFromVerse(verse.verse_id, note.verse_note_id, note.note_id)">Delete</button>
                          </div>
                        </template>
                        <template v-else>
                          <div v-if="note.note_title" class="note-title" :class="{ 'hide-superscript': !showSuperscript }" :style="{ fontSize: (fontSize - 2) + 'px' }" v-html="formatVerseWithPaleoBora(note.note_title)"></div>
                          <div class="note-content" :class="{ 'hide-superscript': !showSuperscript }" :style="{ fontSize: (fontSize - 2) + 'px' }" v-html="formatVerseWithPaleoBora(note.note_content)"></div>
                        </template>
                      </div>
                      <div v-if="isAdmin && addingAdminNoteVerseId === verse.verse_id" class="note-add-row">
                        <textarea v-model="newAdminNoteContent" class="note-edit-textarea" rows="3" placeholder="New admin note…"></textarea>
                        <div class="note-edit-actions">
                          <button class="note-save-btn" @click.stop="saveNewAdminNote(verse.verse_id)">Save</button>
                          <button class="note-cancel-btn" @click.stop="cancelAddAdminNote">Cancel</button>
                        </div>
                      </div>
                    </div>

                    <div v-if="showMyNotes && !isAdmin && ((verse.my_notes && verse.my_notes.length > 0) || user)" class="verse-notes my-notes">
                      <div v-for="note in verse.my_notes" :key="note.personal_note_id" class="note-item">
                        <template v-if="editingPersonalNoteId === note.personal_note_id">
                          <textarea v-model="editPersonalNoteContent" class="note-edit-textarea" rows="3"></textarea>
                          <div class="note-edit-actions">
                            <button class="note-save-btn" @click.stop="saveEditPersonalNote(verse.verse_id, note.personal_note_id)">Save</button>
                            <button class="note-cancel-btn" @click.stop="cancelEditPersonalNote">Cancel</button>
                          </div>
                        </template>
                        <template v-else>
                          <div class="note-content" :class="{ 'hide-superscript': !showSuperscript }" :style="{ fontSize: (fontSize - 2) + 'px' }" v-html="formatVerseWithPaleoBora(note.note_content)"></div>
                          <div class="note-inline-actions">
                            <button class="note-icon-btn" title="Edit note" @click.stop="startEditPersonalNote(note)">✎</button>
                            <button class="note-icon-btn" title="Delete note" @click.stop="deletePersonalNoteFromVerse(verse.verse_id, note.personal_verse_note_id, note.personal_note_id)">🗑</button>
                          </div>
                        </template>
                      </div>
                      <div v-if="user" class="note-add-row">
                        <template v-if="addingPersonalNoteVerseId === verse.verse_id">
                          <textarea v-model="newPersonalNoteContent" class="note-edit-textarea" rows="3" placeholder="New personal note…"></textarea>
                          <div class="note-edit-actions">
                            <button class="note-save-btn" @click.stop="saveNewPersonalNote(verse.verse_id)">Save</button>
                            <button class="note-cancel-btn" @click.stop="cancelAddPersonalNote">Cancel</button>
                          </div>
                        </template>
                        <button v-else class="note-add-btn" @click.stop="startAddPersonalNote(verse.verse_id)">+ Add my note</button>
                      </div>
                    </div>

                    <!-- Share action bar (only visible when verse is selected) -->
                    <div v-if="clickSelectedVerseId === verse.verse_id" class="verse-actions" @click.stop>
                      <div class="verse-actions-bar">
                        <motion.button
                          class="verse-action-btn"
                          :class="{ active: shareMenuVerseId === verse.verse_id }"
                          :while-tap="tapScale"
                          @click.stop="toggleShareMenu(verse.verse_id)"
                          title="Share verse"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                          </svg>
                          Share
                        </motion.button>
                        <motion.button
                          v-if="isAdmin && verse.notes && verse.notes.length > 0"
                          class="verse-action-btn"
                          :while-tap="tapScale"
                          @click.stop="startEditAdminNote(verse.notes[0])"
                          title="Edit admin note"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit Note
                        </motion.button>
                        <motion.button
                          v-if="isAdmin && (!verse.notes || verse.notes.length === 0)"
                          class="verse-action-btn"
                          :while-tap="tapScale"
                          @click.stop="startAddAdminNote(verse.verse_id)"
                          title="Add admin note"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          Add Note
                        </motion.button>
                        <span v-if="copiedVerseId === verse.verse_id" class="copied-feedback">Link copied!</span>
                      </div>

                      <!-- Share dropdown -->
                      <AnimatePresence>
                        <motion.div
                          v-if="shareMenuVerseId === verse.verse_id"
                          class="share-menu"
                          :initial="prefersReducedMotion ? false : { opacity: 0, y: -4, scale: 0.96 }"
                          :animate="{ opacity: 1, y: 0, scale: 1 }"
                          :exit="{ opacity: 0, y: -4, scale: 0.96 }"
                          :transition="{ duration: 0.15 }"
                        >
                          <motion.button class="share-option" :while-tap="tapScale" @click.stop="copyVerseLink(verse, chapterData.chapter.chapter_number)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy link
                          </motion.button>
                          <motion.button class="share-option" :while-tap="tapScale" @click.stop="copyVerseText(verse, chapterData.chapter.chapter_number)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Copy text
                          </motion.button>
                          <motion.button v-if="canNativeShare" class="share-option" :while-tap="tapScale" @click.stop="nativeShareVerse(verse, chapterData.chapter.chapter_number)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                              <polyline points="16 6 12 2 8 6"></polyline>
                              <line x1="12" y1="2" x2="12" y2="15"></line>
                            </svg>
                            Share...
                          </motion.button>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                </motion.div>
              </div>
            </div>

            <!-- Book Footer (Conclusion) -->
            <div v-if="book?.book_footer" class="book-footer-section">
              <div 
                class="book-footer-content"
                :class="{ 'hide-superscript': !showSuperscript }"
                :style="{ fontSize: fontSize + 'px' }"
                v-html="formatVerseWithPaleoBora(book.book_footer)"
              ></div>
            </div>

            <!-- Loading indicator for adjacent chapters -->
            <div v-if="isLoadingAdjacentChapter" class="loading-adjacent">
              Loading more chapters...
            </div>
            
            <!-- Bottom Navigation Button -->
            <div class="chapter-nav-buttons bottom">
              <button 
                v-if="getNextChapter(Array.from(loadedChapters.keys()).sort((a, b) => {
                  const chA = chapters.find(ch => ch.chapter_id === a);
                  const chB = chapters.find(ch => ch.chapter_id === b);
                  return parseInt(chA?.chapter_number || '0') - parseInt(chB?.chapter_number || '0');
                })[Array.from(loadedChapters.keys()).length - 1])"
                @click="loadNextChapterManually"
                class="nav-btn next-btn"
                :disabled="isLoadingChapter"
                title="Load Next Chapter"
              >
                <i class="bi bi-chevron-down"></i>
              </button>
            </div>
          </div>

          <!-- Cross-Reference Tooltip -->
          <AnimatePresence>
            <motion.div
              v-if="crossRefTooltip.show"
              class="cross-ref-tooltip"
              :class="{ 'broadcast-mode': broadcastMode }"
              :style="{ left: crossRefTooltip.x + 'px', top: crossRefTooltip.y + 'px' }"
              :initial="prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }"
              :animate="{ opacity: 1, scale: 1 }"
              :exit="{ opacity: 0, scale: 0.94 }"
              :transition="tooltipSpring"
              @click.stop
            >
              <div class="tooltip-header" @mousedown.prevent="startTooltipDrag">
                <span class="tooltip-title">
                  <template v-if="crossRefTooltip.hebrewBookName">{{ crossRefTooltip.hebrewBookName }} / </template>{{ crossRefTooltip.bookName }} {{ crossRefTooltip.chapterNumber }}:{{ crossRefTooltip.verseNumber }}
                </span>
                <motion.button class="tooltip-popout" :while-tap="tapScale" @click="navigateFromTooltip" title="Go to verse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </motion.button>
                <motion.button class="tooltip-close" :while-tap="tapScale" @click="closeCrossRefTooltip">&times;</motion.button>
              </div>
              <div class="tooltip-content" @click="handleTooltipVerseRefClick">
                <div v-if="crossRefTooltip.loading" class="tooltip-loading">
                  <div class="loading-spinner"></div>
                  <p>Loading verse...</p>
                </div>
                <div v-else>
                  <div v-if="showEnglish && crossRefTooltip.verseText" class="tooltip-verse" :class="{ 'hide-superscript': !showSuperscript }" :style="{ fontSize: fontSize + 'px' }" v-html="crossRefTooltip.verseText"></div>
                  <div v-if="showTelugu && crossRefTooltip.teluguVerseText" class="tooltip-verse telugu-verse" :style="{ fontSize: fontSize + 'px' }" v-html="crossRefTooltip.teluguVerseText"></div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
        
    </div>

    <!-- Verse Picker -->
    <VersePicker
      :is-open="showVersePicker"
      :initial-book-id="book?.book_id"
      :initial-chapter-id="selectedChapterId ?? undefined"
      :broadcast-mode="broadcastMode"
      @close="showVersePicker = false"
      @select="handleVerseSelection"
      @update="handleVersePickerUpdate"
    />

    <!-- Verse Search -->
    <VerseSearch
      :is-open="showSearchModal"
      :broadcast-mode="broadcastMode"
      @close="showSearchModal = false"
      @select="handleVerseSelection"
    />

    <!-- Search Results Navigation -->
    <AnimatePresence>
      <motion.div
        v-if="hasSearchResults"
        class="search-navigation-bar"
        :initial="prefersReducedMotion ? false : { opacity: 0, y: 40, x: '-50%' }"
        :animate="{ opacity: 1, y: 0, x: '-50%' }"
        :exit="{ opacity: 0, y: 40, x: '-50%' }"
        :transition="tooltipSpring"
      >
        <motion.button class="clear-search-btn" :while-tap="tapScale" @click="clearSearchResults" title="Clear search results">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </motion.button>
        <span class="search-results-text">{{ searchResultsText }}</span>
        <div class="search-nav-buttons">
          <motion.button class="search-nav-btn" :while-tap="tapScale" @click="goToPreviousSearchResult" title="Previous result">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </motion.button>
          <motion.button class="search-nav-btn" :while-tap="tapScale" @click="goToNextSearchResult" title="Next result">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>

    <!-- Context Menu for Verse References -->
    <AnimatePresence>
      <motion.div
        v-if="contextMenu.show"
        class="context-menu"
        :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
        :initial="prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }"
        :animate="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0, scale: 0.94 }"
        :transition="{ duration: 0.15 }"
      >
        <button @click="handleGoToVerse" class="context-menu-item">
          Go to verse
        </button>
        <button @click="handleSearch" class="context-menu-item">
          Search
        </button>
      </motion.div>
    </AnimatePresence>

    <!-- Settings Modal -->
    <Settings
      :is-open="showSettingsModal"
      @close="showSettingsModal = false"
      @settings-change="handleSettingsChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { motion, AnimatePresence, useReducedMotion } from 'motion-v';
import { getChaptersByBookId } from '@/api/chapters';
import { getBookById, getAllBooks } from '@/api/books';
import { getVersesByChapterId } from '@/api/verses';
import { getChapterVersesWithCrossRefs, type CrossReferenceData } from '@/api/crossReferences';
import VersePicker from '@/components/VersePicker.vue';
import VerseSearch from '@/components/VerseSearch.vue';
import Settings from '@/components/Settings.vue';
import { BOOKS_DATA } from '@/utils/versePickerData';
import { generatePaleoBoraImagesForText, stripHtmlKeepPaleo, generateVerseCardImage } from '@/utils/paleoBora';
import { useBookLanguage } from '@/composables/useBookLanguage';
import { useAuth } from '@/composables/useAuth';
import { updateNote, createNote, linkNoteToVerse, unlinkNoteFromVerse } from '@/api/notes';
import {
  createPersonalNote,
  updatePersonalNote,
  deletePersonalNote,
  linkPersonalNoteToVerse,
  unlinkPersonalNoteFromVerse,
} from '@/api/personalNotes';

// ── Motion (motion-v) ──────────────────────────────────────────────────────
// Respect the OS-level "reduce motion" preference across every animated element.
const prefersReducedMotion = useReducedMotion();

const tooltipSpring = { type: 'spring', stiffness: 380, damping: 32 } as const;
const tapScale = computed(() => (prefersReducedMotion.value ? {} : { scale: 0.96 }));
const hoverLift = computed(() => (prefersReducedMotion.value ? {} : { y: -2 }));

// Per-verse stagger entrance — capped so long chapters don't produce a long queued animation.
function verseEnterTransition(index: number) {
  if (prefersReducedMotion.value) return { duration: 0 };
  return { duration: 0.28, delay: Math.min(index, 12) * 0.02, ease: [0.4, 0, 0.2, 1] };
}

interface Book {
  book_id: number;
  book_name: string;
  book_abbr?: string | null;
  book_description?: string | null;
  book_header?: string | null;
  book_footer?: string | null;
}

interface Chapter {
  chapter_id: number;
  book_id: number;
  chapter_number: string;
  chapter_description?: string | null;
  chapter_notes?: string | null;
}

interface Verse {
  verse_id: number;
  chapter_id: number;
  verse_index: number | null;
  verse: string;
  telugu_verse?: string | null;
  verse_links?: string | null;
  verse_notes?: string | null;
  links?: Array<{
    target_book_id: number;
    target_chapter_id: number;
    target_verse_id: number;
    target_book_name: string;
    target_chapter_number: string;
    target_verse_index: number;
  }>;
  notes?: Array<{
    note_id: number;
    verse_note_id: number;
    note_title?: string | null;
    note_content: string;
  }>;
  my_notes?: Array<{
    personal_note_id: number;
    personal_verse_note_id: number;
    note_title?: string | null;
    note_content: string;
  }>;
  crossReferences?: CrossReferenceData[];
}

interface LoadedChapterData {
  chapter: Chapter;
  verses: Verse[];
}

interface SearchResult {
  verse_id: number;
  book_id: number;
  chapter_id: number;
  book_name: string;
  chapter_number: string;
  verse_index: number;
  verse: string;
  telugu_verse?: string | null;
  note_content?: string | null;
}

const props = withDefaults(defineProps<{
  broadcastMode?: boolean;
}>(), {
  broadcastMode: false
});

const emit = defineEmits<{
  'broadcast-verse-change': [verse: { verse: any; chapterNumber: string } | null, book: any];
  'settings-change': [settings: any];
  'broadcast-text-select': [text: string];
}>();

const route = useRoute();
const router = useRouter();
const { getBookName, getBookAbbr } = useBookLanguage();
const allBooks = ref<any[]>([]);
const bookAbbreviations = ref<Record<string, number>>({});
const book = ref<Book | null>(null);
const chapters = ref<Chapter[]>([]);
const loadedChapters = ref<Map<number, LoadedChapterData>>(new Map());
const selectedChapter = ref<Chapter | null>(null);
const selectedChapterId = ref<number | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isLoadingAdjacentChapter = ref(false);

const parashaFlash = ref({ visible: false, week: 0, name: '', torahText: '', ncText: '' });
let parashaFlashTimer: ReturnType<typeof setTimeout> | null = null;

// Settings state (managed by Settings component)
const showEnglish = ref(true);
const showTelugu = ref(true);
const showAdminNotes = ref(true);
const showMyNotes = ref(true);
const showCrossReferences = ref(true);
const showSuperscript = ref(true);
const fontSize = ref(16);
const boldVerseText = ref(true);
const internalBroadcastMode = ref(false);
const broadcastMode = computed(() => props.broadcastMode || internalBroadcastMode.value);
const chapterContentRef = ref<HTMLElement | null>(null);

const showSettingsModal = ref(false);
const showVersePicker = ref(false);
const showSearchModal = ref(false);

// ── Admin Notes (in-place editing) & My Notes (personal, per-user) ──────────
const { user, isAdmin } = useAuth();

const editingAdminNoteId = ref<number | null>(null);
const editAdminNoteContent = ref('');
const addingAdminNoteVerseId = ref<number | null>(null);
const newAdminNoteContent = ref('');

const editingPersonalNoteId = ref<number | null>(null);
const editPersonalNoteContent = ref('');
const addingPersonalNoteVerseId = ref<number | null>(null);
const newPersonalNoteContent = ref('');

function findVerse(verseId: number) {
  for (const chapterData of loadedChapters.value.values()) {
    const verse = chapterData.verses.find(v => v.verse_id === verseId);
    if (verse) return verse;
  }
  return null;
}

// -- Admin note edit-in-place --
function startEditAdminNote(note: { note_id: number; note_content: string }) {
  editingAdminNoteId.value = note.note_id;
  editAdminNoteContent.value = note.note_content;
}

function cancelEditAdminNote() {
  editingAdminNoteId.value = null;
  editAdminNoteContent.value = '';
}

async function saveEditAdminNote(verseId: number, noteId: number) {
  const content = editAdminNoteContent.value.trim();
  if (!content) return;
  try {
    await updateNote(noteId, { note_content: content });
    const verse = findVerse(verseId);
    const note = verse?.notes?.find(n => n.note_id === noteId);
    if (note) note.note_content = content;
  } catch (err) {
    console.error('Failed to update admin note:', err);
  } finally {
    cancelEditAdminNote();
  }
}

async function deleteAdminNoteFromVerse(verseId: number, verseNoteId: number, noteId: number) {
  if (!confirm('Remove this admin note from the verse?')) return;
  try {
    await unlinkNoteFromVerse(verseNoteId);
    const verse = findVerse(verseId);
    if (verse?.notes) {
      verse.notes = verse.notes.filter(n => n.note_id !== noteId);
    }
  } catch (err) {
    console.error('Failed to remove admin note:', err);
  }
}

function startAddAdminNote(verseId: number) {
  addingAdminNoteVerseId.value = verseId;
  newAdminNoteContent.value = '';
}

function cancelAddAdminNote() {
  addingAdminNoteVerseId.value = null;
  newAdminNoteContent.value = '';
}

async function saveNewAdminNote(verseId: number) {
  const content = newAdminNoteContent.value.trim();
  if (!content) return;
  try {
    const { note_id } = await createNote({ note_content: content });
    const { verse_note_id } = await linkNoteToVerse({ verse_id: verseId, note_id });
    const verse = findVerse(verseId);
    if (verse) {
      verse.notes = [...(verse.notes || []), { note_id, verse_note_id, note_content: content }];
    }
  } catch (err) {
    console.error('Failed to add admin note:', err);
  } finally {
    cancelAddAdminNote();
  }
}

// -- My (personal) notes --
function startAddPersonalNote(verseId: number) {
  addingPersonalNoteVerseId.value = verseId;
  newPersonalNoteContent.value = '';
}

function cancelAddPersonalNote() {
  addingPersonalNoteVerseId.value = null;
  newPersonalNoteContent.value = '';
}

async function saveNewPersonalNote(verseId: number) {
  const content = newPersonalNoteContent.value.trim();
  if (!content) return;
  try {
    const { personal_note_id } = await createPersonalNote({ note_content: content });
    const { personal_verse_note_id } = await linkPersonalNoteToVerse(verseId, personal_note_id);
    const verse = findVerse(verseId);
    if (verse) {
      verse.my_notes = [...(verse.my_notes || []), { personal_note_id, personal_verse_note_id, note_content: content }];
    }
  } catch (err) {
    console.error('Failed to add personal note:', err);
  } finally {
    cancelAddPersonalNote();
  }
}

function startEditPersonalNote(note: { personal_note_id: number; note_content: string }) {
  editingPersonalNoteId.value = note.personal_note_id;
  editPersonalNoteContent.value = note.note_content;
}

function cancelEditPersonalNote() {
  editingPersonalNoteId.value = null;
  editPersonalNoteContent.value = '';
}

async function saveEditPersonalNote(verseId: number, personalNoteId: number) {
  const content = editPersonalNoteContent.value.trim();
  if (!content) return;
  try {
    await updatePersonalNote(personalNoteId, { note_content: content });
    const verse = findVerse(verseId);
    const note = verse?.my_notes?.find(n => n.personal_note_id === personalNoteId);
    if (note) note.note_content = content;
  } catch (err) {
    console.error('Failed to update personal note:', err);
  } finally {
    cancelEditPersonalNote();
  }
}

async function deletePersonalNoteFromVerse(verseId: number, personalVerseNoteId: number, personalNoteId: number) {
  if (!confirm('Delete this note?')) return;
  try {
    await unlinkPersonalNoteFromVerse(personalVerseNoteId);
    await deletePersonalNote(personalNoteId);
    const verse = findVerse(verseId);
    if (verse?.my_notes) {
      verse.my_notes = verse.my_notes.filter(n => n.personal_note_id !== personalNoteId);
    }
  } catch (err) {
    console.error('Failed to delete personal note:', err);
  }
}

function openSearchModal() {
  const selected = window.getSelection()?.toString().trim();
  if (selected) {
    (window as any).initialSearchQuery = selected;
  }
  showSearchModal.value = true;
}
const isNavigatingToVerseRef = ref(false);

// Search results navigation
const searchResults = ref<SearchResult[]>([]);
const currentSearchIndex = ref<number>(-1);

// Preview state for live verse picker updates
const previewBookId = ref<number | null>(null);
const previewChapterId = ref<number | null>(null);
const previewVerseId = ref<number | null>(null);

// Track the first visible verse at the top of the viewport
const firstVisibleVerseIndex = ref<number | null>(null);
const firstVisibleChapterNumber = ref<string | null>(null);

// Track which verses have expanded cross-references
const expandedCrossRefs = ref<Set<number>>(new Set());

// Track highlighted verse to prevent premature removal
const highlightedVerseId = ref<number | null>(null);
const highlightTimeout = ref<number | null>(null);
const isNavigatingToVerse = ref(false);
const pendingScrollVerseId = ref<number | null>(null);

// Track user-clicked (selected) verse for highlight and broadcast panel
const clickSelectedVerseId = ref<number | null>(null);

// Share menu state
const shareMenuVerseId = ref<number | null>(null);
const copiedVerseId = ref<number | null>(null);

// Verse shown in the broadcast right panel: clicked selection takes priority over scroll tracking
const broadcastPanelVerse = computed<{ verse: any; chapterNumber: string } | null>(() => {
  if (clickSelectedVerseId.value !== null) {
    for (const chData of loadedChapters.value.values()) {
      const v = chData.verses.find(v => v.verse_id === clickSelectedVerseId.value);
      if (v) return { verse: v, chapterNumber: chData.chapter.chapter_number };
    }
  }
  return null;
});

// Cross-reference tooltip state
const crossRefTooltip = ref<{
  show: boolean;
  x: number;
  y: number;
  loading: boolean;
  verseText: string;
  teluguVerseText: string;
  bookName: string;
  hebrewBookName: string;
  chapterNumber: string;
  verseNumber: string;
  bookId: number;
  chapterId: number;
  verseId: number;
  verseIndex: number;
}>({
  show: false,
  x: 0,
  y: 0,
  loading: false,
  verseText: '',
  teluguVerseText: '',
  bookName: '',
  hebrewBookName: '',
  chapterNumber: '',
  verseNumber: '',
  bookId: 0,
  chapterId: 0,
  verseId: 0,
  verseIndex: 0
});

// Tooltip drag state
const tooltipDragging = ref(false);
const tooltipDragOffsetX = ref(0);
const tooltipDragOffsetY = ref(0);

// Context menu state for verse reference links
const contextMenu = ref<{
  show: boolean;
  x: number;
  y: number;
  bookId: number;
  chapterNum: number;
  verseNum: number;
}>({
  show: false,
  x: 0,
  y: 0,
  bookId: 0,
  chapterNum: 0,
  verseNum: 0
});

// Refs for scroll detection
const chapterRefs = ref<Map<number, HTMLElement>>(new Map());
const intersectionObserver = ref<IntersectionObserver | null>(null);
const bottomObserver = ref<IntersectionObserver | null>(null);
const topObserver = ref<IntersectionObserver | null>(null);
const currentlyVisibleChapterId = ref<number | null>(null);
const lastScrollY = ref(0);
const isLoadingChapter = ref(false);

// Sorted chapters for dropdown
const sortedChapters = computed(() => {
  return [...chapters.value].sort((a, b) => {
    const numA = parseInt(a.chapter_number) || 0;
    const numB = parseInt(b.chapter_number) || 0;
    return numA - numB;
  });
});

// Computed property for verse picker button display (language-aware)
const displayButtonBookName = computed(() => {
  const bookId = showVersePicker.value && previewBookId.value
    ? previewBookId.value
    : book.value?.book_id;
  if (!bookId) return book.value?.book_name || '';
  const found = allBooks.value.find(b => b.book_id === bookId);
  if (!found) return book.value?.book_name || '';
  return getBookName(found);
});

const displayChapterNumber = computed(() => {
  if (showVersePicker.value && previewChapterId.value) {
    const previewChapter = chapters.value.find(c => c.chapter_id === previewChapterId.value);
    return previewChapter?.chapter_number || selectedChapter.value?.chapter_number || '';
  }
  // Show the chapter number of the first visible verse if available
  if (firstVisibleChapterNumber.value) {
    return firstVisibleChapterNumber.value;
  }
  return selectedChapter.value?.chapter_number || '';
});

const displayVerseNumber = computed(() => {
  if (firstVisibleVerseIndex.value !== null) {
    return `:${firstVisibleVerseIndex.value}`;
  }
  return '';
});

// Ordered loaded chapters for rendering
const orderedLoadedChapters = computed(() => {
  const sorted = Array.from(loadedChapters.value.values()).sort((a, b) => {
    const numA = parseInt(a.chapter.chapter_number) || 0;
    const numB = parseInt(b.chapter.chapter_number) || 0;
    return numA - numB;
  });
  return sorted;
});

// Get chapter index
function getChapterIndex(chapterId: number): number {
  return sortedChapters.value.findIndex(ch => ch.chapter_id === chapterId);
}

// Get previous chapter
function getPreviousChapter(chapterId: number): Chapter | null {
  const index = getChapterIndex(chapterId);
  if (index > 0) {
    return sortedChapters.value[index - 1];
  }
  return null;
}

// Get next chapter
function getNextChapter(chapterId: number): Chapter | null {
  const index = getChapterIndex(chapterId);
  if (index < sortedChapters.value.length - 1) {
    return sortedChapters.value[index + 1];
  }
  return null;
}

// Set chapter ref
function setChapterRef(chapterId: number, el: HTMLElement | null) {
  if (el) {
    chapterRefs.value.set(chapterId, el);
  } else {
    chapterRefs.value.delete(chapterId);
  }
}

// Load verses for a chapter (includes cross-references in a single request)
async function loadChapterVerses(chapterId: number): Promise<void> {
  if (loadedChapters.value.has(chapterId)) {
    return; // Already loaded
  }

  const chapter = chapters.value.find(ch => ch.chapter_id === chapterId);
  if (!chapter) return;

  try {
    const verses = await getChapterVersesWithCrossRefs(chapterId);

    loadedChapters.value.set(chapterId, { chapter, verses });

    // Scroll to a pending verse now that cross-refs are already present
    if (pendingScrollVerseId.value !== null) {
      const verseIdToScroll = pendingScrollVerseId.value;
      const verseInChapter = verses.find((v: any) => v.verse_id === verseIdToScroll);
      if (verseInChapter) {
        pendingScrollVerseId.value = null;
        await nextTick();
        const verseElement = document.querySelector(`[data-verse-id="${verseIdToScroll}"]`) as HTMLElement;
        if (verseElement) {
          const navHeight = 90;
          const elementTop = verseElement.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementTop - navHeight - 20;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    }
  } catch (err) {
    console.error('Error loading chapter verses:', err);
  }
}

// Load adjacent chapters (previous and next)
async function loadAdjacentChapters(chapterId: number): Promise<void> {
  isLoadingAdjacentChapter.value = true;

  const prevChapter = getPreviousChapter(chapterId);
  const nextChapter = getNextChapter(chapterId);
  console.log('[loadAdjacentChapters] for', chapterId, '| prev:', prevChapter?.chapter_id, prevChapter?.chapter_number, '| next:', nextChapter?.chapter_id, nextChapter?.chapter_number);
  const promises: Promise<void>[] = [];

  if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
    promises.push(loadChapterVerses(prevChapter.chapter_id));
  }

  if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
    promises.push(loadChapterVerses(nextChapter.chapter_id));
  }

  await Promise.all(promises);
  console.log('[loadAdjacentChapters] done, map keys:', Array.from(loadedChapters.value.keys()));
  isLoadingAdjacentChapter.value = false;
}

// Select chapter and load it
async function selectChapter(chapter: Chapter, skipScroll: boolean = false, skipAdjacentLoad: boolean = false) {
  console.log('[selectChapter] START chapter_number:', chapter.chapter_number, 'chapter_id:', chapter.chapter_id);
  selectedChapter.value = chapter;
  selectedChapterId.value = chapter.chapter_id;

  // Load this chapter if not loaded
  await loadChapterVerses(chapter.chapter_id);
  console.log('[selectChapter] after loadChapterVerses, loadedChapters has ch6?', loadedChapters.value.has(chapter.chapter_id), 'map size:', loadedChapters.value.size);
  // Load adjacent chapters only if not navigating to a specific verse
  if (!skipAdjacentLoad) {
    await loadAdjacentChapters(chapter.chapter_id);
  }
  console.log('[selectChapter] after loadAdjacent, loadedChapters has ch6?', loadedChapters.value.has(chapter.chapter_id), 'map size:', loadedChapters.value.size, 'keys:', Array.from(loadedChapters.value.keys()));

  // Scroll to chapter after DOM updates (unless skipScroll is true).
  // Use 'instant' to avoid the topObserver's compensating scroll overriding navigation.
  if (!skipScroll) {
    await nextTick();
    console.log('[selectChapter] after nextTick, loadedChapters has ch6?', loadedChapters.value.has(chapter.chapter_id), 'el in DOM?', !!document.querySelector(`[data-chapter-id="${chapter.chapter_id}"]`));
    scrollToChapter(chapter.chapter_id, 'instant');
    console.log('[selectChapter] scrollY after instant scroll:', window.scrollY);
  }
  console.log('[selectChapter] END selectedChapterId:', selectedChapterId.value);
}

// Scroll to chapter
function scrollToChapter(chapterId: number, behavior: ScrollBehavior = 'smooth') {
  // Scroll without changing the URL (no hash navigation)
  const el = document.querySelector(`[data-chapter-id="${chapterId}"]`) as HTMLElement;
  console.log('[scrollToChapter] chapterId:', chapterId, 'el found:', !!el, 'scrollY:', window.scrollY);
  if (el) {
    const navHeight = 90;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY - navHeight - 10;
    console.log('[scrollToChapter] rect.top:', rect.top, 'target scrollY:', top, 'behavior:', behavior);
    window.scrollTo({ top, behavior });
  }
}

// Scroll to verse
function scrollToVerse(verseId: number) {
  // Set flag to prevent intersection observer from loading adjacent chapters
  isNavigatingToVerse.value = true;
  
  // Track this verse so cross-reference loading can re-scroll after DOM updates
  pendingScrollVerseId.value = verseId;
  
  // Clear any existing highlight timeout
  if (highlightTimeout.value) {
    clearTimeout(highlightTimeout.value);
    highlightTimeout.value = null;
  }
  
  // Remove previous highlight if exists
  if (highlightedVerseId.value) {
    const prevElement = document.querySelector(`[data-verse-id="${highlightedVerseId.value}"]`);
    if (prevElement) {
      prevElement.classList.remove('highlight-verse');
    }
  }
  
  // Apply highlight after a short delay to ensure element is rendered
  setTimeout(() => {
    const verseElement = document.querySelector(`[data-verse-id="${verseId}"]`) as HTMLElement;
    
    if (verseElement) {
      // Scroll the verse to the top of the viewport with smooth scrolling
      const navHeight = 90; // Height of the fixed top nav
      const elementTop = verseElement.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementTop - navHeight - 20; // 20px extra padding from top
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Apply highlight class
      verseElement.classList.add('highlight-verse');
      
      // Track this verse as highlighted
      highlightedVerseId.value = verseId;
      
      // Set up a MutationObserver to watch for class changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target as HTMLElement;
            const hasHighlight = target.classList.contains('highlight-verse');
            
            // If highlight was removed, add it back
            if (!hasHighlight && target.getAttribute('data-verse-id') === String(verseId)) {
              target.classList.add('highlight-verse');
            }
          }
        });
      });
      
      observer.observe(verseElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Also set up an interval to check and re-apply the class if needed
      const intervalId = setInterval(() => {
        const el = document.querySelector(`[data-verse-id="${verseId}"]`);
        if (el && !el.classList.contains('highlight-verse')) {
          el.classList.add('highlight-verse');
        }
      }, 500);
      
      // Remove highlight after 30 seconds
      highlightTimeout.value = window.setTimeout(() => {
        const el = document.querySelector(`[data-verse-id="${verseId}"]`);
        if (el) {
          el.classList.remove('highlight-verse');
        }
        highlightedVerseId.value = null;
        pendingScrollVerseId.value = null;
        observer.disconnect();
        clearInterval(intervalId);
      }, 30000);
      
      // Clear navigation flag after a delay to allow scroll to complete
      setTimeout(() => {
        isNavigatingToVerse.value = false;
        isNavigatingToVerseRef.value = false; // Clear loading spinner
      }, 1000);
    } else {
      // Fallback: search in loaded chapters data for the verse
      for (const chapterData of loadedChapters.value.values()) {
        const foundVerse = chapterData.verses.find(v => v.verse_id === verseId);
        if (foundVerse) {
          // Try to find by verse index instead
          const fallbackElement = document.querySelector(`[data-verse-id="${foundVerse.verse_id}"]`);
          if (fallbackElement && fallbackElement instanceof HTMLElement) {
            fallbackElement.classList.add('highlight-verse');
            fallbackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          break;
        }
      }
      
      isNavigatingToVerse.value = false;
      isNavigatingToVerseRef.value = false; // Clear loading spinner
    }
  }, 300); // Wait 300ms for anchor scroll to complete
}

// Handle verse selection from VersePicker
function handleVerseSelection(bookId: number, chapterId: number, verseId: number, results?: SearchResult[]) {
  showVersePicker.value = false;
  showSearchModal.value = false;
  
  if (results && results.length > 0) {
    searchResults.value = results;
    currentSearchIndex.value = results.findIndex(r => r.verse_id === verseId);
  } else {
    searchResults.value = [];
    currentSearchIndex.value = -1;
  }
  
  previewBookId.value = null;
  previewChapterId.value = null;
  previewVerseId.value = null;
  
  // Always navigate in-place — no URL changes
  navigateToVerse(bookId, chapterId, verseId);
}

// Handle live updates from VersePicker while scrolling
function handleVersePickerUpdate(bookId: number, chapterId: number, verseId: number) {
  previewBookId.value = bookId;
  previewChapterId.value = chapterId;
  previewVerseId.value = verseId;
}

// Watch broadcastPanelVerse changes — emit to parent BroadcastView
watch(broadcastPanelVerse, (val) => {
  emit('broadcast-verse-change', val, book.value);
});

// Toggle highlighting a verse when clicked by the user
function selectVerse(verse: any, event: MouseEvent) {
  const target = event.target as HTMLElement;
  // Ignore clicks on links, badges, or interactive sub-elements
  if (target.closest('a') || target.closest('.cross-ref-more') || target.closest('.verse-links') || target.closest('.verse-cross-references') || target.closest('.verse-notes') || target.closest('.verse-actions')) {
    return;
  }
  // If the user was selecting text, don't toggle verse selection
  const selectedText = window.getSelection()?.toString().trim();
  if (selectedText) return;
  if (clickSelectedVerseId.value === verse.verse_id) {
    // Deselect on second click
    clickSelectedVerseId.value = null;
    shareMenuVerseId.value = null;
  } else {
    clickSelectedVerseId.value = verse.verse_id;
    shareMenuVerseId.value = null;
  }
}

// Share helpers
const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

function getVerseShareUrl(verse: any, chapterNumber: string): string {
  const bookSlug = book.value?.book_name?.toLowerCase().replace(/\s+/g, '-') || '';
  return `${window.location.origin}/${bookSlug}/${chapterNumber}/${verse.verse_index}`;
}

// Build share text, preserving PaleoBora words as readable plain text
function buildVerseShareText(verse: any, chapterNumber: string): { title: string; text: string; url: string } {
  const bookLabel = displayButtonBookName.value || book.value?.book_name || '';
  const reference = `${bookLabel} ${chapterNumber}:${verse.verse_index}`;

  const parts: string[] = [reference];

  if (verse.verse) {
    parts.push(stripHtmlKeepPaleo(verse.verse));
  }

  if (verse.telugu_verse) {
    parts.push(stripHtmlKeepPaleo(verse.telugu_verse));
  }

  if (verse.notes && verse.notes.length > 0) {
    for (const note of verse.notes) {
      const titlePart = note.note_title ? `[${stripHtmlKeepPaleo(note.note_title)}]` : '';
      const contentPart = note.note_content ? stripHtmlKeepPaleo(note.note_content) : '';
      if (titlePart || contentPart) {
        parts.push([titlePart, contentPart].filter(Boolean).join('\n'));
      }
    }
  }

  const url = getVerseShareUrl(verse, chapterNumber);
  return { title: reference, text: parts.join('\n\n'), url };
}

// Build share content and generate canvas images for any PaleoBora words found
async function buildVerseShareContent(verse: any, chapterNumber: string): Promise<{ title: string; text: string; url: string; imageMap: Map<string, string> }> {
  const { title, text, url } = buildVerseShareText(verse, chapterNumber);
  const imageMap = await generatePaleoBoraImagesForText(text, fontSize.value);
  return { title, text, url, imageMap };
}

function toggleShareMenu(verseId: number) {
  shareMenuVerseId.value = shareMenuVerseId.value === verseId ? null : verseId;
}

async function copyVerseLink(verse: any, chapterNumber: string) {
  const url = getVerseShareUrl(verse, chapterNumber);
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  shareMenuVerseId.value = null;
  copiedVerseId.value = verse.verse_id;
  setTimeout(() => { copiedVerseId.value = null; }, 2000);
}

async function copyVerseText(verse: any, chapterNumber: string) {
  const { text, url } = await buildVerseShareContent(verse, chapterNumber);
  const fullText = `${text}\n\n${url}`;
  try {
    await navigator.clipboard.writeText(fullText);
  } catch {
    const el = document.createElement('textarea');
    el.value = fullText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  shareMenuVerseId.value = null;
  copiedVerseId.value = verse.verse_id;
  setTimeout(() => { copiedVerseId.value = null; }, 2000);
}

async function nativeShareVerse(verse: any, chapterNumber: string) {
  const { title, text, url } = await buildVerseShareContent(verse, chapterNumber);
  shareMenuVerseId.value = null;
  try {
    if (typeof navigator.canShare === 'function') {
      const cardFile = await generateVerseCardImage({
        reference: title,
        englishText: verse.verse ? stripHtmlKeepPaleo(verse.verse) : undefined,
        teluguText: verse.telugu_verse ? stripHtmlKeepPaleo(verse.telugu_verse) : undefined,
        verseNotes: verse.notes && verse.notes.length > 0 ? verse.notes : undefined,
        verseUrl: url,   // URL is embedded inside the card image
        fontSizePx: fontSize.value,
      });

      if (navigator.canShare({ files: [cardFile] })) {
        // Include URL as plain text alongside the image.
        // Using `text` (not `url`) avoids iOS generating a second rich link preview card.
        await navigator.share({ title, text: url, files: [cardFile] });
      } else {
        // Files not supported — fall back to plain text + url
        await navigator.share({ title, text, url });
      }
    } else {
      await navigator.share({ title, text, url });
    }
  } catch {
    // User cancelled or share not supported
  }
}

// Navigate to verse (for cross-references)
async function navigateToVerse(bookId: number, chapterId: number, verseId: number) {
  // Check if we're on the same book (handle both old and new URL formats)
  const currentBookId = route.params.id ? Number(route.params.id) : book.value?.book_id;
  const isSameBook = currentBookId === bookId;
  // If same book, just select the chapter and scroll
  if (isSameBook) {
    const chapter = chapters.value.find(ch => ch.chapter_id === chapterId);
    
    if (chapter) {
      // Check if we're already on this chapter
      if (selectedChapterId.value === chapterId) {
        await nextTick();
        scrollToVerse(verseId);
      } else {
        // Clear previously loaded chapters to only show the target chapter
        loadedChapters.value.clear();
        
        // Load only the target chapter (no adjacent chapters)
        await loadChapterVerses(chapterId);
        
        // Select chapter and skip adjacent chapter loading
        await selectChapter(chapter, true, true);
        
        // Wait for chapter verses to be loaded and DOM to be ready
        let attempts = 0;
        const maxAttempts = 30; // Increase attempts for far chapters
        
        const waitForChapter = async () => {
          await nextTick();
          const chapterElement = document.querySelector(`[data-chapter-id="${chapterId}"]`);
          const verseElement = document.querySelector(`[data-verse-id="${verseId}"]`);
          
          if (chapterElement && verseElement) {
            scrollToVerse(verseId);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(waitForChapter, 150);
          } else {
            console.warn('navigateToVerse: Chapter/verse not found in DOM after', maxAttempts, 'attempts');
            // Try scrolling anyway
            scrollToVerse(verseId);
          }
        };
        
        await waitForChapter();
      }
    } else {
      console.warn('navigateToVerse: Chapter not found!');
      console.warn('navigateToVerse: Searched for chapterId:', chapterId, 'type:', typeof chapterId);
      console.warn('navigateToVerse: Available IDs:', chapters.value.map(ch => `${ch.chapter_id} (${typeof ch.chapter_id})`));
      isNavigatingToVerseRef.value = false; // Clear loading spinner on error
    }
  } else {
    // Different book — load in-place without changing the URL
    await loadBookInPlace(bookId, chapterId, verseId);
  }
}

// Load a different book's content in-place (no URL change)
async function loadBookInPlace(bookId: number, chapterId: number, verseId: number) {
  isNavigatingToVerseRef.value = true;
  try {
    book.value = await getBookById(bookId);
    chapters.value = await getChaptersByBookId(bookId);
    loadedChapters.value.clear();
    selectedChapter.value = null;
    selectedChapterId.value = null;

    const targetChapter = chapters.value.find(ch => ch.chapter_id === chapterId);
    if (!targetChapter) {
      console.error('loadBookInPlace: Chapter not found', chapterId);
      isNavigatingToVerseRef.value = false;
      return;
    }

    await loadChapterVerses(chapterId);
    await selectChapter(targetChapter, true, true);

    let attempts = 0;
    const waitForVerse = async () => {
      await nextTick();
      const verseElement = document.querySelector(`[data-verse-id="${verseId}"]`);
      if (verseElement) {
        scrollToVerse(verseId);
      } else if (attempts < 30) {
        attempts++;
        setTimeout(waitForVerse, 150);
      } else {
        scrollToVerse(verseId);
      }
    };
    await waitForVerse();
  } catch (err) {
    console.error('Error in loadBookInPlace:', err);
    isNavigatingToVerseRef.value = false;
  }
}

// Toggle cross-reference expansion
function toggleCrossRefs(verseId: number) {
  if (expandedCrossRefs.value.has(verseId)) {
    expandedCrossRefs.value.delete(verseId);
  } else {
    expandedCrossRefs.value.add(verseId);
  }
}

// Show cross-reference tooltip with verse preview
async function showCrossRefTooltip(event: MouseEvent, crossRef: CrossReferenceData) {
  event.preventDefault();

  if (!crossRefTooltip.value.show) {
    const pos = getTooltipCenterPosition();
    crossRefTooltip.value.x = pos.x;
    crossRefTooltip.value.y = pos.y;
  }
  crossRefTooltip.value.show = true;
  crossRefTooltip.value.loading = true;
  crossRefTooltip.value.bookName = crossRef.to_book_name;
  crossRefTooltip.value.hebrewBookName = '';
  crossRefTooltip.value.chapterNumber = crossRef.to_chapter;
  crossRefTooltip.value.verseNumber = crossRef.to_verse;
  
  try {
    // Use to_book_id from database if available
    let targetBook;
    if (crossRef.to_book_id) {
      targetBook = allBooks.value.find(b => b.book_id === crossRef.to_book_id);
    } else {
      targetBook = allBooks.value.find(b => 
        b.book_abbr === crossRef.to_book_name || 
        b.book_name.toLowerCase() === crossRef.to_book_name.toLowerCase()
      );
    }
    
    if (!targetBook) {
      crossRefTooltip.value.verseText = 'Book not found';
      crossRefTooltip.value.loading = false;
      return;
    }

    // Set language-aware book name in tooltip
    crossRefTooltip.value.bookName = getBookName(targetBook);
    
    // Find the chapter
    const targetChapters = await getChaptersByBookId(targetBook.book_id);
    const normalizedTargetChapter = String(crossRef.to_chapter);
    const targetChapter = targetChapters.find(ch => String(ch.chapter_number) === normalizedTargetChapter);
    
    if (!targetChapter) {
      crossRefTooltip.value.verseText = 'Chapter not found';
      crossRefTooltip.value.loading = false;
      return;
    }
    
    // Find the verse
    const targetVerses = await getVersesByChapterId(targetChapter.chapter_id);
    const targetVerse = targetVerses.find(v => String(v.verse_index) === crossRef.to_verse);
    
    if (!targetVerse) {
      crossRefTooltip.value.verseText = 'Verse not found';
      crossRefTooltip.value.loading = false;
      return;
    }
    
    // Store IDs for navigation
    crossRefTooltip.value.bookId = targetBook.book_id;
    crossRefTooltip.value.chapterId = targetChapter.chapter_id;
    crossRefTooltip.value.verseId = targetVerse.verse_id;
    crossRefTooltip.value.verseIndex = targetVerse.verse_index ?? 1;
    crossRefTooltip.value.hebrewBookName = BOOKS_DATA.find(b => b.book_id === targetBook.book_id)?.hebrew_book_name || '';
    
    // Set verse text with formatting applied
    crossRefTooltip.value.verseText = formatVerseWithPaleoBora(targetVerse.verse || '');
    crossRefTooltip.value.teluguVerseText = formatVerseWithPaleoBora(targetVerse.telugu_verse || '');
    crossRefTooltip.value.loading = false;
  } catch (err) {
    console.error('Error loading cross-reference verse:', err);
    crossRefTooltip.value.verseText = 'Error loading verse';
    crossRefTooltip.value.loading = false;
  }
}

// Navigate to cross-reference from tooltip
function navigateFromTooltip() {
  const { bookId, chapterId, verseId } = crossRefTooltip.value;
  crossRefTooltip.value.show = false;
  // Always navigate in-place — no URL changes
  navigateToVerse(bookId, chapterId, verseId);
}

// Close cross-reference tooltip
function closeCrossRefTooltip() {
  crossRefTooltip.value.show = false;
}

// Emit selected verse text to BroadcastView when in broadcast mode
function handleVerseTextSelection() {
  if (!broadcastMode.value) return;
  const selection = window.getSelection();
  if (!selection) return;
  const text = selection.toString().trim();
  if (!text) return;
  // Check that the selection is within chapter-content
  const container = chapterContentRef.value;
  if (!container) return;
  const range = selection.getRangeAt(0);
  if (container.contains(range.commonAncestorContainer)) {
    emit('broadcast-text-select', text);
  }
}

function getTooltipCenterPosition(): { x: number; y: number } {
  const panelRight = broadcastMode.value ? window.innerWidth * 0.7 : window.innerWidth;
  const tooltipW = broadcastMode.value ? panelRight - 16 : 700;
  const tooltipH = 240;
  const vh = window.innerHeight;
  const rect = chapterContentRef.value?.getBoundingClientRect();
  if (rect) {
    // Clamp to the visible portion of chapter-content within the viewport
    const visLeft = Math.max(rect.left, 0);
    const visTop = Math.max(rect.top, 0);
    const visRight = Math.min(rect.right, panelRight);
    const visBottom = Math.min(rect.bottom, vh);
    const x = visLeft + Math.max(0, (visRight - visLeft - tooltipW) / 2);
    // In broadcast mode, default to top; otherwise center vertically
    const y = broadcastMode.value
      ? visTop + 8
      : visTop + Math.max(0, (visBottom - visTop - tooltipH) / 2);
    // Final clamp so tooltip never goes off-screen or outside the left panel
    return {
      x: Math.min(Math.max(8, x), panelRight - tooltipW - 8),
      y: Math.min(Math.max(8, y), vh - tooltipH - 8),
    };
  }
  return {
    x: Math.max(8, (panelRight - tooltipW) / 2),
    y: broadcastMode.value ? 8 : Math.max(8, (vh - tooltipH) / 2),
  };
}

function startTooltipDrag(e: MouseEvent) {
  tooltipDragging.value = true;
  tooltipDragOffsetX.value = e.clientX - crossRefTooltip.value.x;
  tooltipDragOffsetY.value = e.clientY - crossRefTooltip.value.y;
  document.addEventListener('mousemove', onTooltipDragMove);
  document.addEventListener('mouseup', onTooltipDragEnd);
}

function onTooltipDragMove(e: MouseEvent) {
  if (!tooltipDragging.value) return;
  crossRefTooltip.value.x = e.clientX - tooltipDragOffsetX.value;
  crossRefTooltip.value.y = e.clientY - tooltipDragOffsetY.value;
}

function onTooltipDragEnd() {
  tooltipDragging.value = false;
  document.removeEventListener('mousemove', onTooltipDragMove);
  document.removeEventListener('mouseup', onTooltipDragEnd);
}

// Handle settings change from Settings component
interface SettingsData {
  showEnglish: boolean;
  showTelugu: boolean;
  showAdminNotes: boolean;
  showMyNotes: boolean;
  showCrossReferences: boolean;
  showSuperscript: boolean;
  fontSize: number;
  boldVerseText: boolean;
  broadcastMode: boolean;
}

function handleSettingsChange(settings: SettingsData) {
  showEnglish.value = settings.showEnglish;
  showTelugu.value = settings.showTelugu;
  showAdminNotes.value = settings.showAdminNotes;
  showMyNotes.value = settings.showMyNotes;
  showCrossReferences.value = settings.showCrossReferences;
  showSuperscript.value = settings.showSuperscript;
  fontSize.value = settings.fontSize;
  boldVerseText.value = settings.boldVerseText;
  const wasInBroadcastMode = internalBroadcastMode.value;
  internalBroadcastMode.value = settings.broadcastMode;
  emit('settings-change', settings);
  // Navigate to broadcast route when broadcast mode is toggled ON from reading page
  if (settings.broadcastMode && !wasInBroadcastMode && !props.broadcastMode) {
    router.push({ name: 'broadcast', state: { bookId: book.value?.book_id } });
  }
}

// Search results navigation
async function goToNextSearchResult() {
  if (searchResults.value.length === 0 || currentSearchIndex.value === -1) return;
  
  const nextIndex = (currentSearchIndex.value + 1) % searchResults.value.length;
  currentSearchIndex.value = nextIndex;
  
  const nextResult = searchResults.value[nextIndex];
  await navigateToVerse(nextResult.book_id, nextResult.chapter_id, nextResult.verse_id);
}

async function goToPreviousSearchResult() {
  if (searchResults.value.length === 0 || currentSearchIndex.value === -1) return;
  
  const prevIndex = currentSearchIndex.value === 0 
    ? searchResults.value.length - 1 
    : currentSearchIndex.value - 1;
  currentSearchIndex.value = prevIndex;
  
  const prevResult = searchResults.value[prevIndex];
  await navigateToVerse(prevResult.book_id, prevResult.chapter_id, prevResult.verse_id);
}

function clearSearchResults() {
  searchResults.value = [];
  currentSearchIndex.value = -1;
}

// Computed properties for search navigation
const hasSearchResults = computed(() => searchResults.value.length > 0);
const searchResultsText = computed(() => {
  if (!hasSearchResults.value || currentSearchIndex.value === -1) return '';
  return `${currentSearchIndex.value + 1} of ${searchResults.value.length}`;
});

// Format verse with PaleoBora font
function formatVerseWithPaleoBora(text: string): string {
  if (!text) return '';
  
  const patterns = [
    { search: /HWHY/g, replace: '<span class="paleobora-text">HWHY</span>' },
    { search: /hwhy/g, replace: '<span class="paleobora-text">hwhy</span>' },
    { search: /OSWHY/g, replace: '<span class="paleobora-text">OSWHY</span>' },
    { search: /oswhy/g, replace: '<span class="paleobora-text">oswhy</span>' },
    { search: /MYHLA/g, replace: '<span class="paleobora-text">MYHLA</span>' },
    { search: /Myhla/g, replace: '<span class="paleobora-text">Myhla</span>' },
    { search: /myhla/g, replace: '<span class="paleobora-text">myhla</span>' }
  ];
  
  let formatted = text;
  patterns.forEach(pattern => {
    formatted = formatted.replace(pattern.search, pattern.replace);
  });
  
  // Convert inline verse references like #Yech18 4 to clickable links
  // Pattern: #[4-char-abbr][chapter-number] [verse-number]
  // Using book abbreviations from allBooks
  formatted = formatted.replace(/#([a-z]{4})(\d+)\s+(\d+)/gi, (match, bookAbbr, chapter, verse) => {
    const bookId = bookAbbreviations.value[bookAbbr.toLowerCase()];
    if (bookId) {
      const bookObj = allBooks.value.find(b => b.book_id === bookId);
      const displayAbbr = bookObj ? getBookAbbr(bookObj) : bookAbbr;
      const label = `#${displayAbbr}${chapter} ${verse}`;
      return `<a href="#" class="inline-verse-ref" data-book-id="${bookId}" data-chapter="${chapter}" data-verse="${verse}">${label}</a>`;
    }
    return match;
  });
  
  return formatted;
}

// Handle inline verse ref clicks inside the cross-reference tooltip
async function handleTooltipVerseRefClick(event: Event) {
  const target = event.target as HTMLElement;
  if (!(target.tagName === 'A' && target.classList.contains('inline-verse-ref'))) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const bookId = parseInt(target.getAttribute('data-book-id') || '0');
  const chapterNum = parseInt(target.getAttribute('data-chapter') || '0');
  const verseNum = parseInt(target.getAttribute('data-verse') || '0');
  if (!bookId || !chapterNum || !verseNum) return;
  
  const targetBook = allBooks.value.find(b => b.book_id === bookId);
  if (!targetBook) return;
  
  // Update tooltip header and show loading
  crossRefTooltip.value.loading = true;
  crossRefTooltip.value.bookName = targetBook.book_name;
  crossRefTooltip.value.hebrewBookName = BOOKS_DATA.find(b => b.book_id === bookId)?.hebrew_book_name || '';
  crossRefTooltip.value.chapterNumber = String(chapterNum);
  crossRefTooltip.value.verseNumber = String(verseNum);
  crossRefTooltip.value.verseText = '';
  crossRefTooltip.value.teluguVerseText = '';
  
  try {
    const targetChapters = await getChaptersByBookId(bookId);
    const targetChapter = targetChapters.find(ch => String(ch.chapter_number) === String(chapterNum));
    if (!targetChapter) {
      crossRefTooltip.value.verseText = 'Chapter not found';
      crossRefTooltip.value.loading = false;
      return;
    }
    
    const targetVerses = await getVersesByChapterId(targetChapter.chapter_id);
    const targetVerse = targetVerses.find(v => String(v.verse_index) === String(verseNum));
    if (!targetVerse) {
      crossRefTooltip.value.verseText = 'Verse not found';
      crossRefTooltip.value.loading = false;
      return;
    }
    
    crossRefTooltip.value.bookId = bookId;
    crossRefTooltip.value.chapterId = targetChapter.chapter_id;
    crossRefTooltip.value.verseId = targetVerse.verse_id;
    crossRefTooltip.value.verseIndex = targetVerse.verse_index ?? 1;
    crossRefTooltip.value.verseText = formatVerseWithPaleoBora(targetVerse.verse || '');
    crossRefTooltip.value.teluguVerseText = formatVerseWithPaleoBora(targetVerse.telugu_verse || '');
    crossRefTooltip.value.loading = false;
  } catch (err) {
    console.error('Error loading tooltip inline verse ref:', err);
    crossRefTooltip.value.verseText = 'Error loading verse';
    crossRefTooltip.value.loading = false;
  }
}

// Handle clicks on inline verse references using event delegation
async function handleVerseRefClick(event: Event) {
  const target = event.target as HTMLElement;
  
  // Check if clicked element is an inline verse reference link
  if (target.tagName === 'A' && target.classList.contains('inline-verse-ref')) {
    event.preventDefault();
    event.stopPropagation();
    
    const bookId = parseInt(target.getAttribute('data-book-id') || '0');
    const chapterNum = parseInt(target.getAttribute('data-chapter') || '0');
    const verseNum = parseInt(target.getAttribute('data-verse') || '0');
    
    // Get the target book
    const targetBook = allBooks.value.find(b => b.book_id === bookId);
    if (!targetBook) return;
    
    // Show tooltip like cross references
    if (!crossRefTooltip.value.show) {
      const pos = getTooltipCenterPosition();
      crossRefTooltip.value.x = pos.x;
      crossRefTooltip.value.y = pos.y;
    }
    crossRefTooltip.value.show = true;
    crossRefTooltip.value.loading = true;
    crossRefTooltip.value.hebrewBookName = BOOKS_DATA.find(b => b.book_id === bookId)?.hebrew_book_name || '';
    crossRefTooltip.value.bookName = targetBook.book_name;
    crossRefTooltip.value.chapterNumber = String(chapterNum);
    crossRefTooltip.value.verseNumber = String(verseNum);
    
    try {
      // Find the chapter
      const targetChapters = await getChaptersByBookId(bookId);
      const normalizedChapterNum = String(chapterNum);
      const targetChapter = targetChapters.find(ch => String(ch.chapter_number) === normalizedChapterNum);
      
      if (!targetChapter) {
        crossRefTooltip.value.verseText = 'Chapter not found';
        crossRefTooltip.value.loading = false;
        return;
      }
      
      // Find the verse
      const targetVerses = await getVersesByChapterId(targetChapter.chapter_id);
      const normalizedVerseNum = String(verseNum);
      const targetVerse = targetVerses.find(v => String(v.verse_index) === normalizedVerseNum);
      
      if (!targetVerse) {
        crossRefTooltip.value.verseText = 'Verse not found';
        crossRefTooltip.value.loading = false;
        return;
      }
      
      // Store IDs for navigation
      crossRefTooltip.value.bookId = bookId;
      crossRefTooltip.value.chapterId = targetChapter.chapter_id;
      crossRefTooltip.value.verseId = targetVerse.verse_id;
      
      // Set verse text with formatting
      crossRefTooltip.value.verseText = formatVerseWithPaleoBora(targetVerse.verse || '');
      crossRefTooltip.value.teluguVerseText = formatVerseWithPaleoBora(targetVerse.telugu_verse || '');
      crossRefTooltip.value.loading = false;
    } catch (err) {
      console.error('Error loading inline verse reference:', err);
      crossRefTooltip.value.verseText = 'Error loading verse';
      crossRefTooltip.value.loading = false;
    }
  }
}

// Handle "Go to verse" from context menu
async function handleGoToVerse() {
  const { bookId, chapterNum, verseNum } = contextMenu.value;
  contextMenu.value.show = false;
  isNavigatingToVerseRef.value = true;
  
  try {
    // If same book, find chapter and navigate
    const currentBookId = route.params.id ? Number(route.params.id) : book.value?.book_id;
    if (currentBookId === bookId) {
    const targetChapter = chapters.value.find(ch => ch.chapter_number === String(chapterNum));
    if (targetChapter) {
      // Check if the target chapter is already loaded
      const chapterData = loadedChapters.value.get(targetChapter.chapter_id);
      let targetVerse;
      
      if (chapterData) {
        // Chapter already loaded, find verse from cached data
        targetVerse = chapterData.verses.find(v => v.verse_index === verseNum);
      } else {
        // Load chapter with caching
        await loadChapterVerses(targetChapter.chapter_id);
        const loadedData = loadedChapters.value.get(targetChapter.chapter_id);
        if (loadedData) {
          targetVerse = loadedData.verses.find(v => v.verse_index === verseNum);
        }
      }
      
      if (targetVerse) {
        await navigateToVerse(bookId, targetChapter.chapter_id, targetVerse.verse_id);
      }
    }
    } else {
      // Different book - need to load that book's chapters first
      const targetBookChapters = await getChaptersByBookId(bookId);
      const targetChapter = targetBookChapters.find(ch => ch.chapter_number === String(chapterNum));
      
      if (targetChapter) {
        const versesData = await getVersesByChapterId(targetChapter.chapter_id);
        const targetVerse = versesData.find(v => v.verse_index === verseNum);
        
        if (targetVerse) {
          await navigateToVerse(bookId, targetChapter.chapter_id, targetVerse.verse_id);
        }
      }
    }
  } catch (err) {
    console.error('Error navigating to verse:', err);
  } finally {
    isNavigatingToVerseRef.value = false;
  }
}

// Handle "Search" from context menu
function handleSearch() {
  const { bookId, chapterNum, verseNum } = contextMenu.value;
  contextMenu.value.show = false;
  
  // Get book abbreviation for search
  const book = allBooks.value.find(b => b.book_id === bookId);
  const bookAbbr = book?.book_abbr || '';
  const searchText = `#${bookAbbr}${chapterNum} ${verseNum}`;
  
  // Open search modal with the reference
  showSearchModal.value = true;
  (window as any).initialSearchQuery = searchText;
}

// Close context menu and tooltip when clicking outside
function closeContextMenu(event: Event) {
  // Don't close if clicking on verse ref link, inside context menu, or cross-ref badge
  const target = event.target as HTMLElement;
  if (target.closest('.context-menu') || 
      target.closest('.cross-ref-tooltip') || 
      target.classList.contains('inline-verse-ref') ||
      target.classList.contains('cross-ref-badge')) {
    return;
  }
  
  if (contextMenu.value.show) {
    contextMenu.value.show = false;
  }
  
  if (crossRefTooltip.value.show) {
    crossRefTooltip.value.show = false;
  }
}

// Manually load next chapter
function loadNextChapterManually() {
  if (isLoadingChapter.value) return;
  
  const loadedChapterIds = Array.from(loadedChapters.value.keys()).sort((a, b) => {
    const chA = chapters.value.find(ch => ch.chapter_id === a);
    const chB = chapters.value.find(ch => ch.chapter_id === b);
    const numA = parseInt(chA?.chapter_number || '0');
    const numB = parseInt(chB?.chapter_number || '0');
    return numA - numB;
  });
  
  if (loadedChapterIds.length === 0) return;
  
  const lastLoadedChapterId = loadedChapterIds[loadedChapterIds.length - 1];
  const nextChapter = getNextChapter(lastLoadedChapterId);
  
  if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
    isLoadingChapter.value = true;
    loadChapterVerses(nextChapter.chapter_id).then(() => {
      // Scroll to the newly loaded chapter
      nextTick().then(() => {
        scrollToChapter(nextChapter.chapter_id);
        isLoadingChapter.value = false;
      });
    }).catch(() => {
      isLoadingChapter.value = false;
    });
  }
}

// Manually load previous chapter
function loadPreviousChapterManually() {
  if (isLoadingChapter.value) return;
  
  const loadedChapterIds = Array.from(loadedChapters.value.keys()).sort((a, b) => {
    const chA = chapters.value.find(ch => ch.chapter_id === a);
    const chB = chapters.value.find(ch => ch.chapter_id === b);
    const numA = parseInt(chA?.chapter_number || '0');
    const numB = parseInt(chB?.chapter_number || '0');
    return numA - numB;
  });
  
  if (loadedChapterIds.length === 0) return;
  
  const firstLoadedChapterId = loadedChapterIds[0];
  const prevChapter = getPreviousChapter(firstLoadedChapterId);
  
  if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
    isLoadingChapter.value = true;
    
    // Get current scroll position
    const scrollBeforeLoad = window.scrollY;
    
    loadChapterVerses(prevChapter.chapter_id).then(async () => {
      await nextTick();
      // Maintain scroll position by calculating offset
      const newScrollY = window.scrollY;
      const offset = newScrollY - scrollBeforeLoad;
      window.scrollTo({ top: scrollBeforeLoad + offset, behavior: 'instant' });
      isLoadingChapter.value = false;
    }).catch(() => {
      isLoadingChapter.value = false;
    });
  }
}

// Track the first visible verse at the top of the viewport
function trackFirstVisibleVerse() {
  const navHeight = 90; // Height of the fixed top nav
  const topThreshold = navHeight + 10; // Small buffer below the nav
  
  // Find all verse items
  const verseItems = document.querySelectorAll('[data-verse-id]');
  
  for (const verseItem of Array.from(verseItems)) {
    const rect = verseItem.getBoundingClientRect();
    
    // Check if this verse is at or just below the top nav
    if (rect.top >= topThreshold && rect.top < topThreshold + 100) {
      const verseId = (verseItem as HTMLElement).getAttribute('data-verse-id');
      if (verseId) {
        // Find the verse in loaded chapters to get its index and chapter
        for (const chapterData of loadedChapters.value.values()) {
          const verse = chapterData.verses.find(v => v.verse_id === Number(verseId));
          if (verse && verse.verse_index !== null) {
            firstVisibleVerseIndex.value = verse.verse_index;
            firstVisibleChapterNumber.value = chapterData.chapter.chapter_number;
            return;
          }
        }
      }
    }
    
    // If verse is past the threshold, stop searching
    if (rect.top > topThreshold + 100) {
      break;
    }
  }
}

// Handle scroll for loading adjacent chapters
function handleScroll() {
  // Track first visible verse
  trackFirstVisibleVerse();
  
  if (isNavigatingToVerse.value || isLoadingChapter.value) {
    return;
  }
  
  const currentScrollY = window.scrollY;
  const scrollingDown = currentScrollY > lastScrollY.value;
  lastScrollY.value = currentScrollY;
  
  // Get first and last loaded chapters
  const loadedChapterIds = Array.from(loadedChapters.value.keys()).sort((a, b) => {
    const chA = chapters.value.find(ch => ch.chapter_id === a);
    const chB = chapters.value.find(ch => ch.chapter_id === b);
    const numA = parseInt(chA?.chapter_number || '0');
    const numB = parseInt(chB?.chapter_number || '0');
    return numA - numB;
  });
  
  if (loadedChapterIds.length === 0) return;
  
  const firstLoadedChapterId = loadedChapterIds[0];
  const lastLoadedChapterId = loadedChapterIds[loadedChapterIds.length - 1];
  
  // Check if scrolling down and near bottom
  if (scrollingDown) {
    const lastChapterElement = document.querySelector(`[data-chapter-id="${lastLoadedChapterId}"]`);
    if (lastChapterElement) {
      const rect = lastChapterElement.getBoundingClientRect();
      const distanceFromBottom = rect.bottom - window.innerHeight;
      
      // Load next chapter when within 1.5 viewports of bottom (works on mobile and desktop)
      const threshold = window.innerHeight * 1.5;
      if (distanceFromBottom < threshold) {
        const nextChapter = getNextChapter(lastLoadedChapterId);
        if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
          isLoadingChapter.value = true;
          loadChapterVerses(nextChapter.chapter_id).finally(() => {
            isLoadingChapter.value = false;
          });
        }
      }
    }
  } else {
    // Scrolling up, check if near top
    const firstChapterElement = document.querySelector(`[data-chapter-id="${firstLoadedChapterId}"]`);
    if (firstChapterElement) {
      const rect = firstChapterElement.getBoundingClientRect();
      const distanceFromTop = rect.top;
      
      // Load previous chapter when within 1.5 viewports of top (works on mobile and desktop)
      const threshold = window.innerHeight * 1.5;
      if (distanceFromTop > -threshold && distanceFromTop < threshold) {
        const prevChapter = getPreviousChapter(firstLoadedChapterId);
        if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
          isLoadingChapter.value = true;
          
          // Store scroll position relative to first chapter
          const scrollBeforeLoad = window.scrollY;
          const firstChapterTop = rect.top + scrollBeforeLoad;
          
          loadChapterVerses(prevChapter.chapter_id).then(async () => {
            await nextTick();
            // Restore position relative to the same chapter
            const newRect = firstChapterElement.getBoundingClientRect();
            const newFirstChapterTop = newRect.top + window.scrollY;
            const offset = newFirstChapterTop - firstChapterTop;
            window.scrollTo({ top: scrollBeforeLoad + offset, behavior: 'instant' });
            isLoadingChapter.value = false;
          }).catch(() => {
            isLoadingChapter.value = false;
          });
        }
      }
    }
  }
}

// Setup intersection observer for chapter visibility
function setupIntersectionObserver() {
  // Observer for chapter visibility (middle of viewport)
  const visibilityOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px', // Trigger when chapter is in middle of viewport
    threshold: 0
  };
  
  intersectionObserver.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const chapterId = parseInt(entry.target.getAttribute('data-chapter-id') || '0');
        if (chapterId) {
          currentlyVisibleChapterId.value = chapterId;
          
          // Update dropdown to match visible chapter
          if (selectedChapterId.value !== chapterId) {
            console.log('[intersectionObserver] Overriding selectedChapterId from', selectedChapterId.value, 'to', chapterId, '| scrollY:', window.scrollY);
            selectedChapterId.value = chapterId;
            const chapter = chapters.value.find(ch => ch.chapter_id === chapterId);
            if (chapter) {
              selectedChapter.value = chapter;
            }
          }
        }
      }
    });
  }, visibilityOptions);
  
  // Observer for loading next chapter when scrolling to bottom
  const bottomOptions = {
    root: null,
    rootMargin: '0px 0px -80% 0px', // Trigger when bottom 20% of chapter is visible
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  };
  
  bottomObserver.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isNavigatingToVerse.value) {
        const chapterId = parseInt(entry.target.getAttribute('data-chapter-id') || '0');
        if (chapterId) {
          // Check if we're near the bottom of this chapter
          const rect = entry.boundingClientRect;
          const viewportHeight = window.innerHeight;
          const bottomDistance = rect.bottom - viewportHeight;
          
          // Load next chapter when we're within 500px of the bottom
          if (bottomDistance < 500 && bottomDistance > -100) {
            const nextChapter = getNextChapter(chapterId);
            if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
              loadChapterVerses(nextChapter.chapter_id);
            }
          }
        }
      }
    });
  }, bottomOptions);
  
  // Observer for loading previous chapter when scrolling to top
  const topOptions = {
    root: null,
    rootMargin: '-80% 0px 0px 0px', // Trigger when top 20% of chapter is visible
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  };
  
  topObserver.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isNavigatingToVerse.value) {
        const chapterId = parseInt(entry.target.getAttribute('data-chapter-id') || '0');
        if (chapterId) {
          // Check if we're near the top of this chapter
          const rect = entry.boundingClientRect;
          const topDistance = rect.top;
          
          // Load previous chapter when we're within 500px of the top
          console.log('[topObserver] chapterId:', chapterId, 'topDistance:', topDistance, 'scrollY:', window.scrollY);
          if (topDistance < 500 && topDistance > -100) {
            const prevChapter = getPreviousChapter(chapterId);
            if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
              console.log('[topObserver] Loading prev chapter:', prevChapter.chapter_number);
              // Store current scroll position and the chapter element's position
              const currentScrollY = window.scrollY;
              const chapterTop = rect.top + window.scrollY;

              loadChapterVerses(prevChapter.chapter_id).then(async () => {
                // Wait for DOM to update
                await nextTick();
                // Calculate new position: find the chapter element again and maintain relative position
                const chapterElement = document.querySelector(`[data-chapter-id="${chapterId}"]`);
                if (chapterElement) {
                  const newRect = chapterElement.getBoundingClientRect();
                  const newChapterTop = newRect.top + window.scrollY;
                  const offset = newChapterTop - chapterTop;
                  console.log('[topObserver] compensating scroll by', offset, '→ new scrollY:', currentScrollY + offset);
                  window.scrollTo({ top: currentScrollY + offset, behavior: 'instant' });
                }
              });
            }
          }
        }
      }
    });
  }, topOptions);
  
  // Observe all chapter sections with all three observers
  chapterRefs.value.forEach((element) => {
    intersectionObserver.value?.observe(element);
    bottomObserver.value?.observe(element);
    topObserver.value?.observe(element);
  });
}

// Watch for new chapter refs and observe them
watch(() => chapterRefs.value.size, () => {
  if (intersectionObserver.value) {
    chapterRefs.value.forEach((element) => {
      intersectionObserver.value?.observe(element);
      bottomObserver.value?.observe(element);
      topObserver.value?.observe(element);
    });
  }
});

// Initialize
onMounted(async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Load all books for abbreviation mapping
    allBooks.value = await getAllBooks();
    bookAbbreviations.value = {};
    allBooks.value.forEach(b => {
      if (b.book_abbr) {
        bookAbbreviations.value[b.book_abbr.toLowerCase()] = b.book_id;
      }
      if (b.hebrew_book_abbr) {
        bookAbbreviations.value[b.hebrew_book_abbr.toLowerCase()] = b.book_id;
      }
      if (b.telugu_book_abbr) {
        bookAbbreviations.value[b.telugu_book_abbr.toLowerCase()] = b.book_id;
      }
    });
    
    // Determine book ID from route
    let bookId: number;
    let targetChapterNumber: string | null = null;
    let targetVerseNumber: number | null = null;
    
    if (route.params.bookName) {
      // New URL format: /:bookName/:chapterNumber/:verseNumber
      const bookName = String(route.params.bookName).replace(/-/g, ' ');
      const foundBook = allBooks.value.find(b => 
        b.book_name.toLowerCase() === bookName.toLowerCase()
      );
      
      if (!foundBook) {
        error.value = `Book not found: ${bookName}`;
        loading.value = false;
        return;
      }
      
      bookId = foundBook.book_id;
      targetChapterNumber = route.params.chapterNumber ? String(route.params.chapterNumber) : null;
      targetVerseNumber = route.params.verseNumber ? Number(route.params.verseNumber) : null;
    } else if (route.params.id) {
      // Old URL format: /chapters/:id
      bookId = Number(route.params.id);
      if (isNaN(bookId)) {
        error.value = 'Invalid book ID';
        loading.value = false;
        return;
      }
    } else {
      // reading-pane route — check for bookId passed via router state, else default to Genesis
      const stateBookId = window.history.state?.bookId as number | undefined;
      const defaultBook = stateBookId
        ? allBooks.value.find(b => b.book_id === stateBookId)
        : allBooks.value.find(b => b.book_name.toLowerCase() === 'genesis') ?? allBooks.value[0];
      if (!defaultBook) {
        error.value = 'No books available';
        loading.value = false;
        return;
      }
      bookId = defaultBook.book_id;
    }
    
    // Load book and chapters
    book.value = await getBookById(bookId);
    
    chapters.value = await getChaptersByBookId(bookId);
    
    // Check for query parameters (for old format cross-references)
    const queryChapterId = route.query.chapterId ? Number(route.query.chapterId) : null;
    const queryVerseId = route.query.verseId ? Number(route.query.verseId) : null;
    
    // Determine which chapter to select
    let targetChapter: Chapter | null = null;
    let scrollToVerseId: number | null = null;
    
    if (targetChapterNumber) {
      // New URL format with chapter number
      targetChapter = chapters.value.find(ch => String(ch.chapter_number) === targetChapterNumber) ?? null;
      
      if (!targetChapter) {
        console.error('onMounted: Could not find chapter with chapter_number:', targetChapterNumber);
        console.error('onMounted: Trying to parse as number and find by position...');
        const chapterIndex = parseInt(targetChapterNumber) - 1; // Try 0-indexed
        if (sortedChapters.value[chapterIndex]) {
          targetChapter = sortedChapters.value[chapterIndex];
        }
      }
      
      if (targetChapter && targetVerseNumber) {
        // Pre-load the chapter verses
        await loadChapterVerses(targetChapter.chapter_id);
        
        // Find the verse from cached data instead of making another API call
        const chapterData = loadedChapters.value.get(targetChapter.chapter_id);
        if (chapterData) {
          const verse = chapterData.verses.find(v => v.verse_index === targetVerseNumber);
          if (verse) {
            scrollToVerseId = verse.verse_id;
          }
        }
      }
    } else if (queryChapterId) {
      // Old URL format with query params
      targetChapter = chapters.value.find(ch => ch.chapter_id === queryChapterId) ?? null;
      scrollToVerseId = queryVerseId;
    }
    
    if (targetChapter) {
      // Always skipScroll here — loading=true keeps the chapter DOM hidden (v-if="loading"
      // shows the spinner overlay), so scrollToChapter would find no element. We turn off
      // loading first, wait for the DOM to render, then scroll.
      await selectChapter(targetChapter, true, !!scrollToVerseId);

      // Reveal the chapter DOM before scrolling
      loading.value = false;
      await nextTick();

      if (scrollToVerseId) {
        scrollToVerse(scrollToVerseId);
      } else {
        scrollToChapter(targetChapter.chapter_id, 'instant');
      }
    } else if (chapters.value.length > 0) {
      // Default: load and show the first chapter
      const defaultChapter = sortedChapters.value[0];
      await selectChapter(defaultChapter, true);
      loading.value = false;
      await nextTick();
      scrollToChapter(defaultChapter.chapter_id, 'instant');
    }
    
    // Setup intersection observer after initial load
    await nextTick();
    setupIntersectionObserver();
    
    // Add scroll listener for loading adjacent chapters
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add event delegation for inline verse reference clicks
    document.addEventListener('click', handleVerseRefClick);
    
    // Add document click listener to close context menu
    document.addEventListener('click', closeContextMenu);

    // Add document mouseup listener for broadcast text selection
    document.addEventListener('mouseup', handleVerseTextSelection);

    // Show parasha flash if navigated from weekly reading plan
    const state = window.history.state;
    if (state?.parashaWeek) {
      parashaFlash.value = {
        visible: true,
        week: state.parashaWeek,
        name: state.parashaName ?? '',
        torahText: state.parashaTorahText ?? '',
        ncText: state.parashaNcText ?? '',
      };
      parashaFlashTimer = setTimeout(() => {
        parashaFlash.value.visible = false;
      }, 20000);
    }

  } catch (err: any) {
    error.value = err.message || 'Failed to load chapters';
    console.error('Error loading chapters:', err);
  } finally {
    loading.value = false;
  }
});

// Watch for route changes (when navigating to different book or chapter via verse picker)
watch(() => [route.params.id, route.params.bookName, route.params.chapterNumber, route.params.verseNumber] as const,
  async ([newId, newBookName, newChapterNumber, newVerseNumber], [oldId, oldBookName, oldChapterNumber, oldVerseNumber]) => {
  // Skip on initial mount: old values are all undefined when the component first renders.
  // onMounted handles the initial load; this watch is only for subsequent in-app navigations.
  console.log('[watch] fired old:', [oldId, oldBookName, oldChapterNumber, oldVerseNumber], 'new:', [newId, newBookName, newChapterNumber, newVerseNumber]);
  if (oldId === undefined && oldBookName === undefined && oldChapterNumber === undefined && oldVerseNumber === undefined) {
    console.log('[watch] SKIPPING — initial mount');
    return;
  }

  // Check if book or chapter/verse changed
  const bookChanged = (newId && newId !== oldId) || (newBookName && newBookName !== oldBookName);
  const sameBookNavigated = !bookChanged && ((newChapterNumber && newChapterNumber !== oldChapterNumber) || (newVerseNumber && newVerseNumber !== oldVerseNumber));
  
  if (sameBookNavigated && newChapterNumber) {
    // Same book, but chapter or verse changed — navigate within current book
    const targetChapterNumber = String(newChapterNumber);
    const targetVerseNumber = newVerseNumber ? Number(newVerseNumber) : null;
    const targetChapter = chapters.value.find(ch => String(ch.chapter_number) === targetChapterNumber) ?? null;
    
    if (targetChapter) {
      let scrollToVerseId: number | null = null;
      if (targetVerseNumber) {
        let chapterData = loadedChapters.value.get(targetChapter.chapter_id);
        if (!chapterData) {
          await loadChapterVerses(targetChapter.chapter_id);
          chapterData = loadedChapters.value.get(targetChapter.chapter_id);
        }
        if (chapterData) {
          const verse = chapterData.verses.find(v => v.verse_index === targetVerseNumber);
          if (verse) scrollToVerseId = verse.verse_id;
        }
      }
      await selectChapter(targetChapter, !!scrollToVerseId, !!scrollToVerseId);
      if (scrollToVerseId) {
        await nextTick();
        scrollToVerse(scrollToVerseId);
      }
    }
    return;
  }
  
  if (bookChanged) {
    loading.value = true;
    error.value = null;
    
    try {
      // Determine book ID from route
      let bookId: number;
      let targetChapterNumber: string | null = null;
      let targetVerseNumber: number | null = null;
      
      if (newBookName) {
        // New URL format
        const bookName = String(newBookName).replace(/-/g, ' ');
        const foundBook = allBooks.value.find(b => 
          b.book_name.toLowerCase() === bookName.toLowerCase()
        );
        
        if (!foundBook) {
          error.value = `Book not found: ${bookName}`;
          loading.value = false;
          return;
        }
        
        bookId = foundBook.book_id;
        targetChapterNumber = newChapterNumber ? String(newChapterNumber) : null;
        targetVerseNumber = newVerseNumber ? Number(newVerseNumber) : null;
      } else if (newId) {
        // Old URL format
        bookId = Number(newId);
        if (isNaN(bookId)) {
          error.value = 'Invalid book ID';
          loading.value = false;
          return;
        }
      } else {
        return;
      }

      // Clear previous data
      loadedChapters.value.clear();
      selectedChapter.value = null;
      selectedChapterId.value = null;
      
      // Load new book and chapters
      book.value = await getBookById(bookId);
      chapters.value = await getChaptersByBookId(bookId);
      
      // Determine which chapter to select
      let targetChapter: Chapter | null = null;
      let scrollToVerseId: number | null = null;
      
      if (targetChapterNumber) {
        // New URL format with chapter number
        targetChapter = chapters.value.find(ch => String(ch.chapter_number) === targetChapterNumber) ?? null;
        
        if (targetChapter && targetVerseNumber) {
          // Pre-load the chapter verses before selecting
          await loadChapterVerses(targetChapter.chapter_id);
          
          // Use cached data instead of making another API call
          const chapterData = loadedChapters.value.get(targetChapter.chapter_id);
          if (chapterData) {
            const verse = chapterData.verses.find(v => v.verse_index === targetVerseNumber);
            if (verse) {
              scrollToVerseId = verse.verse_id;
            }
          }
        }
      } else {
        // Check for query parameters (old format)
        const queryChapterId = route.query.chapterId ? Number(route.query.chapterId) : null;
        const queryVerseId = route.query.verseId ? Number(route.query.verseId) : null;
        
        if (queryChapterId) {
          targetChapter = chapters.value.find(ch => ch.chapter_id === queryChapterId) ?? null;
          scrollToVerseId = queryVerseId;
        }
      }
      
      if (targetChapter) {
        // Skip chapter scroll and adjacent loading if we're going to scroll to a specific verse
        await selectChapter(targetChapter, !!scrollToVerseId, !!scrollToVerseId);
        if (scrollToVerseId) {
          await nextTick();
          scrollToVerse(scrollToVerseId);
        }
      } else if (chapters.value.length > 0) {
        // Select first chapter by default
        await selectChapter(sortedChapters.value[0]);
      }
      
      // Setup intersection observer for new content
      await nextTick();
      setupIntersectionObserver();
      
      // Reset scroll tracking
      lastScrollY.value = window.scrollY;
      
    } catch (err: any) {
      error.value = err.message || 'Failed to load chapters';
      console.error('Error loading chapters:', err);
    } finally {
      loading.value = false;
    }
  }
});

// Watch for loaded chapters and re-apply highlight if needed
watch(() => loadedChapters.value.size, async () => {
  // If we have a verse that should be highlighted, re-apply the highlight
  if (highlightedVerseId.value) {
    await nextTick();
    const verseElement = document.querySelector(`[data-verse-id="${highlightedVerseId.value}"]`);
    if (verseElement && !verseElement.classList.contains('highlight-verse')) {
      verseElement.classList.add('highlight-verse');
    }
  }
});

// Cleanup
onUnmounted(() => {
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect();
  }
  if (bottomObserver.value) {
    bottomObserver.value.disconnect();
  }
  if (topObserver.value) {
    topObserver.value.disconnect();
  }
  // Clear highlight timeout
  if (highlightTimeout.value) {
    clearTimeout(highlightTimeout.value);
  }
  if (parashaFlashTimer) {
    clearTimeout(parashaFlashTimer);
  }
  // Remove event listeners
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleVerseRefClick);
  document.removeEventListener('click', closeContextMenu);
  document.removeEventListener('mouseup', handleVerseTextSelection);
  document.removeEventListener('mousemove', onTooltipDragMove);
  document.removeEventListener('mouseup', onTooltipDragEnd);
});

defineExpose({ showCrossRefTooltip });
</script>

<style scoped>
.chapters-page {
  min-height: 100vh;
}

.chapters-page.broadcast-mode {
  width: 100%;
  max-width: 100%;
  margin-right: 30%;
  box-sizing: border-box;
}

.content-wrapper {
  width: 100%;
}

.content-wrapper.broadcast-mode {
  min-height: 100vh;
}

.content-layout {
  width: 100%;
}

.content-wrapper.broadcast-mode .content-layout {
  display: flex;
  flex-direction: column;
}

.content-wrapper.broadcast-mode .content-layout {
  display: block;
}

.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-nav);
}

.chapters-page.broadcast-mode .top-nav {
  right: 30%;
}

.nav-container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.content-wrapper.broadcast-mode .nav-container {
  max-width: none;
  margin: 0;
  padding: 0 1rem;
}

.chapter-content {
  position: relative; /* For absolute positioning of content-loading-overlay */
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-card-padding);
  margin: 90px auto 2rem auto;
  max-width: 900px;
  box-shadow: var(--shadow-sm);
  min-height: 400px;
}

.content-wrapper.broadcast-mode .chapter-content {
  margin: 90px 0 2rem 0;
  padding: 2rem 1rem;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  background: white;
  border-radius: 0;
  box-shadow: none;
  min-height: calc(100vh - 100px);
}

.verse-picker-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgb(255 255 255 / 0.95);
  border: none;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default), box-shadow var(--duration-fast) var(--ease-default);
  font-size: 1rem;
  color: var(--color-foreground);
  min-width: 0;
  box-shadow: var(--shadow-card);
}

.verse-picker-button:hover {
  background: white;
  box-shadow: var(--shadow-nav);
}

.book-names {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.hebrew-book-name {
  font-size: 1.1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.book-name {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  opacity: 0.8;
}

.telugu-book-name {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  opacity: 0.7;
}

.chapter-verse {
  font-size: 0.9rem;
  color: var(--color-primary);
  font-weight: 600;
  white-space: nowrap;
}

.chevron-icon {
  flex-shrink: 0;
  color: var(--color-muted-foreground);
  transition: color var(--duration-fast) var(--ease-default);
}

.verse-picker-button:hover .chevron-icon {
  color: var(--color-primary);
}

.nav-back-btn {
  background: rgb(255 255 255 / 0.2);
  border: none;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--duration-fast) var(--ease-default), box-shadow var(--duration-fast) var(--ease-default);
  flex-shrink: 0;
  color: white;
}

.nav-back-btn:hover {
  background: rgb(255 255 255 / 0.3);
  box-shadow: var(--shadow-nav);
}

.nav-right-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.search-icon,
.settings-icon {
  background: rgb(255 255 255 / 0.2);
  border: none;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--duration-fast) var(--ease-default), box-shadow var(--duration-fast) var(--ease-default);
  flex-shrink: 0;
  color: white;
}

.search-icon:hover,
.settings-icon:hover {
  background: rgb(255 255 255 / 0.3);
  box-shadow: var(--shadow-nav);
}

.search-icon:active,
.settings-icon:active {
  transform: translateY(0);
}

.search-icon svg,
.settings-icon svg {
  width: 24px;
  height: 24px;
}

.toggle-buttons-container {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-default);
  background: var(--color-card);
  color: var(--color-muted-foreground);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.toggle-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.toggle-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.toggle-btn.active:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.continuous-scroll-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.chapter-section {
  scroll-margin-top: 150px; /* Account for sticky header */
}

.book-header {
  padding: 2rem 0 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--color-border);
  text-align: center !important;
}

.book-header h1 {
  margin: 0;
  text-align: right;
  color: var(--color-foreground);
}

.chapter-indicator {
  display: block;
  font-family: var(--font-family-chapter);
  font-size: 3rem;
  line-height: 1;
  text-align: right;
  color: var(--color-primary);
  font-weight: 700;
}

.book-description {
  text-align: center;
  color: var(--color-muted-foreground);
  font-size: 0.95rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
  font-style: italic;
}

.book-header-section,
.book-footer-section {
  padding: 2rem;
  margin: 2rem 0;
  background-color: var(--color-background-alt);
  border-radius: var(--radius-sm);
}

.book-header-section {
  margin-top: 100px;
  border-bottom: 4px solid var(--color-primary);
}

.book-footer-section {
  margin-bottom: 0;
  border-top: 4px solid var(--color-primary);
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.book-header-content,
.book-footer-content {
  line-height: var(--leading-reading);
  color: var(--color-neutral-800);
  text-align: left;
}

.loading, .error, .select-prompt, .no-verses {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: var(--color-muted-foreground);
}

.error {
  color: var(--color-error);
}

.loading-adjacent {
  text-align: center;
  padding: 1rem;
  color: var(--color-muted-foreground);
  font-style: italic;
}

.chapter-nav-buttons {
  display: none; /* Hide the manual navigation buttons for cleaner UI */
}

@media (max-width: 768px) {
  .top-nav {
    padding: 0.5rem;
  }
  
  .chapter-content {
    padding: 1rem;
    margin: 80px 0.5rem 1rem 0.5rem;
  }
}

.verses-list {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.verse-item {
  line-height: var(--leading-reading);
  padding: var(--spacing-verse-gap);
  transition: background var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default);
  cursor: pointer;
}

.verse-item.highlight-verse {
  background: linear-gradient(90deg, var(--color-highlight-from) 0%, var(--color-highlight-to) 100%);
  animation: highlightPulse 0.6s ease-out;
}

.verse-item.verse-selected {
  border-radius: var(--radius-default);
  box-shadow: var(--shadow-card), inset 0 1px 0 rgb(255 255 255 / 0.8);
  background: linear-gradient(180deg, var(--color-selected-from) 0%, var(--color-selected-to) 100%);
}

/* Verse action bar (share) */
.verse-actions {
  position: relative;
  margin-top: 0.5rem;
  padding-top: 0.35rem;
  border-top: 1px solid rgb(0 0 0 / 0.07);
}

.verse-actions-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.verse-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-neutral-600);
  background: rgb(0 0 0 / 0.05);
  border: 1px solid rgb(0 0 0 / 0.1);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default), color var(--duration-fast) var(--ease-default);
  line-height: 1.4;
}

.verse-action-btn:hover,
.verse-action-btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-color: rgb(30 64 175 / 0.3);
}

.copied-feedback {
  font-size: 0.72rem;
  color: var(--color-primary);
  font-weight: 500;
  animation: fadeInOut 2s ease forwards;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-4px); }
  15% { opacity: 1; transform: translateY(0); }
  75% { opacity: 1; }
  100% { opacity: 0; }
}

.share-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  background: var(--color-card);
  border: 1px solid rgb(0 0 0 / 0.12);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.12);
  min-width: 150px;
  overflow: hidden;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.85rem;
  font-size: 0.82rem;
  color: var(--color-neutral-800);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--duration-fast) var(--ease-default);
}

.share-option:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

@keyframes highlightPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 193, 7, 0);
  }
  100% {
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
  }
}

.verse-main {
  display: block;
}

.verse-number {
  display: inline;
  font-weight: 700;
  color: var(--color-primary);
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.hide-superscript :deep(sup) {
  display: none;
}

.verse-text {
  display: inline;
  color: var(--color-neutral-800);
  font-family: var(--font-family-body);
}

.bold-text {
  font-weight: 600;
}

:deep(.verse-text p) {
  display: inline;
  margin: 0;
  padding: 0;
}

.verse-telugu {
  display: block;
  color: var(--color-muted-foreground);
  font-size: 0.95rem;
  margin-top: 0.125rem;
  text-align: left;
  font-family: var(--font-family-telugu);
}

.verse-telugu.inline {
  display: inline;
  margin-top: 0;
}

:deep(.verse-telugu p) {
  margin: 0;
  padding: 0;
}

:deep(.verse-telugu.inline p) {
  display: inline;
}

.verse-links {
  display: block;
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.link-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: background var(--duration-fast) var(--ease-default), color var(--duration-fast) var(--ease-default);
}

.link-badge:hover {
  background: var(--color-primary);
  color: white;
}

.verse-cross-references {
  display: block;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
}

.cross-ref-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-success);
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
}

.cross-ref-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  margin: 0.25rem 0.25rem 0.25rem 0;
  background: #D1FAE5;
  color: #065F46;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  transition: background var(--duration-fast) var(--ease-default), color var(--duration-fast) var(--ease-default), border-color var(--duration-fast) var(--ease-default);
  border: 1px solid #A7F3D0;
}

.cross-ref-badge:hover {
  background: var(--color-success);
  color: white;
  border-color: #059669;
}

.cross-ref-more {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--color-success);
  font-weight: 600;
  font-style: normal;
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  background: #F0FDF4;
  border-radius: var(--radius-sm);
  border: 1px solid #BBF7D0;
  vertical-align: middle;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default), border-color var(--duration-fast) var(--ease-default);
}

.cross-ref-more:hover {
  background: #DCFCE7;
  border-color: #059669;
}

/* Inline verse references within text */
:deep(.inline-verse-ref) {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px dotted var(--color-primary);
  transition: color var(--duration-fast) var(--ease-default), border-color var(--duration-fast) var(--ease-default);
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0;
}

:deep(.inline-verse-ref:hover) {
  color: var(--color-primary-hover);
  border-bottom: 1px solid var(--color-primary-hover);
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-tooltip);
  z-index: 10000;
  padding: 4px 0;
}

.context-menu-item {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background var(--duration-normal) var(--ease-default);
}

.context-menu-item:hover {
  background: var(--color-background-alt);
}

/* Cross-Reference Tooltip */
.chapters-page-tint {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 1);
  z-index: 10000;
  pointer-events: all;
}

.chapters-page-tint.broadcast-mode {
  right: 30%;
}

body {
  background-color: black;
}

.cross-ref-tooltip {
  position: fixed;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-tooltip);
  z-index: 10001;
  min-width: 300px;
  max-width: 700px;
  overflow: hidden;
  max-height: 70vh;
  user-select: none;
}

.cross-ref-tooltip.broadcast-mode {
  max-width: calc(70vw - 2rem);
  width: calc(70vw - 2rem);
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background-alt);
  border-bottom: 1px solid var(--color-border);
  gap: 8px;
  cursor: move;
}

.tooltip-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-neutral-800);
  flex: 1;
}

.tooltip-popout {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted-foreground);
  transition: color var(--duration-normal) var(--ease-default);
  border-radius: var(--radius-sm);
}

.tooltip-popout:hover {
  color: var(--color-primary);
  background: var(--color-border);
}

.tooltip-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  color: var(--color-muted-foreground);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-normal) var(--ease-default);
  border-radius: var(--radius-sm);
}

.tooltip-close:hover {
  color: var(--color-neutral-800);
  background: var(--color-border);
}

.tooltip-content {
  padding: 16px;
  max-height: 50vh;
  overflow-y: auto;
}

.tooltip-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
}

.tooltip-loading .loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
}

.tooltip-loading p {
  margin: 0;
  font-size: 14px;
  color: var(--color-muted-foreground);
}

.tooltip-verse {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--color-neutral-800);
  text-align: left;
  font-family: var(--font-family-body);
}

.tooltip-verse.telugu-verse {
  font-family: var(--font-family-telugu);
  margin-top: 10px;
  text-align: left;
}

.broadcast-mode-right-panel {
  display: none;
}

@media (min-width: 1200px) {
  .content-layout.broadcast-mode {
    display: grid;
    grid-template-columns: 1fr;
  }

  .broadcast-mode-right-panel {
    display: block;
  }

  .panel-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    color: #999;
    text-align: center;
    font-size: 14px;
  }

  .panel-placeholder p {
    margin: 0;
  }
}

/* Mobile responsive tooltip */
@media (max-width: 768px) {
  .cross-ref-tooltip {
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 92%;
    max-width: 92%;
    max-height: 80vh;
  }

  .tooltip-content {
    max-height: calc(80vh - 56px);
  }
}

/* Loading Overlays */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(255 255 255 / 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(8px);
}

.content-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(255 255 255 / 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(8px);
  border-radius: var(--radius-lg);
}

.loading-overlay p,
.content-loading-overlay p {
  color: var(--color-foreground);
  font-size: 18px;
  margin-top: 1.5rem;
  font-weight: 600;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.verse-notes {
  display: block;
  margin-top: 0.75rem;
  padding: 2px;
  background: linear-gradient(to left, var(--color-note-bg), transparent);
  border-radius: var(--radius-sm);
}

.note-item {
  display: block;
  margin-bottom: 0.5rem;
}

.note-item:last-child {
  margin-bottom: 0;
}

.note-title {
  font-weight: 600;
  color: var(--color-note-title);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.note-content {
  color: var(--color-note-text);
  font-size: 0.85rem;
  line-height: 1.5;
}

.admin-notes {
  border-left: 3px solid #8B4513;
  padding-left: 0.6rem;
}

.my-notes {
  border-left: 3px solid #4D7C0F;
  padding-left: 0.6rem;
  margin-top: 0.5rem;
}

.note-inline-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.note-icon-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 5px;
  font-size: 0.7rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}

.note-icon-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

.note-add-row {
  margin-top: 0.5rem;
}

.note-add-btn {
  border: 1.5px dashed #b5aca0;
  background: transparent;
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  min-height: 36px;
  transition: all 0.15s ease;
}

.note-add-btn:hover {
  border-color: #8B4513;
  color: #8B4513;
}

.note-edit-textarea {
  width: 100%;
  min-height: 60px;
  padding: 0.5rem 0.65rem;
  border: 1.5px solid #d8d2c9;
  border-radius: 8px;
  font-size: 0.85rem;
  font-family: inherit;
  resize: vertical;
}

.note-edit-textarea:focus {
  outline: none;
  border-color: #8B4513;
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.15);
}

.note-edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.note-save-btn,
.note-cancel-btn {
  min-height: 34px;
  padding: 0.3rem 0.9rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.note-save-btn {
  background: #8B4513;
  color: #fff;
}

.note-cancel-btn {
  background: rgba(0, 0, 0, 0.08);
  color: #333;
}

.note-delete-btn {
  min-height: 34px;
  padding: 0.3rem 0.9rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: #fef2f2;
  color: #b91c1c;
  margin-left: auto;
}

.paleobora-text {
  font-family: 'PaleoBora', serif !important;
  font-size: 1.1rem;
}

.verse-text :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.verse-telugu :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.note-content :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.book-header-content :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.book-footer-content :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.tooltip-verse :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.broadcast-crossref-verse :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

@media (max-width: 768px) {
  .chapters-page {
    padding: 0;
  }
  
  .top-nav {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .verse-picker-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }

  .book-name {
    font-size: 0.95rem;
  }

  .chapter-verse {
    font-size: 0.85rem;
  }
  
  .chapter-content {
    padding: 0.75rem;
    border-radius: 0;
  }
  
  .book-header {
    text-align: center;
  }
  
  .book-header h1 {
    font-size: 1.5rem;
    text-align: center;
  }

  .book-header-section,
  .book-footer-section {
    padding: 1rem;
    margin: 1rem 0;
  }

  .book-header-section {
    margin-top: 100px;
  }

  .section-title {
    font-size: 1.1rem;
  }
  
  .verse-item {
    gap: 0.5rem;
    font-size: 0.95rem;
  }
  
  .verse-number {
    min-width: 25px;
    font-size: 0.85rem;
  }
}

/* Search Results Navigation Bar — enter/exit driven by motion-v (AnimatePresence + spring) */
.search-navigation-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 24px rgb(102 126 234 / 0.4);
  z-index: 999;
}

.clear-search-btn {
  background: rgb(255 255 255 / 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--duration-normal) var(--ease-default);
}

.clear-search-btn:hover {
  background: rgb(255 255 255 / 0.3);
}

.search-results-text {
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  min-width: 80px;
  text-align: center;
}

.search-nav-buttons {
  display: flex;
  gap: 0.5rem;
}

.search-nav-btn {
  background: rgb(255 255 255 / 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--duration-normal) var(--ease-default);
}

.search-nav-btn:hover {
  background: rgb(255 255 255 / 0.3);
}

@media (max-width: 768px) {
  .search-navigation-bar {
    bottom: 1rem;
    padding: 0.5rem 1rem;
    gap: 0.75rem;
  }

  .search-results-text {
    font-size: 0.9rem;
    min-width: 60px;
  }
}

/* Parasha flash notification */
.parasha-flash {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #3b1f0a, #5c2d0e);
  color: #fff;
  border-radius: 18px;
  padding: 1.4rem 1.6rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
  max-width: min(600px, calc(100vw - 2rem));
  cursor: pointer;
  user-select: none;
}

.parasha-flash-inner {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}

.parasha-flash-week {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #f59e0b;
  opacity: 0.9;
}

.parasha-flash-name {
  font-size: 1.45rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.parasha-flash-readings {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.3rem;
}

.parasha-flash-torah {
  font-size: 1rem;
  color: #fde68a;
  font-weight: 500;
}

.parasha-flash-divider {
  font-size: 1rem;
  color: rgba(255,255,255,0.35);
}

.parasha-flash-nc {
  font-size: 1rem;
  color: #93c5fd;
  font-weight: 500;
}

.parasha-flash-close {
  flex-shrink: 0;
  background: rgba(255,255,255,0.12);
  border: none;
  color: rgba(255,255,255,0.7);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s ease;
  padding: 0;
}

.parasha-flash-close:hover {
  background: rgba(255,255,255,0.22);
  color: #fff;
}

/* Transition */
.parasha-flash-enter-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.parasha-flash-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.parasha-flash-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.88);
}
.parasha-flash-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.94);
}
</style>
