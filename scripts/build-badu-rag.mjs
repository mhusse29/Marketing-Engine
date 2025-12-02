#!/usr/bin/env node
/**
 * BADU RAG INDEX BUILDER
 * Converts shared/badu-kb-complete.js into vector-indexed chunks in Supabase
 * Uses OpenAI text-embedding-3-small for semantic search
 */

import 'dotenv/config'
import { config } from 'dotenv'
import { resolve } from 'path'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { COMPLETE_KNOWLEDGE_BASE } from '../shared/badu-kb-complete.js'

// Load server-specific .env file to get OPENAI_API_KEY
config({ path: resolve(process.cwd(), 'server/.env') })

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role for bypassing RLS
)

/**
 * Generate embedding for a text chunk
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('❌ Embedding generation failed:', error.message)
    throw error
  }
}

/**
 * Process knowledge base into atomic chunks
 */
function extractChunks() {
  const chunks = []
  const kb = COMPLETE_KNOWLEDGE_BASE

  // 1. CONTENT PANEL CHUNKS
  if (kb.content) {
    // Overview chunk
    chunks.push({
      chunk_id: 'content_overview',
      panel: 'content',
      provider: null,
      section: 'overview',
      title: kb.content.title,
      markdown: `# ${kb.content.title}\n\n${kb.content.description}\n\n**Purpose:** ${kb.content.purpose}\n\n**Steps:**\n${kb.content.steps.map(s => `- ${s}`).join('\n')}`,
      metadata: { minimumBriefLength: kb.content.minimumBriefLength }
    })

    // Settings chunks (one per setting)
    if (kb.content.settings) {
      Object.entries(kb.content.settings).forEach(([key, setting]) => {
        chunks.push({
          chunk_id: `content_setting_${key}`,
          panel: 'content',
          provider: null,
          section: 'settings',
          title: `Content Setting: ${setting.label}`,
          markdown: `## ${setting.label}\n\n${setting.description || ''}\n\n${
            setting.options ? `**Options:** ${setting.options.join(', ')}\n\n` : ''
          }${
            setting.hints ? `**Hints:**\n${Object.entries(setting.hints).map(([opt, hint]) => `- **${opt}:** ${hint}`).join('\n')}` : ''
          }${
            setting.features ? `\n\n**Features:**\n${setting.features.map(f => `- ${f}`).join('\n')}` : ''
          }`,
          metadata: { 
            type: setting.type,
            default: setting.default,
            minLength: setting.minLength,
            options: setting.options || []
          }
        })
      })
    }

    // Models chunk
    if (kb.content.models) {
      Object.entries(kb.content.models).forEach(([modelName, modelInfo]) => {
        chunks.push({
          chunk_id: `content_model_${modelName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          panel: 'content',
          provider: 'openai',
          section: 'models',
          title: `Content Model: ${modelName}`,
          markdown: `## ${modelName}\n\n${modelInfo.description}\n\n**Best for:** ${modelInfo.bestFor}\n\n**Features:**\n${modelInfo.features.map(f => `- ${f}`).join('\n')}\n\n**When to use:** ${modelInfo.whenToUse}`,
          metadata: { tier: modelInfo.tier, maxTokens: modelInfo.maxTokens }
        })
      })
    }
  }

  // 2. PICTURES PANEL CHUNKS
  if (kb.pictures) {
    // Overview
    const stepsText = kb.pictures.steps ? `\n\n**Steps:**\n${kb.pictures.steps.map(s => `- ${s}`).join('\n')}` : ''
    chunks.push({
      chunk_id: 'pictures_overview',
      panel: 'pictures',
      provider: null,
      section: 'overview',
      title: kb.pictures.title,
      markdown: `# ${kb.pictures.title}\n\n${kb.pictures.description}\n\n**Purpose:** ${kb.pictures.purpose}${stepsText}`,
      metadata: { minimumPromptLength: kb.pictures.minimumPromptLength }
    })

    // Provider chunks
    if (kb.pictures.providers) {
      Object.entries(kb.pictures.providers).forEach(([providerKey, provider]) => {
        chunks.push({
          chunk_id: `pictures_provider_${providerKey}`,
          panel: 'pictures',
          provider: providerKey,
          section: 'providers',
          title: `Pictures Provider: ${provider.name}`,
          markdown: `## ${provider.name}\n\n${provider.description}\n\n**Best for:** ${provider.bestFor}\n\n**Strengths:**\n${provider.strengths.map(s => `- ${s}`).join('\n')}\n\n**Available models:**\n${Object.keys(provider.models || {}).join(', ')}`,
          metadata: { 
            tier: provider.tier,
            costPerImage: provider.costPerImage,
            speed: provider.speed
          }
        })

        // Model chunks for each provider
        if (provider.models) {
          Object.entries(provider.models).forEach(([modelKey, model]) => {
            chunks.push({
              chunk_id: `pictures_${providerKey}_model_${modelKey}`,
              panel: 'pictures',
              provider: providerKey,
              section: 'models',
              title: `${provider.name} Model: ${model.name}`,
              markdown: `### ${model.name}\n\n${model.description}\n\n**Best for:** ${model.bestFor}\n\n**Features:**\n${model.features?.map(f => `- ${f}`).join('\n') || 'N/A'}`,
              metadata: {
                tier: model.tier,
                aspectRatios: model.aspectRatios || [],
                maxDimensions: model.maxDimensions
              }
            })
          })
        }
      })
    }

    // Settings chunks
    if (kb.pictures.settings) {
      Object.entries(kb.pictures.settings).forEach(([key, setting]) => {
        chunks.push({
          chunk_id: `pictures_setting_${key}`,
          panel: 'pictures',
          provider: null,
          section: 'settings',
          title: `Pictures Setting: ${setting.label}`,
          markdown: `## ${setting.label}\n\n${setting.description || ''}\n\n${
            setting.options ? `**Options:** ${setting.options.join(', ')}\n\n` : ''
          }${
            setting.hints ? `**Hints:**\n${Object.entries(setting.hints).map(([opt, hint]) => `- **${opt}:** ${hint}`).join('\n')}` : ''
          }`,
          metadata: {
            type: setting.type,
            default: setting.default,
            options: setting.options || []
          }
        })
      })
    }
  }

  // 3. VIDEO PANEL CHUNKS
  if (kb.video) {
    // Overview
    const stepsText = kb.video.steps ? `\n\n**Steps:**\n${kb.video.steps.map(s => `- ${s}`).join('\n')}` : ''
    chunks.push({
      chunk_id: 'video_overview',
      panel: 'video',
      provider: null,
      section: 'overview',
      title: kb.video.title,
      markdown: `# ${kb.video.title}\n\n${kb.video.description}\n\n**Purpose:** ${kb.video.purpose}${stepsText}`,
      metadata: { minimumPromptLength: kb.video.minimumPromptLength }
    })

    // Provider chunks
    if (kb.video.providers) {
      Object.entries(kb.video.providers).forEach(([providerKey, provider]) => {
        chunks.push({
          chunk_id: `video_provider_${providerKey}`,
          panel: 'video',
          provider: providerKey,
          section: 'providers',
          title: `Video Provider: ${provider.name}`,
          markdown: `## ${provider.name}\n\n${provider.description}\n\n**Best for:** ${provider.bestFor}\n\n**Strengths:**\n${provider.strengths.map(s => `- ${s}`).join('\n')}\n\n**Available models:**\n${Object.keys(provider.models || {}).join(', ')}`,
          metadata: {
            tier: provider.tier,
            costPerSecond: provider.costPerSecond,
            speed: provider.speed
          }
        })

        // Model chunks
        if (provider.models) {
          Object.entries(provider.models).forEach(([modelKey, model]) => {
            chunks.push({
              chunk_id: `video_${providerKey}_model_${modelKey}`,
              panel: 'video',
              provider: providerKey,
              section: 'models',
              title: `${provider.name} Model: ${model.name}`,
              markdown: `### ${model.name}\n\n${model.description}\n\n**Best for:** ${model.bestFor}\n\n**Features:**\n${model.features?.map(f => `- ${f}`).join('\n') || 'N/A'}`,
              metadata: {
                tier: model.tier,
                maxDuration: model.maxDuration,
                aspectRatios: model.aspectRatios || []
              }
            })
          })
        }
      })
    }

    // Settings chunks
    if (kb.video.settings) {
      Object.entries(kb.video.settings).forEach(([key, setting]) => {
        chunks.push({
          chunk_id: `video_setting_${key}`,
          panel: 'video',
          provider: null,
          section: 'settings',
          title: `Video Setting: ${setting.label}`,
          markdown: `## ${setting.label}\n\n${setting.description || ''}\n\n${
            setting.options ? `**Options:** ${setting.options.join(', ')}\n\n` : ''
          }${
            setting.hints ? `**Hints:**\n${Object.entries(setting.hints).map(([opt, hint]) => `- **${opt}:** ${hint}`).join('\n')}` : ''
          }`,
          metadata: {
            type: setting.type,
            default: setting.default,
            min: setting.min,
            max: setting.max,
            options: setting.options || []
          }
        })
      })
    }
  }

  // 4. GENERAL CHUNKS (FAQ, troubleshooting, etc.)
  if (kb.troubleshooting) {
    Object.entries(kb.troubleshooting).forEach(([key, issue]) => {
      chunks.push({
        chunk_id: `troubleshooting_${key}`,
        panel: 'general',
        provider: null,
        section: 'troubleshooting',
        title: `Troubleshooting: ${issue.problem}`,
        markdown: `## ${issue.problem}\n\n**Cause:** ${issue.cause}\n\n**Solution:**\n${issue.solution.map(s => `- ${s}`).join('\n')}`,
        metadata: { category: issue.category }
      })
    })
  }

  return chunks
}

