# Strategy Math Audit — The Kraken Scalper

## Baseline Parameters (Assumptions)

| Parameter                      | Value                                                  |
| ------------------------------ | ------------------------------------------------------ |
| Pair                           | XXBTZUSD                                               |
| Timeframe                      | 1-minute                                               |
| Entry trigger                  | ≥ 0.4% drop over 2 candles, RSI(14) < 35, volume spike |
| TP (gross)                     | +0.9%                                                  |
| SL (gross)                     | −0.8%                                                  |
| Max hold                       | 5 min                                                  |
| Exits                          | Market only                                            |
| Sizing                         | 30% of balance, max $30 per trade                      |
| Mode                           | Spot only                                              |
| Kraken taker fee               | 0.26% per side                                         |
| **Round-trip fee**             | **0.52%**                                              |
| Starting balance (stress test) | $100                                                   |

All math below uses these assumptions. No backtests—closed-form arithmetic only.

---

## 1. Risk/Reward Reality

**Nominal (before fees):** TP = +0.9%, SL = −0.8% → nominal R:R = 0.9 / 0.8 = **1.125**.

**Fee impact:** 0.26% entry + 0.26% exit = **0.52%** round-trip.

**Net TP and net SL after fees:**

- Net TP = 0.9% − 0.52% = **+0.38%**
- Net SL = 0.8% + 0.52% = **−1.32%**

**True risk/reward ratio (reward per unit risk):**

- Fee-adjusted R:R = 0.38 / 1.32 ≈ **0.29**

So you are risking 1 to make ~0.29—structurally inverted vs the nominal 1.125.

**Break-even win rate**

From expectancy zero: `p × net_tp + (1−p) × net_sl = 0`:

- `p_breakeven = |net_sl| / (|net_sl| + net_tp) = 1.32 / (1.32 + 0.38) = 1.32 / 1.70 ≈ 77.6%`

**Verdict:** You need a win rate **above ~78%** to break even. The real R:R is not 1.125; it is
~0.29 after fees.

---

## 2. Fee Impact on Small Accounts

**Dollar cost per round trip**

| Position size     | Fee (0.52%) |
| ----------------- | ----------- |
| $30 (max)         | $0.156      |
| $15 (30% of $50)  | $0.078      |
| $30 (30% of $100) | $0.156      |

**Minimum gross edge to overcome fees:** Gross TP must be at least **0.52%** for net TP ≥ 0.

**At current TP (0.9% gross):**

- Net win per $30 = 0.38% × 30 = **$0.114**
- Net loss per $30 = 1.32% × 30 = **$0.396**
- Fee as share of a full TP move: 0.52% / 0.9% ≈ **58%** of the gross TP is consumed by fees.

**Takeaway:** On a $30 position you make about **$0.11** on a win and lose **$0.40** on a loss; fee
friction is material at this size.

---

## 3. Entry Condition Logical Integrity

**Internal coherence**

- **0.4% drop in 2 candles** defines a short-term “dip” over 2 minutes.
- **RSI(14) < 35** indicates oversold.
- Both point in the same direction (short-term weakness / mean-reversion setup) → **coherent**.

**Volume spike (volume > 10-candle average)**

- Can align with **reversal** (capitulation) or **continuation** (breakout). Assumption: in the
  context of a dip + oversold RSI, we treat volume spike as **reversal confirmation**
  (capitulation). So it **reinforces** the drop + RSI rather than conflicting.

**Redundancy**

- RSI < 35 and “0.4% drop in 2 candles” are partially overlapping: both reflect recent bearish price
  action. RSI adds a normalized, smoothed view of the same short-term move. Some redundancy; not a
  logical conflict.

**Conclusion:** Entry logic is structurally **coherent**. Drop, RSI, and volume spike all point
toward a mean-reversion long; redundancy between drop and RSI is acceptable. No internal conflict.

---

## 4. Position Sizing Stress Test

**Rule:** `size_usd = min(0.30 × balance, 30)`.

**3-loss streak (full SL each time), from $100**

