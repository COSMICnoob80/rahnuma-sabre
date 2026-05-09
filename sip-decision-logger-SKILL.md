# SKILL: Monthly SIP Decision Logger

> **Owner:** Shah G
> **Created:** February 2026
> **Version:** 1.0
> **Philosophy:** "Continue the SIP. No matter what. The market is noise. The plan is signal."

---

## 1. PURPOSE

This skill automates Shah G's monthly Systematic Investment Plan (SIP) review and generates a structured decision log entry. It is designed to:

1. **Preserve discipline** during emotionally compromised states (post-call exhaustion, geopolitical anxiety, FOMO)
2. **Build an investment journal** — every decision logged with rationale and context
3. **Feed into Rahnuma AI** eventually — same data model, same philosophy, same language
4. **Prevent emotional override** of a systematic plan that has already survived stress testing

---

## 2. CORE PRINCIPLE (NON-NEGOTIABLE)

> **Default decision is ALWAYS: EXECUTE THE SIP AS PLANNED.**

Shah G has stated unambiguously that he continues his SIP regardless of market conditions. This skill honors that discipline. It does NOT ask "should I execute this month?" It asks "is there any extraordinary reason to deviate from the plan?" — and the answer is almost always no.

**Deviation requires:**
- Catastrophic personal event (medical emergency, job loss, unexpected large expense)
- NOT market volatility
- NOT geopolitical news
- NOT NAV movement
- NOT FOMO on other opportunities
- NOT "it feels wrong this month"

The skill's job is to **execute the plan and document it** — not to second-guess it.

---

## 3. TRIGGER

This skill activates when Shah G says any of:
- "Monthly SIP review"
- "Log this month's SIP"
- "SIP decision [month]"
- "Run SIP logger"

OR automatically on the 25th of each month (via calendar reminder).

---

## 4. INPUTS

### 4.1 Required from Shah G
- Current date
- This month's available investment amount (PKR)
- MIIETF current NAV (Shah G looks this up in KTrade or asks the skill)
- Mahaana Save+ allocation for this month (separately)

### 4.2 Automatically Assessed
- Budget status (from TrackWallet data if available, or quick confirm from user)
- Any extraordinary personal circumstances (medical, family, job)
- Market context (for LOGGING purposes only — does NOT affect decision)

### 4.3 Allocation Rule
- **MIIETF:** Core equity SIP (long-term wealth building)
- **Mahaana Save+:** Cash management / emergency fund growth
- **Split ratio:** Determined by Shah G month-to-month based on available funds

---

## 5. DECISION LOGIC

```python
# PSEUDOCODE — captures the skill's reasoning flow

def monthly_sip_decision(inputs):
    # Step 1: Check for deviation triggers (the ONLY reasons to pause)
    deviation_triggers = [
        "medical_emergency",
        "job_loss",
        "major_unexpected_expense",
        "family_financial_crisis"
    ]
    
    if any(trigger in inputs.circumstances for trigger in deviation_triggers):
        return {
            "decision": "PAUSE_AND_REASSESS",
            "severity": "extraordinary_circumstance",
            "action": "Consult with financial priority framework"
        }
    
    # Step 2: Market noise filter (these NEVER trigger deviation)
    ignored_factors = [
        "psx_crash",              # Shah G: continues regardless
        "geopolitical_tension",   # Shah G: continues regardless
        "nav_at_all_time_high",   # Shah G: continues regardless
        "nav_at_all_time_low",    # Shah G: continues regardless
        "ipo_fomo",               # Shah G: continues regardless
        "crypto_hype",            # Shah G: continues regardless
        "property_fomo",          # Shah G: continues regardless
    ]
    
    # Step 3: Default path — EXECUTE
    return {
        "decision": "EXECUTE_SIP_AS_PLANNED",
        "rationale": "Systematic plan honored. Market noise ignored.",
        "action": "Log and proceed"
    }
```

---

## 6. OUTPUT FORMAT (Decision Log Entry)

The skill generates a JSON entry that accumulates into a long-term investment journal:

```json
{
  "log_id": "sip-2026-02",
  "date": "2026-02-25",
  "month": "February 2026",
  
  "investment": {
    "total_amount": 25000,
    "miietf_amount": 15000,
    "mahaana_save_amount": 10000,
    "allocation_ratio": "60/40"
  },
  
  "market_context": {
    "miietf_nav": 10.42,
    "kse100_level": 98420,
    "notable_events": [
      "SBP held rates at 11%",
      "Minor PSX volatility mid-month"
    ],
    "note": "Logged for historical reference only. Did not influence decision."
  },
  
  "decision": {
    "action": "EXECUTED_AS_PLANNED",
    "rationale": "Systematic plan honored. Market conditions ignored per core principle.",
    "deviation_from_plan": false,
    "emotional_state_at_decision": "calm"
  },
  
  "cumulative_tracking": {
    "months_since_sip_start": 14,
    "consecutive_executions": 14,
    "missed_months": 0,
    "discipline_score": "100%",
    "total_invested_lifetime": 350000,
    "miietf_units_owned": "calculated_from_nav_history",
    "mahaana_balance": "from_account"
  },
  
  "reflection": "Another month of discipline. The plan is working.",
  
  "next_review_date": "2026-03-25"
}
```

