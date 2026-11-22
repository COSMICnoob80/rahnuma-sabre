// Portfolio render tests.
//
// The NAV lane shipped with zero render coverage, which is how an unpriced
// ETF ended up printing "NAV 18.27 · price 15.00 · gap -17.9%" against a buy
// price. These tests mount the real screen and drive the real navService, with
// only the network edge stubbed.

import { renderScreen, renderedText, loadDb, resetModules, flush } from './aux/renderHarness.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const PORTFOLIO = 'src/screens/PortfolioScreen.tsx';

// Verbatim stats block from https://dps.psx.com.pk/etf/MZNPETF (intraday iNAV).
const MZN_HTML =
  '<div class="stats"><div class="stats_item"><div class="stats_label" style="text-transform: none;">iNAV</div>' +
  '<div class="stats_value">18.27</div>' +
  '<div class="stats_note" style="font-size: 0.9em; color:#666; margin-top:0.5em">Last Updated:  2026-11-20 16:30:19</div>' +
  '</div><div class="stats_item"></div></div>';

async function settle(renderer) {
  for (let i = 0; i < 6; i += 1) await flush(renderer);
  return renderer;
}

function stubEtfPage(html) {
  globalThis.fetch = async () => ({ ok: true, text: async () => html });
}

async function seedEtf(db, currentPrice) {
  await db.addHolding({
    ticker: 'MZNPETF',
    quantity: 100,
    avg_buy_price: 15,
    current_price: currentPrice,
    last_fetched: null,
    purchase_date: null,
  });
}

test('Portfolio, unpriced ETF: no gap line is drawn against the buy price', async () => {
  resetModules();
  const db = loadDb();
  await seedEtf(db, null);
  stubEtfPage(MZN_HTML);

  const renderer = await settle(renderScreen(PORTFOLIO));
  const strings = renderedText(renderer);

  // The row is honest about what the 15.00 is …
  assert.ok(strings.some((s) => s.includes('showing buy price')), 'the buy price is labelled as such');
  // … and shows the NAV alone, never a market-looking gap.
  assert.ok(strings.includes('NAV 18.27'), 'the published NAV is still shown');
  assert.ok(!strings.some((s) => s.includes('· gap')), 'no gap without a live quote');
  assert.ok(!strings.some((s) => s.includes('price 15.00')), 'a buy price is never labelled price');
  assert.ok(!strings.some((s) => s.includes('-17.9%')), 'the audit reproduction number never renders');
  assert.ok(!strings.includes('NAV unavailable'), 'the NAV itself is available');
});

test('Portfolio, priced ETF: the gap line still appears when NAV and price both exist', async () => {
  resetModules();
  const db = loadDb();
  await seedEtf(db, 18.22);
  stubEtfPage(MZN_HTML);

  const renderer = await settle(renderScreen(PORTFOLIO));
  const strings = renderedText(renderer);

  assert.ok(
    strings.includes('NAV 18.27 · price 18.22 · gap -0.3%'),
    'with a live quote the full gap line is rendered'
  );
});
