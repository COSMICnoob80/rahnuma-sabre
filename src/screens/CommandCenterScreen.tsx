import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchGlobalPropertyQuote, fetchOutlookQuotes } from '../services/globalMarkets';
import type { InstrumentQuote } from '../services/globalMarkets';
import { fetchPmexQuote } from '../services/pmexService';
import type { PmexQuote } from '../services/pmexService';
import { COUNCIL_BUSY_MESSAGE, hasAnyProvider } from '../services/llmService';
import {
  COUNCIL_LIVE_CHIP,
  COUNCIL_PERSONAS,
  buildContextSnapshot,
  requestCouncilNote,
} from '../services/outlookCouncil';
import type { CouncilNoteResult } from '../services/outlookCouncil';
import { requestContextNote } from '../services/contextNote';
import type { ContextNote } from '../services/contextNote';
import { fetchNews, storyAge } from '../services/newsService';
import type { NewsFeedSource, NewsSourceStatus, NewsStory } from '../services/newsService';
import { SUMMARIES_OFFLINE_CHIP, summarizeStories } from '../services/newsFuse';
import {
  buildCommodityCards,
  buildFusionCards,
  buildPropertyCard,
  pkrRateFromQuotes,
} from '../utils/fusionStrip';
import type { FusionTone } from '../utils/fusionStrip';
import { CONTEXT_CHIP, OUTLOOK_CONTRACT, councilNotes } from '../utils/outlookText';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card, Chip, LoadingState } from '../components';
import { fonts } from '../utils/fonts';

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const NEWS_VISIBLE = 5;

interface FeedLine {
  name: string;
  detail: string;
  status: NewsSourceStatus;
}

function toneColor(tone: FusionTone): string {
  if (tone === 'pos') return colors.accent;
  if (tone === 'neg') return colors.danger;
  return colors.textMuted;
}

function statusColor(status: NewsSourceStatus): string {
  if (status === 'live') return colors.accent;
  if (status === 'stale') return colors.warning;
  return colors.textMuted;
}

function statusLabel(status: NewsSourceStatus): string {
  if (status === 'live') return 'LIVE';
  if (status === 'stale') return 'STALE';
  return 'FAILED';
}

