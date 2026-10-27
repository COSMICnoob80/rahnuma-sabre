/**
 * Live council notes for the Global Outlook screen.
 *
 * The council reads the quote snapshot and speaks about the public record only:
 * facts in, attributed sentences out. No member states a direction, a target or
 * an action, and nothing that goes wrong here reaches the user — a failure
 * returns null and the screen keeps its static block.
 */

import type { InstrumentQuote } from './globalMarkets';
import { formatChangePct, formatOutlookNumber, freshnessChip } from './globalMarkets.ts';
import { enforceNoDirective, personaById } from './personaService.ts';
import type { Persona, PersonaId } from './personaService';
import type { AskOptions, AskResult } from './llmService';
import type { ProviderId } from './providers';
import type { CouncilNote } from '../utils/outlookText';

export const COUNCIL_CACHE_PREFIX = 'council_cache_';
export const COUNCIL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const COUNCIL_DISCLAIMER = 'Information only, not investment advice.';
export const COUNCIL_LIVE_CHIP = 'live council';
export const COUNCIL_STATIC_CHIP = 'static sample';

// One screen-level call, not a chat turn: bound each provider attempt so a
// provider that accepts the connection and stalls cannot hold the card.
export const COUNCIL_TIMEOUT_MS = 15_000;

export const COUNCIL_PERSONAS: PersonaId[] = ['oracle', 'habib', 'risk_manager'];

const SYNTHESIS_FALLBACK =
  'The council read the same snapshot; the voices differ in emphasis, not in the numbers.';

export interface CouncilCacheEntry {
  t: number;
  notes: CouncilNote[];
  synthesis: string;
  provider: ProviderId | null;
}

export interface CouncilNoteResult {
  notes: CouncilNote[];
  synthesis: string;
  disclaimer: string;
  provider: ProviderId | null;
  cached: boolean;
}

export interface CouncilDeps {
  ask?: (options: AskOptions) => Promise<AskResult>;
  now?: number;
  readCache?: (key: string) => Promise<CouncilCacheEntry | null>;
  writeCache?: (key: string, entry: CouncilCacheEntry) => Promise<void>;
}

// Market state, stated flatly: value, change, freshness and source per row.
// Every row carries its own freshness label so a cached or missing instrument
// is visible rather than smoothed over.
export function buildContextSnapshot(quotes: InstrumentQuote[], now: number = Date.now()): string {
  const header = `Market state snapshot recorded ${new Date(now).toISOString()}. Freshness is stated per row.`;
  const rows = quotes.map((quote) => {
    const value =
      quote.pricePKR === null
        ? 'no quote on device'
        : `${formatOutlookNumber(quote.pricePKR)}${quote.priceNote ? ` (${quote.priceNote})` : ''}`;
    return `${quote.label} (${quote.symbol}): ${value} · change ${formatChangePct(
      quote.changePct
    )} · ${freshnessChip(quote, now)} · source ${quote.source}`;
  });
  return [header, ...rows].join('\n');
}

