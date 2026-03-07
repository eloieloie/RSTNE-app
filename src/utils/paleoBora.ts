// PaleoBora image generation utility
// Generates a portrait verse share card with PaleoBora words rendered inline.

const PALEO_WORDS = ['HWHY', 'hwhy', 'OSWHY', 'oswhy', 'MYHLA', 'Myhla', 'myhla'] as const;
export type PaleoWord = typeof PALEO_WORDS[number];
const PALEO_SET = new Set<string>(PALEO_WORDS);

interface TextRun {
  text: string;
  font: 'regular' | 'paleo' | 'telugu';
}

function tokenize(text: string, base: 'regular' | 'telugu'): TextRun[] {
  const pattern = new RegExp(`(${PALEO_WORDS.join('|')})`, 'g');
  const parts = text.split(pattern);
  return parts
    .filter(p => p.length > 0)
    .map(p => ({ text: p, font: PALEO_SET.has(p) ? 'paleo' : base }));
}

function applyFont(ctx: CanvasRenderingContext2D, run: TextRun, sizePx: number) {
  if (run.font === 'paleo') {
    ctx.font = `${sizePx}px PaleoBora, serif`;
  } else if (run.font === 'telugu') {
    ctx.font = `${sizePx}px "Noto Sans Telugu", sans-serif`;
  } else {
    ctx.font = `${sizePx}px Georgia, serif`;
  }
}

function measureRun(ctx: CanvasRenderingContext2D, run: TextRun, sizePx: number): number {
  applyFont(ctx, run, sizePx);
  return ctx.measureText(run.text).width;
}

function drawRun(ctx: CanvasRenderingContext2D, run: TextRun, x: number, y: number, sizePx: number, color: string) {
  applyFont(ctx, run, sizePx);
  ctx.fillStyle = color;
  ctx.fillText(run.text, x, y);
}

