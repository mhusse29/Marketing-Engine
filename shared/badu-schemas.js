/**
 * JSON Schemas for Badu Structured Responses
 * All responses must conform to these schemas for validation
 */

export const RESPONSE_SCHEMAS = {
  // Default help answer schema
  help: {
    type: 'object',
    required: ['title', 'brief', 'bullets'],
    properties: {
      title: {
        type: 'string',
        maxLength: 120,
        description: 'Concise title summarizing the answer',
      },
      brief: {
        type: 'string',
        maxLength: 500,
        description: 'Brief overview of the answer',
      },
      bullets: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 15,
        description: 'Key points as bullet list - include ALL relevant settings and parameters',
      },
      next_steps: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 5,
        description: 'ONLY include if user needs to take action in the app. Omit for informational queries.',
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Documentation sources used',
      },
    },
    additionalProperties: false,
  },

  // Panel comparison schema
  comparison: {
    type: 'object',
    required: ['title', 'brief', 'comparisons', 'recommendation'],
    properties: {
      title: {
        type: 'string',
        maxLength: 120,
      },
      brief: {
        type: 'string',
        maxLength: 500,
      },
      comparisons: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'pros', 'cons', 'best_for'],
          properties: {
            name: { type: 'string' },
            pros: { type: 'array', items: { type: 'string' } },
            cons: { type: 'array', items: { type: 'string' } },
            best_for: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      recommendation: {
        type: 'string',
        description: 'Which option to choose and why',
      },
      callout: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['tip', 'warning', 'info', 'success'] },
          message: { type: 'string' },
        },
        description: 'Optional callout box with important info',
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },

  // Comparison table schema (for side-by-side feature comparison)
  comparison_table: {
    type: 'object',
    required: ['title', 'brief', 'table', 'recommendation'],
    properties: {
      title: {
        type: 'string',
        maxLength: 120,
      },
      brief: {
        type: 'string',
        maxLength: 500,
      },
      table: {
        type: 'object',
        required: ['headers', 'rows'],
        properties: {
          headers: {
            type: 'array',
            items: { type: 'string' },
            description: 'Column headers (e.g., Feature, Provider A, Provider B)',
          },
          rows: {
            type: 'array',
            items: {
              type: 'object',
              required: ['feature', 'values'],
              properties: {
                feature: { type: 'string', description: 'Feature name (e.g., Duration, Quality)' },
                values: { type: 'array', items: { type: 'string' }, description: 'Values for each column' },
              },
            },
          },
        },
      },
      recommendation: {
        type: 'string',
        description: 'Which option to choose and why',
      },
      callout: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['tip', 'warning', 'info', 'success'] },
          message: { type: 'string' },
        },
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },

  // Categorized settings schema (organized settings with icons/categories)
  categorized_settings: {
    type: 'object',
    required: ['title', 'brief', 'categories'],
    properties: {
      title: {
        type: 'string',
        maxLength: 120,
      },
      brief: {
        type: 'string',
        maxLength: 500,
      },
      categories: {
        type: 'array',
        items: {
          type: 'object',
          required: ['category_name', 'icon', 'settings'],
          properties: {
            category_name: { type: 'string', description: 'Category name (e.g., Basic, Camera, Visual)' },
            icon: { type: 'string', description: 'Emoji or icon for category (e.g., 🎬, 📷, 🎨)' },
            count: { type: 'number', description: 'Number of settings in category' },
            settings: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'options'],
                properties: {
                  name: { type: 'string' },
                  options: { type: 'string', description: 'Options as text (e.g., "5s, 9s")' },
                  tip: { type: 'string', description: 'Optional tip or recommendation' },
                },
              },
            },
          },
        },
      },
      callout: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['tip', 'warning', 'info', 'success'] },
          message: { type: 'string' },
        },
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },

  // Decision tree schema (for "which should I choose" queries)
  decision_tree: {
    type: 'object',
    required: ['title', 'brief', 'decision_question', 'branches'],
    properties: {
      title: {
        type: 'string',
        maxLength: 120,
      },
      brief: {
        type: 'string',
        maxLength: 500,
      },
      decision_question: {
        type: 'string',
        description: 'Main question user is trying to answer',
      },
      branches: {
        type: 'array',
        items: {
          type: 'object',
          required: ['condition', 'recommendation', 'reason'],
          properties: {
            condition: { type: 'string', description: 'If/When condition (e.g., "Need cinema-quality")' },
            recommendation: { type: 'string', description: 'What to choose (e.g., "Runway Veo-3")' },
            reason: { type: 'string', description: 'Why this choice' },
            icon: { type: 'string', description: 'Optional emoji' },
          },
        },
      },
      callout: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['tip', 'warning', 'info', 'success'] },
          message: { type: 'string' },
        },
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },

  // Step-by-step workflow schema
  workflow: {
    type: 'object',
    required: ['title', 'brief', 'steps', 'tips'],
    properties: {
      title: {
        type: 'string',
        maxLength: 120,
      },
      brief: {
        type: 'string',
        maxLength: 500,
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          required: ['step_number', 'panel', 'action', 'description'],
          properties: {
            step_number: { type: 'number' },
            panel: { type: 'string', enum: ['content', 'pictures', 'video', 'all'] },
            action: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      tips: {
        type: 'array',
        items: { type: 'string' },
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },

  // Settings guide schema
  settings_guide: {
    type: 'object',
    required: ['title', 'brief', 'panel'],
    properties: {
      title: {
        type: 'string',
        maxLength: 120,
      },
      brief: {
        type: 'string',
        maxLength: 500,
      },
      panel: {
        type: 'string',
        enum: ['content', 'pictures', 'video'],
      },
      settings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'value', 'explanation'],
          properties: {
            name: { type: 'string' },
            value: { type: 'string' },
            explanation: { type: 'string' },
          },
        },
        description: 'Settings array (old format for backward compatibility)',
      },
      basic_settings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'value'],
          properties: {
            name: { type: 'string' },
            value: { type: 'string' },
            explanation: { type: 'string' },
          },
        },
        description: 'Provider-specific settings (Model, CFG, Steps, Style Preset, etc.)',
      },
      advanced_settings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'value'],
          properties: {
            name: { type: 'string' },
            value: { type: 'string' },
            explanation: { type: 'string' },
          },
        },
        description: 'Advanced section settings (Brand Colors, Backdrop, Lighting, Quality, Avoid)',
      },
      best_practices: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tips and recommendations',
      },
      next_steps: {
        type: 'array',
        items: { type: 'string' },
        description: 'Only if user needs to configure in app. Omit for informational queries.',
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },

  // Troubleshooting schema
  troubleshooting: {
    type: 'object',
    required: ['title', 'problem', 'causes', 'solutions'],
    properties: {
      title: {
        type: 'string',
        maxLength: 120,
      },
      problem: {
        type: 'string',
        maxLength: 300,
      },
      causes: {
        type: 'array',
        items: { type: 'string' },
      },
      solutions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['solution', 'steps'],
          properties: {
            solution: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },

  // Error response schema
  error: {
    type: 'object',
    required: ['title', 'message', 'type'],
    properties: {
      title: {
        type: 'string',
        maxLength: 100,
      },
      message: {
        type: 'string',
        maxLength: 500,
      },
      type: {
        type: 'string',
        enum: ['not_found', 'out_of_scope', 'validation_error', 'unknown'],
      },
      next_steps: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },
};

/**
 * Validate response against schema
 */
export function validateResponse(response, schemaName = 'help') {
  const schema = RESPONSE_SCHEMAS[schemaName];
  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown schema: ${schemaName}`],
    };
  }

  const errors = [];
  
  // Check required fields
  if (schema.required) {
    schema.required.forEach(field => {
      if (!(field in response)) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  }

  // Check field types and constraints
  Object.entries(schema.properties).forEach(([field, spec]) => {
    if (field in response) {
      const value = response[field];
      
      // Type check
      if (spec.type === 'string' && typeof value !== 'string') {
        errors.push(`Field '${field}' must be a string`);
      } else if (spec.type === 'array' && !Array.isArray(value)) {
        errors.push(`Field '${field}' must be an array`);
      } else if (spec.type === 'object' && typeof value !== 'object') {
        errors.push(`Field '${field}' must be an object`);
      }
      
      // String length checks
      if (spec.type === 'string' && typeof value === 'string') {
        if (spec.maxLength && value.length > spec.maxLength) {
          errors.push(`Field '${field}' exceeds maximum length of ${spec.maxLength}`);
        }
        if (spec.minLength && value.length < spec.minLength) {
          errors.push(`Field '${field}' is below minimum length of ${spec.minLength}`);
        }
      }
      
      // Array checks
      if (spec.type === 'array' && Array.isArray(value)) {
        if (spec.minItems && value.length < spec.minItems) {
          errors.push(`Field '${field}' must have at least ${spec.minItems} items`);
        }
        if (spec.maxItems && value.length > spec.maxItems) {
          errors.push(`Field '${field}' cannot have more than ${spec.maxItems} items`);
        }
      }
      
      // Enum checks
      if (spec.enum && !spec.enum.includes(value)) {
        errors.push(`Field '${field}' must be one of: ${spec.enum.join(', ')}`);
      }
    }
  });

  // Check for additional properties if not allowed
  if (schema.additionalProperties === false) {
    Object.keys(response).forEach(key => {
      if (!(key in schema.properties)) {
        errors.push(`Unexpected field: ${key}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Determine appropriate schema based on query type
 * @param {string} query - User's query text
 * @param {boolean} hasImages - Whether images are attached
 */
export function detectSchemaType(query, hasImages = false) {
  const queryLower = query.toLowerCase();
  
  // 🔥 SMART DETECTION: When images are attached, prioritize prompt-generation schemas
  if (hasImages) {
    // User wants a prompt from the image → Use settings_guide (has copyable prompts)
    if (queryLower.match(/\b(give me|create|write|generate|make|provide).*(prompt|description)/i) ||
        queryLower.match(/\bprompt.*(for|to|from|mock|recreate|replicate)/i) ||
        queryLower.match(/\b(mock|recreate|replicate|copy).*(look|style|image)/i)) {
      return 'settings_guide'; // Has copyable settings/prompts
    }
    
    // User wants model recommendation + prompt → Use settings_guide (comprehensive)
    if ((queryLower.match(/\b(which|what).*(model|provider)/i) || 
         queryLower.match(/\b(suggest|recommend).*(model|provider)/i)) &&
        queryLower.match(/\b(prompt|give|create|make)/i)) {
      return 'settings_guide'; // Can include model + prompt + settings
    }
    
    // Only model recommendation without prompt request → decision_tree is ok
    if ((queryLower.match(/\b(which|what).*(model|provider).*(should|to|use)/i) ||
         queryLower.match(/\b(suggest|recommend).*(model|provider)/i)) &&
        !queryLower.match(/\b(prompt|give me|create)/i)) {
      return 'decision_tree';
    }
    
    // Image analysis request → help schema (structured bullets)
    if (queryLower.match(/\b(analyze|describe|what('s| is)|tell me about).*(image|picture|photo)/i)) {
      return 'help';
    }
  }
  
  // Troubleshooting queries (check first - highest priority)
  if (queryLower.match(/\b(error|problem|issue|not working|fail|broken|fix|troubleshoot|why can't|won't|doesn't work)\b/i)) {
    return 'troubleshooting';
  }
  
  // Workflow/how-to queries (check before comparison)
  if (queryLower.match(/\b(step by step|how (do|can) i|guide|tutorial|create|make|build|walkthrough)\b/i)) {
    return 'workflow';
  }
  
  // Decision tree queries (which should I choose) - but not when images + prompt requested
  if (queryLower.match(/\b(which\b.*(should|to|do i) (choose|use|pick|select)|help me (choose|decide|pick)|which .+ should)\b/i)) {
    return 'decision_tree';
  }
  
  // Categorized settings queries (all/show me settings for a provider/model) - check before comparison table
  if ((queryLower.match(/\b(all|show( me)?|list)\b.*\b(settings?|parameters?|options?)\b/i) ||
       queryLower.match(/\b(settings?|parameters?|options?).*\b(all|complete|full)\b/i)) &&
      queryLower.match(/\b(luma|runway|dalle|flux|stability|ideogram)\b/i)) {
    return 'categorized_settings';
  }
  
  // Comparison table queries (differences/comparisons with features/settings/specs keywords)
  if ((queryLower.match(/\b(compare|vs|versus|difference[s]? between)\b/i) && 
       queryLower.match(/\b(features?|settings?|specs?|capabilities?)\b/i)) ||
      queryLower.match(/\bwhat.*difference[s]?\b.*\b(between|vs)\b/i)) {
    return 'comparison_table';
  }
  
  // Comparison queries (explicit comparisons with pros/cons)
  if (queryLower.match(/\b(compare|vs|versus|difference between|better than|pros and cons)\b/i)) {
    return 'comparison';
  }
  
  // Settings queries (specific configuration questions)
  if (queryLower.match(/\bwhat (settings|setting|parameters|parameter|options|option|configuration|config)\b/i)) {
    return 'settings_guide';
  }
  
  // Default to help schema
  return 'help';
}

/**
 * Generate schema instruction for LLM
 */
export function getSchemaInstruction(schemaName) {
  const schema = RESPONSE_SCHEMAS[schemaName];
  if (!schema) {
    return RESPONSE_SCHEMAS.help;
  }
  
  return {
    instruction: `Return ONLY valid JSON matching this exact schema. No extra text, no markdown code blocks, just the JSON object.`,
    schema: JSON.stringify(schema, null, 2),
    example: getSchemaExample(schemaName),
  };
}

/**
 * Get example response for each schema type
 */
function getSchemaExample(schemaName) {
  const examples = {
    help: {
      title: 'Complete Luma Ray-2 Settings Guide',
      brief: 'Luma Ray-2 offers comprehensive control over video generation with 15+ parameters for camera, style, motion, and quality.',
      bullets: [
        'Duration: Choose 5s for social media or 9s for detailed scenes',
        'Resolution: 720p for previews, 1080p for final delivery',
        'Loop: Enable seamless loop for GIFs and backgrounds',
        'Camera Movement: Static, Pan Left/Right, Zoom In/Out, Orbit Right',
        'Camera Angle: Low, Eye Level (natural), High, Bird\'s Eye',
        'Camera Distance: Close-up, Medium, Wide, Extreme Wide',
        'Style: Cinematic (film-like), Photorealistic, Artistic, Animated, Vintage',
        'Lighting: Natural, Dramatic, Soft, Hard, Golden Hour, Blue Hour',
        'Mood: Energetic, Calm, Mysterious, Joyful, Serious, Epic',
        'Motion Intensity: Minimal, Moderate, High, Extreme',
        'Motion Speed: Slow Motion, Normal, Fast Motion',
        'Subject Movement: Static, Subtle, Active, Dynamic',
        'Quality: Standard (iterations), High, Premium (final)',
        'Color Grading: Natural, Warm, Cool, Dramatic, Desaturated',
        'Film Look: Digital, 35mm, 16mm, Vintage',
      ],
      sources: ['Video Panel Documentation', 'Luma Ray-2 Guide'],
    },
    
    comparison: {
      title: 'Runway vs Luma for Video Generation',
      brief: 'Both providers create high-quality videos but with different strengths. Choose based on your needs for quality vs speed.',
      comparisons: [
        {
          name: 'Runway Veo-3',
          pros: ['Cinema-quality output', 'Professional cinematography', 'Photorealistic rendering'],
          cons: ['Slower generation (30-90s)', 'Fixed 8-second duration'],
          best_for: ['Premium campaigns', 'Professional content', 'Highest quality needs'],
        },
        {
          name: 'Luma Ray-2',
          pros: ['Fast generation (20-45s)', 'Flexible duration (5s or 9s)', 'Seamless loops', 'Full control'],
          cons: ['Slightly lower quality than Runway', 'More settings to configure'],
          best_for: ['Quick iterations', 'Social media content', 'Loop videos'],
        },
      ],
      recommendation: 'Use Runway for premium campaigns where quality is paramount. Use Luma for fast social media content and when you need loops or flexible duration.',
      sources: ['Video Panel Documentation', 'Provider Comparison'],
    },
    
    workflow: {
      title: 'Create a Complete Social Media Campaign',
      brief: 'This workflow guides you through creating content, images, and video for a full campaign.',
      steps: [
        {
          step_number: 1,
          panel: 'content',
          action: 'Write campaign brief',
          description: 'Describe your product/service and campaign goals in detail',
        },
        {
          step_number: 2,
          panel: 'content',
          action: 'Configure settings',
          description: 'Select platforms, persona, tone, and CTA',
        },
        {
          step_number: 3,
          panel: 'pictures',
          action: 'Choose provider and style',
          description: 'Select FLUX for people, DALL-E for products, match aspect to platform',
        },
        {
          step_number: 4,
          panel: 'video',
          action: 'Select provider and configure',
          description: 'Choose Runway for quality or Luma for speed, set camera and style',
        },
        {
          step_number: 5,
          panel: 'all',
          action: 'Validate and Generate',
          description: 'Click Validate on each panel, then Generate All',
        },
      ],
      tips: [
        'Validate each panel before generating',
        'Use consistent aspect ratios across assets',
        'Match tone and style across content, images, and video',
      ],
      sources: ['Complete Campaign Workflow'],
    },
    
    settings_guide: {
      title: 'Stability SD 3.5 Settings for Line Art Portrait',
      brief: 'Configure Stability SD 3.5 to create a stylized monochrome portrait with bold lines.',
      panel: 'pictures',
      settings: [
        {
          name: 'Complete Prompt',
          value: 'Create a monochrome portrait...',
          explanation: 'Copy this entire prompt',
        },
        {
          name: 'Recommended Model',
          value: 'Stability SD 3.5',
          explanation: 'Offers artistic control with style presets',
        },
      ],
      basic_settings: [
        { name: 'Model', value: 'large', explanation: 'Best quality for detailed line art' },
        { name: 'CFG Scale', value: '10', explanation: 'Strong adherence to prompt for clean lines' },
        { name: 'Steps', value: '40', explanation: 'Balanced detail and generation time' },
        { name: 'Style Preset', value: 'line-art', explanation: 'Bold black lines and high contrast' },
        { name: 'Aspect Ratio', value: '1:1', explanation: 'Square format for balanced portrait' },
      ],
      advanced_settings: [
        { name: 'Brand Colors', value: 'Flexible', explanation: 'Allow monochrome palette' },
        { name: 'Backdrop', value: 'Clean', explanation: 'Plain background to highlight subject' },
        { name: 'Lighting', value: 'Hard', explanation: 'Sharp shadows for bold contrast' },
        { name: 'Quality', value: 'High detail', explanation: 'Maximum line and edge definition' },
        { name: 'Avoid', value: 'None', explanation: 'No restrictions needed' },
      ],
      best_practices: [
        'Use line-art preset for bold outlines and graphic style',
        'Set high CFG Scale (10+) for strong prompt adherence',
        'Maintain 1:1 aspect ratio for balanced composition',
        'Hard lighting creates dramatic contrast',
      ],
      sources: ['Stability SD 3.5 Documentation', 'Pictures Panel Advanced Settings'],
    },
    
    troubleshooting: {
      title: 'Cannot Validate Content Panel',
      problem: 'The Validate button is disabled or validation fails in the Content panel.',
      causes: [
        'Brief is less than 15 characters',
        'No platforms are selected',
        'Required fields are empty',
      ],
      solutions: [
        {
          solution: 'Write a detailed brief',
          steps: [
            'Brief must be at least 15 characters',
            'Describe your product/service and goals clearly',
            'Include key details about target audience',
          ],
        },
        {
          solution: 'Select target platforms',
          steps: [
            'Click on at least one platform (Facebook, Instagram, etc.)',
            'Multiple platforms can be selected',
            'Selected platforms show with a checkmark',
          ],
        },
      ],
      sources: ['Content Panel Documentation', 'Troubleshooting Guide'],
    },
    
    comparison_table: {
      title: 'Runway vs Luma: Feature Comparison',
      brief: 'Side-by-side comparison of video generation features to help you choose the right provider.',
      table: {
        headers: ['Feature', 'Runway Veo-3', 'Luma Ray-2'],
        rows: [
          { feature: 'Duration', values: ['8s (fixed)', '5s or 9s (flexible)'] },
          { feature: 'Resolution', values: ['HD', '720p or 1080p'] },
          { feature: 'Speed', values: ['30-90s', '20-45s'] },
          { feature: 'Quality', values: ['Cinema-grade', 'High quality'] },
          { feature: 'Parameters', values: ['4 (simple)', '19 (full control)'] },
          { feature: 'Loops', values: ['No', 'Yes (seamless)'] },
          { feature: 'Best For', values: ['Premium campaigns', 'Quick iterations'] },
        ],
      },
      recommendation: 'Choose Runway for highest quality premium content. Choose Luma for speed, flexibility, and seamless loops.',
      callout: {
        type: 'tip',
        message: 'Pro Tip: Use Luma for social media and Runway for client presentations or premium campaigns.',
      },
      sources: ['Video Panel Documentation', 'Provider Comparison'],
    },
    
    categorized_settings: {
      title: 'Complete Luma Ray-2 Settings (19 Total)',
      brief: 'All available settings organized by category for complete creative control.',
      categories: [
        {
          category_name: 'Basic Settings',
          icon: '🎬',
          count: 4,
          settings: [
            { name: 'Duration', options: '5s or 9s', tip: 'Use 5s for social, 9s for detailed scenes' },
            { name: 'Resolution', options: '720p or 1080p', tip: '1080p for final delivery' },
            { name: 'Loop', options: 'On/Off', tip: 'Enable for seamless GIFs' },
            { name: 'Aspect Ratio', options: '9:16, 1:1, 16:9', tip: 'Match your platform' },
          ],
        },
        {
          category_name: 'Camera Controls',
          icon: '📷',
          count: 3,
          settings: [
            { name: 'Movement', options: 'Static, Pan, Zoom, Orbit', tip: '6 movement options' },
            { name: 'Angle', options: 'Low, Eye Level, High, Bird\'s Eye', tip: '4 angle options' },
            { name: 'Distance', options: 'Close-up, Medium, Wide, Extreme Wide', tip: '4 distance options' },
          ],
        },
        {
          category_name: 'Visual Style',
          icon: '🎨',
          count: 5,
          settings: [
            { name: 'Style', options: 'Cinematic, Photorealistic, Artistic, Animated, Vintage' },
            { name: 'Lighting', options: 'Natural, Dramatic, Soft, Hard, Golden Hour, Blue Hour' },
            { name: 'Mood', options: 'Energetic, Calm, Mysterious, Joyful, Serious, Epic' },
            { name: 'Color Grading', options: 'Natural, Warm, Cool, Dramatic, Desaturated' },
            { name: 'Film Look', options: 'Digital, 35mm, 16mm, Vintage' },
          ],
        },
        {
          category_name: 'Motion Controls',
          icon: '🎞️',
          count: 3,
          settings: [
            { name: 'Intensity', options: 'Minimal, Moderate, High, Extreme' },
            { name: 'Speed', options: 'Slow Motion, Normal, Fast Motion' },
            { name: 'Subject Movement', options: 'Static, Subtle, Active, Dynamic' },
          ],
        },
        {
          category_name: 'Technical',
          icon: '⚙️',
          count: 4,
          settings: [
            { name: 'Quality', options: 'Standard, High, Premium', tip: 'Premium for final delivery' },
            { name: 'Seed', options: 'Optional number', tip: 'For reproducible results' },
            { name: 'Guidance Scale', options: '1-20 slider', tip: 'How closely to follow prompt' },
            { name: 'Negative Prompt', options: 'Optional text', tip: 'What to avoid' },
          ],
        },
      ],
      callout: {
        type: 'success',
        message: '✅ Over 100 million unique combinations possible with 19 parameters!',
      },
      sources: ['Video Panel Documentation', 'Luma Ray-2 Guide'],
    },
    
    decision_tree: {
      title: 'Which Video Provider Should I Choose?',
      brief: 'Quick decision guide to help you select the right video provider based on your needs.',
      decision_question: 'Which video provider is best for my project?',
      branches: [
        {
          condition: 'Need cinema-quality for premium campaigns',
          recommendation: 'Runway Veo-3',
          reason: 'Professional cinematography and highest quality output',
          icon: '🎬',
        },
        {
          condition: 'Need quick iterations for social media',
          recommendation: 'Luma Ray-2',
          reason: 'Fast generation (20-45s) with flexible duration',
          icon: '⚡',
        },
        {
          condition: 'Need seamless loops for GIFs/backgrounds',
          recommendation: 'Luma Ray-2',
          reason: 'Only provider with seamless loop feature',
          icon: '🔄',
        },
        {
          condition: 'Want full creative control (19 parameters)',
          recommendation: 'Luma Ray-2',
          reason: 'Complete control over camera, style, motion, and quality',
          icon: '🎛️',
        },
        {
          condition: 'Prefer simplicity (just 4 settings)',
          recommendation: 'Runway Veo-3',
          reason: 'Minimal configuration, managed cinematography',
          icon: '✨',
        },
      ],
      callout: {
        type: 'tip',
        message: 'Pro Tip: Try both providers! Luma for testing concepts, Runway for final delivery.',
      },
      sources: ['Video Panel Documentation', 'Provider Comparison'],
    },
  };
  
  return examples[schemaName] || examples.help;
}