- Loss is **0.8% of position size** (gross); we use gross for simplicity (fee already in net TP/SL).
- Trade 1: size = min(30, 30) = $30, loss = 30 × 0.008 = $0.24 → balance = $99.76
- Trade 2: size = min(29.93, 30) ≈ $29.93, loss ≈ $0.24 → balance ≈ $99.52
- Trade 3: size ≈ $29.86, loss ≈ $0.24 → balance ≈ $99.28

Cumulative loss ≈ **$0.72** (~**0.72%** of initial capital).

**Worst hour**

- Max 3 trades per hour. If all three lose: ≈ **$0.72** (~0.72% of $100).

**Worst day (qualitative)**

- With “3 trades per hour” and “stop after 3 consecutive losses” + 5-min cooldown, worst case is 3
  losses in the first hour, then cooldown. Assume at most **3 trades in that hour**; further trading
  blocked until cooldown and possibly next hour. So worst-hour loss ≈ **$0.72**; worst-day loss is
  bounded by repeated 3-loss bursts and cooldowns (e.g. on the order of a few percent of capital,
  not a full blow-up).

**Risk gates vs size**

- “3 trades/hour” and “3-loss stop + cooldown” cap how many losing trades can occur in a row and per
  hour. With 30% cap and $30 max, **max drawdown in the worst single hour is ~0.72%** of capital.
  Position sizing and risk gates are **aligned**: no blow-up in a bad hour.

---

## 5. Max-Hold Behavior

**Structure:** 5 minutes on 1-minute candles = 5 bars. This is a **time-based stop** that aligns
with bar count; it is structured rather than arbitrary.

**Expectancy impact (conceptual)**

- If price often reaches TP in **&lt; 5 min**, max-hold **preserves** edge (winners close as
  intended).
- If price often **wanders then hits SL** after 5 min, max-hold **cuts losers** by time instead of
  waiting for full SL—so it can **reduce loss size** in some cases.
- So max-hold can cut both winners (if TP would have been hit after 5 min) and losers (if SL would
  have been hit after 5 min). Net effect is scenario-dependent.

**Conclusion:** Max-hold is **edge-neutral to slightly edge-preserving** under the assumption that
many losing trades would otherwise run past 5 minutes; the cap limits exposure. It is structured (5
bars on 1m) and not arbitrary.

---

## 6. Audit Summary Table

| Metric                             | Value                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Nominal R:R                        | 1.125                                                                            |
| Fee-adjusted R:R                   | ~0.29                                                                            |
| Break-even win rate                | ~77.6%                                                                           |
| Fee per $30 round trip             | $0.16                                                                            |
| Min gross edge to beat fees        | 0.52%                                                                            |
| 3-loss streak drawdown (from $100) | ~0.72% / ~$0.72                                                                  |
| Entry logic                        | Coherent                                                                         |
| Max-hold                           | Edge-neutral / slightly edge-preserving (assumption: many losers run past 5 min) |

**Structural findings**

- After fees, real R:R is ~0.29; break-even requires ~78% win rate.
- At 60% and 70% win rate, expectancy per trade is negative; at 80% it is barely positive (~+0.04%
  per trade).
- Fee friction is material at $30 size (win ≈ $0.11, loss ≈ $0.40 per $30).
- Risk gates and position sizing are aligned; worst-hour drawdown is bounded (~0.72% from $100).

**Verdict:** Strategy math at **0.9% TP / 0.8% SL with market exits** is **structurally
unfavorable**. Execution engine is solid; edge is fee-compressed. Long-term profitability requires
either a very high sustained win rate (&gt; ~78%), or parameter adjustment (e.g. higher TP).

---

## 7. Expectancy Stress (Win-Rate Scenarios)

Using net TP = +0.38% and net SL = −1.32%:

- **60% win rate:** 0.6 × 0.38 − 0.4 × 1.32 = 0.228 − 0.528 = **−0.30%** per trade (negative).
- **70% win rate:** 0.7 × 0.38 − 0.3 × 1.32 = 0.266 − 0.396 = **−0.13%** per trade (negative).
- **80% win rate:** 0.8 × 0.38 − 0.2 × 1.32 = 0.304 − 0.264 = **+0.04%** per trade (barely
  positive).

