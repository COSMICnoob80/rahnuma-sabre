/**
 * Copy and contract rules for the Global Outlook screen.
 *
 * Every sentence here is a statement about the public record. No member of the
 * council states a direction, a target, or an action.
 */

export const OUTLOOK_HEADLINE = {
  en: 'Global Outlook',
  ur: 'روزانہ نظرثانی',
  roman: 'Global nazaar-e-sara · aaj ka subah ka munzar',
  brand: 'Rahnuma Sabre',
} as const;

export const OUTLOOK_CONTRACT =
  'Information only · Not investment advice · Rahnuma will never tell you to buy or sell';

export const OUTLOOK_DATA_FOOTNOTE =
  'Data: public feeds · Freshness labeled · Urdu + English · No direction is ever stated.';

export const CONTEXT_CHIP = 'Context, not forecast';

export interface HorizonChip {
  label: string;
  active: boolean;
}

export const HORIZON_CHIPS: HorizonChip[] = [
  { label: CONTEXT_CHIP, active: false },
  { label: 'Short', active: true },
  { label: 'Medium', active: false },
  { label: 'Long', active: false },
];

export interface CouncilNote {
  by: string;
  org: string | null;
  initials: string;
  text: string;
}

export interface CouncilNotesView {
  visible: boolean;
  placeholder: string | null;
  placeholderChip: string | null;
  notes: CouncilNote[];
}

const NO_KEY_PLACEHOLDER =
  'Council notes need a free AI key. Add one in Settings to read the attributed context here.';
const NO_KEY_CHIP = 'Council notes · key needed';

const WITH_KEY_NOTES: CouncilNote[] = [
  {
    by: 'Warren',
    org: 'Council',
    initials: 'W',
    text: 'Commodity swings are weather, not climate. Watch your own plan.',
  },
  {
    by: 'Arif Habib',
    org: 'PSX',
    initials: 'AH',
    text: 'Liquidity was thin at the open. That is a fact about the session, not a direction.',
  },
  {
    by: 'Rahnuma',
    org: 'Council',
    initials: 'R',
    text: 'The council reads the public record. Where the record is silent, this card stays silent.',
  },
];

export function councilNotes(hasKey: boolean): CouncilNotesView {
  if (!hasKey) {
    return {
      visible: true,
      placeholder: NO_KEY_PLACEHOLDER,
      placeholderChip: NO_KEY_CHIP,
      notes: [],
    };
  }
  return { visible: true, placeholder: null, placeholderChip: null, notes: WITH_KEY_NOTES };
}
