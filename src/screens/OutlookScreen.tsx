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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchOutlookQuotes();
    setQuotes(result.quotes);
    setDegraded(result.degraded);
    try {
      setHasKey(await hasAnyProvider());
    } catch {
      setHasKey(false);
    }
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
          <Text style={styles.cardTitle}>
            What the council notes
            <Text style={styles.h2Ur}> · شورہ کونسل</Text>
          </Text>

          {noteView.notes.map((note) => (
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
    fontWeight: '700',
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
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  greetSep: { color: colors.textSecondary, fontWeight: '400' },
  greetUr: { fontSize: 24, fontWeight: '600' },
  heroSub: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 19,
  },

  degradedNote: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },

  sectionTitle: { ...typography.bodyStrong, marginBottom: spacing.md },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.bodyStrong, marginBottom: spacing.md },
  h2Ur: { fontSize: 16, fontWeight: '600' },

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
    fontWeight: '700',
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
  rowLabel: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  rowNote: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 },
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
  captionStrong: { color: colors.textPrimary, fontWeight: '600' },

  quote: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  qmark: { color: colors.accent, fontSize: 22, fontWeight: '700', lineHeight: 22 },
  quoteText: { color: colors.textPrimary, fontSize: 13, lineHeight: 20, marginTop: spacing.xs },
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
  avatarText: { color: colors.textPrimary, fontSize: 9.5, fontWeight: '700' },
  qname: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '600', letterSpacing: 0.4 },

  placeholderRow: { marginTop: spacing.sm },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: spacing.sm,
  },

  horizon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  footnote: { color: colors.textSecondary, fontSize: 12, lineHeight: 19 },

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
  },
  contractActions: { flexDirection: 'row', justifyContent: 'space-between' },
  contractButton: { flex: 1, marginHorizontal: spacing.xs },
});