function syncLabel(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return 'never';
  const date = new Date(at);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} PKT`;
}

export default function CommandCenterScreen() {
  const [quotes, setQuotes] = useState<InstrumentQuote[]>([]);
  const [hasKey, setHasKey] = useState(false);
  const [council, setCouncil] = useState<CouncilNoteResult | null>(null);
  const [contextNote, setContextNote] = useState<ContextNote | null>(null);
  const [councilLoading, setCouncilLoading] = useState(false);
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [summaries, setSummaries] = useState<string[]>([]);
  const [summariesOffline, setSummariesOffline] = useState(false);
  const [newsSources, setNewsSources] = useState<NewsFeedSource[]>([]);
  const [newsCached, setNewsCached] = useState(false);
  const [lastSync, setLastSync] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pmex, setPmex] = useState<PmexQuote | null>(null);
  const [pmexOffline, setPmexOffline] = useState(false);
  const [property, setProperty] = useState<InstrumentQuote | null>(null);

  const load = useCallback(async () => {
    const result = await fetchOutlookQuotes();
    setQuotes(result.quotes);
    setLastSync(Date.now());

    // PMEX and the global property card both convert with the SAME snapshot's
    // PKR/USD — one rate read, many uses, no second FX fetch.
    const rate = pkrRateFromQuotes(result.quotes);
    const [pmexResult, propertyQuote] = await Promise.all([
      fetchPmexQuote(rate).catch(() => null),
      fetchGlobalPropertyQuote().catch(() => null),
    ]);
    setPmex(pmexResult?.quote ?? null);
    setPmexOffline(pmexResult === null);
    setProperty(propertyQuote);

    let keyed = false;
    try {
      keyed = await hasAnyProvider();
    } catch {
      keyed = false;
    }
    setHasKey(keyed);

    if (keyed) {
      // The council reads the exact snapshot the strip above is showing, so the
      // two cards can never disagree about the numbers.
      const snapshot = buildContextSnapshot(result.quotes);
      setCouncilLoading(true);
      requestCouncilNote(snapshot, COUNCIL_PERSONAS)
        .then(async (note) => {
          setCouncil(note);
          const context = note ? await requestContextNote(snapshot, note) : null;
          setContextNote(context);
        })
        .catch(() => {
          setCouncil(null);
          setContextNote(null);
        })
        .finally(() => setCouncilLoading(false));
    } else {
      setCouncil(null);
      setContextNote(null);
    }

    const feed = await fetchNews().catch(() => null);
    const top = (feed?.stories ?? []).slice(0, NEWS_VISIBLE);
    setStories(top);
    setNewsSources(feed?.sources ?? []);
    setNewsCached(feed?.cached ?? false);

    const fuse = await summarizeStories(top);
    setSummaries(fuse.summaries);
    setSummariesOffline(fuse.offline);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load().catch(() => undefined);
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
  const rate = pkrRateFromQuotes(quotes);
  const cards = [
    ...buildFusionCards(quotes, now),
    ...buildCommodityCards(pmex, rate, now, pmexOffline),
    buildPropertyCard(property, now),
  ];
  const national = quotes.filter((quote) => quote.region === 'national');
  const international = quotes.filter((quote) => quote.region === 'international');

  const nationalLive = national.some((quote) => quote.fresh && /dps/i.test(quote.source));
  const nationalAny = national.some((quote) => quote.pricePKR !== null);
  const internationalLive = international.filter(
    (quote) => quote.fresh && !/dps/i.test(quote.source)
  ).length;
  const internationalAny = international.some((quote) => quote.pricePKR !== null);

  const newsLive = newsSources.filter((source) => source.status === 'live').length;
  const newsStatus: NewsSourceStatus =
    newsLive > 0 ? 'live' : stories.length > 0 ? 'stale' : 'failed';

  const councilStatus: NewsSourceStatus =
    council && !council.cached ? 'live' : council ? 'stale' : 'failed';

  const feeds: FeedLine[] = [
    {
      name: 'PSX DPS',
      detail: nationalLive ? 'local quotes' : nationalAny ? 'cached quotes' : 'unavailable',
      status: nationalLive ? 'live' : nationalAny ? 'stale' : 'failed',
    },
    {
      name: 'Yahoo / stooq',
      detail: `${internationalLive}/${international.length} live`,
      status: internationalLive > 0 ? 'live' : internationalAny ? 'stale' : 'failed',
    },
    {
      name: 'Google News',
      detail: newsCached
        ? `cached · ${stories.length} stories`
        : `${newsLive}/${newsSources.length} queries answered`,
      status: newsStatus,
    },
    {
      name: 'Council',
      detail: council
        ? `${council.provider ?? 'provider'}${council.cached ? ' · cached' : ''}`
        : hasKey
          ? 'no note returned'
          : 'key needed',
      status: councilStatus,
    },
  ];

  const noteView = councilNotes(hasKey);
  const liveNotes = council?.notes ?? [];
  const isLive = liveNotes.length > 0;
  const renderedNotes = isLive ? liveNotes.slice(0, 2) : noteView.notes.slice(0, 2);
  const councilChip = isLive
    ? COUNCIL_LIVE_CHIP
    : councilLoading
      ? 'reading the record'
      : hasKey
        ? COUNCIL_BUSY_MESSAGE
        : 'key needed';

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.head}>
          <Text style={styles.headTitle}>COMMAND CENTER</Text>
          <View style={styles.pulseChip}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseText}>HYBRID PULSE</Text>
          </View>
        </View>

        <View style={styles.secLabel}>
          <Text style={styles.secTitle}>Fusion strip</Text>
          <Text style={styles.secHint}>signed % · {cards.length} marks</Text>
        </View>

        <View style={styles.fusionGrid}>
          {cards.map((card) => (
            <View
              key={card.symbol}
              style={[styles.mcard, { borderLeftColor: toneColor(card.tone) }]}
            >
              <View style={styles.mTop}>
                <Text style={styles.mLabel} numberOfLines={1}>
                  {card.label}
                </Text>
                {card.sourceChip ? (
                  <Text style={styles.mSourceChip}>{card.sourceChip}</Text>
                ) : null}
              </View>
              <Text style={styles.mUrdu} numberOfLines={1}>
                {card.urdu}
              </Text>
              <Text style={styles.mPrice} numberOfLines={1} adjustsFontSizeToFit>
                {card.value}
              </Text>
              {card.pkrValue ? (
                <Text style={styles.mPkr} numberOfLines={1} adjustsFontSizeToFit>
                  {card.pkrValue}
                </Text>
              ) : null}
              <View style={styles.mFoot}>
                <Text style={[styles.mDelta, { color: toneColor(card.tone) }]}>{card.delta}</Text>
                {card.stale ? (
                  <Text style={styles.staleChip}>STALE</Text>
                ) : (
                  <Text style={styles.mTime}>{card.timeLabel}</Text>
                )}
              </View>
            </View>
          ))}
          {cards.length === 0 ? <Text style={styles.placeholder}>No quotes on device.</Text> : null}
        </View>

        <View style={styles.secLabel}>
          <Text style={styles.secTitle}>Council note</Text>
          <Text style={styles.secHint}>context, not forecast</Text>
        </View>

        <Card compact>
          <View style={styles.cardHead}>
            <View style={styles.noteLabelRow}>
              <View style={styles.noteDot} />
              <Text style={styles.noteLabel}>COUNCIL NOTE</Text>
            </View>
            <Chip label={councilChip} />
          </View>

          {contextNote
            ? contextNote.parts.map((part) => (
                <View key={part.id} style={styles.contextBlock}>
                  <Text style={styles.contextTitle}>
                    {part.number}. {part.title}
                  </Text>
                  <Text style={styles.noteBody}>{part.body}</Text>
                </View>
              ))
            : renderedNotes.map((note) => (
                <Text key={note.by} style={styles.noteBody}>
                  <Text style={styles.noteBy}>{note.by}: </Text>
                  {note.text}
                </Text>
              ))}

          {!contextNote && isLive && council?.synthesis ? (
            <Text style={styles.noteSynthesis}>{council.synthesis}</Text>
          ) : null}

          {!isLive && noteView.placeholder ? (
            <Text style={styles.placeholder}>{noteView.placeholder}</Text>
          ) : null}

          <Text style={styles.noteFinal}>
            {contextNote?.disclaimer ?? council?.disclaimer ?? 'Information only, not investment advice.'}
          </Text>

          <View style={styles.chipRow}>
            <Chip label={CONTEXT_CHIP} />
          </View>
        </Card>

        <View style={styles.secLabel}>
          <Text style={styles.secTitle}>News</Text>
          <Text style={styles.secHint}>one-line summaries</Text>
        </View>

        <Card compact>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Top {NEWS_VISIBLE} stories</Text>
            {summariesOffline ? <Chip label={SUMMARIES_OFFLINE_CHIP} tone="danger" /> : null}
          </View>

          {stories.map((story, index) => (
            <View key={story.key} style={styles.story}>
              <Text style={styles.storyTitle}>{story.title}</Text>
              <Text style={styles.storyMeta}>
                {story.source || 'unknown source'} · {storyAge(story.publishedAtMs, now)}
              </Text>
              {!summariesOffline && summaries[index] ? (
                <Text style={styles.storySummary}>{summaries[index]}</Text>
              ) : null}
            </View>
          ))}

          {stories.length === 0 ? (
            <Text style={styles.placeholder}>
              No stories on device. The feed did not answer — nothing is shown rather than
              something invented.
            </Text>
          ) : null}

          <Text style={styles.newsContract}>Not investment advice.</Text>
        </Card>

        <View style={styles.secLabel}>
          <Text style={styles.secTitle}>Feeds</Text>
          <Text style={styles.secHint}>this session</Text>
        </View>

        <View style={styles.feeds}>
          {feeds.map((feed) => (
            <View key={feed.name} style={styles.feedRow}>
              <View
                style={[
                  styles.feedChip,
                  {
                    borderColor: statusColor(feed.status),
                  },
                ]}
              >
                <View style={[styles.feedDot, { backgroundColor: statusColor(feed.status) }]} />
                <Text style={[styles.feedChipText, { color: statusColor(feed.status) }]}>
                  {statusLabel(feed.status)}
                </Text>
              </View>
              <Text style={styles.feedName}>{feed.name}</Text>
              <Text style={styles.feedDesc} numberOfLines={1}>
                {feed.detail}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.contractBar}>
        <Text style={styles.contractText}>{OUTLOOK_CONTRACT}</Text>
        <Text style={styles.contractRefresh}>last sync {syncLabel(lastSync)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  headTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.bold,
    letterSpacing: 1.8,
  },
  pulseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentTint,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginRight: spacing.xs + 1,
  },
  pulseText: {
    color: colors.accent,
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    letterSpacing: 1,
  },

  secLabel: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  secTitle: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontFamily: fonts.bold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  secHint: {
    color: colors.textMuted,
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },

  fusionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  mcard: {
    flexBasis: '22%',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 108,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  mTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mLabel: {
    color: colors.textPrimary,
    fontSize: 10.5,
    fontFamily: fonts.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  mSourceChip: {
    fontFamily: MONO_FONT,
    fontSize: 7.5,
    letterSpacing: 0.4,
    color: colors.textMuted,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
    overflow: 'hidden',
  },
  mUrdu: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    minHeight: 17,
    fontFamily: fonts.regular,
    writingDirection: 'rtl',
  },
  mPrice: {
    color: colors.textPrimary,
    fontFamily: MONO_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 3,
  },
  mPkr: {
    color: colors.textMuted,
    fontFamily: MONO_FONT,
    fontSize: 8.5,
    letterSpacing: -0.1,
    marginTop: 1,
  },
  mFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: spacing.xs,
  },
  mDelta: { fontFamily: MONO_FONT, fontSize: 12.5, fontWeight: '700' },
  mTime: { fontFamily: MONO_FONT, fontSize: 9, color: colors.textMuted },
  staleChip: {
    fontFamily: MONO_FONT,
    fontSize: 8.5,
    letterSpacing: 0.8,
    color: colors.textMuted,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
  },

  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: { ...typography.bodyStrong, fontSize: 13 },
  noteLabelRow: { flexDirection: 'row', alignItems: 'center' },
  noteDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  noteLabel: {
    color: colors.textSecondary,
    fontSize: 9.5,
    fontFamily: fonts.bold,
    letterSpacing: 1.6,
  },
  contextBlock: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contextTitle: {
    color: colors.accent,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  noteBody: {
    color: colors.textPrimary,
    fontSize: 12.5,
    lineHeight: 20,
    marginBottom: spacing.xs + 2,
    fontFamily: fonts.regular,
  },
  noteBy: { fontFamily: fonts.bold },
  noteSynthesis: {
    color: colors.accent,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
  },
  noteFinal: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontFamily: fonts.regular,
  },
  chipRow: { flexDirection: 'row', marginTop: spacing.sm },

  story: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  storyTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bold,
  },
  storyMeta: {
    color: colors.textMuted,
    fontFamily: MONO_FONT,
    fontSize: 10,
    marginTop: 3,
  },
  storySummary: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
  },
  newsContract: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: spacing.md,
    fontFamily: fonts.regular,
  },

  placeholder: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },

  feeds: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  feedDot: {
    width: 4,
    height: 4,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  feedChipText: { fontFamily: MONO_FONT, fontSize: 9, letterSpacing: 0.8 },
  feedName: { color: colors.textPrimary, fontSize: 12.5, fontFamily: fonts.bold },
  feedDesc: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
    fontFamily: fonts.regular,
    marginLeft: spacing.sm,
  },

  contractBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  contractText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  contractRefresh: {
    color: colors.textMuted,
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    marginTop: spacing.xs,
  },
});
