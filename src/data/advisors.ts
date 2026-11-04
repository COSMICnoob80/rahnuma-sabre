/**
 * Rahnuma Sabre — Advisor directory roster
 *
 * The roster is public registry data, not a recommendation list.
 *
 * Sources (harvested 2026-11-04 from open institutional pages):
 * - MUFAP member registry (mutual fund / AMC side):
 *     https://www.mufap.com.pk/members.php
 *   The live page answers HTTP 403 (Cloudflare challenge) from this build host, so the
 *   member table was transcribed from the Internet Archive capture of that same page
 *   dated 2024-05-18:
 *     https://web.archive.org/web/20240518060530/https://mufap.com.pk/members.php
 *   Each name was cross-checked against the fund managers still listed on the
 *   MUFAP-derived 2026 roster; an entity that no longer appears was dropped
 *   (Interloop Asset Management Limited).
 * - PSX published online brokerage list (broker side):
 *     https://www.psx.com.pk/psx/themes/psx/uploads/List-of-Online-Brokers-13-8-24.zip
 *   linked from https://www.psx.com.pk/psx/online-only-broker
 *   The first 36 rows are included in the list's own order — a size cut-off, not a ranking.
 *
 * Names, cities and addresses are transcribed as published. No ratings, no fees, no
 * rankings, no affiliate links: Rahnuma records who is registered, never who is better.
 */

export type AdvisorKind = 'AMC' | 'Broker';

export interface Advisor {
  kind: AdvisorKind;
  name: string;
  city: string;
  /** Registry status line (membership / licence), as printed by the source. */
  licenseNote?: string;
  /** The entity's own page, only where the registry printed one. */
  url?: string;
  /** Registered address, as printed by the registry. */
  address?: string;
}

