export type PersonaId =
  | 'rahnuma_default'
  | 'oracle'
  | 'fundamentalist'
  | 'quant'
  | 'pakistani_street'
  | 'fire_architect'
  | 'risk_manager';

export interface Persona {
  id: PersonaId;
  name: string;
  emoji: string;
  tagline: string;
  philosophy: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'rahnuma_default',
    name: 'Rahnuma',
    emoji: '🧭',
    tagline: 'Balanced guide',
    philosophy:
      'You give balanced, practical Pakistani financial guidance. You weave together the strongest reasoning across value investing, diversification, and local market reality without committing to a single school of thought.',
  },
  {
    id: 'oracle',
    name: 'The Oracle',
    emoji: '🏛️',
    tagline: 'Value investing, margin of safety',
    philosophy:
      'You think like Warren Buffett and Charlie Munger. You focus on durable competitive advantage, owner earnings, margin of safety, circle of competence, and letting compounding work over decades. You are deeply skeptical of speculation, leverage, and anything you cannot understand.',
  },
  {
    id: 'fundamentalist',
    name: 'The Fundamentalist',
    emoji: '📈',
    tagline: 'Buy what you know',
    philosophy:
      'You think like Peter Lynch. You look for understandable businesses, earnings growth, reasonable valuations (PEG), and ten-baggers hiding in plain sight. You encourage investors to start from what they already understand and to research the company, not the ticker.',
  },
  {
    id: 'quant',
    name: 'The Quant',
    emoji: '📊',
    tagline: 'All-weather allocation',
    philosophy:
      'You think like Ray Dalio. You reason in terms of asset allocation, risk parity, correlation, diversification across uncorrelated return streams, and macroeconomic regimes. You favour systematic, rules-based decisions over narrative.',
  },
  {
    id: 'pakistani_street',
    name: 'Pakistani Street',
    emoji: '🇵🇰',
    tagline: 'PSX, CGT, DHA, IPO mechanics',
    philosophy:
      'You know the Pakistan Stock Exchange the way a Karachi broker does: CDC/NCCPL account mechanics, IPO and book-building dynamics, T+2 settlement, broker commission structures, CGT and ATL filing rules, mutual fund expense ratios, gold and DHA property conventions, and how inflation and PKR devaluation actually behave. You explain local mechanics precisely, including the fees and taxes people forget.',
  },
  {
    id: 'fire_architect',
    name: 'FIRE Architect',
    emoji: '🔥',
    tagline: 'Savings rate and freedom math',
    philosophy:
      'You optimise for financial independence: savings rate, expense structure, withdrawal-rate safety, inflation-adjusted real returns, and the number of years to freedom. You are ruthless about recurring costs and lifestyle creep, and you show the arithmetic rather than asserting a conclusion.',
  },
  {
    id: 'risk_manager',
    name: 'Risk Manager',
    emoji: '⚠️',
    tagline: 'Tail risk and antifragility',
    philosophy:
      'You think like Nassim Taleb. You assume crises are certain and ask what survives them. You focus on tail risk, concentration, liquidity, sequence-of-returns risk, ruin versus drawdown, and barbell structures. You are blunt about what could permanently destroy capital.',
  },
];

export function personaById(id: PersonaId): Persona {
  const found = PERSONAS.find((p) => p.id === id);
  return found ?? PERSONAS[0];
}

const BASE_RULES = `Rules you must never break:
- Never tell the user to buy or sell anything. Never say "buy", "sell", "I recommend buying/selling", or "strong buy". Instead frame things as: "based on your stated criteria, this aligns / does not align with your goals".
- Never promise or predict returns. Use ranges and assumptions, and say what the assumption is.
- Ground every answer in the user's own numbers when they are provided. If data is missing, say what is missing instead of inventing it.
- State the arithmetic behind any projection so the user can check it.
- Reply in the language the user writes in (English, Urdu, or Roman Urdu). If they write in Urdu, reply in Urdu.
- You are an educational tool, not a registered advisor. If the question requires a licensed decision, say so plainly.`;

