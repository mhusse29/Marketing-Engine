# BADU Enhanced V2 - Complete Setup Guide

This guide walks you through setting up the comprehensive BADU AI enhancement with Supabase persistence, pgvector RAG, personalization, and streaming support.

## 🎯 Overview

**BADU Enhanced V2** includes:

✅ **Supabase Data Backbone**
- User profiles with preferences
- Session management
- Message history with structured responses
- Feedback system
- Comprehensive metrics/telemetry

✅ **RAG with pgvector**
- Semantic search using OpenAI embeddings
- 1536-dimensional vector index
- Panel and provider biasing
- Real-time context retrieval

✅ **Personalization Loop**
- User preference tracking
- Soft defaults from usage patterns
- Adaptive model selection
- Context-aware responses

✅ **Streaming & Intelligence**
- SSE streaming support
- Complexity-based model selection
- Retrieval diagnostics
- Comprehensive logging

✅ **Client Enhancements**
- Preference management hook
- Inline feedback component
- Citation support
- Responsive design

---

## 📋 Prerequisites

- Node.js 18+
- Supabase project (local or hosted)
- OpenAI API key
- Service role key from Supabase

---

## 🚀 Setup Steps

### 1. Apply Supabase Migration

Apply the comprehensive BADU schema migration:

```bash
# If using Supabase CLI locally
supabase migration up

# Or apply manually via Supabase dashboard
# Navigate to SQL Editor and run:
# supabase/migrations/20250211_badu_data_backbone.sql
```

**What this creates:**
- `badu_profiles` - User preferences and traits
- `badu_sessions` - Conversation sessions
- `badu_messages` - Message history
- `badu_feedback` - User feedback
- `badu_docs` - Vector-indexed knowledge base
- `badu_metrics` - Telemetry and analytics

**Plus:**
- Row-Level Security (RLS) policies
- Helper functions for RAG and preferences
- Automatic triggers for session updates
- pgvector extension with HNSW index

### 2. Build RAG Index

Populate the `badu_docs` table with vector embeddings:

```bash
node scripts/build-badu-rag.mjs
```

**This script:**
- Extracts chunks from `shared/badu-kb-complete.js`
- Generates embeddings using OpenAI `text-embedding-3-small`
- Upserts to Supabase with pgvector
- Creates ~100+ indexed chunks covering:
  - Content panel (settings, models, platforms)
  - Pictures panel (providers, models, settings)
  - Video panel (providers, models, settings)
  - Troubleshooting and general help

**Expected output:**
```
✅ Upload complete: 120 succeeded, 0 failed
📊 Top 3 results for "How do I generate pictures with Flux?":
1. Flux Provider Overview (similarity: 0.95)
...
```

### 3. Configure Environment Variables

Ensure your `.env` file includes:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Required for RAG and backend

# Gateway
VITE_GATEWAY_URL=http://localhost:3001
```

### 4. Start the Gateway

The AI gateway now includes the enhanced BADU endpoint:

```bash
npm run start:gateway
# or
node server/ai-gateway.mjs
```

**New endpoints available:**
- `POST /v1/chat/enhanced` - Enhanced chat with RAG, persistence, streaming
- `GET /api/v1/badu/preferences` - Fetch user preferences
- `PUT /api/v1/badu/preferences` - Update preferences
- `POST /api/v1/badu/feedback` - Submit feedback

### 5. Run Tests

Validate the entire setup:

```bash
node test-badu-enhanced-v2.mjs
```

**Tests include:**
- ✅ Schema validation
- ✅ RAG docs population
- ✅ Semantic search
- ✅ User profile management
- ✅ Session management
- ✅ Feedback system
- ✅ Metrics logging
- ✅ Integration flow

**Expected result:**
```
📋 TEST SUMMARY
✅ PASS - schema
✅ PASS - rag Docs
✅ PASS - semantic Search
...
Total: 8/8 tests passed
🎉 All tests passed! BADU Enhanced V2 is ready.
```

---

## 🎨 Frontend Integration

### Using the Preferences Hook

```tsx
import { useBaduPreferences } from './hooks/useBaduPreferences'

function MyComponent() {
  const { 
    preferences, 
    preferenceVector, 
    favoritePanels,
    updatePreferences 
  } = useBaduPreferences()
  
  // Show computed favorites
  console.log('Favorite panels:', favoritePanels)
  
  // Update preferences
  const handleUpdate = async () => {
    await updatePreferences({
      content: {
        defaultPersona: 'Warm lead',
        defaultTone: 'Bold'
      }
    })
  }
}
```

### Adding Feedback Component

```tsx
import { BaduFeedback } from './components/AskAI/BaduFeedback'

function ChatMessage({ messageId, content }) {
  return (
    <div>
      <div>{content}</div>
      <BaduFeedback 
        messageId={messageId}
        onFeedbackSubmitted={() => console.log('Thanks!')}
      />
    </div>
  )
}
```

### Calling Enhanced Chat with Streaming

```typescript
const response = await fetch('/v1/chat/enhanced', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'How do I use Flux for image generation?',
    history: [],
    attachments: [],
    stream: true  // Enable streaming
  })
})

