import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSystemPrompt,
  enforceNoDirective,
  personaById,
  routePersona,
  COUNCIL_DEBATE_PERSONAS,
  PERSONAS,
} from '../src/services/personaService.ts';
import {
  buildRequest,
  cacheKey,
  parseResponse,
} from '../src/services/llmAdapters.ts';

// ---------- deterministic routing ----------

test('router: "should I buy" goes to The Oracle', () => {
  assert.equal(routePersona('Should I buy LUCK at this price?').persona, 'oracle');
});

test('router: allocation questions go to The Quant', () => {
  assert.equal(routePersona('How should I diversify my allocation?').persona, 'quant');
  assert.equal(routePersona('I want to rebalance across asset classes').persona, 'quant');
});

test('router: local mechanics go to Pakistani Street', () => {
  assert.equal(routePersona('What is the CGT if I sell 400 shares held 300 days?').persona, 'pakistani_street');
  assert.equal(routePersona('Explain PSX book building for the IPO').persona, 'pakistani_street');
});

test('router: retirement questions go to FIRE Architect', () => {
  assert.equal(routePersona('How do I improve my savings rate?').persona, 'fire_architect');
  assert.equal(routePersona('When can I retire?').persona, 'fire_architect');
});

test('router: risk questions go to Risk Manager', () => {
  assert.equal(routePersona('What if the market crashes 40%?').persona, 'risk_manager');
  assert.equal(routePersona('How much tail risk am I carrying?').persona, 'risk_manager');
});

test('router: company analysis goes to The Fundamentalist', () => {
  assert.equal(routePersona('Evaluate Meezan Bank fundamentals').persona, 'fundamentalist');
});

test('router: overlapping signals resolve to the higher-scoring persona', () => {
  // "cgt" + "psx" beat the single "should i buy" signal.
  assert.equal(routePersona('Should I buy, and what is the CGT on PSX shares?').persona, 'pakistani_street');
});

test('router: ambiguous input falls back to Rahnuma default', () => {
  const result = routePersona('Hello, how are you?');
  assert.equal(result.persona, 'rahnuma_default');
  assert.equal(result.score, 0);
});

test('router: every persona id is resolvable', () => {
  for (const persona of PERSONAS) {
    assert.equal(personaById(persona.id).id, persona.id);
  }
  assert.equal(personaById('nonexistent' as any).id, 'rahnuma_default');
});

test('council debate uses two distinct personas', () => {
  assert.equal(COUNCIL_DEBATE_PERSONAS.length, 2);
  assert.equal(new Set(COUNCIL_DEBATE_PERSONAS).size, 2);
});

// ---------- Principle XVI enforced in code ----------

test('guard: catches directive language', () => {
  assert.equal(enforceNoDirective('You should buy LUCK now.').violated, true);
  assert.equal(enforceNoDirective('I recommend selling half your position.').violated, true);
  assert.equal(enforceNoDirective('This is a strong buy.').violated, true);
  assert.equal(enforceNoDirective('Sell it.').violated, true);
});

test('guard: passes neutral framing through untouched', () => {
  const neutral =
    'Based on your stated criteria of 15% annual returns, holding LUCK aligns with your goal, though it raises your sector concentration.';
  const result = enforceNoDirective(neutral);
  assert.equal(result.violated, false);
  assert.equal(result.text, neutral);
});

test('guard: a violation appends the correction without deleting the answer', () => {
  const result = enforceNoDirective('You should buy LUCK.');
  assert.ok(result.text.includes('You should buy LUCK.'));
  assert.ok(result.text.includes('I cannot tell you to buy or sell'));
});

test('system prompt carries the persona and the hard rules', () => {
  const prompt = buildSystemPrompt('risk_manager');
  assert.ok(prompt.includes('Risk Manager'));
  assert.ok(prompt.includes('Never tell the user to buy or sell anything'));
  assert.ok(prompt.includes('Urdu'));
});

// ---------- provider adapters ----------

test('OpenAI-compatible providers send system as the first message', () => {
  const request = buildRequest('groq', 'llama-3.3-70b-versatile', 'k', 'SYS', [
    { role: 'user', content: 'hi' },
  ]);
  assert.equal(request.url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(request.headers.Authorization, 'Bearer k');
  const body = request.body as any;
  assert.deepEqual(body.messages[0], { role: 'system', content: 'SYS' });
  assert.equal(body.model, 'llama-3.3-70b-versatile');
});

test('OpenRouter adds attribution headers', () => {
  const request = buildRequest('openrouter', 'deepseek/deepseek-v4-flash', 'k', 'SYS', []);
  assert.equal(request.headers['X-Title'], 'Rahnuma SABRE');
  assert.ok(request.url.startsWith('https://openrouter.ai/'));
});

test('Gemini maps assistant turns to the model role and uses systemInstruction', () => {
  const request = buildRequest('gemini', 'gemini-2.5-flash', 'k', 'SYS', [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'a1' },
    { role: 'user', content: 'q2' },
  ]);
  assert.ok(request.url.includes('generativelanguage.googleapis.com'));
  const body = request.body as any;
  assert.equal(body.systemInstruction.parts[0].text, 'SYS');
  assert.deepEqual(
    body.contents.map((c: any) => c.role),
    ['user', 'model', 'user']
  );
});

test('parsers read both response shapes', () => {
  assert.equal(
    parseResponse('groq', { choices: [{ message: { content: ' hello ' } }] }),
    'hello'
  );
  assert.equal(
    parseResponse('gemini', { candidates: [{ content: { parts: [{ text: 'hi' }, { text: ' there' }] } }] }),
    'hi there'
  );
  assert.equal(parseResponse('groq', { choices: [{ message: { content: '   ' } }] }), null);
});

test('parsers surface provider errors so the chain can fall through', () => {
  assert.throws(() => parseResponse('groq', { error: { message: 'rate limit exceeded' } }), /rate limit/);
});

test('cache keys are stable and message-order sensitive', () => {
  const a = cacheKey('SYS', [{ role: 'user', content: 'q' }]);
  const b = cacheKey('SYS', [{ role: 'user', content: 'q' }]);
  const c = cacheKey('SYS', [{ role: 'assistant', content: 'q' }]);
  assert.equal(a, b);
  assert.notEqual(a, c);
});
