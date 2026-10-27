import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  fetchOutlookQuotes,
  freshnessChip,
  toChips,
} from '../services/globalMarkets';
import type { InstrumentQuote } from '../services/globalMarkets';
import { hasAnyProvider } from '../services/llmService';
import {
  COUNCIL_LIVE_CHIP,
  COUNCIL_PERSONAS,
  COUNCIL_STATIC_CHIP,
  buildContextSnapshot,
  requestCouncilNote,
} from '../services/outlookCouncil';
import type { CouncilNoteResult } from '../services/outlookCouncil';
import {
  HORIZON_CHIPS,
  OUTLOOK_CONTRACT,
  OUTLOOK_DATA_FOOTNOTE,
  OUTLOOK_HEADLINE,
  councilNotes,
} from '../utils/outlookText';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button, Card, Chip, LoadingState } from '../components';
import { fonts } from '../utils/fonts';

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

function clockLabel(): string {
  const now = new Date();
  const day = now.toLocaleDateString('en-PK', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day} · ${time} PKT`;
}

function deltaColor(changePct: number | null): string {
  if (changePct === null || changePct === 0) return colors.textMuted;
  return changePct > 0 ? colors.accent : colors.danger;
}

function freshnessColor(q: InstrumentQuote): string {
  if (q.fresh) return colors.accent;
  return q.pricePKR === null ? colors.textMuted : colors.warning;
}

function QuoteRow({ quote, now }: { quote: InstrumentQuote; now: number }) {
  const chips = toChips(quote);
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{quote.label}</Text>
        {quote.priceNote ? <Text style={styles.rowNote}>{quote.priceNote}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{chips.value}</Text>
        <Text style={[styles.delta, { color: deltaColor(quote.changePct) }]}>{chips.delta}</Text>
        <Text style={[styles.rowFresh, { color: freshnessColor(quote) }]}>
          {freshnessChip(quote, now)}
        </Text>
      </View>
    </View>
  );
}

export default function OutlookScreen() {
  const navigation = useNavigation<any>();
  const [quotes, setQuotes] = useState<InstrumentQuote[]>([]);
  const [degraded, setDegraded] = useState<string[]>([]);
  const [hasKey, setHasKey] = useState(false);
  const [council, setCouncil] = useState<CouncilNoteResult | null>(null);
  const [councilLoading, setCouncilLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchOutlookQuotes();
    setQuotes(result.quotes);
    setDegraded(result.degraded);

    let keyed = false;
    try {
      keyed = await hasAnyProvider();
    } catch {
      keyed = false;
    }
    setHasKey(keyed);

    if (!keyed) {
      setCouncil(null);
      return;
    }

    // The council reads the snapshot on its own clock so the quotes paint first.
    setCouncilLoading(true);
    requestCouncilNote(buildContextSnapshot(result.quotes), COUNCIL_PERSONAS)
      .then((note) => setCouncil(note))
      .catch(() => setCouncil(null))
      .finally(() => setCouncilLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingState label="Reading the public record..." />
      </View>
    );
  }

  const now = Date.now();
  const nationalQuotes = quotes.filter((q) => q.region === 'national');
  const internationalQuotes = quotes.filter((q) => q.region === 'international');
  const noteView = councilNotes(hasKey);
  const liveNotes = council?.notes ?? [];
  const isLive = liveNotes.length > 0;
  const renderedNotes = isLive ? liveNotes : noteView.notes;
  const councilChip = isLive ? COUNCIL_LIVE_CHIP : councilLoading ? 'reading the record' : COUNCIL_STATIC_CHIP;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.brand}>{OUTLOOK_HEADLINE.brand}</Text>
            <Text style={styles.clock}>{clockLabel()}</Text>
          </View>
          <Text style={styles.greeting}>
            {OUTLOOK_HEADLINE.en}
            <Text style={styles.greetSep}> · </Text>
            <Text style={styles.greetUr}>{OUTLOOK_HEADLINE.ur}</Text>
          </Text>
          <Text style={styles.heroSub}>{OUTLOOK_HEADLINE.roman}</Text>
        </View>

        {degraded.length > 0 ? (
          <Text style={styles.degradedNote}>
            {degraded.length} of {quotes.length} instruments are cached or unavailable. Each row
            carries its own freshness label.
          </Text>
        ) : null}

        <Card>
          <Text style={styles.sectionTitle}>National</Text>
          {nationalQuotes.map((quote) => {
            const chips = toChips(quote);
            return (
              <View key={quote.symbol} style={styles.kpiChip}>
                <Text style={styles.kpiName}>{chips.label}</Text>
                <Text style={styles.kpiValue}>{chips.value}</Text>
                <Text style={[styles.delta, { color: deltaColor(quote.changePct) }]}>
                  {chips.delta}
                </Text>
                <Text style={[styles.kpiFresh, { color: freshnessColor(quote) }]}>
                  {freshnessChip(quote, now)}
                </Text>
              </View>
            );
          })}
          {nationalQuotes.length === 0 ? (
            <Text style={styles.placeholderText}>KSE-100 quote not loaded.</Text>
          ) : null}
          <Text style={styles.caption}>
            Value, change and freshness from the public feed. No direction is stated.
          </Text>
        </Card>

        <Card>
          <View style={styles.cardHead}>
            <Text style={styles.sectionTitle}>International</Text>
            <Chip label="overnight" />
          </View>
          {internationalQuotes.map((quote) => (
            <QuoteRow key={quote.symbol} quote={quote} now={now} />
          ))}
          {internationalQuotes.length === 0 ? (
            <Text style={styles.placeholderText}>International quotes not loaded.</Text>
          ) : null}
          <Text style={styles.caption}>
            <Text style={styles.captionStrong}>Kya giya kal raat?</Text> What moved overnight?
          </Text>
        </Card>

        <Card>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>
              What the council notes
              <Text style={styles.h2Ur}> · شورہ کونسل</Text>
            </Text>
            <Chip label={councilChip} />
          </View>

          {renderedNotes.map((note) => (
            <View key={note.by} style={styles.quote}>
              <Text style={styles.qmark}>“</Text>
              <Text style={styles.quoteText}>{note.text}</Text>
              <View style={styles.byRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{note.initials}</Text>
                </View>
                <Text style={styles.qname}>
                  {note.by}
                  {note.org ? ` (${note.org})` : ''}
                </Text>
              </View>
            </View>
          ))}

          {isLive && council?.synthesis ? (
            <Text style={styles.synthesis}>{council.synthesis}</Text>
          ) : null}

          {isLive && council ? (
            <Text style={styles.councilProvider}>
              {council.disclaimer}
              {council.provider ? ` · read by ${council.provider}${council.cached ? ' (cached)' : ''}` : ''}
            </Text>
          ) : null}

          {noteView.placeholder ? (
            <View style={styles.placeholderRow}>
              <Chip label={noteView.placeholderChip ?? 'Council notes'} />
              <Text style={styles.placeholderText}>{noteView.placeholder}</Text>
            </View>
          ) : null}

          <View style={styles.horizon}>
            {HORIZON_CHIPS.map((chip) => (
              <Chip key={chip.label} label={chip.label} selected={chip.active} />
            ))}
          </View>
        </Card>

        <Card variant="sunken">
          <Text style={styles.footnote}>{OUTLOOK_DATA_FOOTNOTE}</Text>
        </Card>
      </ScrollView>

      <View style={styles.contractBar}>
        <Text style={styles.contractText}>
          Information only · Not investment advice · Rahnuma will never tell you to buy or sell
        </Text>
        <View style={styles.contractActions}>
          <Button
            label="Refresh quotes"
            onPress={onRefresh}
            variant="ghost"
            size="sm"
            style={styles.contractButton}
          />
          <Button
            label="Close briefing"
            onPress={() => navigation.goBack()}
            variant="secondary"
            size="sm"
            style={styles.contractButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  hero: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1.6,
  },
  clock: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: MONO_FONT,
  },
  greeting: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 25,
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  greetSep: { color: colors.textSecondary, fontFamily: fonts.regular },
  greetUr: { fontSize: 24, fontFamily: fonts.bold },
  heroSub: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: fonts.regular,
  },

  degradedNote: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },

  sectionTitle: { ...typography.bodyStrong, marginBottom: spacing.md },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.bodyStrong, marginBottom: spacing.md },
  h2Ur: { fontSize: 16, fontFamily: fonts.bold },

  kpiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  kpiName: {
    color: colors.dangerInk,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    marginRight: spacing.sm,
  },
  kpiValue: {
    color: colors.textPrimary,
    fontFamily: MONO_FONT,
    fontSize: 15,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  kpiFresh: { fontFamily: MONO_FONT, fontSize: 10.5, marginLeft: spacing.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: { flex: 1, marginRight: spacing.sm },
  rowLabel: { color: colors.textSecondary, fontSize: 12.5, fontFamily: fonts.bold },
  rowNote: { color: colors.textMuted, fontSize: 10.5, marginTop: 2, fontFamily: fonts.regular },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  rowValue: {
    color: colors.textPrimary,
    fontFamily: MONO_FONT,
    fontSize: 13,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  delta: { fontFamily: MONO_FONT, fontSize: 12.5, fontWeight: '700', marginRight: spacing.sm },
  rowFresh: { fontFamily: MONO_FONT, fontSize: 10.5 },

  caption: { ...typography.small, marginTop: spacing.md, lineHeight: 17 },
  captionStrong: { color: colors.textPrimary, fontFamily: fonts.bold },

  quote: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  qmark: { color: colors.accent, fontSize: 22, fontFamily: fonts.bold, lineHeight: 22 },
  quoteText: { color: colors.textPrimary, fontSize: 13, lineHeight: 20, marginTop: spacing.xs, fontFamily: fonts.regular },
  byRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { color: colors.textPrimary, fontSize: 9.5, fontFamily: fonts.bold },
  qname: { color: colors.textSecondary, fontSize: 11.5, fontFamily: fonts.bold, letterSpacing: 0.4 },

  placeholderRow: { marginTop: spacing.sm },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
  },

  horizon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  synthesis: {
    color: colors.accent,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontFamily: fonts.regular,
  },
  councilProvider: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
  },

  footnote: { color: colors.textSecondary, fontSize: 12, lineHeight: 19, fontFamily: fonts.regular },

  contractBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  contractText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },
  contractActions: { flexDirection: 'row', justifyContent: 'space-between' },
  contractButton: { flex: 1, marginHorizontal: spacing.xs },
});
