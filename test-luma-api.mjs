#!/usr/bin/env node
/**
 * Luma Dream Machine API smoke test
 * ---------------------------------
 * - Reads LUMA_API_KEY from server/.env
 * - Fetches credit information to confirm authentication
 * - Attempts to start a lightweight video generation for each supported model alias
 *   (stops after the first successful alias per model family)
 *
 * NOTE: Successful requests will enqueue real generations and may consume credits.
 *       Cancel the jobs in the Luma console if you only needed to verify access.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const API_BASE = 'https://api.lumalabs.ai/dream-machine/v1';

if (!LUMA_API_KEY) {
  console.error('❌ LUMA_API_KEY missing. Add it to server/.env and rerun.');
  process.exit(1);
}

const MODEL_FAMILIES = [
  { label: 'Ray 1.6', aliases: ['ray-1-6', 'ray-v1'] },
  { label: 'Ray 2', aliases: ['ray-2', 'ray-v2'] },
  { label: 'Ray Flash 2', aliases: ['ray-flash-2', 'ray-v2-flash'] },
  { label: 'Ray 3', aliases: ['ray-3', 'ray-v3'] },
  { label: 'Ray Flash 3', aliases: ['ray-flash-3', 'ray-v3-flash'] },
  { label: 'Ray HDR 3', aliases: ['ray-hdr-3', 'ray-v3-reasoning', 'ray-v3-hdr'] },
];

const DEFAULT_PROMPT = 'Short cinematic marketing teaser of a futuristic product spinning on a pedestal, moody studio lighting';

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${LUMA_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  return { response, data, raw };
}

async function checkCredits() {
  const { response, data, raw } = await fetchJson(`${API_BASE}/credits`, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Credits endpoint failed (${response.status}) - ${JSON.stringify(data ?? raw)}`);
  }
  return data;
}

function buildVideoPayload(modelAlias) {
  return {
    request_type: 'text_to_video',
    prompt: DEFAULT_PROMPT,
    aspect_ratio: '16:9',
    enhance: true,
    loop: false,
    model_settings: {
      media_type: 'video',
      model_name: modelAlias,
      resolution: '720p',
      duration: '5s',
      dynamic_range: 'standard',
      batch_size: 1,
    },
  };
}

async function tryModelAlias(modelAlias) {
  const payload = buildVideoPayload(modelAlias);
  const { response, data, raw } = await fetchJson(`${API_BASE}/generations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const outcome = {
    aliasTried: modelAlias,
    status: response.status,
    ok: response.ok,
    id: data?.id ?? data?.generation_id ?? null,
    error: null,
  };

  if (!response.ok) {
    const message = data?.detail || data?.error || data?.message;
    if (Array.isArray(data?.detail)) {
      // FastAPI validation errors come back as array of {msg, loc}
      outcome.error = data.detail.map((item) => item.msg || JSON.stringify(item)).join('; ');
    } else if (typeof message === 'string') {
      outcome.error = message;
    } else if (typeof raw === 'string') {
      outcome.error = raw.slice(0, 200);
    } else {
      outcome.error = 'Unknown error';
    }
  }

  return outcome;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('            LUMA DREAM MACHINE API – ACCESS CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const credits = await checkCredits();
    console.log('💳 Credits endpoint OK');
    if (credits && typeof credits === 'object') {
      if (credits.remaining_credits !== undefined) {
        console.log('   Remaining credits:', credits.remaining_credits);
      }
      if (credits.plan_tier || credits.account_type) {
        console.log('   Plan tier:', credits.plan_tier ?? credits.account_type);
      }
    }
  } catch (error) {
    console.error('\n❌ Failed to read credits:', error.message);
    process.exit(1);
  }

  console.log('\n⚠️  Running the model checks below will enqueue generations (one per accessible model).');
  console.log('    Cancel them in https://lumalabs.ai/dream-machine/api/usage if you only needed a smoke test.\n');

  const summary = [];

  for (const family of MODEL_FAMILIES) {
    console.log(`→ Testing ${family.label}`);
    let familyResult = null;

    for (const alias of family.aliases) {
      const attempt = await tryModelAlias(alias);
      summary.push({ family: family.label, alias, ...attempt });

      if (attempt.ok) {
        console.log(`   ✅ accepted alias "${alias}" (generation id: ${attempt.id ?? 'pending'})`);
        familyResult = 'success';
        break;
      }

      // Continue trying other aliases only if it was a validation error (400/422)
      if (attempt.status === 400 || attempt.status === 422) {
        console.log(`   ⚠️  alias "${alias}" rejected (${attempt.error || 'validation error'})`);
        continue;
      }

      if (attempt.status === 403) {
        console.log(`   ❌ access forbidden (${attempt.error || 'forbidden'})`);
        familyResult = 'forbidden';
        break;
      }

      console.log(`   ❌ request failed (status ${attempt.status}: ${attempt.error || 'unknown error'})`);
      familyResult = 'error';
      break;
    }

    if (!familyResult) {
      console.log('   ❌ no aliases accepted (likely unsupported on this tier)');
    }

    console.log('');
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                           SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  for (const entry of summary) {
    const statusLabel = entry.ok
      ? '✅ OK'
      : entry.status === 403
        ? '🚫 403'
        : entry.status === 422
          ? '⚠️ 422'
          : `❌ ${entry.status}`;
    console.log(`${statusLabel.padEnd(10)} ${entry.family.padEnd(15)} alias=${entry.alias}${entry.error ? ` – ${entry.error}` : ''}`);
  }

  console.log('\nDone.');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
