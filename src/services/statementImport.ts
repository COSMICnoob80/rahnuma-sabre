export type RowKind = 'cash' | 'bank' | 'property' | 'gold' | 'mutual_fund' | 'other';
export type RowSource = 'bank' | 'fbr' | 'manual';

export interface ParsedRow {
  kind: RowKind;
  label: string;
  amountPKR: number;
  source: RowSource;
  rawLine: string;
  // Optional metadata used by the batch envelope. A blank date on a bank row is
  // a pending transaction, surfaced rather than silently dropped.
  date?: string | null;
  narration?: string | null;
}

export interface RejectedLine {
  line: string;
  reason: string;
}

export interface ImportReport {
  rows: ParsedRow[];
  rejected: RejectedLine[];
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseMoneyPKR(value: string): number | null {
  let text = value.trim();
  if (!text) return null;

  let negative = false;
  if (text.startsWith('(') && text.endsWith(')')) {
    negative = true;
    text = text.slice(1, -1);
  }

  text = text
    .replace(/,/g, '')
    .replace(/₨/g, '')
    .replace(/\brs\.?/gi, '')
    .replace(/\bpkr\b/gi, '')
    .replace(/\brupees?\b/gi, '')
    .replace(/\s+/g, '');

  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;

  const amount = Number(text);
  if (!Number.isFinite(amount)) return null;
  return negative ? -amount : amount;
}

function isSkippable(line: string): boolean {
  return line.length === 0 || line.startsWith('#') || line.startsWith('//');
}

function splitCsvLine(line: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === ',' && !quoted) {
      tokens.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  tokens.push(current.trim());
  return tokens;
}

interface BankHeaderMap {
  date: number;
  description: number;
  credit: number;
  debit: number;
  balance: number;
  // A single signed amount column (`Amount`, Chase-style) instead of separate
  // credit/debit columns. Only the aliased reader sets this.
  signed?: number;
}

function readBankHeader(tokens: string[]): BankHeaderMap | null {
  const lower = tokens.map((token) => token.toLowerCase());
  const find = (needle: string) => lower.findIndex((token) => token.includes(needle));

  const credit = find('credit');
  const debit = find('debit');
  const balance = find('balance');
  if (credit === -1 || debit === -1 || balance === -1) return null;

  return {
    date: find('date'),
    description: find('description') === -1 ? find('detail') : find('description'),
    credit,
    debit,
    balance,
  };
}

// Alternate header names banks use for the same fields. Sniffed from the file's
// own header row — never from the filename.
const HEADER_ALIASES = {
  date: ['transaction date', 'txn date', 'post date', 'posted date', 'posting date', 'value date', 'date'],
  description: [
    'transaction detail',
    'description',
    'details',
    'narration',
    'particulars',
    'remarks',
    'transaction',
    'memo',
  ],
  credit: ['credit amount', 'deposit amount', 'credit', 'deposit', 'cr'],
  debit: ['debit amount', 'withdrawal amount', 'debit', 'withdrawal', 'withdrawals', 'dr'],
  balance: ['closing balance', 'running balance', 'balance'],
  signed: ['amount (pkr)', 'amount(pkr)', 'transaction amount', 'amount'],
};

function findAliasToken(lower: string[], aliases: string[], claimed: Set<number>): number {
  for (const alias of aliases) {
    for (let index = 0; index < lower.length; index += 1) {
      if (!claimed.has(index) && lower[index] === alias) return index;
    }
  }
  for (const alias of aliases) {
    if (alias.length < 4) continue;
    for (let index = 0; index < lower.length; index += 1) {
      if (!claimed.has(index) && lower[index].includes(alias)) return index;
    }
  }
  return -1;
}

function readBankHeaderAliased(tokens: string[]): BankHeaderMap | null {
  if (tokens.length < 3) return null;

  const lower = tokens.map((token) => token.toLowerCase().trim().replace(/\(pkr\)$/, '').trim());
  const claimed = new Set<number>();
  const pick = (aliases: string[]) => {
    const index = findAliasToken(lower, aliases, claimed);
    if (index >= 0) claimed.add(index);
    return index;
  };

  const date = pick(HEADER_ALIASES.date);
  const description = pick(HEADER_ALIASES.description);
  const credit = pick(HEADER_ALIASES.credit);
  const debit = pick(HEADER_ALIASES.debit);
  const balance = pick(HEADER_ALIASES.balance);
  const signed = pick(HEADER_ALIASES.signed);

  if (credit === -1 && debit === -1 && signed === -1) return null;
  if (date === -1 && description === -1) return null;

  return { date, description, credit, debit, balance, signed };
}

export function parseBankCsvReport(
  text: string,
  headerReader: (tokens: string[]) => BankHeaderMap | null = readBankHeader
): ImportReport {
  const rows: ParsedRow[] = [];
  const rejected: RejectedLine[] = [];
  let header: BankHeaderMap | null = null;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (isSkippable(trimmed)) continue;

    const tokens = splitCsvLine(trimmed);

    if (!header) {
      const detected = headerReader(tokens);
      if (detected) {
        header = detected;
        continue;
      }
    }

    if (header) {
      const map = header;
      const credit = parseMoneyPKR(tokens[map.credit] ?? '');
      const debit = parseMoneyPKR(tokens[map.debit] ?? '');
      const balance = parseMoneyPKR(tokens[map.balance] ?? '');
      const signedRaw =
        map.signed !== undefined && map.signed >= 0
          ? parseMoneyPKR(tokens[map.signed] ?? '')
          : null;

      if (signedRaw === null && credit === null && debit === null && balance === null) {
        rejected.push({ line: trimmed, reason: 'no numeric amount found' });
        continue;
      }

      const amountPKR =
        signedRaw !== null
          ? signedRaw
          : credit === null && debit === null && balance !== null
            ? balance
            : (credit ?? 0) - Math.abs(debit ?? 0);

      const date = map.date >= 0 ? tokens[map.date] ?? '' : '';
      const label =
        map.description >= 0
          ? tokens[map.description] ?? ''
          : tokens
              .filter((_, index) => index !== map.date && index !== map.credit && index !== map.debit && index !== map.balance)
              .join(', ');

      rows.push({
        kind: 'bank',
        label: label || date || 'Bank statement line',
        amountPKR: round2(amountPKR),
        source: 'bank',
        rawLine: trimmed,
        date: date || null,
        narration: label || date || null,
      });
      continue;
    }

    if (tokens.length < 4) {
      rejected.push({ line: trimmed, reason: 'needs at least a date, a description and one amount column' });
      continue;
    }

    const credit = parseMoneyPKR(tokens[tokens.length - 3]);
    const debit = parseMoneyPKR(tokens[tokens.length - 2]);
    const balance = parseMoneyPKR(tokens[tokens.length - 1]);

    if (credit === null && debit === null && balance === null) {
      rejected.push({ line: trimmed, reason: 'no numeric amount found' });
      continue;
    }

    const amountPKR =
      credit === null && debit === null && balance !== null
        ? balance
        : (credit ?? 0) - Math.abs(debit ?? 0);

    const date = tokens[0];
    const description = tokens.slice(1, -3).join(', ').trim();

    rows.push({
      kind: 'bank',
      label: description || date || 'Bank statement line',
      amountPKR: round2(amountPKR),
      source: 'bank',
      rawLine: trimmed,
      date: date || null,
      narration: description || date || null,
    });
  }

