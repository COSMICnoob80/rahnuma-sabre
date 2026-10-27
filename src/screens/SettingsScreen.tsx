import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import { getSetting, setSetting, addAsset } from '../database/db';
import { PROVIDERS, ProviderId } from '../services/providers';
import {
  getProviderKey, setProviderKey, getProviderModel, setProviderModel,
} from '../utils/secureStorage';
import { hasPin, setPin, removePin } from '../utils/pinLock';
import { exportAllData } from '../services/dataService';
import {
  ImportReport,
  parseBankCsvReport,
  parseFbrWealthLinesReport,
  summarizeNetWorth,
} from '../services/statementImport';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card, Button, Input, Chip } from '../components';
import { fonts } from '../utils/fonts';

type KeysState = Record<string, { input: string; saved: boolean }>;
type ModelsState = Record<string, string>;

const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

function looksBinary(text: string): boolean {
  if (text.includes('\u0000')) return true;
  const sample = text.slice(0, 4000);
  let control = 0;
  for (let index = 0; index < sample.length; index += 1) {
    const code = sample.charCodeAt(index);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) control += 1;
  }
  return control / sample.length > 0.05;
}

async function readPickedText(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  if (asset.size !== undefined && asset.size > MAX_IMPORT_BYTES) {
    throw new Error(`That file is ${(asset.size / (1024 * 1024)).toFixed(1)} MB. Pick a text export under 4 MB.`);
  }

  const text = asset.file ? await asset.file.text() : await new File(asset.uri).text();
  if (!text.trim()) throw new Error('That file is empty.');
  if (looksBinary(text)) throw new Error('That looks like a binary file. Pick the CSV or text export, not the PDF or the spreadsheet.');
  return text;
}

