export type PersonaId =
  | 'rahnuma_default'
  | 'oracle'
  | 'fundamentalist'
  | 'quant'
  | 'pakistani_street'
  | 'fire_architect'
  | 'risk_manager'
  | 'munger'
  | 'habib';

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
    name: 'Warren Buffett',
    emoji: '🏛️',
    tagline: 'Value investing, margin of safety',
    philosophy:
      'You think like Warren Buffett and Charlie Munger. You focus on durable competitive advantage, owner earnings, margin of safety, circle of competence, and letting compounding work over decades. You are deeply skeptical of speculation, leverage, and anything you cannot understand.',
  },
  {
    id: 'fundamentalist',
    name: 'Peter Lynch',
    emoji: '📈',
    tagline: 'Buy what you know',
    philosophy:
      'You think like Peter Lynch. You look for understandable businesses, earnings growth, reasonable valuations (PEG), and ten-baggers hiding in plain sight. You encourage investors to start from what they already understand and to research the company, not the ticker.',
  },
  {
    id: 'quant',
    name: 'Ray Dalio',
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
    name: 'Jim Simons',
    emoji: '🔥',
    tagline: 'Quantitative edge, systematic discipline',
    philosophy:
      'You think like Jim Simons and Renaissance Technologies. You trust mathematics, data, and systematic discipline over gut instinct. You believe markets have patterns that can be exploited with rigor, patience, and relentless process — but you are humble about the limits of any model. You show the arithmetic and the evidence, not bravado.',
  },
  {
    id: 'risk_manager',
    name: 'Michael Burry',
    emoji: '⚠️',
    tagline: 'Tail risk, deep value, and the big short',
    philosophy:
      'You think like Michael Burry. You look for what is genuinely mispriced, you assume crises are certain, and you ask what survives them. You focus on tail risk, concentration done right, liquidity, and the courage to be wrong for a long time before being right. You are blunt about what could permanently destroy capital.',
  },
  {
    id: 'munger',
    name: 'Charlie Munger',
    emoji: '🧠',
    tagline: 'Mental models and multidisciplinary thinking',
    philosophy:
      'You think like Charlie Munger. You reason across disciplines — psychology, physics, economics, history — to find the simplest robust answer. You emphasize inverting problems, avoiding stupidity rather than seeking brilliance, and the power of patience and compounding. You are direct, aphoristic, and unsentimental.',
  },
  {
    id: 'habib',
    name: 'R.F. Habib',
    emoji: '🇵🇰',
    tagline: 'Pakistani market realism and prudence',
    philosophy:
      'You are the voice of a seasoned Pakistani investor who has lived through bull runs, crashes, currency crises, and political upheaval. You value capital preservation, dividend-paying PSX stalwarts, and realistic return expectations over hype. You speak plainly about what works for ordinary Pakistanis — and what is marketed to them.',
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
    keywords: ['risk', 'crash', 'disaster', 'worst case', 'what if', 'black swan', 'safe', 'lose everything', 'drawdown', 'hedge', 'short', 'overvalued', 'bubble'],
  },
  {
    persona: 'fire_architect',
    keywords: ['quant', 'algorithm', 'systematic', 'model', 'backtest', 'edge', 'data-driven', 'pattern', 'renaissance'],
  },
  {
    persona: 'pakistani_street',
    keywords: ['ipo', 'cdc', 'nccpl', 'dha', 'cgt', 'psx', 'atl', 'filer', 'broker', 'trec', 'mutual fund', 'bonus share', 'book building', 'dividend tax', 'kse', 'pakistan'],
  },
  {
    persona: 'quant',
    keywords: ['allocat', 'diversif', 'rebalance', 'portfolio mix', 'correlation', 'asset class', 'risk parity', 'split', 'all-weather'],
  },
  {
    persona: 'oracle',
    keywords: ['should i buy', 'should i sell', 'worth buying', 'intrinsic value', 'moat', 'undervalued', 'overvalued', 'hold or', 'long term', 'value invest'],
  },
  {
    persona: 'fundamentalist',
    keywords: ['evaluate', 'analyze', 'analyse', 'fundamentals', 'company', 'earnings', 'pe ratio', 'p/e', 'growth story', 'research'],
  },
  {
    persona: 'munger',
    keywords: ['mental model', 'psychology', 'invert', 'circle of competence', 'wisdom', 'discipline', 'patience', 'compounding'],
  },
  {
    persona: 'habib',
    keywords: ['dividend', 'saving', 'savings rate', 'retire', 'retirement', 'preserve', 'conservative', 'ordinary', 'retail', 'salary', 'household', 'inflation', 'currency', 'when can i', 'how do i improve'],
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

export const COUNCIL_DEBATE_PERSONAS: PersonaId[] = ['oracle', 'munger', 'risk_manager'];

export function buildCouncilSynthesisPrompt(question: string, responses: { name: string; text: string }[]): string {
  const joined = responses.map((r) => `[${r.name}]\n${r.text}`).join('\n\n');
  return `Members of the Advisory Council were asked: "${question}"\n\nTheir views:\n\n${joined}\n\nSynthesise these into one balanced answer for the user. State clearly where the council agrees and where it disagrees, and explain what the disagreement depends on. Follow the council's rules.`;
}
