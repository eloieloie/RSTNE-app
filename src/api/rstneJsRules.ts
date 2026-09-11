import { API_HEADERS } from './client';

const API_URL = 'https://rstne.eloi.in/api';

export type RstneRuleSource = 'inline-script' | 'find-replace-app';

export interface RstneJsRule {
  id: number;
  find: string;
  flags: string;
  replaceRaw: string;
  replaceText: string;
  wholeWord: boolean;
  hasHtml: boolean;
  scriptLabel: string;
  source: RstneRuleSource;
  // Tracking fields, merged in from rstne_js_rules_tbl on the backend.
  ruleHash: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastReviewedAt: string | null;
  lastReplacedAt: string | null;
  lastReplaceCount: number | null;
}

export interface RstneJsRulesResult {
  url: string;
  pageHandle: string;
  rules: RstneJsRule[];
}

export async function getRstneJsRules(pageUrl?: string): Promise<RstneJsRulesResult> {
  const query = pageUrl ? `?url=${encodeURIComponent(pageUrl)}` : '';
  const response = await fetch(`${API_URL}/rstne-js-rules${query}`, { headers: API_HEADERS, cache: 'no-store' });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }
  return response.json();
}

export async function markRuleReviewed(ruleHash: string): Promise<void> {
  await fetch(`${API_URL}/rstne-js-rules/mark-reviewed`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ruleHash }),
  }).catch(() => {}); // best-effort — never block the scan/review flow on this
}

export async function markRuleReplaced(ruleHash: string, replacedCount: number): Promise<void> {
  await fetch(`${API_URL}/rstne-js-rules/mark-replaced`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ruleHash, replacedCount }),
  }).catch(() => {}); // best-effort — never block the replace flow on this
}
