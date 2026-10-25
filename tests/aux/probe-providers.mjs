// Live provider probe — evidence only, no npm dependencies.
// Run: node tests/aux/probe-providers.mjs
//
// Node's bundled fetch (undici) is rejected by Yahoo at the TLS layer on some
// hosts, while system curl is accepted. The probe tries fetch, then retries the
// identical request with curl so the evidence reflects the provider, not the
// transport.

import { execFileSync } from 'node:child_process';

const UA =
  'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

async function request(url, accept) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept } });
    return { status: response.status, text: await response.text(), via: 'fetch' };
  } catch (error) {
    try {
      const raw = execFileSync(
        'curl',
        ['-sS', '-m', '25', '-H', `User-Agent: ${UA}`, '-H', `Accept: ${accept}`, '-w', '\n%{http_code}', url],
        { encoding: 'utf8' }
      );
      const splitAt = raw.lastIndexOf('\n');
      return {
        status: Number(raw.slice(splitAt + 1).trim()),
        text: raw.slice(0, splitAt),
        via: 'curl',
      };
    } catch (curlError) {
      return {
        status: 0,
        text: `fetch: ${error.message}; curl: ${curlError.message}`,
        via: 'none',
      };
    }
  }
}

async function probeYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  console.log(`[yahoo] GET ${url}`);
  const result = await request(url, 'application/json,text/plain,*/*');
  console.log(`[yahoo] HTTP ${result.status} via=${result.via}`);
  if (result.status !== 200) {
    console.log(`[yahoo] body=${result.text.slice(0, 120).replace(/\s+/g, ' ')}`);
    return;
  }
  try {
    const data = JSON.parse(result.text);
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) {
      console.log(`[yahoo] no chart meta; body=${result.text.slice(0, 120)}`);
      return;
    }
    console.log(
      `[yahoo] JSON meta: ${JSON.stringify({
        currency: meta.currency,
        symbol: meta.symbol,
        regularMarketPrice: meta.regularMarketPrice,
        chartPreviousClose: meta.chartPreviousClose,
        regularMarketChangePercent: meta.regularMarketChangePercent,
      })}`
    );
  } catch (error) {
    console.log(`[yahoo] parse error ${error.message}`);
  }
}

async function probeStooq(stooqSymbol) {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`;
  console.log(`[stooq] GET ${url}`);
  const result = await request(url, 'text/csv,text/plain,*/*');
  console.log(`[stooq] HTTP ${result.status} via=${result.via}`);
  const firstLine = result.text.split(/\r?\n/)[0] ?? '';
  console.log(`[stooq] first-line=${firstLine.slice(0, 160).replace(/\s+/g, ' ')}`);
  if (result.status === 200 && firstLine.toLowerCase().includes('close')) {
    const row = result.text.split(/\r?\n/)[1] ?? '';
    const header = firstLine.split(',').map((cell) => cell.trim().toLowerCase());
    const cells = row.split(',');
    const closeIndex = header.indexOf('close');
    console.log(`[stooq] symbol=${cells[0]} close=${closeIndex >= 0 ? cells[closeIndex] : 'n/a'}`);
  }
}

await probeYahoo('^GSPC');
console.log('');
await probeStooq('^spx');
console.log('');
await probeStooq('usdpkr');
