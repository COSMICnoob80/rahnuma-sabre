/**
 * Four-part context note for the council card.
 *
 * The note follows the adopted bank-DNA skeleton — facts, both sides of the
 * strategy read, named risks, then what would change the stated facts. It is a
 * reading aid, not a verdict: no fair value, no rating, no target, no direction.
 * A provider that breaks those bans has the offending segment removed before the
 * note is rendered.
 */

import { enforceNoDirective } from './personaService.ts';
import { COUNCIL_DISCLAIMER } from './outlookCouncil.ts';
import type { CouncilNoteResult } from './outlookCouncil.ts';
import type { AskOptions, AskResult } from './llmService';
import type { ProviderId } from './providers';

export const CONTEXT_NOTE_CACHE_PREFIX = 'context_note_cache_';
export const CONTEXT_NOTE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const CONTEXT_NOTE_TIMEOUT_MS = 15_000;
export const CONTEXT_NOTE_DISCLAIMER = COUNCIL_DISCLAIMER;
export const CONTEXT_NOTE_UNSTATED = 'Not stated in the record.';
export const CONTEXT_NOTE_MAX_SENTENCES = 2;

export type ContextNotePartId = 'facts' | 'strategy' | 'risks' | 'what_would_change';

export interface ContextNotePart {
  id: ContextNotePartId;
  number: number;
  title: string;
  body: string;
}

export interface ContextNote {
  parts: ContextNotePart[];
  provider: ProviderId | null;
  cached: boolean;
  disclaimer: string;
}

export interface ContextNoteCacheEntry {
  t: number;
  parts: ContextNotePart[];
  provider: ProviderId | null;
}

export interface ContextNoteDeps {
  ask?: (options: AskOptions) => Promise<AskResult>;
  now?: number;
  readCache?: (key: string) => Promise<ContextNoteCacheEntry | null>;
  writeCache?: (key: string, entry: ContextNoteCacheEntry) => Promise<void>;
}

// Fixed order per the harvest's adopted skeleton. The renderer always emits all
// four blocks in this order, so a missing part becomes a labelled gap rather
// than a silently shorter note.
export const CONTEXT_NOTE_ORDER: ContextNotePartId[] = [
  'facts',
  'strategy',
  'risks',
  'what_would_change',
];

export const CONTEXT_NOTE_TITLES: Record<ContextNotePartId, string> = {
  facts: 'Facts',
  strategy: 'Strategy — both sides',
  risks: 'Risks',
  what_would_change: 'What would change this',
};

// The verdict layer of the source skeleton, plus every direction word the
// product contract forbids. A sentence matching any of these is dropped.
const BANNED_SEGMENT_PATTERNS: RegExp[] = [
  /\bfair[\s-]*value\b/i,
  /\bprice\s*(?:target|objective)\b|\btarget\s*price\b|\btargets?\s+(?:of|at)\b/i,
  /\b(?:one|two|three|four|five|1|2|3|4|5)\s*[- ]?stars?\b|\bstars?\b|\bstar\s*rating\b|\brating\s*of\b/i,
  /\b(overvalued|undervalued|cheap|expensive|mispriced)\b/i,
  /\b(buy|buying|sell|selling|accumulate|overweight|underweight)\b/i,
  /\b(?:will|shall|expected\s+to)\s+(?:rise|fall|climb|drop|decline|surge|recover|outperform|underperform)\b/i,
  /\b(bullish|bearish|upside|downside|outperform|underperform)\b/i,
  /\byou\s+should\b/i,
];

const PART_LABELS: { id: ContextNotePartId; patterns: RegExp[] }[] = [
  { id: 'facts', patterns: [/^facts?\b/i, /^the facts?\b/i, /^values?\b/i, /^record\b/i] },
  {
    id: 'strategy',
    patterns: [/^strategy\b/i, /^both sides\b/i, /^evidence\b/i, /^what the record says\b/i],
  },
  { id: 'risks', patterns: [/^risks?\b/i, /^named unknowns?\b/i, /^unknowns?\b/i] },
  {
    id: 'what_would_change',
    patterns: [/^what would change\b/i, /^what changes\b/i],
  },
];

const BLOCK_HEADER = /^\[?\s*(?:\d\s*[.)]\s*)?([A-Za-z][^\]\n:：]{1,50}?)\s*(?:\]|[:：])\s*(.*)$/;