  return { rows, rejected };
}

export function parseBankCsv(text: string): ParsedRow[] {
  return parseBankCsvReport(text).rows;
}

function classifyFbrLabel(label: string): RowKind {
  const lower = label.toLowerCase();
  if (/\bcash\b/.test(lower)) return 'cash';
  if (/gold|silver|jewel/.test(lower)) return 'gold';
  if (/property|plot|land|house|flat|real estate|building/.test(lower)) return 'property';
  if (/mutual fund|mutual-fund|\bfunds?\b|\betf\b/.test(lower)) return 'mutual_fund';
  if (/bank|account|savings/.test(lower)) return 'bank';
  return 'other';
}

export function parseFbrWealthLinesReport(text: string): ImportReport {
  const rows: ParsedRow[] = [];
  const rejected: RejectedLine[] = [];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (isSkippable(trimmed)) continue;

    const colon = trimmed.indexOf(':');
    const equals = trimmed.indexOf('=');
    const separator =
      colon === -1 ? equals : equals === -1 ? colon : Math.min(colon, equals);

    if (separator <= 0) {
      rejected.push({ line: trimmed, reason: 'expected a "label: amount" or "label = amount" line' });
      continue;
    }

    const label = trimmed.slice(0, separator).trim();
    const rawAmount = trimmed.slice(separator + 1).trim();
    if (!label) {
      rejected.push({ line: trimmed, reason: 'missing label' });
      continue;
    }

    const amountPKR = parseMoneyPKR(rawAmount);
    if (amountPKR === null) {
      rejected.push({ line: trimmed, reason: 'amount is not a number' });
      continue;
    }
    if (amountPKR < 0) {
      rejected.push({ line: trimmed, reason: 'wealth amounts cannot be negative' });
      continue;
    }

    rows.push({
      kind: classifyFbrLabel(label),
      label,
      amountPKR: round2(amountPKR),
      source: 'fbr',
      rawLine: trimmed,
      date: null,
      narration: label,
    });
  }

  return { rows, rejected };
}

