import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTEXT_CHIP,
  HORIZON_CHIPS,
  OUTLOOK_CONTRACT,
  OUTLOOK_DATA_FOOTNOTE,
  OUTLOOK_HEADLINE,
  councilNotes,
} from '../src/utils/outlookText.ts';

const FORECAST_OR_DIRECTIVE =
  /will\s+(rise|fall)|target\s+price|\bbuy\b|\bsell\b|expect(ed)?\s+(gain|loss)/i;

test('council: without a settings key the notes slot is a visible labelled placeholder', () => {
  const view = councilNotes(false);
  assert.equal(view.visible, true);
  assert.equal(view.notes.length, 0);
  assert.equal(view.placeholderChip, 'Council notes · key needed');
  assert.ok(view.placeholder && view.placeholder.length > 0);
  assert.equal(view.placeholder, 'Council notes need a free AI key. Add one in Settings to read the attributed context here.');
  assert.doesNotMatch(view.placeholder, FORECAST_OR_DIRECTIVE);
});

test('council: with a key the notes are attributed and still carry no prediction', () => {
  const view = councilNotes(true);
  assert.equal(view.visible, true);
  assert.equal(view.placeholder, null);
  assert.equal(view.placeholderChip, null);
  assert.ok(view.notes.length >= 2);

  for (const note of view.notes) {
    assert.ok(note.by.length > 0);
    assert.ok(note.initials.length > 0);
    assert.ok(note.text.length > 0);
    assert.doesNotMatch(note.text, FORECAST_OR_DIRECTIVE);
  }

  const joined = view.notes.map((n) => n.text).join(' ');
  assert.match(joined, /public record|not a direction|weather, not climate/i);
});

test('chips: the pinned context chip and short horizon are the visible contract', () => {
  assert.equal(CONTEXT_CHIP, 'Context, not forecast');
  assert.deepEqual(
    HORIZON_CHIPS.map((c) => c.label),
    ['Context, not forecast', 'Short', 'Medium', 'Long']
  );
  const active = HORIZON_CHIPS.filter((c) => c.active).map((c) => c.label);
  assert.deepEqual(active, ['Short']);
});

test('contract: the closing line matches the harvest acceptance table verbatim', () => {
  assert.equal(
    OUTLOOK_CONTRACT,
    'Information only · Not investment advice · Rahnuma will never tell you to buy or sell'
  );
  assert.match(OUTLOOK_DATA_FOOTNOTE, /Freshness labeled/);
  assert.doesNotMatch(OUTLOOK_DATA_FOOTNOTE, FORECAST_OR_DIRECTIVE);
});

test('headline: English primary, Urdu accent, Roman Urdu subline', () => {
  assert.equal(OUTLOOK_HEADLINE.en, 'Global Outlook');
  assert.equal(OUTLOOK_HEADLINE.ur, 'روزانہ نظرثانی');
  assert.match(OUTLOOK_HEADLINE.roman, /Global nazaar-e-sara/);
  assert.ok(OUTLOOK_HEADLINE.brand.length > 0);
});
