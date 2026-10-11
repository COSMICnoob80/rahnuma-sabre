# API Landscape — Rahnuma Sabre Data Sources

**Date:** 2026-10-11
**Purpose:** Identify free/legitimate data sources for the offline-first PSX personal finance app.

---

## Summary Verdict

**Good news:** Several free PSX data sources exist. **Caveat:** most are unofficial/scraped and carry licensing risk. The app's current Yahoo Finance `.KAR` endpoint is indicative and unlicensed — same risk profile as most alternatives below.

---

## PSX Market Data Sources

| Source | URL | Free? | Data | Licensing | Reliability |
|---|---|---|---|---|---|
| **pyPSX** | https://pypsx.com/data | ✅ Free, no key | 10yr OHLCV, fundamentals, dividends, sectors, signals | Public domain / scraped | High — clean pandas DataFrames |
| **PSX Lens** | https://psxlens.com/api-access | ✅ Free | Real-time + delayed PSX prices, MCP server | Unclear — free tier | Medium — community-run |
| **Capital Stake** | https://www.capitalstake.com/docs/rest/api/stocks/intro | ✅ Free REST + WebSocket | 360° PSX data, real-time | Commercial API with free tier | High — production-grade |
| **PSX Official Data Vending** | https://www.psx.com.pk/psx/product-and-services/data-services-vending | ❌ Paid | Real-time L1/L2, delayed, historical | Official PSX license | Highest — but paid |
| **PakDataHub** | https://pakdatahub.com/about | ✅ Free tier | Pakistan economic data, forex, commodities | Free tier available | Medium — economic, not equity-specific |
| **Yahoo Finance .KAR** | (undocumented endpoint) | ✅ Free | Indicative EOD prices for .KAR tickers | Unlicensed | Medium — what we use today |

## Mutual Fund NAV Sources

| Source | URL | Free? | Data | Notes |
|---|---|---|---|---|
| **Al-Meezan Group** | https://www.almeezangroup.com | ✅ PDFs | Fund brochures, NAVs | Manual scraping required — no API |
| **Zakheera** | https://www.zakheera.com | ✅ Free | Pakistan economy, stocks, mutual funds, debt | Has a data universe, unclear API access |
| **Sarmaaya** | https://sarmaaya.pk | ✅ Free | PSX-authorized verified data, 100K+ investors | PSX-authorized — most legitimate |

## News & Announcements

| Source | URL | Free? | Data |
|---|---|---|---|
| **PSX Company Announcements** | https://www.psx.com.pk | ✅ Free | Official announcements, financial statements |
| **Mettis Global** | https://mettisglobal.news | ✅ Free | PSX news, company updates |
| **Investify** | https://investify.pk | ✅ Free | PSX quotes, news, announcements |

## Competitor Apps (for feature comparison, not data)

| App | URL | Notes |
|---|---|---|
| **Finqalab** (Next Capital) | https://finqalab.com | SECP-regulated brokerage, portfolio analytics |
| **UpInvest** | https://upinvest.pk | Portfolio tracker, real-time updates |
| **Nuffa** (Ticker Analyst) | — | PSX portfolio tracker |
| **Smarter PSX** | — | Embedded AI stock summaries |

---

## Recommendation for Rahnuma

1. **Short-term (free, no key):** Use **pyPSX** as a drop-in replacement for the Yahoo Finance endpoint. It's free, no API key, and has clean pandas DataFrames with 10 years of OHLCV. Same licensing risk profile as Yahoo — acceptable for a beta.

2. **Medium-term (legitimate):** Partner with **Sarmaaya** (PSX-authorized data) or **Zakheera** for mutual fund NAV data. This would be a genuine differentiator — "PSX-authorized data" vs. competitors using scraped feeds.

3. **Long-term (production):** Evaluate **Capital Stake** REST API — it has a free tier and is production-grade. If Rahnuma grows, this becomes the paid upgrade path.

4. **Mutual fund data:** No clean API exists. Al-Meezan and other AMCs publish PDFs. This is a real gap in the market — **if Rahnuma could scrape and normalize mutual fund NAVs into a clean API, that alone would be a moat.**

---

## Risk Note

All free sources (pyPSX, PSX Lens, Yahoo) are scraped/unlicensed. They carry the same risk: they could break or change without notice. For a beta this is acceptable. For production, a PSX-authorized partnership (Sarmaaya) is the only defensible path.
