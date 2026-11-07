import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PMEX_FILTERS,
  buildPmexAssets,
  filterPmexAssets,
  pmexCategoryGroup,
  searchPmexAssets,
  visiblePmexAssets,
} from '../src/utils/pmexBoard.ts';
import type { PmexRow } from '../src/services/pmexService.ts';
import { pkrPerTolaFromUsdPerOz } from '../src/services/pmexService.ts';

const USD_PKR = 276.5278;

function row(overrides: Partial<PmexRow>): PmexRow {
  return {
    contract: 'X',
    bid: null,
    ask: null,
    lastPrice: null,
    changePct: null,
    category: '',
    updatedAtMs: null,
    ...overrides,
  };
}

// Values trace to docs/HARVEST-PMEX.md §2.1 / §4.
const BOARD: PmexRow[] = [
  row({
    contract: 'TOLAGOLD-WED',
    bid: 415833,
    ask: 424816,
    changePct: -2.68,
    category: 'Phy_Gold',
    updatedAtMs: Date.parse('2026-11-04T14:43:12Z'),
  }),
  row({
    contract: 'MTOLAGOLD-WED',
    bid: 424,
    ask: 425,
    changePct: 0,
    category: 'Phy_Gold',
    updatedAtMs: Date.parse('2026-11-04T14:43:12Z'),
  }),
  row({
    contract: 'SL100OZ-DE26',
    bid: 52.257,
    ask: 52.283,
    changePct: -0.27,
    category: 'Metals',
    updatedAtMs: Date.parse('2026-11-04T14:43:38Z'),
  }),
  row({
    contract: 'GO100OZ-DE26',
    bid: 4056.3,
    ask: 4056.8,
    changePct: 3.01,
    category: 'Metals',
    updatedAtMs: Date.parse('2026-11-04T14:43:38Z'),
  }),
  row({
    contract: 'BRENT10-JA27',
    bid: 100.41,
    ask: 100.57,
    changePct: 0.5,
    category: 'Oil',
    updatedAtMs: Date.parse('2026-11-04T14:43:38Z'),
  }),
  row({
    contract: 'GOLDEURUSD',
    bid: 1.08,
    ask: 1.09,
    changePct: -0.1,
    category: 'Cots',
    updatedAtMs: Date.parse('2026-11-04T14:43:38Z'),
  }),
  row({
    contract: 'GOLD-DE26',
    bid: 0,
    ask: 0,
    changePct: null,
    category: 'Phy_Gold',
    updatedAtMs: null,
  }),
];

test('pmex board: the 9 harvest categories fold into the four filter groups', () => {
  assert.equal(pmexCategoryGroup('Metals'), 'Metals');
  assert.equal(pmexCategoryGroup('Phy_Gold'), 'Metals');
  assert.equal(pmexCategoryGroup('Oil'), 'Energy');
  assert.equal(pmexCategoryGroup('Energy'), 'Energy');
  assert.equal(pmexCategoryGroup('Cots'), 'FX');
  assert.equal(pmexCategoryGroup('Agri'), 'Other');
  assert.equal(pmexCategoryGroup('Phy_Agri'), 'Other');
  assert.equal(pmexCategoryGroup('Indices'), 'Other');
  assert.equal(pmexCategoryGroup('Financials'), 'Other');
  assert.equal(pmexCategoryGroup('nonsense'), 'Other');
  assert.deepEqual(PMEX_FILTERS, ['All', 'Metals', 'Energy', 'FX']);
});

