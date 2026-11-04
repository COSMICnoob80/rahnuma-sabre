import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  ADVISORS,
  ADVISOR_CITIES,
  ALL_CITIES,
  DEFAULT_ADVISOR_FILTER,
  DIRECTORY_FOOTNOTE,
  filterAdvisors,
} from '../data/advisors';
import type { Advisor, AdvisorKindFilter } from '../data/advisors';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card, Chip, EmptyState, Input } from '../components';
import { fonts } from '../utils/fonts';

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const KIND_FILTERS: { label: string; value: AdvisorKindFilter }[] = [
  { label: 'All', value: 'All' },
  { label: 'AMCs', value: 'AMC' },
  { label: 'Brokers', value: 'Broker' },
];

export default function DirectoryScreen() {
  const [kind, setKind] = useState<AdvisorKindFilter>(DEFAULT_ADVISOR_FILTER.kind);
  const [city, setCity] = useState<string>(DEFAULT_ADVISOR_FILTER.city);
  const [query, setQuery] = useState<string>(DEFAULT_ADVISOR_FILTER.query);
  const [cityOpen, setCityOpen] = useState(false);

  const results = useMemo(
    () => filterAdvisors(ADVISORS, { kind, city, query }),
    [kind, city, query]
  );

  const openSite = (url?: string) => {
    if (url) Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Text style={styles.headTitle}>ADVISOR DIRECTORY</Text>
          <View style={styles.countChip}>
            <Text style={styles.countText}>{ADVISORS.length} REGISTRY ROWS</Text>
          </View>
        </View>

        <Input
          label="Search"
          placeholder="Name or city"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />

        <View style={styles.kindRow}>
          {KIND_FILTERS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={kind === option.value}
              onPress={() => setKind(option.value)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.cityButton}
          onPress={() => setCityOpen((open) => !open)}
          activeOpacity={0.7}
        >
          <Text style={styles.cityButtonLabel}>City</Text>
          <Text style={styles.cityButtonValue}>
            {city} {cityOpen ? '▴' : '▾'}
          </Text>
        </TouchableOpacity>

        {cityOpen ? (
          <Card compact variant="sunken" style={styles.cityPanel}>
            {[ALL_CITIES, ...ADVISOR_CITIES].map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.cityOption}
                onPress={() => {
                  setCity(option);
                  setCityOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.cityOptionText, city === option && styles.cityOptionActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        ) : null}

        <View style={styles.secLabel}>
          <Text style={styles.secTitle}>Registry</Text>
          <Text style={styles.secHint}>
            {results.length}/{ADVISORS.length}
          </Text>
        </View>

        {results.length === 0 ? (
          <EmptyState
            message="No registry row matches these filters."
            hint="Clear the search or pick All cities."
          />
        ) : (
          results.map((entry: Advisor) => (
            <Card key={`${entry.kind}-${entry.name}`} compact style={styles.row}>
              <View style={styles.rowHead}>
                <Text style={styles.rowName}>{entry.name}</Text>
                <View style={styles.kindTag}>
                  <Text style={styles.kindTagText}>{entry.kind}</Text>
                </View>
              </View>
              <Text style={styles.rowCity}>{entry.city}</Text>
              {entry.licenseNote ? (
                <Text style={styles.rowNote}>{entry.licenseNote}</Text>
              ) : null}
              {entry.address ? <Text style={styles.rowAddress}>{entry.address}</Text> : null}
              {entry.url ? (
                <TouchableOpacity onPress={() => openSite(entry.url)} activeOpacity={0.7}>
                  <Text style={styles.rowLink}>Open their own site ↗</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          ))
        )}

        <Text style={styles.footnote}>{DIRECTORY_FOOTNOTE}</Text>
      </ScrollView>
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
  countChip: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  countText: {
    color: colors.textMuted,
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },

  kindRow: { flexDirection: 'row', marginBottom: spacing.sm },

  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  cityButtonLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cityButtonValue: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.regular },
  cityPanel: { paddingVertical: spacing.xs },
  cityOption: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  cityOptionText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular },
  cityOptionActive: { color: colors.accent, fontFamily: fonts.bold },

  secLabel: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.md,
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
  secHint: { color: colors.textMuted, fontFamily: MONO_FONT, fontSize: 9.5, letterSpacing: 0.5 },

  row: { paddingVertical: spacing.md },
  rowHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  rowName: { ...typography.bodyStrong, fontSize: 14, flex: 1, marginRight: spacing.sm },
  kindTag: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  kindTagText: {
    color: colors.textSecondary,
    fontFamily: MONO_FONT,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  rowCity: {
    color: colors.accent,
    fontFamily: MONO_FONT,
    fontSize: 11,
    marginTop: 3,
  },
  rowNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  rowAddress: {
    color: colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
  },
  rowLink: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: fonts.bold,
    marginTop: spacing.sm,
  },

  footnote: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
});