export const ADVISORS: Advisor[] = [
  {
    kind: 'AMC',
    name: 'ABL Asset Management Company Limited',
    city: 'Lahore',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.ablfunds.com',
    address: 'Plot # 14, Main Boulevard, DHA, Phase VI, Lahore.',
  },
  {
    kind: 'AMC',
    name: 'AKD Investment Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.akdinvestment.com',
    address: 'Suite # 216-217, 2nd Floor, Continental Trade Center, Block-8, Clifton, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'AL Habib Asset Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.alhabibfunds.com',
    address: '3rd Floor, Mackinnon Building, I. I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Al Meezan Investment Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.almeezangroup.com',
    address: 'Ground Floor, Block-B, Finance and Trade Centre (FTC), Shahrah-e-Faisal, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Alfalah Asset Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.alfalahamc.com',
    address: 'Islamic Chamber of Commerce, Industry and Agriculture Building, 2nd floor, ST - 2/A, Block-9, KDA Scheme 5, Clifton, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Atlas Asset Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.atlasfunds.com.pk',
    address: 'Ground Floor, Federation House, Shahrah-e-Firdousi, Clifton, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'AWT Investments Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.awtinvestments.com',
    address: '3rd Floor, AWT Plaza, I.I Chundrgiar Road, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'BMA Investment Advisors Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.bmainvests.com',
    address: '804, 8th Floor, Uni Tower, I.I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Faysal Asset Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.faysalfunds.com',
    address: '7th Floor, West Wing, Faysal House, ST-02, Main Shahrah-e-Faisal, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'First Capital Investments Limited',
    city: 'Lahore',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.fcil.com.pk',
    address: '96-B/1, Lower Ground Floor, M.M . Alam Road, Gulberg-III, Lahore.',
  },
  {
    kind: 'AMC',
    name: 'HBL Asset Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.hblasset.com',
    address: '7th Floor, Emerald Tower, G-19, Block-5, Clifton, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'JS Investments Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.jsil.com',
    address: 'The Centre, 19th Floor, Plot # 28, SB-5, Abdullah Haroon Road, Saddar, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Lakson Investments Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.li.com.pk',
    address: 'Lakson Square, Building # 2, Sarwar Shaheed Road, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Magnus Investment Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.magnusinvestments.com',
    address: 'Office # 101, 1st Floor, Glass Tower, Frere Town, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Mahaana Wealth Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.mahaana.com',
    address: 'Office 203, 2nd Floor, The Forum, Khayaban-e-Roomi, Clifton, Karachi',
  },
  {
    kind: 'AMC',
    name: 'MCB Investment Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.mcbfunds.com',
    address: '2nd Floor, Adamjee House, I.I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'National Investment Trust Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.nit.com.pk',
    address: '6th Floor, National Bank Building, I. I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'NBP Fund Management Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.nbpfunds.com',
    address: '7th Floor, Clifton Diamond Building, Block-4, Scheme # 5, Clifton, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Pak Oman Asset Management Company Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.pakomanfunds.com',
    address: '83-C, ICON House, 12th Commercial Street, Phase II Extension, D.H.A, Karachi.',
  },
  {
    kind: 'AMC',
    name: 'Pak-Qatar Asset Management Company Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.pqamcl.com',
    address: 'Suite # G-8/9, Ground Floor, Business Arcade, Block-6, P.E.C.H.S., Shahrah-e-Faisal, Karachi',
  },
  {
    kind: 'AMC',
    name: 'UBL Fund Managers Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.ublfunds.com.pk',
    address: '4th Floor, STSM Building, Beaumont Road, Civil Lines, Karachi.',
  },
  {
    kind: 'AMC',
    name: '786 Investments Limited',
    city: 'Karachi',
    licenseNote: 'MUFAP member — asset management company',
    url: 'https://www.786Investments.com',
    address: 'G-3, Ground Floor, B.R.R. Tower, Hassan Ali Street, Off. I.I Chundrigar Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Sherman Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.shermansecurities.com',
    address: 'Room No.501-502, 5th Floor, Continental Trade Centre, Block-VIII, Clifton, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Amanah Investments Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.amanahinvestments.com',
    address: 'Room No. 123, 3rd Floor, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Optimus Capital Management (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.optimus.pk',
    address: '1st Floor, State Life Building # 1-B,  I.I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Sakarwala Capital Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.sakarwalasecurities.com',
    address: 'Room No. 114 and 605-606, 3rd & 6th Floor, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Summit Capital (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.summitcapital.com.pk',
    address: '504-506, 5th Floor, Balad Trade Center – III, D-75, Block-7, Clifton, Karachi',
  },
  {
    kind: 'Broker',
    name: 'Ismail Iqbal Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.ismailiqbal.com',
    address: 'House No. C-94, (Main House), KDA Scheme # 1, Karsaz Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'AKD Securities Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.akdsl.com',
    address: '602, Continental Trade Centre, Block 8, Clifton, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Alpha Capital (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.alfaadhi.pk',
    address: '3rd Floor, Shaheen Chamber, KAECHS, Block 7 & 8, Shahrah-e-Faisal, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'BMA Capital Management Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.bmacapital.com',
    address: 'Level-8, Unitower, I. I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'ASDA Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.asdalive.com',
    address: 'Room No. 406-408, 4th Floor, Stock Exchange New Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Ghani Osman Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.gosecurities.com.pk',
    address: 'Plot # 2/1-16, Pardesi House, Old Queens Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'AKY Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.aky.com.pk',
    address: 'Room No. 48, 1st Floor, Stock Exchange Building Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Surmawala Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.ssltrade.pk',
    address: 'Room No.635-636, 6th Floor, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Time Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.timesec.pk',
    address: 'Room No.98-99, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'HH Misbah Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.hhm.com.pk',
    address: 'Room No.96-97, 2nd Floor, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'A.H.M. Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.ahmsecurities.com',
    address: 'Room No.154, Bangalore Town, Tipu Sultan Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'IGI Finex Securities Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.igisecurities.com.pk',
    address: 'Suite No. 701-713, 7th Floor, The Forum, G-20, Khayaban-e-Jami, Block 9, Clifton, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Fortune Securities Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.fortunesecurities.com',
    address: '3rd Floor,Razi Tower, BC-13, Block No. 9, KDA Scheme No. 5, Clifton, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Next Capital Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.nextcapital.com.pk',
    address: '2nd Floor, Imperial Court Building, Dr. Ziauddin Ahmed Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Multiline Securities Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.msltrade.com',
    address: 'Office Nos. 504-505, 5th Floor, Emerald Tower, Plot # G-19, Block-5, Clifton, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Arif Habib Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.arifhabibltd.com',
    address: 'Plot # 23, 2nd Floor, Arif Habib Centre M. T. Khan Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'N.U.A. Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.nua.com.pk',
    address: 'Room No. 135-136, 3rd Floor, Stock Exchange Main Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Bawa Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.bawasecurities.com',
    address: 'Room Nos. 432-433, 4th Floor, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Nael Capital (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.naelcapital.com',
    address: 'Room No.301, 3rd Floor, Business & Finance Centre, I. I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Dawood Equities Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.dawoodequities.com',
    address: '1709, 17th Floor, Saima Trade Tower "A" I. I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'WE Financial Services Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.we.com.pk',
    address: 'Room No.506-508, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Al Habib Capital Markets (Pvt.) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.ahcml.com',
    address: 'GF-01, Techno City, Hasrat Mohani Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Iqbal Usman Kodvavi Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.iuks.com.pk',
    address: 'Room No.521-522, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Zafar Securities (Private) Limited',
    city: 'Lahore',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.zafarstocks.com',
    address: 'Room # 519, 5th Floor, LSE Building, 19-Khayaban-e-Aiwan-e-Iqbal, Lahore.',
  },
  {
    kind: 'Broker',
    name: 'Bawany Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.bawanysecurities.com.pk',
    address: 'Room No. 524, 5th Floor, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Mohammad Munir Mohammad Ahmed Khanani Securities Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.munirkhanani.com',
    address: 'Room Nos. 505, 623~627, 631~632, 6th Floor & 724, 7th Floor, Stock Exchange Main Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Fawad Yusuf Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.fyslonline.com',
    address: 'Room Nos. 301-304, 3rd Floor, Stock Exchange New Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Darson Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.darson.com.pk',
    address: 'Office No. 808, 8th Floor, Business & Finance Centre, I.I. Chundrigar Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Intermarket Securities Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.imsecurities.com.pk',
    address: 'Bahria Complex-IV, (Extension Block), 5th Floor, Ch. Kahliq-uz-Zaman Road,  Clifton, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'Memon Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.memonsecurities.com',
    address: 'Room No. 154, 3rd Floor, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
  {
    kind: 'Broker',
    name: 'FDM Capital Securities (Private) Limited',
    city: 'Karachi',
    licenseNote: 'PSX online brokerage — active',
    url: 'https://www.fdm.com.pk',
    address: 'Room No.620-621, 6th Floor, Stock Exchange Building, Stock Exchange Road, Karachi.',
  },
]

/** Footnote rendered under the list — neutral, no endorsement. */
export const DIRECTORY_FOOTNOTE =
  'Public registry data — Rahnuma endorses no provider. Information only · Not investment advice.';

export const ALL_CITIES = 'All';

/** Cities present in the roster, alphabetical. */
export const ADVISOR_CITIES: readonly string[] = Array.from(
  new Set(ADVISORS.map((entry) => entry.city))
).sort();

export type AdvisorKindFilter = 'All' | AdvisorKind;

export interface AdvisorFilter {
  kind: AdvisorKindFilter;
  city: string;
  query: string;
}

export const DEFAULT_ADVISOR_FILTER: AdvisorFilter = { kind: 'All', city: ALL_CITIES, query: '' };

/** Pure filter used by the Directory screen and by the roster tests. */
export function filterAdvisors(list: readonly Advisor[], filter: AdvisorFilter): Advisor[] {
  const query = filter.query.trim().toLowerCase();
  return list.filter((entry) => {
    if (filter.kind !== 'All' && entry.kind !== filter.kind) return false;
    if (filter.city !== ALL_CITIES && entry.city !== filter.city) return false;
    if (
      query.length > 0 &&
      !entry.name.toLowerCase().includes(query) &&
      !entry.city.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });
}