// djb2 — stable, dependency-free. Non-cryptographic; this only keys a local cache.
export function snapshotHash(snapshot: string, personaIds: PersonaId[]): string {
  const input = `${snapshot}\u0000${personaIds.join(',')}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function isCouncilCacheFresh(t: number, now: number = Date.now()): boolean {
  if (!Number.isFinite(t)) return false;
  const age = now - t;
  return age >= 0 && age <= COUNCIL_CACHE_TTL_MS;
}

export function buildCouncilSystemPrompt(personaIds: PersonaId[]): string {
  const voices = personaIds.map((id) => {
    const persona = personaById(id);
    return `- ${persona.name} (${persona.tagline}): ${persona.philosophy}`;
  });

  return [
    'You are the Advisory Council of Rahnuma, a Pakistani personal-finance app, reading the public market record for a retail investor.',
    'Each voice below belongs to one member. They all read the same snapshot.',
    '',
    'Voices:',
    ...voices,
    '',
    'Rules you must never break:',
    '- Describe only what the snapshot states. Do not add prices, news, events or numbers from outside it.',
    '- No direction, no forecast, no target, no action. Do not say what will happen, and do not say what the reader should do.',
    '- Do not name anything as worth acquiring or worth disposing of, and do not rank assets as better or worse.',
    '- Where a row is labelled cached or missing, say so plainly instead of reasoning past it.',
    '- Ground every sentence in a number or a label from the snapshot.',
    '- Plain English, short sentences, no dramatic adjectives, no exclamation marks.',
    '',
    'Reply in exactly this format and nothing else — no preamble, no headings, no closing note:',
    '[<voice name>] <one or two sentences>',
    'Repeat that block once for every voice above, using the exact names given, in the order given.',
    '[Synthesis] <one sentence naming where the voices agree and where they differ>',
  ].join('\n');
}

interface ReplyBlock {
  label: string;
  text: string;
}

const BLOCK_HEADER = /^\[([^\]]{1,80})\]\s*(.*)$/;

function splitBlocks(reply: string): ReplyBlock[] {
  const blocks: ReplyBlock[] = [];
  for (const rawLine of reply.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = BLOCK_HEADER.exec(line);
    if (match) {
      blocks.push({ label: match[1].trim(), text: match[2].trim() });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last) last.text = `${last.text} ${line}`.trim();
  }
  return blocks;
}

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toNote(persona: Persona, text: string): CouncilNote {
  return {
    by: persona.name,
    org: 'Council',
    initials: initialsOf(persona.name),
    text: enforceNoDirective(text).text,
  };
}

// Anything the model invents beyond the requested voices is dropped rather than
// rendered under a name the council does not have.
export function parseCouncilReply(
  reply: string,
  personaIds: PersonaId[]
): { notes: CouncilNote[]; synthesis: string } | null {
  if (typeof reply !== 'string' || reply.trim().length === 0) return null;

  const voices = personaIds.map((id) => personaById(id));
  const notes: CouncilNote[] = [];
  const attributed = new Set<PersonaId>();
  let synthesis = '';

  for (const block of splitBlocks(reply)) {
    if (!block.text) continue;
    const persona = voices.find((voice) => voice.name.toLowerCase() === block.label.toLowerCase());
    if (persona) {
      if (attributed.has(persona.id)) continue;
      attributed.add(persona.id);
      notes.push(toNote(persona, block.text));
      continue;
    }
    if (/synthesis/i.test(block.label)) {
      synthesis = enforceNoDirective(block.text).text;
    }
  }

  if (notes.length === 0) return null;
  return { notes, synthesis: synthesis || SYNTHESIS_FALLBACK };
}

async function readStoredCache(key: string, now: number): Promise<CouncilCacheEntry | null> {
  try {
    const { getSetting } = await import('../database/db');
    const raw = await getSetting(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<CouncilCacheEntry>;
    if (typeof entry.t !== 'number' || !Array.isArray(entry.notes)) return null;
    if (!isCouncilCacheFresh(entry.t, now)) return null;
    return {
      t: entry.t,
      notes: entry.notes,
      synthesis: typeof entry.synthesis === 'string' ? entry.synthesis : SYNTHESIS_FALLBACK,
      provider: entry.provider ?? null,
    };
  } catch {
    return null;
  }
}

async function writeStoredCache(key: string, entry: CouncilCacheEntry): Promise<void> {
  try {
    const { setSetting } = await import('../database/db');
    await setSetting(key, JSON.stringify(entry));
  } catch {
    // A cache write failure must never break a successful note.
  }
}

export async function requestCouncilNote(
  snapshot: string,
  personaIds: PersonaId[] = COUNCIL_PERSONAS,
  deps: CouncilDeps = {}
): Promise<CouncilNoteResult | null> {
  const now = deps.now ?? Date.now();
  const key = COUNCIL_CACHE_PREFIX + snapshotHash(snapshot, personaIds);
  const readCache = deps.readCache ?? ((cacheKey: string) => readStoredCache(cacheKey, now));
  const writeCache = deps.writeCache ?? writeStoredCache;

  const cached = await readCache(key).catch(() => null);
  if (cached) {
    return {
      notes: cached.notes,
      synthesis: cached.synthesis,
      disclaimer: COUNCIL_DISCLAIMER,
      provider: cached.provider,
      cached: true,
    };
  }

  try {
    const ask = deps.ask ?? (await import('./llmService')).askAdvisor;
    const answer = await ask({
      systemPrompt: buildCouncilSystemPrompt(personaIds),
      messages: [{ role: 'user', content: snapshot }],
      useCache: false,
      timeoutMs: COUNCIL_TIMEOUT_MS,
    });

    const parsed = parseCouncilReply(answer.text, personaIds);
    if (!parsed) return null;

    await writeCache(key, {
      t: now,
      notes: parsed.notes,
      synthesis: parsed.synthesis,
      provider: answer.provider,
    }).catch(() => undefined);

    return {
      notes: parsed.notes,
      synthesis: parsed.synthesis,
      disclaimer: COUNCIL_DISCLAIMER,
      provider: answer.provider,
      cached: false,
    };
  } catch {
    return null;
  }
}