Sustained 80%+ win rate in live scalping is rare, so the current configuration is **mathematically
fragile**.

---

## 8. Dollar Reality at $30 Position Size

- **Win:** 0.38% of $30 = **$0.114**
- **Loss:** 1.32% of $30 = **$0.396**
- **Three losses in a row:** ≈ −**$1.20**
- To survive 10 trades you need on the order of **8 winners** just to offset 2 full losses; the
  asymmetry is severe.

---

## 9. Levers for Adjustment

**Lever A — Increase TP**

- If TP = **1.6%**: Net TP = 1.6 − 0.52 = **1.08%**.
- Fee-adjusted R:R = 1.08 / 1.32 ≈ **0.82**.
- Break-even win rate = 1.32 / (1.32 + 1.08) ≈ **55%** — much healthier.

**Lever B — Reduce SL**

- If SL = 0.5%: Net SL = 0.5 + 0.52 = 1.02%.
- With TP 0.9%, net TP = 0.38%; R:R ≈ 0.37 — still weak. Fee compression dominates.

**Lever C — Reduce fees (e.g. maker TP)**

- If exit fee ≈ 0.16%, round-trip ≈ 0.42%: Net TP ≈ 0.48%, Net SL ≈ −1.22%. Ratio improves slightly
  but remains poor; fee reduction alone does not fix the structure.

---

## 10. Conclusion and Recommendation

**Conclusion:** Execution engine is solid. Edge math at **0.9% TP / 0.8% SL** with market exits is
**structurally unfavorable**: fee-compressed, break-even ~78%, expectancy negative at realistic win
rates (60–70%).

**Hard truth:** With small capital and taker fees, tiny-TP scalping must either achieve very high
win rate, or increase TP distance, or widen SL, or move to higher timeframe. Current expectancy is
mathematically fragile.

**Recommendation (before live deployment):**

- **Increase TP to at least 1.4%–1.8%** (e.g. 1.6% as in Lever A).
- **Keep SL at 0.8%.**
- **Keep 5 min max-hold.**

That moves break-even into the **~55%** range and improves fee-adjusted R:R to ~0.82, which is in
realistic territory.

---

## 11. Recommended Parameter Set (Adjusted TP)

Recalculation with SL fixed at 0.8% and round-trip fee 0.52%. Net SL = 0.8% + 0.52% = **1.32%** in
all rows.

| Gross TP | Net TP                 | Fee-adjusted R:R       | Break-even win rate              |
| -------- | ---------------------- | ---------------------- | -------------------------------- |
| 1.4%     | 1.4 − 0.52 = **0.88%** | 0.88 / 1.32 ≈ **0.67** | 1.32 / (1.32 + 0.88) ≈ **60.0%** |
| 1.6%     | 1.6 − 0.52 = **1.08%** | 1.08 / 1.32 ≈ **0.82** | 1.32 / (1.32 + 1.08) ≈ **55.0%** |
| 1.8%     | 1.8 − 0.52 = **1.28%** | 1.28 / 1.32 ≈ **0.97** | 1.32 / (1.32 + 1.28) ≈ **50.8%** |

**Recommended for live:** Use **TP = 1.6%** (or 1.4–1.8% band), **SL = 0.8%**, **max hold = 5 min**.
Break-even ~55% and R:R ~0.82 are in realistic territory. Update the bot’s strategy config to use
the chosen TP before deployment.

---

## Next Directions (Optional)

1. **Recalculate with adjusted TP** — Refill summary table and expectancy for TP = 1.4%, 1.6%, 1.8%
   and document the recommended parameter set.
2. **Audit signal probability assumptions** — Formalize assumptions on how often entry conditions
   fire and with what win rate (no curve-fitting; state assumptions only).
3. **Simulate trade sequences** — Run discrete trade sequences with risk gates (3/hour, 3-loss stop,
   cooldown) and document worst-case drawdown paths.
4. **Redesign strategy** — Consider higher timeframe, different TP/SL, or different entry logic;
   document new baseline and re-run this audit.

This document is reference only; no engine code changes. See repo README for run/deploy
instructions.