// Handle SSE stream
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const text = decoder.decode(value)
  const lines = text.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      
      if (data.type === 'meta') {
        console.log('Retrieval:', data)
      } else if (data.token) {
        // Append token to UI
      } else if (data.done) {
        // Complete
      }
    }
  }
}
```

---

## 📊 Monitoring & Analytics

### View User Preferences

```sql
SELECT 
  u.email,
  p.tier,
  p.favorite_panels,
  p.preferences,
  p.preference_vector
FROM badu_profiles p
JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC;
```

### Session Analytics

```sql
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_sessions,
  AVG(message_count) as avg_messages,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_sessions
FROM badu_sessions
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

### Feedback Analysis

```sql
SELECT 
  rating,
  COUNT(*) as count,
  UNNEST(reason_tags) as tag
FROM badu_feedback
GROUP BY rating, tag
ORDER BY count DESC;
```

### RAG Performance

```sql
SELECT 
  schema_type,
  panel,
  AVG(retrieval_latency_ms) as avg_retrieval_ms,
  AVG(llm_latency_ms) as avg_llm_ms,
  AVG(total_latency_ms) as avg_total_ms,
  AVG(chunks_retrieved) as avg_chunks,
  COUNT(*) as total_requests
FROM badu_metrics
WHERE status = 'success'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY schema_type, panel
ORDER BY total_requests DESC;
```

---

## 🔧 Troubleshooting

### Migration Fails

**Issue:** `extension "vector" does not exist`

**Fix:** Enable pgvector in Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### RAG Index Build Fails

**Issue:** OpenAI API rate limits

**Fix:** Reduce batch size or add delays in `build-badu-rag.mjs`

### No Results from Semantic Search

**Issue:** Empty `badu_docs` table

**Fix:** Run `node scripts/build-badu-rag.mjs` to populate

### Auth Errors on Preferences API

**Issue:** Missing or invalid JWT

**Fix:** Ensure `Authorization: Bearer <token>` header is set with valid Supabase session token

### Slow Retrieval Performance

**Issue:** Missing HNSW index

**Fix:** Verify index exists:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'badu_docs' 
  AND indexname LIKE '%embedding%';
```

---

## 🎯 Next Steps

1. **Monitor Usage**: Watch `badu_metrics` table for performance insights
2. **Tune RAG**: Adjust `top_k`, panel biasing based on accuracy
3. **Train Preferences**: Background job to periodically update `preference_vector`
4. **Expand Knowledge**: Add more chunks to `badu_docs` for new features
5. **A/B Test Models**: Compare GPT-4o vs GPT-5 based on complexity scores
6. **Export Analytics**: Build dashboards from `badu_metrics`

---

## 📚 Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Preferences  │  │   Chat UI    │  │   Feedback   │ │
│  │     Hook     │  │              │  │   Component  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓ HTTPS + JWT
┌─────────────────────────────────────────────────────────┐
│               AI Gateway (Express)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │       /v1/chat/enhanced (badu-enhanced-v2.mjs)   │  │
│  │  • Session management                             │  │
│  │  • Preference fetching                            │  │
│  │  • RAG retrieval (pgvector)                       │  │
│  │  • LLM call (OpenAI)                              │  │
│  │  • Persistence & metrics                          │  │
│  │  • SSE streaming support                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ /api/v1/badu/    │  │ /api/v1/badu/    │           │
│  │   preferences    │  │   feedback       │           │
│  └──────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓ Service Role Key
┌─────────────────────────────────────────────────────────┐
│                  Supabase (Postgres)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   badu_      │  │   badu_      │  │   badu_      │ │
│  │  profiles    │  │  sessions    │  │  messages    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   badu_      │  │   badu_      │  │   badu_      │ │
│  │  feedback    │  │    docs      │  │   metrics    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                    + pgvector (HNSW index)              │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓ Embeddings
┌─────────────────────────────────────────────────────────┐
│                   OpenAI API                             │
│  • text-embedding-3-small (RAG)                         │
│  • gpt-4o / gpt-5 (Chat)                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎉 Success Criteria

Your implementation is complete when:

- ✅ All 8 tests pass in `test-badu-enhanced-v2.mjs`
- ✅ RAG index contains 100+ chunks
- ✅ Semantic search returns relevant results
- ✅ User profiles auto-create on first query
- ✅ Messages persist to database
- ✅ Feedback system captures ratings
- ✅ Metrics logged for every request
- ✅ Streaming works in browser
- ✅ Preferences update dynamically

---

**🚀 You now have a production-grade AI assistant with long-term memory, semantic retrieval, and adaptive intelligence!**

For questions or issues, check:
- Supabase logs (for database errors)
- Gateway console (for API errors)
- Browser console (for client errors)
- `badu_metrics` table (for performance data)
