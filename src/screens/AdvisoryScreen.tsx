import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { getHoldings, getTotalIncomeByMonth, getExpenseTotalByMonth } from '../database/db';
import { hasAnyProvider, askAdvisor, ChatMessage } from '../services/llmService';
import {
  PersonaId,
  PERSONAS,
  buildSystemPrompt,
  buildCouncilSynthesisPrompt,
  enforceNoDirective,
  personaById,
  routePersona,
  COUNCIL_DEBATE_PERSONAS,
} from '../services/personaService';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { Chip } from '../components';

const GREETING =
  "Assalam-o-Alaikum! I'm Rahnuma, your financial advisor. Ask me about your portfolio, FIRE planning, taxes, or any financial question.";

interface Message {
  role: 'user' | 'assistant';
  text: string;
  persona?: PersonaId;
  cached?: boolean;
  note?: string;
}

function personaChipLabel(id: PersonaId): string {
  const persona = personaById(id);
  return `${persona.emoji} ${persona.name}`;
}

export default function AdvisoryScreen() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Rahnuma is thinking...');
  const [providerReady, setProviderReady] = useState<boolean | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | 'auto'>('auto');
  const [councilMode, setCouncilMode] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => setProviderReady(await hasAnyProvider()))();
  }, []);

  const buildContext = async (): Promise<string> => {
    const holdings = await getHoldings();
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const income = await getTotalIncomeByMonth(month);
    const expenses = await getExpenseTotalByMonth(month);

    const portfolio = holdings
      .map((h) => {
        const value = (h.current_price ?? h.avg_buy_price) * h.quantity;
        const bought = h.purchase_date ? `, acquired ${h.purchase_date}` : '';
        return `${h.ticker}: ${h.quantity} shares @ Rs.${h.avg_buy_price}${bought}, current value Rs.${value.toFixed(0)}`;
      })
      .join('\n');

    const savingsRate = income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : '0';

    return `[User Portfolio]\n${portfolio || 'No holdings recorded'}\n\n[Current Month Budget]\nIncome: Rs.${income}\nExpenses: Rs.${expenses}\nSavings Rate: ${savingsRate}%`;
  };

  const pushAssistant = (message: Message) => setMessages((prev) => [...prev, message]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;

    if (providerReady === false) {
      Alert.alert(
        'No AI provider configured',
        'Add a free API key in Settings → AI Providers. Gemini and Groq both have free tiers, so the advisor costs nothing to run.'
      );
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const context = await buildContext();
      const history: ChatMessage[] = messages
        .slice(-9)
        .filter((m) => m.text !== GREETING)
        .map((m) => ({ role: m.role, content: m.text }));
      const enriched: ChatMessage = {
        role: 'user',
        content: `${context}\n\n[User Question]\n${question}`,
      };

      if (councilMode) {
        const responses: { name: string; text: string }[] = [];
        for (const personaId of COUNCIL_DEBATE_PERSONAS) {
          setLoadingLabel(`${personaById(personaId).name} is reviewing...`);
          const result = await askAdvisor({
            systemPrompt: buildSystemPrompt(personaId),
            messages: [...history, enriched],
          });
          responses.push({ name: personaById(personaId).name, text: enforceNoDirective(result.text).text });
        }

        setLoadingLabel('Synthesising the council...');
        const synthesis = await askAdvisor({
          systemPrompt: buildSystemPrompt('rahnuma_default'),
          messages: [{ role: 'user', content: buildCouncilSynthesisPrompt(question, responses) }],
          useCache: false,
        });
        const guarded = enforceNoDirective(synthesis.text);

        pushAssistant({
          role: 'assistant',
          text: guarded.text,
          persona: 'rahnuma_default',
          note: `Council debate: ${responses.map((r) => r.name).join(' + ')}`,
        });
        return;
      }

      const routedPersona = selectedPersona === 'auto' ? routePersona(question).persona : selectedPersona;
      const result = await askAdvisor({
        systemPrompt: buildSystemPrompt(routedPersona),
        messages: [...history, enriched],
      });
      const guarded = enforceNoDirective(result.text);

      pushAssistant({
        role: 'assistant',
        text: guarded.text,
        persona: routedPersona,
        cached: result.cached,
        note:
          result.failedProviders.length > 0
            ? `Answered after fallback (${result.failedProviders.map((f) => f.provider).join(', ')} unavailable)`
            : undefined,
      });
    } catch (error) {
      pushAssistant({
        role: 'assistant',
        text:
          error instanceof Error
            ? `${error.message}\n\nYour portfolio, budget and calculators keep working offline.`
            : 'Advisory unavailable right now. Your portfolio, budget and calculators keep working offline.',
      });
    } finally {
      setLoading(false);
      setLoadingLabel('Rahnuma is thinking...');
    }
  };

  if (providerReady === false) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyTitle}>No AI Provider Configured</Text>
        <Text style={styles.emptyText}>
          Go to Settings → AI Providers and add a free key from Gemini or Groq. Both have free tiers, so the advisor runs at zero cost.
        </Text>
        <Text style={styles.emptyText}>
          Your portfolio, budget and calculators already work without any key and without internet.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip
            label="Auto"
            selected={selectedPersona === 'auto' && !councilMode}
            onPress={() => { setSelectedPersona('auto'); setCouncilMode(false); }}
          />

          {PERSONAS.filter((p) => p.id !== 'rahnuma_default').map((persona) => (
            <Chip
              key={persona.id}
              label={personaChipLabel(persona.id)}
              selected={selectedPersona === persona.id && !councilMode}
              onPress={() => { setSelectedPersona(persona.id); setCouncilMode(false); }}
            />
          ))}

          <Chip
            label="Council debate"
            selected={councilMode}
            onPress={() => setCouncilMode(true)}
          />
        </ScrollView>

        <Text style={styles.controlsHint}>
          {councilMode
            ? 'The Oracle and the Risk Manager answer, then Rahnuma synthesises. Uses 3 model calls.'
            : selectedPersona === 'auto'
              ? 'Auto picks the best-suited voice for each question.'
              : personaById(selectedPersona).tagline}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={styles.messageBlock}>
            {item.role === 'assistant' && item.persona && (
              <Text style={styles.personaBadge}>
                {personaChipLabel(item.persona)}
                {item.cached ? ' · saved' : ''}
              </Text>
            )}
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>{item.text}</Text>
            </View>
            {!!item.note && <Text style={styles.messageNote}>{item.note}</Text>}
          </View>
        )}
      />

      {loading && (
        <View style={styles.typing}>
          <Text style={styles.typingText}>{loadingLabel}</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask about your finances..."
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
            <Text style={styles.sendBtnText}>{loading ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        Information only, not investment advice. Consult a SECP-registered advisor for decisions.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl + spacing.sm },
  controls: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.sm,
  },
  chipRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  controlsHint: {
    color: colors.textMuted,
    fontSize: 11,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    lineHeight: 15,
  },
  chatList: { flex: 1, paddingHorizontal: spacing.lg },
  chatContent: { paddingVertical: spacing.md, paddingBottom: spacing.sm },
  messageBlock: { marginBottom: spacing.md },
  personaBadge: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accentBorder,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
  },
  bubbleText: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: colors.textPrimary },
  messageNote: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  typing: { paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  typingText: { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  inputBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chatInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  sendBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
  disclaimer: {
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