/**
 * Upload chunks to Supabase with embeddings
 */
async function uploadChunks(chunks) {
  console.log(`\n📦 Processing ${chunks.length} chunks...`)
  
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    
    try {
      // Generate embedding
      const textForEmbedding = `${chunk.title}\n\n${chunk.markdown}`
      const embedding = await generateEmbedding(textForEmbedding)
      
      // Upsert to Supabase
      const { error } = await supabase
        .from('badu_docs')
        .upsert({
          chunk_id: chunk.chunk_id,
          panel: chunk.panel,
          provider: chunk.provider,
          section: chunk.section,
          title: chunk.title,
          markdown: chunk.markdown,
          metadata: chunk.metadata,
          embedding,
          version: 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'chunk_id'
        })

      if (error) throw error
      
      successCount++
      process.stdout.write(`\r✓ Uploaded ${successCount}/${chunks.length} chunks`)
    } catch (error) {
      errorCount++
      console.error(`\n❌ Failed to upload chunk ${chunk.chunk_id}:`, error.message)
    }
    
    // Rate limiting: small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\n\n✅ Upload complete: ${successCount} succeeded, ${errorCount} failed`)
}

/**
 * Test vector search
 */
async function testSearch() {
  console.log('\n🔍 Testing vector search...')
  
  const testQuery = "How do I generate pictures with Flux?"
  const embedding = await generateEmbedding(testQuery)
  
  const { data, error } = await supabase.rpc('match_badu_docs', {
    query_embedding: embedding,
    top_k: 3
  })
  
  if (error) {
    console.error('❌ Search test failed:', error)
    return
  }
  
  console.log(`\n📊 Top 3 results for "${testQuery}":\n`)
  data.forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.title} (similarity: ${result.similarity})`)
    console.log(`   Panel: ${result.panel} | Provider: ${result.provider || 'N/A'}`)
    console.log(`   Chunk ID: ${result.chunk_id}\n`)
  })
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 BADU RAG Index Builder\n')
  console.log('====================================')
  
  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment')
    process.exit(1)
  }
  
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase credentials not found in environment')
    process.exit(1)
  }
  
  console.log('✓ Environment validated')
  console.log('✓ OpenAI API key found')
  console.log('✓ Supabase credentials found\n')
  
  // Extract chunks
  console.log('📚 Extracting knowledge base chunks...')
  const chunks = extractChunks()
  console.log(`✓ Extracted ${chunks.length} chunks`)
  
  // Show breakdown
  const breakdown = chunks.reduce((acc, chunk) => {
    acc[chunk.panel] = (acc[chunk.panel] || 0) + 1
    return acc
  }, {})
  console.log('\n📊 Chunk breakdown:')
  Object.entries(breakdown).forEach(([panel, count]) => {
    console.log(`   ${panel}: ${count} chunks`)
  })
  
  // Upload
  await uploadChunks(chunks)
  
  // Test
  await testSearch()
  
  console.log('\n✅ RAG index build complete!')
  console.log('\nNext steps:')
  console.log('1. Restart the AI gateway')
  console.log('2. Test BADU with semantic queries')
  console.log('3. Monitor retrieval accuracy in logs')
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
