#!/usr/bin/env node
/**
 * Runway API smoke test
 * 1. Reads RUNWAY_API_KEY from server/.env
 * 2. Prints organization model access
 * 3. Attempts a lightweight text_to_video request for each supported model
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const API_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

if (!RUNWAY_API_KEY) {
  console.error('❌ RUNWAY_API_KEY not found (expected in server/.env)');
  process.exit(1);
}

const TEXT_TO_VIDEO_MODELS = ['gen3a_turbo', 'gen4_turbo', 'gen4_aleph', 'veo3'];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${RUNWAY_API_KEY}`,
      'X-Runway-Version': RUNWAY_VERSION,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = raw;
  }

  return { response, data: parsed, raw };
}

async function getOrganizationModels() {
  const { response, data } = await fetchJson(`${API_BASE}/organization`, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to read organization info (${response.status})`);
  }
  const models = data?.tier?.models ? Object.keys(data.tier.models) : [];
  return { models, info: data };
}

function buildPayload(model) {
  const duration = model === 'veo3' ? 8 : 5;
  return {
    promptText: 'A cinematic marketing hero shot product reveal with dynamic lighting',
    model,
    duration,
    ratio: '1280:720',
    watermark: false,
  };
}

async function testModel(model) {
  const { response, data, raw } = await fetchJson(`${API_BASE}/text_to_video`, {
    method: 'POST',
    body: JSON.stringify(buildPayload(model)),
  });

  const outcome = {
    model,
    status: response.status,
    ok: response.ok,
    error: null,
    taskId: null,
  };

  if (response.ok) {
    outcome.taskId = data?.id || data?.taskId || null;
  } else {
    if (data?.error) {
      outcome.error = data.error;
    } else {
      outcome.error = typeof raw === 'string' ? raw.slice(0, 200) : 'Unknown error';
    }
  }

  return outcome;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('            RUNWAY VIDEO API – ACCESS CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');

  const { models, info } = await getOrganizationModels();
  console.log('📊 Organization credit balance:', info?.creditBalance ?? 'unknown');
  console.log('📦 Models reported by API:', models.join(', ') || 'none');

  const eligibleModels = TEXT_TO_VIDEO_MODELS.filter((model) => models.includes(model));
  if (eligibleModels.length === 0) {
    console.log('\n⚠️  No text-to-video models available for this API key.');
    console.log('   Expected one of:', TEXT_TO_VIDEO_MODELS.join(', '));
    process.exit(0);
  }

  console.log('\n🧪 Attempting text_to_video requests...\n');

  const results = [];
  for (const model of eligibleModels) {
    console.log(`→ ${model}`);
    try {
      const result = await testModel(model);
      results.push(result);
      if (result.ok) {
        console.log(`   ✅ Success (task id: ${result.taskId})\n`);
      } else {
        console.log(`   ❌ ${result.error || 'Request failed'} (status ${result.status})\n`);
      }
    } catch (error) {
      results.push({ model, status: 'error', ok: false, error: error.message, taskId: null });
      console.log(`   ❌ Error: ${error.message}\n`);
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  const successes = results.filter((r) => r.ok);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                           SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  results.forEach((result) => {
    const statusLabel = result.ok ? '✅ OK' : `❌ ${result.status}`;
    console.log(`${statusLabel.padEnd(10)} ${result.model}${result.error ? ` – ${result.error}` : ''}`);
  });

  if (successes.length === 0) {
    console.log('\n⚠️  No models accepted the request.');
    console.log('   This usually means the API key lacks video generation permissions.');
    console.log('   Contact Runway support or double-check your tier configuration.');
  } else {
    console.log(`\n🎉 ${successes.length} model(s) responded successfully!`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
