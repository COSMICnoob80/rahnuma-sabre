export type RowKind = 'cash' | 'bank' | 'property' | 'gold' | 'mutual_fund' | 'other';
export type RowSource = 'bank' | 'fbr' | 'manual';

export interface ParsedRow {
  kind: RowKind;
  label: string;
  amountPKR: number;
  source: RowSource;
  rawLine: string;
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

export function parseBankCsvReport(text: string): ImportReport {
  const rows: ParsedRow[] = [];
  const rejected: RejectedLine[] = [];
  let header: BankHeaderMap | null = null;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (isSkippable(trimmed)) continue;

    const tokens = splitCsvLine(trimmed);

    if (!header) {
      const detected = readBankHeader(tokens);
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

      if (credit === null && debit === null && balance === null) {
        rejected.push({ line: trimmed, reason: 'no numeric amount found' });
        continue;
      }

      const amountPKR =
        credit === null && debit === null && balance !== null
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
