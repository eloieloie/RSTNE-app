# Graph Report - RSTNE-app  (2026-08-02)

## Corpus Check
- 56 files · ~318,888 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 168 nodes · 219 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `449cfea3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ChaptersView.vue
- package.json
- dependencies
- loadChapterVerses
- buildVerseShareContent
- formatVerseWithPaleoBora
- emit
- onTooltipDragEnd
- main.ts

## God Nodes (most connected - your core abstractions)
1. `loadChapterVerses()` - 11 edges
2. `navigateToVerse()` - 10 edges
3. `scripts` - 7 edges
4. `error` - 7 edges
5. `getPreviousChapter()` - 6 edges
6. `getNextChapter()` - 6 edges
7. `selectChapter()` - 6 edges
8. `loadBookInPlace()` - 6 edges
9. `loadAdjacentChapters()` - 5 edges
10. `handleScroll()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `handleTooltipVerseRefClick()` --calls--> `error`  [EXTRACTED]
  src/views/ChaptersView.vue → src/views/ChaptersView.vue  _Bridges community 3 → community 5_

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "ChaptersView.vue"
Cohesion: 0.02
Nodes (72): allBooks, boldVerseText, Book, bookAbbreviations, bottomObserver, broadcastMode, broadcastPanelVerse, Chapter (+64 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (22): cheerio, concurrently, devDependencies, cheerio, concurrently, typescript, vite, @vitejs/plugin-vue (+14 more)

### Community 2 - "dependencies"
Cohesion: 0.10
Nodes (21): bootstrap, cors, dotenv, express, motion-v, mysql2, node-fetch, dependencies (+13 more)

### Community 3 - "loadChapterVerses"
Cohesion: 0.17
Nodes (21): error, getChapterIndex(), getNextChapter(), getPreviousChapter(), goToNextSearchResult(), goToPreviousSearchResult(), handleGoToVerse(), handleScroll() (+13 more)

### Community 4 - "buildVerseShareContent"
Cohesion: 0.33
Nodes (6): buildVerseShareContent(), buildVerseShareText(), copyVerseLink(), copyVerseText(), getVerseShareUrl(), nativeShareVerse()

### Community 5 - "formatVerseWithPaleoBora"
Cohesion: 0.50
Nodes (5): formatVerseWithPaleoBora(), getTooltipCenterPosition(), handleTooltipVerseRefClick(), handleVerseRefClick(), showCrossRefTooltip()

### Community 6 - "emit"
Cohesion: 0.67
Nodes (3): emit, handleSettingsChange(), handleVerseTextSelection()

### Community 7 - "onTooltipDragEnd"
Cohesion: 1.00
Nodes (3): onTooltipDragEnd(), onTooltipDragMove(), startTooltipDrag()

## Knowledge Gaps
- **98 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ChaptersView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.023809523809523808 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._