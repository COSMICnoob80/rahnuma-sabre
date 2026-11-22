import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../components';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const ENTRIES = [
  {
    route: 'Directory',
    label: 'Advisory directory',
    blurb: 'Public AMC and broker registry data — no rankings, no endorsements.',
  },
  {
    route: 'Costs',
    label: 'Costs',
    blurb: 'What this app costs, and what the alternatives charge, with sources.',
  },
  {
    route: 'Calculators',
    label: 'Calculators',
    blurb: 'CGT, SIP, asset ROI, PKR devaluation and FIRE.',
  },
  {
    route: 'Advisory',
    label: 'Advisory',
    blurb: 'Ask the council about your own numbers. Information only, never a buy or sell call.',
  },
];

export default function MoreScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.caption, styles.intro]}>
        Everything that did not fit on the bottom bar.
      </Text>
      {ENTRIES.map((entry) => (
        <Card key={entry.route}>
          <Text style={typography.bodyStrong}>{entry.label}</Text>
          <Text style={[typography.caption, styles.blurb]}>{entry.blurb}</Text>
          <Button
            label={`Open ${entry.label}`}
            onPress={() => navigation.navigate(entry.route)}
            variant="secondary"
          />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  intro: { marginBottom: spacing.lg, marginTop: spacing.sm },
  blurb: { marginTop: spacing.sm, marginBottom: spacing.md },
});