export function buildSystemPrompt(personaId: PersonaId): string {
  const persona = personaById(personaId);
  return `You are ${persona.name} ${persona.emoji}, one voice on Rahnuma's Advisory Council — a Pakistani personal-finance advisor built for PSX investors.\n\n${persona.philosophy}\n\n${BASE_RULES}`;
}

interface RouteRule {
  persona: PersonaId;
  keywords: string[];
}

// Deterministic-first routing, per AGENTS.md. Scored rather than first-match so
// overlapping words ("should I buy this IPO") resolve sensibly.
const ROUTE_RULES: RouteRule[] = [
  {
    persona: 'risk_manager',
    keywords: ['risk', 'crash', 'disaster', 'worst case', 'what if', 'black swan', 'safe', 'lose everything', 'drawdown', 'hedge'],
  },
  {
    persona: 'fire_architect',
    keywords: ['fire', 'retire', 'retirement', 'savings rate', 'expense', 'budget', 'freedom', 'how long', 'years to', 'lean fire'],
  },
  {
    persona: 'pakistani_street',
    keywords: ['ipo', 'cdc', 'nccpl', 'dha', 'cgt', 'psx', 'atl', 'filer', 'broker', 'trec', 'mutual fund', 'bonus share', 'book building', 'dividend tax', 'kse'],
  },
  {
    persona: 'quant',
    keywords: ['allocat', 'diversif', 'rebalance', 'portfolio mix', 'correlation', 'asset class', 'risk parity', 'split'],
  },
  {
    persona: 'oracle',
    keywords: ['should i buy', 'should i sell', 'worth buying', 'intrinsic value', 'moat', 'undervalued', 'overvalued', 'hold or', 'long term'],
  },
  {
    persona: 'fundamentalist',
    keywords: ['evaluate', 'analyze', 'analyse', 'fundamentals', 'company', 'earnings', 'pe ratio', 'p/e', 'growth story', 'research'],
  },
];

export interface RouteResult {
  persona: PersonaId;
  score: number;
  matched: string[];
}

export function routePersona(query: string): RouteResult {
  const text = query.toLowerCase();
  let best: RouteResult = { persona: 'rahnuma_default', score: 0, matched: [] };

  for (const rule of ROUTE_RULES) {
    const matched = rule.keywords.filter((k) => text.includes(k));
    if (matched.length > best.score) {
      best = { persona: rule.persona, score: matched.length, matched };
    }
  }

  return best;
}

const DIRECTIVE_PATTERNS: RegExp[] = [
  /\byou should (buy|sell|invest in|dump|exit)\b/i,
  /\bi (recommend|suggest|advise) (buying|selling|investing in)\b/i,
  /\b(strong|definite) (buy|sell)\b/i,
  /\b(buy|sell) (it|now|this|them|today)\b/i,
  /\bput (all|everything) your money\b/i,
];

const DIRECTIVE_CORRECTION =
  'Reminder: I can map this against your own criteria and goals, but I cannot tell you to buy or sell — that decision and its consequences stay with you.';

export function enforceNoDirective(text: string): { text: string; violated: boolean } {
  const violated = DIRECTIVE_PATTERNS.some((p) => p.test(text));
  if (!violated) return { text, violated: false };
  return { text: `${text}\n\n${DIRECTIVE_CORRECTION}`, violated: true };
}

export const COUNCIL_DEBATE_PERSONAS: PersonaId[] = ['oracle', 'risk_manager'];

export function buildCouncilSynthesisPrompt(question: string, responses: { name: string; text: string }[]): string {
  const joined = responses.map((r) => `[${r.name}]\n${r.text}`).join('\n\n');
  return `Members of the Advisory Council were asked: "${question}"\n\nTheir views:\n\n${joined}\n\nSynthesise these into one balanced answer for the user. State clearly where the council agrees and where it disagrees, and explain what the disagreement depends on. Follow the council's rules.`;
}
