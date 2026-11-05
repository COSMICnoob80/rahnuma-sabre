import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  importStatementBatch,
  parseBankCsv,
  parseBankCsvReport,
  parseFbrWealthLines,
  parseFbrWealthLinesReport,
  summarizeNetWorth,
} from '../src/services/statementImport.ts';

const BANK_CSV = [
  'date,description,creditPKR,debitPKR,balanceOBR',
  '2026-06-01,Salary,"250,000.00",0,"250,000.00"',
  '2026-06-02,"ATM, Karachi",0,"5,000.00","245,000.00"',
  '2026-06-03,Balance only,,,"243,800.00"',
].join('\n');

test('bank csv: quoted rupee commas are one amount, not extra columns', () => {
  const rows = parseBankCsv(BANK_CSV);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].amountPKR, 250000);
  assert.equal(rows[0].label, 'Salary');
  assert.equal(rows[0].source, 'bank');
  assert.equal(rows[0].kind, 'bank');
});

test('bank csv: a debit row is negative and the description comma survives', () => {
  const rows = parseBankCsv(BANK_CSV);
  assert.equal(rows[1].amountPKR, -5000);
  assert.equal(rows[1].label, 'ATM, Karachi');
});

test('bank csv: a row with only a balance is a balance snapshot', () => {
  const rows = parseBankCsv(BANK_CSV);
  assert.equal(rows[2].amountPKR, 243800);
});

test('bank csv: unparseable and short lines are rejected, comments and blanks are skipped', () => {
  const report = parseBankCsvReport(
    [
      '# my statement',
      '',
      'not, enough',
      '2026-06-05,No amounts here,abc,def,ghi',
      '2026-06-06,Coffee,0,300,"99,700"',
    ].join('\n')
  );
  assert.equal(report.rows.length, 1);
  assert.equal(report.rows[0].amountPKR, -300);
  assert.equal(report.rejected.length, 2);
  assert.match(report.rejected[0].reason, /at least/);
  assert.match(report.rejected[1].reason, /numeric/);
});

const FBR_TEXT = [
  '# FBR wealth statement 2025',
  'Cash in Hand: 250,000',
  'Gold: Rs. 500,000',
  'Property = 12,000,000',
  'Mutual Funds: 300,000',
  'Prize Bonds: 50,000',
  'Malformed line without separator',
].join('\n');

test('fbr wealth: cash, gold and property map to their kinds', () => {
  const rows = parseFbrWealthLines(FBR_TEXT);
  assert.equal(rows[0].kind, 'cash');
  assert.equal(rows[1].kind, 'gold');
  assert.equal(rows[2].kind, 'property');
  assert.equal(rows[3].kind, 'mutual_fund');
  assert.equal(rows[0].source, 'fbr');
  assert.equal(rows[2].amountPKR, 12000000);
});

test('fbr wealth: an unknown label becomes other, and malformed lines are reported', () => {
  const report = parseFbrWealthLinesReport(FBR_TEXT);
  assert.equal(report.rows[4].kind, 'other');
  assert.equal(report.rejected.length, 1);
  assert.match(report.rejected[0].reason, /label: amount/);
});

test('fbr wealth: a non-numeric or negative amount is rejected rather than guessed', () => {
  const report = parseFbrWealthLinesReport('Gold: lots\nProperty: -5');
  assert.equal(report.rows.length, 0);
  assert.equal(report.rejected.length, 2);
});

test('summarize: cash and bank sum together, other kinds stay separate, all at 2dp', () => {
  const rows = parseBankCsv(['date,description,creditPKR,debitPKR,balanceOBR', '2026-06-01,Cash,0.1,0,0.1'].join('\n'));
  const fbr = parseFbrWealthLines(['Cash in Hand: 0.2', 'Gold: 100.005'].join('\n'));
  const summary = summarizeNetWorth([...rows, ...fbr]);
  assert.equal(summary.cash, 0.3);
  assert.equal(summary.other, 100.01);
  assert.equal(summary.total, 100.31);
});

test('summarize: an empty import totals zero rather than NaN', () => {
  assert.deepEqual(summarizeNetWorth([]), { cash: 0, other: 0, total: 0 });
});

const ALIAS_CSV = [
  'Transaction Date,Details,Amount,Balance',
  '2026-06-01,Salary,250000,250000',
  '2026-06-02,ATM Karachi,-5000,245000',
].join('\n');

test('batch: alternate headers and a signed amount column parse across banks', () => {
  const report = importStatementBatch([
    {
      name: 'whatever-renamed.csv',
      text: ['HBL statement', 'Account No: 1234-5678', ALIAS_CSV].join('\n'),
    },
  ]);

  assert.equal(report.files.length, 1);
  assert.equal(report.files[0].sourceFormat, 'bank_csv');
  assert.equal(report.files[0].bankName, 'HBL');
  assert.equal(report.files[0].accountLabel, '1234-5678');
  assert.equal(report.staged.length, 2);
  assert.equal(report.staged[0].amountPKR, 250000);
  assert.equal(report.staged[0].label, 'Salary');
  assert.equal(report.staged[1].amountPKR, -5000);
});

const OVERLAP_TEXT = [
  'Statement Period: 01-06-2026 to 30-06-2026',
  'Date,Narration,Withdrawal,Deposit,Balance',
  ',Pending ATM charge,,5000,245000',
  '2026-06-05,Coffee,300,0,244700',
].join('\n');

test('batch: two overlapping files collapse to one pending row', () => {
  const report = importStatementBatch([
    { name: 'first.csv', text: OVERLAP_TEXT },
    { name: 'second.csv', text: OVERLAP_TEXT },
  ]);

  assert.equal(report.files.length, 2);
  assert.equal(report.pending.length, 1);
  assert.equal(report.pendingCount, 1);
  assert.equal(report.staged.length, 1);
  assert.equal(report.duplicateCount, 2);
  assert.equal(report.files[0].periodStart, '01-06-2026');
  assert.equal(report.files[0].periodEnd, '30-06-2026');
});

test('batch: the pending counter is reported before commit, never silently dropped', () => {
  const report = importStatementBatch([
    {
      name: 'pending.csv',
      text: [
        'Date,Description,Withdrawal,Deposit,Balance',
        ',Uncleared cheque,,1500,10000',
        '2026-06-07,Cleared line,0,2000,12000',
      ].join('\n'),
    },
  ]);

  assert.equal(report.files[0].skippedPending, 1);
  assert.equal(report.pendingCount, 1);
  assert.match(report.pending[0].label, /Uncleared cheque/);
  assert.equal(report.staged.length, 1);
});

test('batch: a renamed file imports identically — identity is the content', () => {
  const first = importStatementBatch([{ name: 'download.csv', text: OVERLAP_TEXT }]);
  const second = importStatementBatch([{ name: 'march-statement.csv', text: OVERLAP_TEXT }]);

  assert.deepEqual(
    { ...first.files[0], name: '' },
    { ...second.files[0], name: '' }
  );
  assert.deepEqual(first.staged, second.staged);
});

test('batch: an FBR wealth file and a bank file stay separate accounts', () => {
  const report = importStatementBatch([
    { name: 'fbr.txt', text: ['Cash in Hand: 250,000', 'Gold: Rs. 500,000'].join('\n') },
    { name: 'hbl.csv', text: ['HBL', ALIAS_CSV].join('\n') },
  ]);

  assert.equal(report.files.length, 2);
  assert.equal(report.files[0].sourceFormat, 'fbr_wealth');
  assert.equal(report.files[1].sourceFormat, 'bank_csv');
  assert.equal(report.staged.length, 4);
  assert.equal(report.pendingCount, 0);
});