function wrapRuns(ctx: CanvasRenderingContext2D, runs: TextRun[], maxWidth: number, sizePx: number): TextRun[][] {
  const lines: TextRun[][] = [];
  let currentLine: TextRun[] = [];
  let currentWidth = 0;

  const wordRuns: TextRun[] = [];
  for (const run of runs) {
    if (run.font === 'paleo') {
      wordRuns.push(run);
    } else {
      const parts = run.text.split(/(\s+)/);
      for (const part of parts) {
        if (part.length > 0) wordRuns.push({ text: part, font: run.font });
      }
    }
  }

  for (const wr of wordRuns) {
    const w = measureRun(ctx, wr, sizePx);
    if (currentWidth + w > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      if (wr.text.trim().length === 0) {
        currentLine = [];
        currentWidth = 0;
      } else {
        currentLine = [wr];
        currentWidth = w;
      }
    } else {
      currentLine.push(wr);
      currentWidth += w;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);
  return lines;
}

/**
 * Generates a portrait verse share card as a PNG File.
 * The URL is embedded as a footer inside the image so only one file is shared.
 */
export async function generateVerseCardImage(params: {
  reference: string;
  englishText?: string;
  teluguText?: string;
  verseNotes?: Array<{ note_title?: string | null; note_content: string }>;
  verseUrl?: string;
  fontSizePx?: number;
}): Promise<File> {
  const { reference, englishText, teluguText, verseNotes, verseUrl, fontSizePx = 18 } = params;

  await Promise.all([
    document.fonts.load(`${fontSizePx * 2}px PaleoBora`),
    document.fonts.load(`${fontSizePx * 2}px Georgia`),
  ]);

  // Portrait canvas — 400 logical px wide, rendered at 3× for sharpness
  const CANVAS_WIDTH = 400;
  const DPR = 3; // device pixel ratio — higher = sharper image
  const SCALE = CANVAS_WIDTH / 720;                     // ~0.56x scale factor relative to 720 base
  const FONT_SIZE = Math.round(fontSizePx * SCALE * 1.6);
  const PADDING = Math.round(60 * SCALE);
  const MAX_TEXT_WIDTH = CANVAS_WIDTH - PADDING * 2;
  const LINE_HEIGHT = FONT_SIZE * 1.65;
  const SECTION_GAP = FONT_SIZE * 1.0;

  const BG_TOP = '#0f0c29';
  const BG_BOTTOM = '#1a1a2e';
  const ACCENT_COLOR = '#a78bfa';
  const REFERENCE_COLOR = '#c4b5fd';
  const TEXT_COLOR = '#f3f4f6';
  const TELUGU_COLOR = '#e2e8f0';
  const NOTES_COLOR = '#e2e8f0';
  const NOTES_LABEL_COLOR = '#7c6fd4';
  const DIVIDER_COLOR = '#4b3fa0';
  const URL_COLOR = '#7c6fd4';
  const FOOTER_APP_COLOR = '#a78bfa';

  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d')!;

  const NOTE_FONT_SIZE = Math.round(FONT_SIZE * 0.88);
  const NOTE_LINE_HEIGHT = NOTE_FONT_SIZE * 1.55;

  type LineGroup = { runs: TextRun[][]; color: string; sizePx: number; lineH: number };
  const groups: LineGroup[] = [];

  if (englishText?.trim()) {
    const runs = tokenize(englishText.trim(), 'regular');
    groups.push({ runs: wrapRuns(mctx, runs, MAX_TEXT_WIDTH, FONT_SIZE), color: TEXT_COLOR, sizePx: FONT_SIZE, lineH: LINE_HEIGHT });
  }
  if (teluguText?.trim()) {
    const runs = tokenize(teluguText.trim(), 'telugu');
    groups.push({ runs: wrapRuns(mctx, runs, MAX_TEXT_WIDTH, FONT_SIZE), color: TELUGU_COLOR, sizePx: FONT_SIZE, lineH: LINE_HEIGHT });
  }

  // Notes groups — each note rendered at smaller size
  interface NoteGroup { titleLines: string[]; contentRuns: TextRun[][] }
  const noteGroups: NoteGroup[] = [];
  if (verseNotes && verseNotes.length > 0) {
    for (const note of verseNotes) {
      const titleLines: string[] = [];
      if (note.note_title?.trim()) titleLines.push(stripHtmlKeepPaleo(note.note_title.trim()));
      const contentRuns = note.note_content?.trim()
        ? wrapRuns(mctx, tokenize(stripHtmlKeepPaleo(note.note_content.trim()), 'regular'), MAX_TEXT_WIDTH, NOTE_FONT_SIZE)
        : [];
      noteGroups.push({ titleLines, contentRuns });
    }
  }

  let totalLines = 0;
  for (const g of groups) totalLines += g.runs.length;

  const REF_FONT_SIZE = Math.round(FONT_SIZE * 1.15);
  const URL_FONT_SIZE = Math.round(FONT_SIZE * 0.62);
  const APP_FONT_SIZE = Math.round(FONT_SIZE * 0.68);
  const LOGO_AREA = REF_FONT_SIZE * 1.2; // just enough for reference line + small top pad
  const refHeight = REF_FONT_SIZE * 1.8;
  const dividerH = 2 + SECTION_GAP;
  const contentHeight = totalLines * LINE_HEIGHT + Math.max(0, groups.length - 1) * SECTION_GAP;

  let notesHeight = 0;
  if (noteGroups.length > 0) {
    notesHeight += SECTION_GAP * 1.5; // gap + "Notes" label line
    notesHeight += NOTE_LINE_HEIGHT; // label row
    for (const ng of noteGroups) {
      notesHeight += ng.titleLines.length * NOTE_LINE_HEIGHT;
      notesHeight += ng.contentRuns.length * NOTE_LINE_HEIGHT;
      notesHeight += NOTE_LINE_HEIGHT * 0.5; // between notes
    }
  }

  const urlAreaHeight = verseUrl ? URL_FONT_SIZE * 2.4 : 0;
  const footerHeight = APP_FONT_SIZE * 2.2;

  // Height is purely content-driven — no minimum ratio
  const contentTotal = PADDING + LOGO_AREA + refHeight + dividerH + SECTION_GAP + contentHeight + notesHeight + SECTION_GAP + urlAreaHeight + footerHeight + PADDING;
  const CANVAS_HEIGHT = Math.ceil(contentTotal);

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH * DPR;
  canvas.height = CANVAS_HEIGHT * DPR;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPR, DPR); // all drawing in logical px; output is DPR× sharper

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, BG_TOP);
  grad.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Left accent bar (rounded)
  const BAR_W = Math.round(6 * SCALE);
  const BAR_RADIUS = BAR_W / 2;
  ctx.fillStyle = ACCENT_COLOR;
  ctx.beginPath();
  ctx.roundRect(0, PADDING, BAR_W, CANVAS_HEIGHT - PADDING * 2, BAR_RADIUS);
  ctx.fill();

  // Subtle top glow
  const glowGrad = ctx.createRadialGradient(CANVAS_WIDTH / 2, 0, 0, CANVAS_WIDTH / 2, 0, CANVAS_WIDTH * 0.7);
  glowGrad.addColorStop(0, 'rgba(167,139,250,0.12)');
  glowGrad.addColorStop(1, 'rgba(167,139,250,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT / 3);

  let y = PADDING + LOGO_AREA;

  // Reference
  ctx.font = `bold ${REF_FONT_SIZE}px Georgia, serif`;
  ctx.fillStyle = REFERENCE_COLOR;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(reference, PADDING + BAR_W + Math.round(16 * SCALE), y);

  y += SECTION_GAP * 0.6;

  // Divider
  ctx.fillStyle = DIVIDER_COLOR;
  ctx.fillRect(PADDING, y, MAX_TEXT_WIDTH, 2);
  y += dividerH;

  // Content groups
  for (let gi = 0; gi < groups.length; gi++) {
    if (gi > 0) y += SECTION_GAP * 1.2;
    for (const lineRuns of groups[gi].runs) {
      let x = PADDING;
      for (const run of lineRuns) {
        drawRun(ctx, run, x, y, groups[gi].sizePx, groups[gi].color);
        x += measureRun(ctx, run, groups[gi].sizePx);
      }
      y += groups[gi].lineH;
    }
  }

  // Notes section
  if (noteGroups.length > 0) {
    y += SECTION_GAP * 1.2;
    // Thin divider above notes
    ctx.fillStyle = DIVIDER_COLOR;
    ctx.fillRect(PADDING, y, MAX_TEXT_WIDTH, 1);
    y += NOTE_LINE_HEIGHT * 0.8;

    // "Notes" label
    ctx.font = `bold ${NOTE_FONT_SIZE}px Georgia, serif`;
    ctx.fillStyle = NOTES_LABEL_COLOR;
    ctx.fillText('Notes', PADDING, y);
    y += NOTE_LINE_HEIGHT;

    for (let ni = 0; ni < noteGroups.length; ni++) {
      if (ni > 0) y += NOTE_LINE_HEIGHT * 0.4;
      const ng = noteGroups[ni];
      // Note title
      for (const titleLine of ng.titleLines) {
        ctx.font = `bold italic ${NOTE_FONT_SIZE}px Georgia, serif`;
        ctx.fillStyle = NOTES_LABEL_COLOR;
        ctx.fillText(titleLine, PADDING, y);
        y += NOTE_LINE_HEIGHT;
      }
      // Note content (mixed fonts)
      for (const lineRuns of ng.contentRuns) {
        let x = PADDING;
        for (const run of lineRuns) {
          drawRun(ctx, run, x, y, NOTE_FONT_SIZE, NOTES_COLOR);
          x += measureRun(ctx, run, NOTE_FONT_SIZE);
        }
        y += NOTE_LINE_HEIGHT;
      }
    }
  }

  // URL line — follows content directly, no empty gap
  if (verseUrl) {
    ctx.font = `${URL_FONT_SIZE}px Georgia, serif`;
    ctx.fillStyle = URL_COLOR;
    ctx.fillText(verseUrl, PADDING, y);
    y += Math.round(URL_FONT_SIZE * 1.8);
  }

  // Bottom divider
  ctx.fillStyle = DIVIDER_COLOR;
  ctx.fillRect(PADDING, y, MAX_TEXT_WIDTH, 1);
  y += Math.round(APP_FONT_SIZE * 1.6);

  // "RSTNE Bible" label — bottom right
  ctx.font = `bold ${APP_FONT_SIZE}px Georgia, serif`;
  ctx.fillStyle = FOOTER_APP_COLOR;
  ctx.textAlign = 'right';
  ctx.fillText('RSTNE Bible', CANVAS_WIDTH - PADDING, y);
  ctx.textAlign = 'left'; // reset

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'verse.png', { type: 'image/png' }));
    }, 'image/png');
  });
}

/**
 * Strips HTML tags but preserves PaleoBora words as plain text.
 */
export function stripHtmlKeepPaleo(html: string): string {
  return (html || '')
    .replace(/<span class="paleobora-text">([^<]+)<\/span>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** No-op stub kept for compatibility — images are embedded in the verse card. */
export async function generatePaleoBoraImagesForText(
  _text: string,
  _fontSizePx: number = 18
): Promise<Map<string, string>> {
  return new Map<string, string>();
}

