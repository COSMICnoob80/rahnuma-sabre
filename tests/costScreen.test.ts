import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COST_FOOTER, FEE_ROWS } from '../src/data/feeGrid.ts';

const SCREEN_SOURCE = readFileSync('src/screens/CostScreen.tsx', 'utf8');
const NAV_SOURCE = readFileSync('src/navigation/AppNavigator.tsx', 'utf8');
const GRID_COPY = JSON.stringify(FEE_ROWS);

function row(id: string) {
  return FEE_ROWS.find((entry) => entry.id === id);
}

test('fee grid: the grid ships four rows and the Rahnuma row is PKR 0', () => {
  assert.equal(FEE_ROWS.length, 4);
  assert.deepEqual(FEE_ROWS.map((entry) => entry.id), [
    'rahnuma',
    'pro-seat',
    'india-tier',
    'brokerage',
  ]);

  const rahnuma = row('rahnuma');
  assert.ok(rahnuma);
  assert.equal(rahnuma.price, 'PKR 0');
  assert.match(rahnuma.note, /no account, no contract, no call/);
  assert.equal(rahnuma.reported, undefined);
});

test('fee grid: the screen renders FEE_ROWS and every price/note comes from the data module', () => {
  assert.match(SCREEN_SOURCE, /FEE_ROWS\.map/);
  assert.match(SCREEN_SOURCE, /\{row\.price\}/);
  assert.match(SCREEN_SOURCE, /\{row\.note\}/);
  assert.match(SCREEN_SOURCE, /COST_FOOTER/);
});

test('fee grid: every pro row is labelled reported, sourced and dated', () => {
  const reported = FEE_ROWS.filter((entry) => entry.reported);
  assert.deepEqual(reported.map((entry) => entry.id), ['pro-seat', 'india-tier']);

  for (const entry of reported) {
    assert.match(entry.price, /^reported /i, `${entry.id} is not labelled reported`);
    assert.ok(entry.source && entry.source.trim().length > 0, `${entry.id} has no source`);
  }

  const seat = row('pro-seat');
  assert.ok(seat);
  assert.match(seat.price, /\$31,980/);
  assert.match(seat.converted ?? '', /PKR 8,843,358/);
  assert.match(seat.source ?? '', /276\.527777/);
  assert.match(seat.source ?? '', /2026-11-04/);

  const india = row('india-tier');
  assert.ok(india);
  assert.match(india.price, /₹151,000/);
  assert.match(india.converted ?? '', /2\.5%/);
  assert.match(india.source ?? '', /Bloomberg/);
  assert.match(india.source ?? '', /Oct 2026/);
  assert.match(`${india.note} ${india.source}`, /not verified live/i);
});

test('fee grid: the brokerage row states the honesty line and ships no invented commission', () => {
  const brokerage = row('brokerage');
  assert.ok(brokerage);
  assert.match(
    brokerage.note,
    /brokerage fees apply wherever you trade — that is your broker's page, not ours\./i
  );
  assert.equal(brokerage.reported, undefined);
  assert.match(brokerage.source ?? '', /not verified/i);
  assert.doesNotMatch(brokerage.price, /\d/, 'a commission number was invented');
});

test('fee grid: no provider recommendation and no ranking language anywhere in the grid', () => {
  assert.equal(/recommend/i.test(SCREEN_SOURCE), false, 'CostScreen contains "recommend"');
  assert.equal(/recommend/i.test(GRID_COPY), false, 'fee grid copy contains "recommend"');
  assert.equal(
    /\brank(ed|ing)?\b|\bbest\b|\bscore\b|\btop pick\b/i.test(`${SCREEN_SOURCE} ${GRID_COPY}`),
    false,
    'fee grid copy ranks or scores a provider'
  );
});

test('fee grid: the footer is the never-advice law line', () => {
  assert.match(COST_FOOTER, /Information only/);
  assert.match(COST_FOOTER, /Not investment advice/);
  assert.match(COST_FOOTER, /never tell you to buy or sell/);
});

test('fee grid: the Costs tab sits immediately after Directory', () => {
  assert.match(
    NAV_SOURCE,
    /<Tab\.Screen name="Directory"[^\n]*\/>\s*<Tab\.Screen name="Costs" component=\{CostScreen\} \/>/
  );
  assert.match(NAV_SOURCE, /^\s*Costs: \($/m, 'Costs tab icon is not registered');
});

test('fee grid: versionCode 13 is synced across both config sources', () => {
  assert.match(readFileSync('app.json', 'utf8'), /"versionCode": 13/);
  assert.match(readFileSync('android/app/build.gradle', 'utf8'), /versionCode 13/);
});