test('pmex board: PKR/tola appears only for native tola and derived silver', () => {
  const assets = buildPmexAssets(BOARD, USD_PKR);
  const byContract = Object.fromEntries(assets.map((asset) => [asset.contract, asset]));

  // Native PKR per tola, midpoint of the two-sided market.
  assert.equal(byContract['TOLAGOLD-WED'].pkrLine, '420,324.50 PKR / tola');
  assert.equal(byContract['TOLAGOLD-WED'].pkrDerived, false);

  // Milli-tola is native PKR per 0.001 tola; shown as PKR/tola by x1000.
  assert.equal(byContract['MTOLAGOLD-WED'].pkrLine, '424,500.00 PKR / tola');
  assert.equal(byContract['MTOLAGOLD-WED'].pkrDerived, false);

  // Silver is USD/oz only, so the PKR/tola figure is the derived formula.
  const expectedSilver = pkrPerTolaFromUsdPerOz(52.27, USD_PKR);
  assert.ok(expectedSilver !== null);
  assert.equal(
    byContract['SL100OZ-DE26'].pkrLine,
    `≈ ${expectedSilver.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} PKR / tola (derived)`
  );
  assert.equal(byContract['SL100OZ-DE26'].pkrDerived, true);

  // USD-quoted contracts that are not silver carry no PKR/tola line.
  assert.equal(byContract['GO100OZ-DE26'].pkrLine, null);
  assert.equal(byContract['BRENT10-JA27'].pkrLine, null);
  assert.equal(byContract['GOLDEURUSD'].pkrLine, null);
});

test('pmex board: change sign drives the tone and the signed label', () => {
  const assets = buildPmexAssets(BOARD, USD_PKR);
  const byContract = Object.fromEntries(assets.map((asset) => [asset.contract, asset]));

  assert.equal(byContract['GO100OZ-DE26'].tone, 'pos');
  assert.equal(byContract['GO100OZ-DE26'].changeLabel, '+3.01%');
  assert.equal(byContract['TOLAGOLD-WED'].tone, 'neg');
  assert.equal(byContract['TOLAGOLD-WED'].changeLabel, '-2.68%');
  assert.equal(byContract['MTOLAGOLD-WED'].tone, 'flat');
  assert.equal(byContract['MTOLAGOLD-WED'].changeLabel, '0.00%');
});

test('pmex board: a row with no two-sided market never ships', () => {
  const assets = buildPmexAssets(BOARD, USD_PKR);
  assert.equal(assets.some((asset) => asset.contract === 'GOLD-DE26'), false);
  assert.equal(assets.length, BOARD.length - 1);
});

test('pmex board: search is case-insensitive on contract and category', () => {
  const assets = buildPmexAssets(BOARD, USD_PKR);

  assert.deepEqual(
    searchPmexAssets(assets, 'go1').map((asset) => asset.contract),
    ['GO100OZ-DE26']
  );
  assert.deepEqual(
    searchPmexAssets(assets, 'PHY').map((asset) => asset.contract),
    ['TOLAGOLD-WED', 'MTOLAGOLD-WED']
  );
  assert.equal(searchPmexAssets(assets, 'metals').length, 2);
  assert.equal(searchPmexAssets(assets, '  ').length, assets.length);
  assert.equal(searchPmexAssets(assets, 'zzz').length, 0);
});

test('pmex board: filter chips and search compose', () => {
  const assets = buildPmexAssets(BOARD, USD_PKR);

  assert.equal(filterPmexAssets(assets, 'All').length, assets.length);
  assert.deepEqual(
    filterPmexAssets(assets, 'Metals').map((asset) => asset.contract),
    ['TOLAGOLD-WED', 'MTOLAGOLD-WED', 'SL100OZ-DE26', 'GO100OZ-DE26']
  );
  assert.deepEqual(
    filterPmexAssets(assets, 'Energy').map((asset) => asset.contract),
    ['BRENT10-JA27']
  );
  assert.deepEqual(
    filterPmexAssets(assets, 'FX').map((asset) => asset.contract),
    ['GOLDEURUSD']
  );

  // Metals + "sl" narrows to the silver row only.
  assert.deepEqual(
    visiblePmexAssets(assets, 'sl', 'Metals').map((asset) => asset.contract),
    ['SL100OZ-DE26']
  );
});
