import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PSX_SYMBOLS, findSymbol, searchSymbols } from '../src/services/psxSymbols.ts';

test('psx symbols: the catalog covers at least the full KSE-100', () => {
  assert.ok(PSX_SYMBOLS.length >= 100, `catalog only has ${PSX_SYMBOLS.length} rows`);
  assert.equal(new Set(PSX_SYMBOLS.map((row) => row.symbol)).size, PSX_SYMBOLS.length);
});

test('psx symbols: every row has an upper-case symbol, a name and a sector', () => {
  for (const row of PSX_SYMBOLS) {
    assert.match(row.symbol, /^[A-Z][A-Z0-9]*$/, `bad symbol: ${row.symbol}`);
    assert.ok(row.name.trim().length > 0, `${row.symbol} has no name`);
    assert.ok(row.sector.trim().length > 0, `${row.symbol} has no sector`);
  }
  const sectors = new Set(PSX_SYMBOLS.map((row) => row.sector));
  for (const sector of ['Banks', 'Cement', 'E&P', 'OMC', 'Fertilizer', 'Pharma', 'Tech']) {
    assert.ok(sectors.has(sector), `sector missing from catalog: ${sector}`);
  }
});

test('psx symbols: find by symbol is exact and case-insensitive', () => {
  assert.equal(findSymbol('HBL')?.name, 'Habib Bank Limited');
  assert.equal(findSymbol('hbl')?.symbol, 'HBL');
  assert.equal(findSymbol('  ogdc ')?.sector, 'E&P');
  assert.equal(findSymbol('HBLX'), null);
  assert.equal(findSymbol(''), null);
});

test('psx symbols: find by name matches a startsWith prefix', () => {
  const hits = searchSymbols('Habib');
  assert.ok(hits.some((row) => row.symbol === 'HBL'), 'name startsWith did not find HBL');

  // "Lucky" prefixes two companies (Lucky Core Industries, Lucky Cement).
  const lucky = searchSymbols('Lucky');
  assert.ok(lucky.some((row) => row.symbol === 'LCI'));
  assert.ok(lucky.some((row) => row.symbol === 'LUCK'));

  assert.equal(searchSymbols('Lucky Cement')[0]?.symbol, 'LUCK');
  assert.equal(searchSymbols('habib bank')[0]?.symbol, 'HBL');
});

test('psx symbols: symbol matches rank before name matches and the list caps at 6', () => {
  const hits = searchSymbols('P');
  assert.ok(hits.length > 0 && hits.length <= 6);
  assert.ok(hits[0].symbol.startsWith('P'), `first hit was ${hits[0].symbol}`);

  assert.deepEqual(searchSymbols(''), []);
  assert.deepEqual(searchSymbols('ZZZZZZ'), []);
  assert.equal(searchSymbols('a', 3).length, 3);
});
