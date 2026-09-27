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
          <TouchableOpacity
            style={[styles.chip, selectedPersona === 'auto' && !councilMode && styles.chipActive]}
            onPress={() => { setSelectedPersona('auto'); setCouncilMode(false); }}
          >
            <Text style={[styles.chipText, selectedPersona === 'auto' && !councilMode && styles.chipTextActive]}>
              ✨ Auto
            </Text>
          </TouchableOpacity>

          {PERSONAS.filter((p) => p.id !== 'rahnuma_default').map((persona) => (
            <TouchableOpacity
              key={persona.id}
              style={[styles.chip, selectedPersona === persona.id && !councilMode && styles.chipActive]}
              onPress={() => { setSelectedPersona(persona.id); setCouncilMode(false); }}
            >
              <Text
                style={[styles.chipText, selectedPersona === persona.id && !councilMode && styles.chipTextActive]}
              >
                {personaChipLabel(persona.id)}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.chip, councilMode && styles.councilChipActive]}
            onPress={() => setCouncilMode(true)}
          >
            <Text style={[styles.chipText, councilMode && styles.chipTextActive]}>⚖️ Council debate</Text>
          </TouchableOpacity>
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
        <TextInput
          style={styles.chatInput}
          placeholder="Ask about your finances..."
          placeholderTextColor="#64748b"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendBtnText}>{loading ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        Information only, not investment advice. Consult a SECP-registered advisor for decisions.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  controls: { borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingTop: 8 },
  chipRow: { paddingHorizontal: 12, paddingVertical: 6 },
  chip: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  councilChipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  chipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  controlsHint: { color: '#64748b', fontSize: 11, paddingHorizontal: 14, paddingBottom: 8, lineHeight: 15 },
  chatList: { flex: 1, paddingHorizontal: 16 },
  chatContent: { paddingVertical: 12 },
  messageBlock: { marginBottom: 10 },
  personaBadge: { color: '#64748b', fontSize: 11, marginBottom: 3, marginLeft: 4 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: '#3b82f6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#1e293b', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#e2e8f0', fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: '#fff' },
  messageNote: { color: '#475569', fontSize: 11, marginTop: 3, marginLeft: 4 },
  typing: { paddingHorizontal: 16, marginBottom: 4 },
  typingText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    color: '#e2e8f0',
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  disclaimer: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  emptyTitle: { color: '#e2e8f0', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
});
