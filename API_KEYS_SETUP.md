# 🔑 API Keys Setup Guide

## 📍 Where to Place Your API Keys

Create a file at: **`server/.env`** (in the same folder as `ai-gateway.mjs`)

```bash
# From the project root, run:
touch server/.env
```

Then open `server/.env` and add your API keys:

## 📝 Example `.env` File Content

```bash
# ═══════════════════════════════════════════════════════════════
# OpenAI API (Required for Content Panel & BADU Assistant)
# ═══════════════════════════════════════════════════════════════
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...your_actual_key_here...

# ═══════════════════════════════════════════════════════════════
# Image Generation Providers (Pictures Panel)
# ═══════════════════════════════════════════════════════════════

# FLUX Pro (BFL.ai) - Photorealistic images
# Get from: https://api.bfl.ai/
FLUX_API_KEY=...your_flux_key_here...

# Stability AI (Stable Diffusion 3.5)
# Get from: https://platform.stability.ai/account/keys
STABILITY_API_KEY=...your_stability_key_here...

# Ideogram - Typography in images
# Get from: https://ideogram.ai/api-keys
IDEOGRAM_API_KEY=...your_ideogram_key_here...

# ═══════════════════════════════════════════════════════════════
# Video Generation Provider (Video Panel)
# ═══════════════════════════════════════════════════════════════

# Runway ML (Gen-3 Alpha)
# Get from: https://app.runwayml.com/account
RUNWAY_API_KEY=...your_runway_key_here...
```

## 🔄 After Adding Keys

Restart the gateway server:

```bash
# Stop existing gateway
pkill -f "node server/ai-gateway.mjs"

# Start gateway with new keys
npm run gateway:start

# Or run in background:
npm run gateway:start > gateway.log 2>&1 &
```

## ✅ Verify Keys Are Loaded

Check the health endpoint:

```bash
curl http://localhost:8787/health | jq
```

You should see:
- `hasOpenAI: true`
- `imageProviders.flux: true` (if FLUX key is set)
- `imageProviders.stability: true` (if Stability key is set)
- `imageProviders.ideogram: true` (if Ideogram key is set)
- `videoProviders.runway: true` (if Runway key is set)

## 📂 File Location

```
Marketing Engine/
├── server/
│   ├── ai-gateway.mjs
│   └── .env           ← CREATE THIS FILE HERE
├── src/
├── package.json
└── README.md
```

## 🔒 Security Note

The `.env` file is automatically ignored by git (listed in `.gitignore`), so your API keys will never be committed to the repository.

## 🎯 YOU MENTIONED YOU ALREADY HAVE THE RUNWAY API KEY

If you already have the Runway API key in your codebase, please check if there's an existing `.env` file in the `server/` directory. If so, just add the `RUNWAY_API_KEY=...` line to it!

