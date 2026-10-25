import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
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