---

## 7. BEHAVIORAL RULES FOR THE AGENT

When executing this skill, the AI agent MUST:

### 7.1 DO
- ✅ Start by confirming the current date and available investment amount
- ✅ Ask about EXTRAORDINARY circumstances only (medical, job, family crisis)
- ✅ Default to EXECUTE decision unless extraordinary circumstance stated
- ✅ Log market context for historical reference
- ✅ Celebrate streak maintenance ("14 consecutive months — disciplined investing in action")
- ✅ Connect back to FIRE progress if relevant ("This month's PKR 25K at 10% real return = PKR X at FIRE date")
- ✅ Save the log entry (eventually to Rahnuma AI database, currently to markdown journal)

### 7.2 DO NOT
- ❌ NEVER ask "do you think the market is right for SIP this month?"
- ❌ NEVER suggest timing the market
- ❌ NEVER validate FOMO with comments like "that IPO does look attractive"
- ❌ NEVER use NAV movement to suggest deviation
- ❌ NEVER frame geopolitical news as an investment concern (Shah G has already decided this doesn't matter)
- ❌ NEVER bring up "what if" market scenarios that could shake discipline
- ❌ NEVER recommend pausing based on short-term market data

### 7.3 SPECIAL RULE — The Discipline Guard

If Shah G himself expresses hesitation during the skill execution ("maybe I should wait this month because..."), the agent MUST:

1. Gently acknowledge the feeling
2. Remind him of his own stated principle: "You've told me you continue your SIP no matter what. Your past self, in a calm state, set this rule for your future self. Are you in extraordinary circumstances, or is this market noise?"
3. If no extraordinary circumstance → execute anyway and log the near-miss
4. If extraordinary circumstance → pause and route to deeper review

This is the HEART of the skill. It exists BECAUSE discipline is hard in the moment. The skill is Shah G's past self protecting his future self from emotional override.

---

## 8. EXAMPLE SESSION

```
User: "Monthly SIP review for February"

Agent: It's February 25, 2026. Let's log this month's SIP decision.

        Quick check: Any extraordinary personal circumstances 
        this month? (medical emergency, job loss, major unexpected 
        expense, or family financial crisis)

User: "No, nothing like that. Budget is fine. Just worried 
       about PSX volatility."

Agent: Noted — PSX volatility is market noise, not an extraordinary 
        circumstance. Per your own stated principle, you continue 
        the SIP regardless of market conditions.

        How much are you investing this month and what's the split?

User: "PKR 25,000 total. 15K MIIETF, 10K Mahaana Save+."

Agent: Current MIIETF NAV (for logging)?

User: "10.42"

Agent: Decision: EXECUTE_SIP_AS_PLANNED ✅

        This is month 14 of consecutive SIP execution. Your 
        discipline score is 100%. The February 2026 entry has 
        been logged.

        At your current savings rate and this month's contribution, 
        your FIRE trajectory is on track. Market volatility this 
        month doesn't change anything — your system is working 
        because you didn't deviate.

        Next review: March 25, 2026.

        [JSON log entry saved]
```

---

## 9. GROWTH PATH

This skill evolves with Shah G's financial journey:

- **v1.0 (current):** Manual input, JSON log generation, markdown journal
- **v1.1:** Automated calendar reminder on 25th of each month
- **v2.0:** Integration with Rahnuma AI database — persistent investment journal
- **v2.1:** Automated MIIETF NAV fetch via MCP server (no manual lookup)
- **v2.2:** TrackWallet integration — auto-confirm budget status
- **v3.0:** Advisory Council integration — "The FIRE Architect says..." with streak celebration

---

## 10. CONNECTION TO RAHNUMA AI

This skill is a **prototype for Rahnuma AI's investment journal feature.** Every decision logged here becomes training data and reference history when Rahnuma launches. The JSON schema is intentionally aligned with Rahnuma's planned data model.

Think of this skill as Rahnuma v0.1 — running in markdown form until the full product exists.

---

## 11. THE META-LESSON

This skill exists because **composable skills codify expertise.** Shah G has developed a disciplined investment philosophy through experience (continuing SIP through geopolitical crisis, resisting IPO FOMO, systematic monthly execution). That expertise lives in his head. Without codification, it's vulnerable to emotional override, memory loss, or bad days.

By writing it as a SKILL.md, Shah G has extracted his investment discipline from his brain and installed it in a file. Any AI agent — Claude Code, Antigravity, a future Rahnuma instance — can now execute Shah G's investment logic with Shah G's specific style.

**That's the Agent Factory paradigm in action.** Your expertise becomes a portable, executable specification. The tool is replaceable. The skill is yours.

---

*This skill was built collaboratively during a co-learning session on February 23, 2026 — the same day Shah G finished his PIAIC exam. The first skill he ever codified was the one protecting his financial future from his worst days.*

**— Rahnuma AI project, Skill Library**
