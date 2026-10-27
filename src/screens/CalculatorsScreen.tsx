import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  calculateCGT, calculateSIP, calculateAssetROI,
  calculateDevaluation, calculateFIRE, formatPKR,
  CgtResult, CgtTranche,
} from '../utils/calculators';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card, Button, Chip, Input } from '../components';
import { fonts } from '../utils/fonts';

function CalculatorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card compact>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </Card>
  );
}

const TRANCHE_OPTIONS: { label: string; tranche: CgtTranche; sampleDate: string }[] = [
  { label: 'On/after Jul 2024', tranche: 'flat_post_2024', sampleDate: '2025-01-01' },
  { label: 'Jul 2022 – Jun 2024', tranche: 'progressive_2022_2024', sampleDate: '2023-01-01' },
  { label: 'Jul 2013 – Jun 2022', tranche: 'legacy_2013_2022', sampleDate: '2018-01-01' },
  { label: 'Before Jul 2013', tranche: 'exempt_pre_2013', sampleDate: '2010-01-01' },
];

export default function CalculatorsScreen() {
  // CGT
  const [cgtBuy, setCgtBuy] = useState('');
  const [cgtSell, setCgtSell] = useState('');
  const [cgtQty, setCgtQty] = useState('');
  const [cgtDays, setCgtDays] = useState('');
  const [cgtDate, setCgtDate] = useState('2025-01-01');
  const [cgtTranche, setCgtTranche] = useState<CgtTranche>('flat_post_2024');
  const [cgtResult, setCgtResult] = useState<CgtResult | null>(null);

  // SIP
  const [sipAmount, setSipAmount] = useState('');
  const [sipReturn, setSipReturn] = useState('12');
  const [sipYears, setSipYears] = useState('10');
  const [sipResult, setSipResult] = useState<{ invested: number; returns: number; totalValue: number; yearlyData: any[] } | null>(null);

  // Asset ROI
  const [assetBuy, setAssetBuy] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetYears, setAssetYears] = useState('');
  const [assetResult, setAssetResult] = useState<{ totalReturn: number; annualizedReturn: number; gain: number } | null>(null);

  // Devaluation
  const [devAmount, setDevAmount] = useState('');
  const [devPct, setDevPct] = useState('20');
  const [devRate, setDevRate] = useState('280');
  const [devResult, setDevResult] = useState<{ newValue: number; loss: number; usdEquivalent: number; impliedUsdRate: number } | null>(null);

  // FIRE
  const [fireExpenses, setFireExpenses] = useState('');
  const [fireSavings, setFireSavings] = useState('');
  const [fireMonthly, setFireMonthly] = useState('');
  const [fireReturn, setFireReturn] = useState('10');
  const [fireInflation, setFireInflation] = useState('8');
  const [fireSwr, setFireSwr] = useState('4');
  const [fireResult, setFireResult] = useState<{ targetCorpus: number; yearsToFire: number; progressPct: number; realReturn: number } | null>(null);

  const selectTranche = (option: typeof TRANCHE_OPTIONS[number]) => {
    setCgtTranche(option.tranche);
    setCgtDate(option.sampleDate);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CalculatorCard title="CGT Calculator (PSX Pakistan)">
        <Text style={styles.hint}>
          Capital gains tax depends on when you bought, not just how long you held. Pick the acquisition window, or type the exact date.
        </Text>
        <View style={styles.trancheRow}>
          {TRANCHE_OPTIONS.map((option) => (
            <Chip
              key={option.tranche}
              label={option.label}
              selected={cgtTranche === option.tranche}
              onPress={() => selectTranche(option)}
              style={styles.trancheChip}
            />
          ))}
        </View>

        <Input placeholder="Buy Price (per share)" value={cgtBuy} onChangeText={setCgtBuy} keyboardType="decimal-pad" />
        <Input placeholder="Sell Price (per share)" value={cgtSell} onChangeText={setCgtSell} keyboardType="decimal-pad" />
        <Input placeholder="Quantity" value={cgtQty} onChangeText={setCgtQty} keyboardType="decimal-pad" />
        <Input placeholder="Holding Days" value={cgtDays} onChangeText={setCgtDays} keyboardType="number-pad" />
        <Input
          placeholder="Acquisition date (YYYY-MM-DD)"
          value={cgtDate}
          onChangeText={(value) => {
            setCgtDate(value);
            setCgtResult(null);
          }}
          autoCapitalize="none"
        />
        <Button
          label="Calculate CGT"
          onPress={() => {
            const b = parseFloat(cgtBuy), s = parseFloat(cgtSell), q = parseFloat(cgtQty), d = parseFloat(cgtDays);
            if (!b || !s || !q || !d) return;
            setCgtResult(calculateCGT(b, s, q, d, cgtDate));
          }}
          style={styles.calcBtn}
        />
        {cgtResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Gain: {formatPKR(cgtResult.gain)}</Text>
            <Text style={styles.resultText}>Applicable rate: {(cgtResult.rate * 100).toFixed(2)}%</Text>
            <Text style={styles.resultText}>CGT: {formatPKR(cgtResult.tax)}</Text>
            <Text style={[styles.resultText, styles.resultPositive]}>
              Net Gain: {formatPKR(cgtResult.netGain)}
            </Text>
            <Text style={styles.resultSub}>{cgtResult.note}</Text>
          </View>
        )}
      </CalculatorCard>

      <CalculatorCard title="SIP Projection">
        <Input placeholder="Monthly Investment (PKR)" value={sipAmount} onChangeText={setSipAmount} keyboardType="decimal-pad" />
        <Input placeholder="Expected Annual Return (%)" value={sipReturn} onChangeText={setSipReturn} keyboardType="decimal-pad" />
        <Input placeholder="Years" value={sipYears} onChangeText={setSipYears} keyboardType="number-pad" />
        <Button
          label="Project SIP"
          onPress={() => {
            const a = parseFloat(sipAmount), r = parseFloat(sipReturn), y = parseFloat(sipYears);
            if (a && r && y) setSipResult(calculateSIP(a, r, y));
          }}
          style={styles.calcBtn}
        />
        {sipResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Total Invested: {formatPKR(sipResult.invested)}</Text>
            <Text style={styles.resultText}>Expected Returns: {formatPKR(sipResult.returns)}</Text>
            <Text style={[styles.resultText, styles.resultPositive]}>
              Total Value: {formatPKR(sipResult.totalValue)}
            </Text>
            {sipResult.yearlyData.filter((_, i) => i % 5 === 0 || i === sipResult.yearlyData.length - 1).map((d: any) => (
              <Text key={d.year} style={styles.resultSub}>Year {d.year}: Invested {formatPKR(d.invested)} → {formatPKR(d.value)}</Text>
            ))}
          </View>
        )}
      </CalculatorCard>

      <CalculatorCard title="Asset ROI Calculator">
        <Input placeholder="Purchase Price (PKR)" value={assetBuy} onChangeText={setAssetBuy} keyboardType="decimal-pad" />
        <Input placeholder="Current/Future Value (PKR)" value={assetValue} onChangeText={setAssetValue} keyboardType="decimal-pad" />
        <Input placeholder="Years Held" value={assetYears} onChangeText={setAssetYears} keyboardType="decimal-pad" />
        <Button
          label="Calculate ROI"
          onPress={() => {
            const b = parseFloat(assetBuy), v = parseFloat(assetValue), y = parseFloat(assetYears);
            if (b && v && y) setAssetResult(calculateAssetROI(b, v, y));
          }}
          style={styles.calcBtn}
        />
        {assetResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultSub}>Works for property, gold, any appreciating asset</Text>
            <Text style={styles.resultText}>Total Return: {assetResult.totalReturn.toFixed(2)}%</Text>
            <Text style={styles.resultText}>Annualized IRR: {assetResult.annualizedReturn.toFixed(2)}%</Text>
            <Text style={[styles.resultText, styles.resultPositive]}>
              Gain: {formatPKR(assetResult.gain)}
            </Text>
          </View>
        )}
      </CalculatorCard>

      <CalculatorCard title="PKR Devaluation Scenario">
        <Input placeholder="Current PKR Portfolio Value" value={devAmount} onChangeText={setDevAmount} keyboardType="decimal-pad" />
        <Input placeholder="Devaluation % (e.g. 20)" value={devPct} onChangeText={setDevPct} keyboardType="decimal-pad" />
        <Input placeholder="Current USD/PKR rate" value={devRate} onChangeText={setDevRate} keyboardType="decimal-pad" />
        <Button
          label="Simulate"
          onPress={() => {
            const a = parseFloat(devAmount), p = parseFloat(devPct), r = parseFloat(devRate);
            if (a && p && r) setDevResult(calculateDevaluation(a, p, r));
          }}
          style={styles.calcBtn}
        />
        {devResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Current USD Value: ${devResult.usdEquivalent.toFixed(2)}</Text>
            <Text style={styles.resultText}>New PKR Value: {formatPKR(devResult.newValue)}</Text>
            <Text style={[styles.resultText, styles.resultNegative]}>
              Loss: {formatPKR(devResult.loss)}
            </Text>
            <Text style={styles.resultText}>Implied USD/PKR: Rs. {devResult.impliedUsdRate.toFixed(2)}</Text>
          </View>
        )}
      </CalculatorCard>

      <CalculatorCard title="FIRE Calculator">
        <Input placeholder="Monthly Expenses (PKR)" value={fireExpenses} onChangeText={setFireExpenses} keyboardType="decimal-pad" />
        <Input placeholder="Current Corpus (PKR)" value={fireSavings} onChangeText={setFireSavings} keyboardType="decimal-pad" />
        <Input placeholder="Monthly Savings (PKR)" value={fireMonthly} onChangeText={setFireMonthly} keyboardType="decimal-pad" />
        <Input placeholder="Expected Return %" value={fireReturn} onChangeText={setFireReturn} keyboardType="decimal-pad" />
        <Input placeholder="Inflation %" value={fireInflation} onChangeText={setFireInflation} keyboardType="decimal-pad" />
        <Input placeholder="Withdrawal Rate % (default 4)" value={fireSwr} onChangeText={setFireSwr} keyboardType="decimal-pad" />
        <Button
          label="Calculate FIRE"
          onPress={() => {
            const e = parseFloat(fireExpenses), s = parseFloat(fireSavings), m = parseFloat(fireMonthly);
            const r = parseFloat(fireReturn), i = parseFloat(fireInflation) || 0, w = parseFloat(fireSwr) || 4;
            if (!e || isNaN(s) || isNaN(m) || !r) return;
            setFireResult(calculateFIRE(e, s || 0, m || 0, r, i, w));
          }}
          style={styles.calcBtn}
        />
        {fireResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>FIRE Target: {formatPKR(fireResult.targetCorpus)}</Text>
            <Text style={styles.resultText}>Real return after inflation: {fireResult.realReturn.toFixed(2)}%</Text>
            <Text style={styles.resultText}>Progress: {fireResult.progressPct.toFixed(1)}%</Text>
            <Text style={[styles.resultText, styles.resultAccent]}>
              {fireResult.yearsToFire === 0
                ? 'You have reached FIRE!'
                : fireResult.yearsToFire > 0
                  ? `${fireResult.yearsToFire} years to FIRE`
                  : 'Cannot reach FIRE at current rate'}
            </Text>
          </View>
        )}
      </CalculatorCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + spacing.sm },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: -0.1,
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.md,
    lineHeight: 17,
    fontFamily: fonts.regular,
  },
  trancheRow: { flexDirection: 'row', flexWrap: 'wrap' },
  trancheChip: { marginBottom: spacing.sm },
  calcBtn: { marginTop: spacing.sm },
  resultBox: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginTop: spacing.md,
  },
  resultText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.xs,
    fontVariant: ['tabular-nums'],
    fontFamily: fonts.regular,
  },
  resultPositive: { color: colors.success, fontFamily: fonts.bold },
  resultNegative: { color: colors.danger, fontFamily: fonts.bold },
  resultAccent: { color: colors.accent, fontFamily: fonts.bold },
  resultSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
});