function splitSentences(text: string): string[] {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (!flat) return [];
  return flat
    .split(/(?<=[.!?])\s+(?=[A-Z0-9(\[“"])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// Segment-level removal, not a correction appended after the fact: the note has
// no room for a verdict, so a verdict sentence is deleted whole.
export function stripBannedSegments(text: string): { text: string; stripped: boolean } {
  const kept: string[] = [];
  let stripped = false;

  for (const sentence of splitSentences(text)) {
    if (BANNED_SEGMENT_PATTERNS.some((pattern) => pattern.test(sentence))) {
      stripped = true;
      continue;
    }
    if (enforceNoDirective(sentence).violated) {
      stripped = true;
      continue;
    }
    kept.push(sentence);
  }

  return { text: kept.join(' ').trim(), stripped };
}

function limitSentences(text: string, max = CONTEXT_NOTE_MAX_SENTENCES): string {
  const sentences = splitSentences(text);
  if (sentences.length <= max) return text.trim();
  return sentences.slice(0, max).join(' ');
}

function partIdForLabel(label: string): ContextNotePartId | null {
  for (const entry of PART_LABELS) {
    if (entry.patterns.some((pattern) => pattern.test(label))) return entry.id;
  }
  return null;
}

export function parseContextNoteReply(reply: string): ContextNotePart[] | null {
  if (typeof reply !== 'string' || reply.trim().length === 0) return null;

  const bodies = new Map<ContextNotePartId, string>();
  let current: ContextNotePartId | null = null;

  for (const rawLine of reply.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = BLOCK_HEADER.exec(line);
    const id = header ? partIdForLabel(header[1].trim()) : null;

    if (header && id) {
      current = id;
      const body = header[2].trim();
      if (body && !bodies.has(id)) bodies.set(id, body);
      continue;
    }

    if (current && !bodies.has(current)) {
      bodies.set(current, line);
    } else if (current) {
      bodies.set(current, `${bodies.get(current) ?? ''} ${line}`.trim());
    }
  }

  if (bodies.size === 0) return null;

  return CONTEXT_NOTE_ORDER.map((id, index) => {
    const cleaned = stripBannedSegments(bodies.get(id) ?? '').text;
    const body = cleaned ? limitSentences(cleaned) : CONTEXT_NOTE_UNSTATED;
    return { id, number: index + 1, title: CONTEXT_NOTE_TITLES[id], body };
  });
}

export function buildContextNoteSource(
  snapshot: string,
  council: CouncilNoteResult | null = null
): string {
  const lines = [snapshot.trim()];
  if (council && council.notes.length > 0) {
    lines.push('', 'Council read, attributed:');
    for (const note of council.notes) {
      lines.push(`[${note.by}] ${note.text}`);
    }
    if (council.synthesis) lines.push(`[Synthesis] ${council.synthesis}`);
  }
  return lines.join('\n');
}

export function buildContextNoteSystemPrompt(): string {
  return [
    'You write a four-part context note for a Pakistani personal-finance app. It is a reading aid over the supplied record, never a verdict.',
    '',
    'Rules you must never break:',
    '- Describe only what the supplied record states. Do not add prices, news or numbers from outside it.',
    '- Never state a fair value, an intrinsic value, a star rating, a price target, or anything cheap/expensive.',
    '- Never state a direction or a forecast, and never tell the reader to act.',
    '- Put both sides of the strategy read in the same block, attributed and unscored.',
    '- Plain English, short sentences, no dramatic adjectives, no exclamation marks.',
    '',
    'Reply with exactly these four labelled blocks in this order and nothing else:',
    '[Facts] one or two sentences stating the dated values the record actually carries.',
    '[Strategy] one or two sentences giving the evidence that cuts both ways, neither side scored.',
    '[Risks] one or two sentences naming what is unknown or what is labelled cached or missing.',
    '[What would change this] one or two sentences stating which inputs would change the facts above, as a condition, never a forecast.',
  ].join('\n');
}

function contextHash(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function isContextNoteCacheFresh(t: number, now: number = Date.now()): boolean {
  if (!Number.isFinite(t)) return false;
  const age = now - t;
  return age >= 0 && age <= CONTEXT_NOTE_CACHE_TTL_MS;
}

async function readStoredCache(key: string, now: number): Promise<ContextNoteCacheEntry | null> {
  try {
    const { getSetting } = await import('../database/db');
    const raw = await getSetting(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<ContextNoteCacheEntry>;
    if (typeof entry.t !== 'number' || !Array.isArray(entry.parts)) return null;
    if (!isContextNoteCacheFresh(entry.t, now)) return null;
    return { t: entry.t, parts: entry.parts, provider: entry.provider ?? null };
  } catch {
    return null;
  }
}

async function writeStoredCache(key: string, entry: ContextNoteCacheEntry): Promise<void> {
  try {
    const { setSetting } = await import('../database/db');
    await setSetting(key, JSON.stringify(entry));
  } catch {
    // A cache write failure must never break a successful note.
  }
}

export async function requestContextNote(
  snapshot: string,
  council: CouncilNoteResult | null = null,
  deps: ContextNoteDeps = {}
): Promise<ContextNote | null> {
  const now = deps.now ?? Date.now();
  const source = buildContextNoteSource(snapshot, council);
  const key = CONTEXT_NOTE_CACHE_PREFIX + contextHash(source);
  const readCache = deps.readCache ?? ((cacheKey: string) => readStoredCache(cacheKey, now));
  const writeCache = deps.writeCache ?? writeStoredCache;

  const cached = await readCache(key).catch(() => null);
  if (cached) {
    return {
      parts: cached.parts,
      provider: cached.provider,
      cached: true,
      disclaimer: CONTEXT_NOTE_DISCLAIMER,
    };
  }

  try {
    const ask = deps.ask ?? (await import('./llmService')).askAdvisor;
    const answer = await ask({
      systemPrompt: buildContextNoteSystemPrompt(),
      messages: [{ role: 'user', content: source }],
      useCache: false,
      timeoutMs: CONTEXT_NOTE_TIMEOUT_MS,
    });

    const parts = parseContextNoteReply(answer.text);
    if (!parts) return null;

    await writeCache(key, { t: now, parts, provider: answer.provider }).catch(() => undefined);

    return {
      parts,
      provider: answer.provider,
      cached: false,
      disclaimer: CONTEXT_NOTE_DISCLAIMER,
    };
  } catch {
    return null;
  }
}
