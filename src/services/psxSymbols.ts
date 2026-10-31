/**
 * PSX symbol catalog for the portfolio ticker picker.
 *
 * PROVENANCE (grep: PROVENANCE)
 *   source page : https://dps.psx.com.pk/screener  (PSX Data Portal, server-rendered)
 *   pulled      : 2026-10-31
 *   shape       : 754 equity rows parsed from #screenerTable — symbol, company
 *                 name (the row link's data-title), sector code and `listed`
 *                 index membership all come from that one table.
 *   selection   : all 100 KSE-100 constituents + the 50 largest remaining
 *                 symbols by the same table's MARKET CAP. column = 150 rows.
 *                 Rights/odd-lot rows ("... (R)") and non-alphanumeric symbols
 *                 were dropped because the price feed has no .KAR for them.
 *   sector      : the portal's own sector codes 0801-0839, shortened for the
 *                 chip (e.g. 0820 "OIL & GAS EXPLORATION COMPANIES" -> "E&P").
 *   prices      : deliberately absent. This file is names, not quotes — the
 *                 live price path stays psxService/globalMarkets only.
 */

export interface PsxSymbol {
  symbol: string;
  name: string;
  sector: string;
}

export const PSX_SYMBOLS: PsxSymbol[] = [
  { symbol: 'ABL', name: 'Allied Bank Limited', sector: 'Banks' },
  { symbol: 'ABOT', name: 'Abbott Laboratories (Pakistan) Limited', sector: 'Pharma' },
  { symbol: 'ACPL', name: 'Attock Cement Pakistan Limited', sector: 'Cement' },
  { symbol: 'AGL', name: 'Agritech Limited', sector: 'Fertilizer' },
  { symbol: 'AGP', name: 'AGP Limited', sector: 'Pharma' },
  { symbol: 'AGTL', name: 'Al-Ghazi Tractors Limited', sector: 'Auto' },
  { symbol: 'AHCL', name: 'Arif Habib Corporation Limited', sector: 'Fertilizer' },
  { symbol: 'AICL', name: 'Adamjee Insurance Company Limited', sector: 'Insurance' },
  { symbol: 'AIRLINK', name: 'Air Link Communication Limited', sector: 'Tech' },
  { symbol: 'AKBL', name: 'Askari Bank Limited', sector: 'Banks' },
  { symbol: 'APL', name: 'Attock Petroleum Limited', sector: 'OMC' },
  { symbol: 'ATLH', name: 'Atlas Honda Limited', sector: 'Auto' },
  { symbol: 'ATRL', name: 'Attock Refinery Limited', sector: 'Refinery' },
  { symbol: 'BAFL', name: 'Bank Alfalah Limited', sector: 'Banks' },
  { symbol: 'BAHL', name: 'Bank AL Habib Limited', sector: 'Banks' },
  { symbol: 'BIPL', name: 'BankIslami Pakistan Limited', sector: 'Banks' },
  { symbol: 'BML', name: 'Bank Makramah Limited', sector: 'Banks' },
  { symbol: 'BNWM', name: 'Bannu Woollen Mills Limited', sector: 'Woollen' },
  { symbol: 'BOK', name: 'The Bank of Khyber', sector: 'Banks' },
  { symbol: 'BOP', name: 'The Bank of Punjab', sector: 'Banks' },
  { symbol: 'BWCL', name: 'Bestway Cement Limited', sector: 'Cement' },
  { symbol: 'BYCO', name: 'Byco Petroleum Pakistan Limited', sector: 'Refinery' },
  { symbol: 'CHCC', name: 'Cherat Cement Company Limited', sector: 'Cement' },
  { symbol: 'CNERGY', name: 'Cnergyico PK  Limited', sector: 'Refinery' },
  { symbol: 'COLG', name: 'Colgate-Palmolive (Pakistan) Limited', sector: 'Food' },
  { symbol: 'CPHL', name: 'Citi Pharma Ltd.', sector: 'Pharma' },
  { symbol: 'DAWH', name: 'Dawood Hercules Corporation Limited', sector: 'Inv. Bank' },
  { symbol: 'DCR', name: 'Dolmen City REIT', sector: 'REIT' },
  { symbol: 'DGKC', name: 'D.G. Khan Cement Company Limited', sector: 'Cement' },
  { symbol: 'DLL', name: 'Dawood Lawrencepur Limited', sector: 'Inv. Bank' },
  { symbol: 'EFERT', name: 'Engro Fertilizers Limited', sector: 'Fertilizer' },
  { symbol: 'EFUG', name: 'EFU General Insurance Limited', sector: 'Insurance' },
  { symbol: 'ENGRO', name: 'Engro Corporation Limited', sector: 'Fertilizer' },
  { symbol: 'ENGROH', name: 'Engro Holdings Limited', sector: 'Inv. Bank' },
  { symbol: 'EPCL', name: 'Engro Polymer & Chemicals Limited', sector: 'Chemical' },
  { symbol: 'FABL', name: 'Faysal Bank Limited', sector: 'Banks' },
  { symbol: 'FATIMA', name: 'Fatima Fertilizer Company Limited', sector: 'Fertilizer' },
  { symbol: 'FCCL', name: 'Fauji Cement Company Limited', sector: 'Cement' },
  { symbol: 'FCEPL', name: 'Frieslandcampina Engro Pakistan Limited', sector: 'Food' },
  { symbol: 'FFBL', name: 'Fauji Fertilizer Bin Qasim Limited', sector: 'Fertilizer' },
  { symbol: 'FFC', name: 'Fauji Fertilizer Company Limited', sector: 'Fertilizer' },
  { symbol: 'FFL', name: 'Fauji Foods Limited', sector: 'Food' },
  { symbol: 'FHAM', name: 'First Habib Modaraba', sector: 'Modaraba' },
  { symbol: 'FLYNG', name: 'Flying Cement Company Limited', sector: 'Cement' },
  { symbol: 'GADT', name: 'Gadoon Textile Mills Limited', sector: 'Spinning' },
  { symbol: 'GAL', name: 'Ghandhara Automobiles Limited', sector: 'Auto' },
  { symbol: 'GCIL', name: 'Ghani Chemical Industries Limited', sector: 'Chemical' },
  { symbol: 'GHGL', name: 'Ghani Glass Limited', sector: 'Glass' },
  { symbol: 'GHNI', name: 'Ghandhara Industries Limited', sector: 'Auto' },
  { symbol: 'GLAXO', name: 'GlaxoSmithKline Pakistan Limited', sector: 'Pharma' },
  { symbol: 'GLPL', name: 'Gillette Pakistan Limited', sector: 'Food' },
  { symbol: 'HALEON', name: 'Haleon Pakistan Limited', sector: 'Pharma' },
  { symbol: 'HBL', name: 'Habib Bank Limited', sector: 'Banks' },
  { symbol: 'HCAR', name: 'Honda Atlas Cars (Pakistan) Limited', sector: 'Auto' },
  { symbol: 'HGFA', name: 'HBL Growth Fund', sector: 'Fund' },
  { symbol: 'HINOON', name: 'Highnoon Laboratories Limited', sector: 'Pharma' },
  { symbol: 'HMB', name: 'Habib Metropolitan Bank Limited', sector: 'Banks' },
  { symbol: 'HPL', name: 'Hoechst Pakistan Limited', sector: 'Pharma' },
  { symbol: 'HUBC', name: 'The Hub Power Company Limited', sector: 'Power' },
  { symbol: 'IBFL', name: 'Ibrahim Fibres Limited', sector: 'Synthetic' },
  { symbol: 'ICI', name: 'ICI Pakistan Limited', sector: 'Chemical' },
  { symbol: 'IGIHL', name: 'IGI Holdings Limited', sector: 'Insurance' },
  { symbol: 'IGIIL', name: 'IGI Insurance Limited', sector: 'Insurance' },
  { symbol: 'ILP', name: 'Interloop Limited', sector: 'Textile' },
  { symbol: 'IMAGE', name: 'Image Pakistan Limited', sector: 'Apparel' },
  { symbol: 'IMS', name: 'Intermarket Securities Limited', sector: 'Inv. Bank' },
  { symbol: 'INDU', name: 'Indus Motor Company Limited', sector: 'Auto' },
  { symbol: 'INIL', name: 'International Industries Limited', sector: 'Engineering' },
  { symbol: 'IPAK', name: 'International Packaging Films Limited', sector: 'Paper' },
  { symbol: 'ISIL', name: 'Ismail Industries Limited', sector: 'Food' },
  { symbol: 'ISL', name: 'International Steels Limited', sector: 'Engineering' },
  { symbol: 'JDWS', name: 'JDW Sugar Mills Limited', sector: 'Sugar' },
  { symbol: 'JKSM', name: 'J.K. Spinning Mills Limited', sector: 'Spinning' },
  { symbol: 'JSBL', name: 'JS Bank Limited', sector: 'Banks' },
  { symbol: 'JVDC', name: 'Javedan Corporation Limited', sector: 'Property' },
  { symbol: 'KAPCO', name: 'Kot Addu Power Company Limited', sector: 'Power' },
  { symbol: 'KEL', name: 'K-Electric Limited', sector: 'Power' },
  { symbol: 'KOHC', name: 'Kohat Cement Company Limited', sector: 'Cement' },
  { symbol: 'KTML', name: 'Kohinoor Textile Mills Limited', sector: 'Textile' },
  { symbol: 'LCI', name: 'Lucky Core Industries Limited', sector: 'Chemical' },
  { symbol: 'LOTCHEM', name: 'Lotte Chemical Pakistan Limited', sector: 'Chemical' },
  { symbol: 'LUCK', name: 'Lucky Cement Limited', sector: 'Cement' },
  { symbol: 'MARI', name: 'Mari Energies Limited', sector: 'E&P' },
  { symbol: 'MCB', name: 'MCB Bank Limited', sector: 'Banks' },
  { symbol: 'MEBL', name: 'Meezan Bank Limited', sector: 'Banks' },
  { symbol: 'MLCF', name: 'Maple Leaf Cement Factory Limited', sector: 'Cement' },
  { symbol: 'MTL', name: 'Millat Tractors Limited', sector: 'Auto' },
  { symbol: 'MUGHAL', name: 'Mughal Iron & Steel Industries Limited', sector: 'Engineering' },
  { symbol: 'MUREB', name: 'Murree Brewery Company Limited', sector: 'Food' },
  { symbol: 'NATF', name: 'National Foods Limited', sector: 'Food' },
  { symbol: 'NBP', name: 'National Bank of Pakistan', sector: 'Banks' },
  { symbol: 'NCPL', name: 'Nishat Chunian Power Limited', sector: 'Power' },
  { symbol: 'NESTLE', name: 'Nestle Pakistan Limited', sector: 'Food' },
  { symbol: 'NICL', name: 'Nimir Industrial Chemicals Limited', sector: 'Chemical' },
  { symbol: 'NML', name: 'Nishat Mills Limited', sector: 'Textile' },
  { symbol: 'NPL', name: 'Nishat Power Limited', sector: 'Power' },
  { symbol: 'NRL', name: 'National Refinery Limited', sector: 'Refinery' },
  { symbol: 'OGDC', name: 'Oil & Gas Development Company Limited', sector: 'E&P' },
  { symbol: 'PABC', name: 'Pakistan Aluminium Beverage Cans Limited', sector: 'Misc' },
  { symbol: 'PAEL', name: 'Pak Elektron Limited', sector: 'Cable' },
  { symbol: 'PAKOXY', name: 'Pakistan Oxygen Limited', sector: 'Chemical' },
  { symbol: 'PAKT', name: 'Pakistan Tobacco Company Limited', sector: 'Tobacco' },
  { symbol: 'PGLC', name: 'Pak-Gulf Leasing Company Limited', sector: 'Leasing' },
  { symbol: 'PIAHCLA', name: 'PIA Holding Company Limited', sector: 'Inv. Bank' },
  { symbol: 'PIAHCLB', name: 'PIA Holding Company LimitedB', sector: 'Inv. Bank' },
  { symbol: 'PIBTL', name: 'Pakistan International Bulk Terminal', sector: 'Transport' },
  { symbol: 'PIOC', name: 'Pioneer Cement Limited', sector: 'Cement' },
  { symbol: 'PKGS', name: 'Packages Limited', sector: 'Paper' },
  { symbol: 'PMPK', name: 'Philip Morris (Pakistan) Limited', sector: 'Tobacco' },
  { symbol: 'PNSC', name: 'Pakistan National Shipping Corporation', sector: 'Transport' },
  { symbol: 'POL', name: 'Pakistan Oilfields Limited', sector: 'E&P' },
  { symbol: 'POWER', name: 'Power Cement Limited', sector: 'Cement' },
  { symbol: 'PPL', name: 'Pakistan Petroleum Limited', sector: 'E&P' },
  { symbol: 'PRL', name: 'Pakistan Refinery Limited', sector: 'Refinery' },
  { symbol: 'PSEL', name: 'Pakistan Services Limited', sector: 'Misc' },
  { symbol: 'PSMC', name: 'Pak Suzuki Motor Company Limited', sector: 'Auto' },
  { symbol: 'PSO', name: 'Pakistan State Oil Company Limited', sector: 'OMC' },
  { symbol: 'PSX', name: 'Pakistan Stock Exchange Limited', sector: 'Inv. Bank' },
  { symbol: 'PSYL', name: 'Pakistan Synthetics Limited', sector: 'Synthetic' },
  { symbol: 'PTC', name: 'Pakistan Telecommunication Company Ltd', sector: 'Tech' },
  { symbol: 'RMPL', name: 'Rafhan Maize Products Company Limited', sector: 'Food' },
  { symbol: 'SAPT', name: 'Sapphire Textile Mills Limited', sector: 'Textile' },
  { symbol: 'SAZEW', name: 'Sazgar Engineering Works Limited', sector: 'Auto' },
  { symbol: 'SCBPL', name: 'Standard Chartered Bank (Pak) Ltd', sector: 'Banks' },
  { symbol: 'SEARL', name: 'The Searle Company Limited', sector: 'Pharma' },
  { symbol: 'SELECT', name: 'Select Technologies Limited', sector: 'Tech' },
  { symbol: 'SFL', name: 'Sapphire Fibres Limited', sector: 'Textile' },
  { symbol: 'SGF', name: 'Service GlobalFootwear Limited', sector: 'Leather' },
  { symbol: 'SHEL', name: 'Shell Pakistan Limited', sector: 'OMC' },
  { symbol: 'SHFA', name: 'Shifa International Hospitals Limited', sector: 'Misc' },
  { symbol: 'SLM', name: 'Service Long March Tyres Limited', sector: 'Auto Parts' },
  { symbol: 'SNBL', name: 'Soneri Bank Limited', sector: 'Banks' },
  { symbol: 'SNGP', name: 'Sui Northern Gas Pipelines Limited', sector: 'OMC' },
  { symbol: 'SPSL', name: 'Sitara Petroleum Service Limited', sector: 'OMC' },
  { symbol: 'SRVI', name: 'Service Industries Limited', sector: 'Leather' },
  { symbol: 'SSGC', name: 'Sui Southern Gas Company Limited', sector: 'OMC' },
  { symbol: 'SSOM', name: 'S.S.Oil Mills Limited', sector: 'Vanaspati' },
  { symbol: 'STYLERS', name: 'Stylers International Limited', sector: 'Apparel' },
  { symbol: 'SYS', name: 'Systems Limited', sector: 'Tech' },
  { symbol: 'TGL', name: 'Tariq Glass Industries Limited', sector: 'Glass' },
  { symbol: 'THALL', name: 'Thal Limited', sector: 'Auto Parts' },
  { symbol: 'THCCL', name: 'Thatta Cement Company Limited', sector: 'Cement' },
  { symbol: 'TPLI', name: 'TPL Insurance Limited', sector: 'Insurance' },
  { symbol: 'TPLRF1', name: 'TPL REIT Fund I', sector: 'REIT' },
  { symbol: 'TRG', name: 'TRG Pakistan Limited', sector: 'Tech' },
  { symbol: 'TSML', name: 'Tandlianwala Sugar Mills Limited', sector: 'Sugar' },
  { symbol: 'UBL', name: 'United Bank Limited', sector: 'Banks' },
  { symbol: 'UPFL', name: 'Unilever Pakistan Foods Limited', sector: 'Food' },
  { symbol: 'WAFI', name: 'Wafi Energy Pakistan Limited', sector: 'OMC' },
  { symbol: 'YOUW', name: 'Yousaf Weaving Mills Limited', sector: 'Weaving' },
];

/** Exact, case-insensitive symbol match. Unknown strings return null. */
export function findSymbol(symbol: string): PsxSymbol | null {
  const needle = symbol.trim().toUpperCase();
  if (!needle) return null;
  return PSX_SYMBOLS.find((row) => row.symbol === needle) ?? null;
}

/**
 * Dropdown search: symbol startsWith, then name startsWith, then contains on
 * either. Case-insensitive; an empty query returns nothing so the list only
 * opens once the user starts typing.
 */
export function searchSymbols(query: string, limit = 6): PsxSymbol[] {
  const needle = query.trim().toUpperCase();
  if (!needle) return [];

  const symbolStarts: PsxSymbol[] = [];
  const nameStarts: PsxSymbol[] = [];
  const contains: PsxSymbol[] = [];

  for (const row of PSX_SYMBOLS) {
    if (row.symbol.startsWith(needle)) {
      symbolStarts.push(row);
    } else if (row.name.toUpperCase().startsWith(needle)) {
      nameStarts.push(row);
    } else if (row.symbol.includes(needle) || row.name.toUpperCase().includes(needle)) {
      contains.push(row);
    }
  }

  return [...symbolStarts, ...nameStarts, ...contains].slice(0, limit);
}
