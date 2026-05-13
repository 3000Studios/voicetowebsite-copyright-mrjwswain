# The Kraken — BTC/USD Spot Scalper

Production-ready Kraken REST scalper (spot only, no leverage). Runs on Railway or locally.

**See [STRATEGY_MATH_AUDIT.md](./STRATEGY_MATH_AUDIT.md) for edge and fee validation, break-even win
rate, and parameter recommendations before live deployment.**

## Where do KRAKEN_API_KEY and KRAKEN_API_SECRET go?

| Place                          | Use                                                                                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Railway**                    | Project → Variables: add `KRAKEN_API_KEY` and `KRAKEN_API_SECRET`. The bot runs here in production.                                                                                 |
| **Local**                      | Copy `.env.example` to `.env` and paste the keys. Never commit `.env`.                                                                                                              |
| **Cloudflare Workers / Pages** | Do **not** put Kraken keys in the site or Worker. The scalper is a separate Python process on Railway; the site’s admin page (“The Kraken”) only links to Railway and shows status. |

## Quick start

- Copy `.env.example` to `.env` and set `KRAKEN_API_KEY` and `KRAKEN_API_SECRET`.
- Run: `python main.py` (after `pip install -r requirements.txt`).
- Deploy to Railway: connect repo (or this folder), set env vars, deploy with
  `worker: python main.py` in Procfile.

## Project layout

- `main.py` — Entry point, 60s cycle, risk gates, graceful shutdown.
- `kraken_client.py` — REST client, signature generation, QueryOrders / TradesHistory.
- `strategy.py` — Entry/exit signal logic (no order placement).
- `STRATEGY_MATH_AUDIT.md` — Structural math audit (R:R, fees, break-even, stress test).
