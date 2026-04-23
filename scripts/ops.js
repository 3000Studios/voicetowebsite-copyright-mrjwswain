#!/usr/bin/env node
/**
 * ops.js
 *
 * A tiny “ops command” CLI for this repo.
 * Free-first: scaffolds integration wiring WITHOUT storing secrets.
 *
 * Examples:
 *   npm run ops -- env:init
 *   npm run ops -- stripe:payment-link --offer operator-os --url https://buy.stripe.com/...
 *   npm run ops -- paypal:payment-link --offer operator-os --url https://www.paypal.com/ncp/payment/...
 *   npm run ops -- adsense:set-publisher --publisher ca-pub-1234567890
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const [key, inlineValue] = token.slice(2).split('=', 2);
    const value = inlineValue ?? argv[i + 1];
    if (inlineValue == null) i++;
    args[key] = value;
  }
  return args;
}

function requireArg(args, key) {
  const v = args[key];
  if (!v) throw new Error(`Missing required --${key}`);
  return String(v);
}

function slugToEnvSuffix(slug) {
  return String(slug)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function upsertEnvLine(envPath, key, value) {
  const line = `${key}=${value}`;
  const exists = await fileExists(envPath);
  const content = exists ? await fs.readFile(envPath, 'utf8') : '';

  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (idx >= 0) lines[idx] = line;
  else lines.push(line);

  await fs.writeFile(envPath, lines.join('\n') + '\n', 'utf8');
}

async function ensureEnvFromExample() {
  const envPath = path.join(ROOT, '.env');
  if (await fileExists(envPath)) return envPath;

  const example = path.join(ROOT, '.env.example');
  if (!(await fileExists(example))) throw new Error('Missing .env.example');
  await fs.copyFile(example, envPath);
  return envPath;
}

async function envInit() {
  const envPath = await ensureEnvFromExample();
  // Set “free-first” defaults (still safe placeholders)
  await upsertEnvLine(envPath, 'PUBLIC_ASSISTANT_PROVIDER', 'ollama');
  await upsertEnvLine(envPath, 'OLLAMA_API_URL', 'http://127.0.0.1:11434');
  await upsertEnvLine(envPath, 'OLLAMA_MODEL', 'qwen2.5-coder:7b');
  return envPath;
}

async function stripePaymentLink(args) {
  const offer = requireArg(args, 'offer');
  const url = requireArg(args, 'url');

  if (!/^https:\/\/buy\.stripe\.com\//i.test(url)) {
    throw new Error('Stripe payment link must start with https://buy.stripe.com/');
  }

  const envPath = await ensureEnvFromExample();
  const suffix = slugToEnvSuffix(offer);
  await upsertEnvLine(envPath, `STRIPE_PAYMENT_LINK_${suffix}`, url);
  return { envPath, key: `STRIPE_PAYMENT_LINK_${suffix}` };
}

async function paypalPaymentLink(args) {
  const offer = requireArg(args, 'offer');
  const url = requireArg(args, 'url');

  if (!/^https:\/\/www\.paypal\.com\/ncp\/payment\//i.test(url)) {
    throw new Error('PayPal payment link must look like https://www.paypal.com/ncp/payment/...');
  }

  const envPath = await ensureEnvFromExample();
  const suffix = slugToEnvSuffix(offer);
  await upsertEnvLine(envPath, `PAYPAL_PAYMENT_LINK_${suffix}`, url);
  return { envPath, key: `PAYPAL_PAYMENT_LINK_${suffix}` };
}

async function adsenseSetPublisher(args) {
  const publisher = requireArg(args, 'publisher');
  if (!/^ca-pub-\d+$/i.test(publisher)) {
    throw new Error('Publisher must look like ca-pub-1234567890');
  }

  const envPath = await ensureEnvFromExample();
  await upsertEnvLine(envPath, 'VITE_ADSENSE_PUBLISHER', publisher);
  await upsertEnvLine(envPath, 'VITE_ENABLE_ADS', 'true');
  return { envPath, key: 'VITE_ADSENSE_PUBLISHER' };
}

function printHelp() {
  console.log(`\
voicetowebsite ops

Commands:
  env:init
  stripe:payment-link --offer <slug> --url <https://buy.stripe.com/...>
  paypal:payment-link --offer <slug> --url <https://www.paypal.com/ncp/payment/...>
  adsense:set-publisher --publisher <ca-pub-...>
`);
}

async function main() {
  const raw = process.argv.slice(2);
  const cmd = raw[0];
  const args = parseArgs(raw.slice(1));

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printHelp();
    return;
  }

  let result;
  switch (cmd) {
    case 'env:init':
      result = await envInit();
      console.log(JSON.stringify({ ok: true, envPath: result }, null, 2));
      return;
    case 'stripe:payment-link':
      result = await stripePaymentLink(args);
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
      return;
    case 'paypal:payment-link':
      result = await paypalPaymentLink(args);
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
      return;
    case 'adsense:set-publisher':
      result = await adsenseSetPublisher(args);
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
      return;
    default:
      throw new Error(`Unknown command: ${cmd}`);
  }
}

main().catch((err) => {
  console.error(String(err?.stack ?? err?.message ?? err));
  process.exit(1);
});
