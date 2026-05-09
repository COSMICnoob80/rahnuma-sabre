import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { getHoldings, getTotalIncome, getExpenseTotalByMonth } from '../database/db';

const OPENROUTER_API_KEY = ''; // User must set this
const SYSTEM_PROMPT = `You are Rahnuma, a Pakistani financial advisor who thinks like Buffett (value investing), Dalio (diversification), and knows PSX like Arif Habib. You have access to the user's portfolio and budget data from the app. Never say 'buy' or 'sell'. Say 'based on your criteria, this aligns/doesn't align with your goals.' Always add: 'This is not investment advice. Consult a SECP-registered advisor for decisions.' Respond in English or Urdu based on the user's language.`;

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function AdvisoryScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Assalam-o-Alaikum! I\'m Rahnuma, your Pakistani financial advisor. Ask me about your portfolio, FIRE planning, or any financial question. I have access to your portfolio and budget data.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(OPENROUTER_API_KEY);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!apiKey) {
      Alert.alert('API Key Required', 'Enter your OpenRouter API key in the app settings to use advisory.');
      return;
    }

    const userMsg: Message = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const holdings = await getHoldings();
      const income = await getTotalIncome();
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const expenses = await getExpenseTotalByMonth(month);

      const portfolioContext = holdings.map(h => {
        const val = (h.current_price ?? h.avg_buy_price) * h.quantity;
        return `${h.ticker}: ${h.quantity} shares @ Rs.${h.avg_buy_price}, current value Rs.${val}`;
      }).join('\n');

      const fullPrompt = `[User Portfolio]\n${portfolioContext || 'No holdings'}\n\n[Monthly Budget]\nIncome: Rs.${income}\nExpenses: Rs.${expenses}\nSavings Rate: ${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0}%\n\n[User Question]\n${userMsg.text}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://rahnuma.app',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-v4-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: fullPrompt },
          ],
        }),
      });

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content || 'I apologize, I could not process that request. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Offline — advisory unavailable. Your portfolios, budget, and calculators still work without internet.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* API Key input */}
      <View style={styles.apiKeyBar}>
        <TextInput
          style={styles.apiKeyInput}
          placeholder="OpenRouter API Key"
          placeholderTextColor="#475569"
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>{item.text}</Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.typing}>
          <Text style={styles.typingText}>Rahnuma is thinking...</Text>
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
        This is not investment advice. Consult a SECP-registered advisor for decisions.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  apiKeyBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  apiKeyInput: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
  },
  chatList: { flex: 1, paddingHorizontal: 16 },
  chatContent: { paddingVertical: 12 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { backgroundColor: '#3b82f6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#1e293b', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#e2e8f0', fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: '#fff' },
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
});