export default function SettingsScreen() {
  const [cashAmount, setCashAmount] = useState('');
  const [propertyAmount, setPropertyAmount] = useState('');
  const [fireTargetAmount, setFireTargetAmount] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [pin, setPinVal] = useState('');
  const [pinExists, setPinExists] = useState(false);
  const [keys, setKeys] = useState<KeysState>({});
  const [models, setModels] = useState<ModelsState>({});
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'bank' | 'fbr'>('bank');
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [pickBusy, setPickBusy] = useState(false);

  const load = useCallback(async () => {
    const c = await getSetting('cash');
    if (c) setCashAmount(c);
    const p = await getSetting('property');
    if (p) setPropertyAmount(p);
    const f = await getSetting('fire_target');
    if (f) setFireTargetAmount(f);
    const b = await getSetting('monthly_budget');
    if (b) setBudgetAmount(b);
    setPinExists(await hasPin());

    const nextKeys: KeysState = {};
    const nextModels: ModelsState = {};
    for (const provider of PROVIDERS) {
      const key = await getProviderKey(provider.id);
      nextKeys[provider.id] = { input: key ?? '', saved: !!key };
      nextModels[provider.id] = await getProviderModel(provider.id);
    }
    setKeys(nextKeys);
    setModels(nextModels);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveSetting = async (key: string, val: string, label: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) { Alert.alert(`Invalid ${label}`); return; }
    await setSetting(key, val);
    Alert.alert(`${label} saved!`);
  };

  const handlePinSetup = async () => {
    if (pin.length !== 4) { Alert.alert('Enter a 4-digit PIN'); return; }
    await setPin(pin);
    setPinExists(true);
    setPinVal('');
    Alert.alert('PIN set!');
  };

  const handleRemovePin = async () => {
    await removePin();
    setPinExists(false);
    Alert.alert('PIN removed');
  };

  const handleSaveKey = async (id: ProviderId) => {
    const value = keys[id]?.input?.trim() ?? '';
    if (!value) { Alert.alert('Enter an API key'); return; }
    await setProviderKey(id, value);
    setKeys((prev) => ({ ...prev, [id]: { input: value, saved: true } }));
    Alert.alert('API key saved securely');
  };

  const handleClearKey = async (id: ProviderId) => {
    await setProviderKey(id, '');
    setKeys((prev) => ({ ...prev, [id]: { input: '', saved: false } }));
  };

  const handleSelectModel = async (id: ProviderId, model: string) => {
    setModels((prev) => ({ ...prev, [id]: model }));
    await setProviderModel(id, model);
  };

  const buildImportReport = (): ImportReport =>
    importFormat === 'bank'
      ? parseBankCsvReport(importText)
      : parseFbrWealthLinesReport(importText);

  const handlePreviewImport = () => {
    const report = buildImportReport();
    setImportReport(report);
    if (report.rows.length === 0 && report.rejected.length === 0) {
      Alert.alert('Nothing to parse', 'Paste statement lines above first.');
    }
  };

  const handlePickFile = async () => {
    if (pickBusy) return;
    setPickBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'text/csv', 'application/csv'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const text = await readPickedText(asset);
      const report = importFormat === 'bank' ? parseBankCsvReport(text) : parseFbrWealthLinesReport(text);

      setImportText(text);
      setImportReport(report);
      Alert.alert(
        'File loaded',
        `${asset.name} — ${report.rows.length} row(s) parsed, ${report.rejected.length} rejected. Review below, then import.`
      );
    } catch (error) {
      Alert.alert(
        'Could not read that file',
        error instanceof Error ? error.message : 'Pick a plain-text CSV or .txt export.'
      );
    } finally {
      setPickBusy(false);
    }
  };

  const handleImportPositions = async () => {
    const report = buildImportReport();
    if (report.rows.length === 0) {
      setImportReport(report);
      Alert.alert(
        'Nothing to import',
        report.rejected.length > 0
          ? `${report.rejected.length} line(s) were rejected. Nothing was saved.`
          : 'Paste statement lines above first.'
      );
      return;
    }

    const summary = summarizeNetWorth(report.rows);
    const existing = parseFloat((await getSetting('cash')) ?? '0');
    const existingCash = Number.isFinite(existing) ? existing : 0;
    const nextCash = importFormat === 'fbr' ? summary.cash : existingCash + summary.cash;
    await setSetting('cash', String(nextCash));

    const importedAt = new Date().toISOString();
    const assetRows = report.rows.filter((row) => row.kind !== 'cash' && row.kind !== 'bank');
    for (const row of assetRows) {
      await addAsset({
        kind: row.kind,
        label: row.label,
        amount_pkr: row.amountPKR,
        source: row.source,
        imported_at: importedAt,
        raw_line: row.rawLine,
      });
    }

    setCashAmount(String(nextCash));
    setImportReport(report);
    setImportText('');
    Alert.alert(
      'Import complete',
      `${report.rows.length} row(s) read, ${assetRows.length} position(s) saved. Cash balance updated to PKR ${nextCash.toLocaleString('en-PK')}.`
    );
  };

  const saveButton = (label: string, onPress: () => void, danger = false) => (
    <Button
      label={label}
      onPress={onPress}
      variant={danger ? 'danger' : 'secondary'}
      size="sm"
      style={styles.rowButton}
    />
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card compact>
        <Text style={styles.sectionTitle}>AI Providers</Text>
        <Text style={styles.hint}>
          Add at least one key. The advisor tries them in order and falls back automatically, so a free-tier key is enough to run at zero cost.
        </Text>

        {PROVIDERS.map((provider) => (
          <View key={provider.id} style={styles.providerBlock}>
            <Text style={styles.label}>{provider.label}</Text>
            <Text style={styles.hint}>
              {provider.signupNote} — {keys[provider.id]?.saved ? 'key saved securely' : 'no key set'}
            </Text>
            <View style={styles.row}>
              <View style={styles.rowField}>
                <Input
                  style={styles.rowInput}
                  placeholder="Paste API key"
                  value={keys[provider.id]?.input ?? ''}
                  onChangeText={(text) =>
                    setKeys((prev) => ({
                      ...prev,
                      [provider.id]: { input: text, saved: prev[provider.id]?.saved ?? false },
                    }))
                  }
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {saveButton('Save', () => handleSaveKey(provider.id))}
            </View>
            {keys[provider.id]?.saved && saveButton('Remove Key', () => handleClearKey(provider.id), true)}

            <View style={styles.modelRow}>
              {provider.models.map((m) => (
                <Chip
                  key={m.value}
                  label={m.label}
                  selected={models[provider.id] === m.value}
                  onPress={() => handleSelectModel(provider.id, m.value)}
                  style={styles.modelChip}
                />
              ))}
            </View>
          </View>
        ))}
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>Financial Settings</Text>

        <Text style={styles.label}>Cash Balance (PKR)</Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Input
              style={styles.rowInput}
              placeholder="0"
              value={cashAmount}
              onChangeText={setCashAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {saveButton('Save', () => saveSetting('cash', cashAmount, 'Cash'))}
        </View>

        <Text style={styles.label}>Property Value (PKR)</Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Input
              style={styles.rowInput}
              placeholder="0"
              value={propertyAmount}
              onChangeText={setPropertyAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {saveButton('Save', () => saveSetting('property', propertyAmount, 'Property'))}
        </View>

        <Text style={styles.label}>FIRE Target (PKR)</Text>
        <Text style={styles.hint}>Leave empty to auto-calculate (monthly expenses × 300 at a 4% withdrawal rate)</Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Input
              style={styles.rowInput}
              placeholder="Auto-calculated"
              value={fireTargetAmount}
              onChangeText={setFireTargetAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {saveButton('Save', () => saveSetting('fire_target', fireTargetAmount, 'FIRE Target'))}
        </View>

        <Text style={styles.label}>Monthly Budget (PKR)</Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Input
              style={styles.rowInput}
              placeholder="Set monthly budget"
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {saveButton('Save', () => saveSetting('monthly_budget', budgetAmount, 'Budget'))}
        </View>
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>Import Financial Positions</Text>
        <Text style={styles.hint}>
          Paste bank statement CSV lines or an FBR wealth statement. Parsing runs on this device — nothing is uploaded and no credentials are asked for.
        </Text>

        <View style={styles.importModeRow}>
          <Chip
            label="Bank CSV"
            selected={importFormat === 'bank'}
            onPress={() => { setImportFormat('bank'); setImportReport(null); }}
          />
          <Chip
            label="FBR wealth"
            selected={importFormat === 'fbr'}
            onPress={() => { setImportFormat('fbr'); setImportReport(null); }}
          />
        </View>

        <Button
          label={pickBusy ? 'Reading file…' : 'Choose file'}
          onPress={handlePickFile}
          variant="secondary"
          size="sm"
          disabled={pickBusy}
          style={styles.pickButton}
        />
        <Text style={styles.hint}>CSV or plain text, read on this device. Up to 4 MB.</Text>

        <Input
          placeholder={
            importFormat === 'bank'
              ? 'date,description,creditPKR,debitPKR,balanceOBR\n2026-06-01,Salary,250,000,0,250,000'
              : 'Cash in Hand: 250000\nGold: 500000\nProperty: 12000000'
          }
          value={importText}
          onChangeText={(text) => { setImportText(text); setImportReport(null); }}
          multiline
          numberOfLines={6}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.pasteInput}
        />

        <View style={styles.row}>
          {saveButton('Preview', handlePreviewImport)}
          <Button
            label="Import into local ledger"
            onPress={handleImportPositions}
            size="sm"
            disabled={!importText.trim()}
          />
        </View>

        {importReport && (
          <View style={styles.previewBlock}>
            <Text style={styles.previewLine}>
              {importReport.rows.length} credited · {importReport.rejected.length} rejected
            </Text>
            {importReport.rows.slice(0, 5).map((row, index) => (
              <View key={`${row.source}-${index}`} style={styles.previewRow}>
                <Chip label={row.source.toUpperCase()} style={styles.sourceChip} />
                <Text style={styles.previewRowText} numberOfLines={1}>
                  {row.label} · PKR {row.amountPKR.toLocaleString('en-PK')}
                </Text>
              </View>
            ))}
            {importReport.rows.length > 5 && (
              <Text style={styles.hint}>+ {importReport.rows.length - 5} more row(s)</Text>
            )}
            {importReport.rejected.map((rejected, index) => (
              <Text key={`rejected-${index}`} style={styles.rejectedText} numberOfLines={2}>
                Rejected: {rejected.line} — {rejected.reason}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.deferNote}>
          Files are read on this device and never uploaded. CSV or plain text only — PDFs and photos are not read. Bank CSV rows are recorded as net movements and added to your saved cash; FBR rows are balance snapshots and replace it.
        </Text>
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>App Lock</Text>
        {pinExists ? (
          <>
            <Text style={styles.hint}>PIN lock is active. Five wrong attempts trigger a 30-second lockout.</Text>
            <Input
              placeholder="New 4-digit PIN"
              value={pin}
              onChangeText={setPinVal}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
            <Button label="Change PIN" onPress={handlePinSetup} variant="secondary" style={styles.stackButton} />
            <Button label="Remove PIN" onPress={handleRemovePin} variant="danger" style={styles.stackButton} />
          </>
        ) : (
          <>
            <Text style={styles.hint}>Set a 4-digit PIN to lock the app</Text>
            <Input
              placeholder="Set 4-digit PIN"
              value={pin}
              onChangeText={setPinVal}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
            <Button label="Set PIN" onPress={handlePinSetup} style={styles.stackButton} />
          </>
        )}
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>Data</Text>
        <Button label="Export All Data (JSON)" onPress={exportAllData} variant="secondary" />
        <Text style={styles.privacyNote}>
          All data stays on this device. Rahnuma has no server and uploads nothing — the database sits in the app's private storage, protected by your phone's own device encryption while its lock screen is on.
        </Text>
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Rahnuma SABRE v1.0.0</Text>
        <Text style={styles.aboutText}>Package: com.rahnuma.sabre</Text>
        <Text style={styles.aboutText}>Offline-first financial advisor for Pakistan</Text>
        <Text style={styles.disclaimer}>
          Information only, not investment advice. Consult a SECP-registered advisor for decisions.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + spacing.sm },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: -0.1,
    marginBottom: spacing.md,
  },
  providerBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.bold,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.sm },
  rowField: { flex: 1, marginRight: spacing.sm },
  rowInput: { marginBottom: 0 },
  rowButton: { marginBottom: 0 },
  modelRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  modelChip: { marginBottom: spacing.sm },
  stackButton: { marginTop: spacing.sm },
  importModeRow: { flexDirection: 'row', marginBottom: spacing.sm },
  pasteInput: { minHeight: 96, textAlignVertical: 'top' },
  pickButton: { marginBottom: spacing.sm },
  privacyNote: { color: colors.textMuted, fontSize: 11, lineHeight: 15, marginTop: spacing.sm, fontFamily: fonts.regular },
  previewBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  previewLine: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.bold, marginBottom: spacing.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  sourceChip: { marginRight: spacing.sm },
  previewRowText: { color: colors.textSecondary, fontSize: 12, flex: 1, fontFamily: fonts.regular },
  rejectedText: { color: colors.danger, fontSize: 11, lineHeight: 15, marginTop: spacing.xs, fontFamily: fonts.regular },
  deferNote: { color: colors.textMuted, fontSize: 11, lineHeight: 15, marginTop: spacing.sm, fontFamily: fonts.regular },
  aboutText: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs, fontFamily: fonts.regular },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: fonts.regular,
  },
});
