// Dashboard render tests.
//
// Every one of the pre-existing 235 tests was a pure function or service, which
// is exactly how the r13 Dashboard shipped "FIRE Achieved!" for a brand-new
// user with a green suite. These tests mount the real screen.
//
// The harness import MUST come first: it installs the module hooks and sets the
// act environment before React is loaded.

import { renderScreen, renderedText, loadDb, resetModules, flush } from './aux/renderHarness.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayLocal } from '../src/utils/calculators.ts';

const DASHBOARD = 'src/screens/DashboardScreen.tsx';
const HONEST_FIRE_LINE = 'Add your monthly expenses in Settings to see your FIRE math';

function afterLabel(strings, label) {
  const index = strings.indexOf(label);
  assert.notEqual(index, -1, `expected the "${label}" card to be rendered`);
  return strings.slice(index + 1);
}

/** JSX interpolation splits "Rs. a / Rs. b" into three text nodes. */
function fireFraction(strings) {
  for (let i = 0; i < strings.length - 2; i += 1) {
    if (/^Rs\. [\d,]+$/.test(strings[i]) && strings[i + 1] === ' / ' && /^Rs\. [\d,]+$/.test(strings[i + 2])) {
      return `${strings[i]} / ${strings[i + 2]}`;
    }
  }
  return null;
}

/** "{n}% of target" likewise renders as two nodes: the number, then the tail. */
function pctOfTarget(strings) {
  const index = strings.indexOf('% of target');
  return index > 0 ? `${strings[index - 1]}% of target` : null;
}

function seedHoldingsAndScalars(db) {
  return Promise.all([
    db.setSetting('cash', '50000'),
    db.setSetting('property', '12000000'),
    db.addHolding({
      ticker: 'OGDC',
      quantity: 100,
      avg_buy_price: 200,
      current_price: 250,
      last_fetched: null,
      purchase_date: null,
    }),
  ]);
}

test('Dashboard, fresh install: no expenses means an honest FIRE card, never a fabricated target', async () => {
  resetModules();
  const db = loadDb();
  // The audit's exact reproduction: brand-new install, Rs 250,000 cash.
  await db.setSetting('cash', '250000');

  const renderer = renderScreen(DASHBOARD);
  await flush(renderer);
  const strings = renderedText(renderer);

  assert.ok(strings.includes(HONEST_FIRE_LINE), 'the honest FIRE state must be rendered');
  assert.ok(!strings.includes('FIRE Achieved!'), 'must never claim FIRE is achieved without expense data');
  assert.ok(!strings.some((s) => /% of target/.test(s)), 'must never print a percentage of target');
  assert.ok(!strings.some((s) => s === 'Rs. 300'), 'must never print the fabricated Rs 300 target');
  assert.ok(
    !strings.some((s) => /Rs\.[\d,]+ \/ Rs\.[\d,]+/.test(s)),
    'no corpus / target fraction without expense data'
  );
});

test('Dashboard, net worth: an imported asset row changes the total', async () => {
  resetModules();
  const db = loadDb();
  await seedHoldingsAndScalars(db);

  const before = renderScreen(DASHBOARD);
  await flush(before);
  const netWorthBefore = afterLabel(renderedText(before), 'Net Worth')[0];

  resetModules();
  const dbAgain = loadDb();
  await seedHoldingsAndScalars(dbAgain);
  // An FBR wealth line, exactly as the importer writes it.
  await dbAgain.addAsset({
    kind: 'gold',
    label: 'Gold',
    amount_pkr: 500000,
    source: 'fbr',
    imported_at: '2026-11-22T00:00:00.000Z',
    raw_line: 'Gold: 500000',
  });

  const after = renderScreen(DASHBOARD);
  await flush(after);
  const stringsAfter = renderedText(after);
  const netWorthAfter = afterLabel(stringsAfter, 'Net Worth')[0];

  assert.equal(netWorthBefore, 'Rs. 12,075,000');
  assert.equal(netWorthAfter, 'Rs. 12,575,000');
  assert.notEqual(netWorthAfter, netWorthBefore, 'importing an asset must move net worth');
  assert.ok(stringsAfter.includes('Other assets: '), 'the imported asset gets its own line');
  assert.ok(stringsAfter.includes('Rs. 500,000'), 'the asset is valued by its stored amount');
});

test('Dashboard, explicit FIRE target: an entered target is shown, never replaced by a prompt', async () => {
  resetModules();
  const db = loadDb();
  // Settings offers "FIRE Target (PKR) — leave empty to auto-calculate", so a
  // target can exist with no expense data at all. Gating the card on expenses
  // alone hid a number the user typed themselves.
  await db.setSetting('cash', '250000');
  await db.setSetting('fire_target', '10000000');

  const renderer = renderScreen(DASHBOARD);
  await flush(renderer);
  const strings = renderedText(renderer);

  assert.ok(strings.includes('Rs. 10,000,000'), 'the saved target is rendered');
  assert.ok(!strings.includes(HONEST_FIRE_LINE), 'must not prompt for expenses when a target exists');
  assert.ok(
    strings.includes('Add your monthly expenses to project years to FIRE'),
    'the years line names the missing data instead of claiming the target is unreachable'
  );
  assert.ok(
    !strings.some((s) => s.includes('Cannot reach FIRE')),
    'a missing expense series is not the same as an unreachable target'
  );
});

test('Dashboard, explicit FIRE target: percentage and verdict use the same target', async () => {
  resetModules();
  const db = loadDb();
  // The audit's reproduction: corpus 20M, explicit target 30M, expenses
  // 50k/month (auto target 15M). r14 printed "66.7% of target · FIRE Achieved!".
  await db.setSetting('cash', '20000000');
  await db.setSetting('fire_target', '30000000');
  await db.addExpense({ amount: 50000, category: 'Living', date: todayLocal() });

  const renderer = renderScreen(DASHBOARD);
  await flush(renderer);
  const strings = renderedText(renderer);

  assert.equal(fireFraction(strings), 'Rs. 20,000,000 / Rs. 30,000,000', 'the fraction names the explicit target');
  assert.equal(pctOfTarget(strings), '66.7% of target', 'the percentage uses the explicit target');
  assert.ok(!strings.includes('FIRE Achieved!'), 'the auto target must not crown a corpus below the saved target');
  assert.ok(
    strings.some((s) => /^\d+ years to FIRE$/.test(s)),
    'the years line is projected to the explicit target too'
  );
});

test('Dashboard, auto FIRE target: achieved verdict and 100% agree when no target is saved', async () => {
  resetModules();
  const db = loadDb();
  // Same corpus and expenses, no explicit target: the auto target is 15M, so
  // the single consistent answer is 100% and FIRE Achieved!.
  await db.setSetting('cash', '20000000');
  await db.addExpense({ amount: 50000, category: 'Living', date: todayLocal() });

  const renderer = renderScreen(DASHBOARD);
  await flush(renderer);
  const strings = renderedText(renderer);

  assert.equal(fireFraction(strings), 'Rs. 20,000,000 / Rs. 15,000,000', 'the fraction names the auto target');
  assert.equal(pctOfTarget(strings), '100.0% of target', 'the percentage is the auto target percentage');
  assert.ok(strings.includes('FIRE Achieved!'), 'crossing the auto target is achieved');
});