export function parseFbrWealthLines(text: string): ParsedRow[] {
  return parseFbrWealthLinesReport(text).rows;
}

export function summarizeNetWorth(rows: ParsedRow[]): { cash: number; other: number; total: number } {
  let cash = 0;
  let other = 0;

  for (const row of rows) {
    if (row.kind === 'cash' || row.kind === 'bank') cash += row.amountPKR;
    else other += row.amountPKR;
  }

  const cashTotal = round2(cash);
  const otherTotal = round2(other);
  return { cash: cashTotal, other: otherTotal, total: round2(cashTotal + otherTotal) };
}

// ---------------------------------------------------------------------------
// Batch envelope — several files in one flow.
//
// One file = one account + one period + one format, per the harvest. The file
// carries its own identity, so metadata is sniffed from the text, never from
// the filename. Enveloped interchange formats are deliberately out of scope this
// sprint: a 695-page surface with zero current users adds parser risk for no
// compatibility gain.
// ---------------------------------------------------------------------------

export type StatementSourceFormat = 'bank_csv' | 'fbr_wealth';

export interface BatchStatementFile {
  name?: string;
  text: string;
  accountLabel?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface BatchFileEnvelope {
  name: string;
  accountLabel: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  bankName: string | null;
  sourceFormat: StatementSourceFormat;
  rowCount: number;
  skippedPending: number;
  skippedUnparsed: number;
  duplicateCount: number;
}

export interface BatchImportReport {
  files: BatchFileEnvelope[];
  // Dated rows ready to commit, deduplicated across every file in the batch.
  staged: ParsedRow[];
  // Undated (pending) rows surfaced and counted, deduplicated across the batch.
  pending: ParsedRow[];
  // The pending counter a screen shows before commit.
  pendingCount: number;
  skippedPending: number;
  skippedUnparsed: number;
  duplicateCount: number;
  rejected: RejectedLine[];
}

const KNOWN_BANKS: { pattern: RegExp; name: string }[] = [
  { pattern: /\bhabib bank\b|\bhbl\b/i, name: 'HBL' },
  { pattern: /\bunited bank\b|\bubl\b/i, name: 'UBL' },
  { pattern: /\bmuslim commercial\b|\bmcb\b/i, name: 'MCB' },
  { pattern: /\bmeezan\b/i, name: 'Meezan Bank' },
  { pattern: /\bbank alfalah\b|\balfalah\b/i, name: 'Bank Alfalah' },
  { pattern: /\baskari\b/i, name: 'Askari Bank' },
  { pattern: /\bfaysal\b/i, name: 'Faysal Bank' },
  { pattern: /\ballied bank\b/i, name: 'Allied Bank' },
  { pattern: /\bstandard chartered\b/i, name: 'Standard Chartered' },
  { pattern: /\bjs bank\b/i, name: 'JS Bank' },
  { pattern: /\bbank al habib\b/i, name: 'Bank Al Habib' },
  { pattern: /\bsummit bank\b/i, name: 'Summit Bank' },
  { pattern: /\bsoneri\b/i, name: 'Soneri Bank' },
  { pattern: /\bsindh bank\b/i, name: 'Sindh Bank' },
];

export function sniffBankName(text: string): string | null {
  for (const bank of KNOWN_BANKS) {
    if (bank.pattern.test(text)) return bank.name;
  }
  const generic = /(?:^|\n)\s*([A-Z][A-Za-z&.\s]{2,40}\bBank(?: Limited| Ltd\.?)?)/.exec(text);
  return generic ? generic[1].trim().replace(/\s+/g, ' ') : null;
}

export function sniffStatementAccount(text: string): string | null {
  const match =
    /(?:account\s*(?:no\.?|number|#)|a\/c\s*(?:no\.?|#)?|acct\.?)\s*[:\-]?\s*([xX*\d][xX*\d\-\s]{2,})/i.exec(
      text
    );
  if (!match) return null;
  const value = match[1].replace(/\s+/g, ' ').trim();
  return value || null;
}

const DATE_TOKEN = '(\\d{1,4}[-/.]\\d{1,2}[-/.]\\d{2,4})';
const PERIOD_RANGE = new RegExp(
  `${DATE_TOKEN}\\s*(?:to|through|until|till|–|—|-)\\s*${DATE_TOKEN}`,
  'i'
);

export function sniffStatementPeriod(text: string): {
  periodStart: string | null;
  periodEnd: string | null;
} {
  const match = PERIOD_RANGE.exec(text);
  if (match) return { periodStart: match[1], periodEnd: match[2] };
  return { periodStart: null, periodEnd: null };
}

function periodFromRows(rows: ParsedRow[]): { periodStart: string | null; periodEnd: string | null } {
  const dates = rows
    .map((row) => row.date)
    .filter((date): date is string => typeof date === 'string' && date.length > 0)
    .sort();
  if (dates.length === 0) return { periodStart: null, periodEnd: null };
  return { periodStart: dates[0], periodEnd: dates[dates.length - 1] };
}

function sniffSourceFormat(text: string): StatementSourceFormat {
  let sawSeparatorLine = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (isSkippable(line)) continue;
    if (readBankHeaderAliased(splitCsvLine(line))) return 'bank_csv';
    if (/^[^:=]{1,60}\s*[:=]\s*\S/.test(line)) sawSeparatorLine = true;
  }
  return sawSeparatorLine ? 'fbr_wealth' : 'bank_csv';
}

export function normalizeNarration(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function narrationHash(value: string): string {
  const input = normalizeNarration(value);
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function statementDedupeKey(row: ParsedRow, accountLabel: string | null): string {
  return [
    accountLabel ?? '',
    row.date ?? '',
    row.amountPKR.toFixed(2),
    narrationHash(row.narration ?? row.label),
  ].join('|');
}

export function importStatementBatch(files: BatchStatementFile[]): BatchImportReport {
  const envelopes: BatchFileEnvelope[] = [];
  const staged: ParsedRow[] = [];
  const pending: ParsedRow[] = [];
  const rejected: RejectedLine[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;
  let skippedPending = 0;
  let skippedUnparsed = 0;

  files.forEach((file, index) => {
    const text = typeof file.text === 'string' ? file.text : '';
    const sourceFormat = sniffSourceFormat(text);
    const report =
      sourceFormat === 'fbr_wealth'
        ? parseFbrWealthLinesReport(text)
        : parseBankCsvReport(text, readBankHeaderAliased);

    const bankName = sniffBankName(text);
    const accountLabel = file.accountLabel ?? sniffStatementAccount(text) ?? bankName ?? null;
    const sniffedPeriod = sniffStatementPeriod(text);
    const rowPeriod = periodFromRows(report.rows);
    const periodStart = file.periodStart ?? sniffedPeriod.periodStart ?? rowPeriod.periodStart;
    const periodEnd = file.periodEnd ?? sniffedPeriod.periodEnd ?? rowPeriod.periodEnd;

    let fileRowCount = 0;
    let filePending = 0;
    let fileDuplicates = 0;

    for (const row of report.rows) {
      const key = statementDedupeKey(row, accountLabel);
      if (seen.has(key)) {
        fileDuplicates += 1;
        duplicateCount += 1;
        continue;
      }
      seen.add(key);

      if (row.source === 'bank' && !row.date) {
        pending.push(row);
        filePending += 1;
      } else {
        staged.push(row);
        fileRowCount += 1;
      }
    }

    skippedPending += filePending;
    skippedUnparsed += report.rejected.length;
    rejected.push(...report.rejected);

    envelopes.push({
      name: file.name ?? `statement-${index + 1}`,
      accountLabel,
      periodStart,
      periodEnd,
      bankName,
      sourceFormat,
      rowCount: fileRowCount,
      skippedPending: filePending,
      skippedUnparsed: report.rejected.length,
      duplicateCount: fileDuplicates,
    });
  });

  return {
    files: envelopes,
    staged,
    pending,
    pendingCount: pending.length,
    skippedPending,
    skippedUnparsed,
    duplicateCount,
    rejected,
  };
}
