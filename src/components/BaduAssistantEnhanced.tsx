import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Minus, Image as ImageIcon, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/format';
import { getApiBase } from '../lib/api';
import { supabase } from '../lib/supabase';
import { StructuredResponse } from './StructuredResponse';
import { ThinkingSteps } from './ThinkingSteps';
import { PremiumBaduLauncher } from './PremiumBaduLauncher';
import { useBaduStream } from '../hooks/useBaduStream';
import { useBaduPreferences } from '../hooks/useBaduPreferences';
import { PreferencesCallout } from './AskAI/PreferencesCallout';
import { StreamingMetadata } from './AskAI/StreamingMetadata';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from './ui/prompt-input';

// ========== TYPES ==========

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string | any; // eslint-disable-line @typescript-eslint/no-explicit-any
  responseType?: string; // Schema type for structured responses
  timestamp: number;
  attachments?: Array<{
    name: string;
    type: string;
    data: string;
  }>;
};


// ========== HELPERS ==========

const clampValue = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

// File validation constants
const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Validate file
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Only PNG, JPG, JPEG, and WebP images are allowed.`,
    };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
    };
  }
  
  return { valid: true };
};

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Enhanced API call using new RAG endpoint with vision support
const callBaduAPIEnhanced = async (
  userMessage: string,
  messageHistory: Message[],
  attachments?: Array<{ name: string; type: string; data: string }>
): Promise<{ response: any; type: string }> => { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    // Send raw message objects - let the gateway handle formatting
    // Don't stringify assistant messages, so formatHistoryMessage can process structured objects
    const history = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content, // Send as-is (string for user, object for assistant)
      attachments: msg.attachments, // Include attachments in history
    }));

    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for enhanced mode
    
    const response = await fetch(`${getApiBase()}/v1/chat/enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message: userMessage,
        history: history.slice(-10), // Last 10 messages for context
        attachments, // Send current message attachments
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: { error?: string; message?: string } | null = null;

      try {
        errorBody = await response.json();
      } catch (parseError) {
        console.warn('[Badu Enhanced] Failed to parse error response', parseError);
      }

      if (response.status === 401 || errorBody?.error === 'unauthorized') {
        return {
          response: {
            title: 'Sign In Required',
            message: 'Please sign in again to continue using BADU Enhanced.',
            type: 'auth_error',
            next_steps: ['Refresh the page', 'Sign in with your SINAIQ account'],
          },
          type: 'error',
        };
      }

      if (response.status === 503 && errorBody?.error === 'openai_not_configured') {
        return {
          response: {
            title: 'BADU Enhanced Setup Needed',
            message: 'The enhanced BADU assistant is not fully configured on this environment yet.',
            type: 'configuration_error',
            next_steps: [
              'Add your OPENAI_API_KEY to server/.env',
              'Restart the gateway server after updating environment variables',
              'Use the standard BADU assistant until setup is complete',
            ],
          },
          type: 'error',
        };
      }

      throw new Error(errorBody?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response data
    if (!data || !data.response) {
      console.warn('[Badu Enhanced] Empty response from API:', data);
      return {
        response: {
          title: 'No Response',
          message: 'The assistant did not provide a response. Please try again.',
          type: 'error',
        },
        type: 'error',
      };
    }
    
    return {
      response: data.response,
      type: data.type || 'help',
    };
  } catch (error) {
    console.error('[Badu Enhanced] API Error:', error);
    return {
      response: {
        title: 'Connection Error',
        message: "I'm having trouble connecting to the server. Please check your connection and try again.",
        type: 'unknown',
        next_steps: ['Check your internet connection', 'Try again in a moment'],
      },
      type: 'error',
    };
  }
};

// ========== COMPONENT ==========

export function BaduAssistantEnhanced() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: {
        title: 'Welcome to BADU',
        brief: "I'm BADU, your AI marketing assistant from SINAIQ. I'll help you navigate the Marketing Engine and get the most out of each panel.",
        bullets: [
          'Ask me about the Content, Pictures, or Video panels',
          'Get step-by-step guidance for any feature',
          'Learn best practices for each provider',
          'Troubleshoot issues and optimize settings',
        ],
        next_steps: [
          'Ask "How do I use the Content panel?"',
          'Ask "Which provider should I choose for product images?"',
          'Ask "How do I create a video ad?"',
        ],
      },
      responseType: 'help',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showPreferenceOverride, setShowPreferenceOverride] = useState(false);
  const [preferencesOverridden, setPreferencesOverridden] = useState(false);
  const blobUrlsRef = useRef<Set<string>>(new Set()); // Track blob URLs for cleanup (using ref to avoid re-renders)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BADU Preferences hook
  const { preferences, isLoading: prefsLoading } = useBaduPreferences();
  
  // Use overridden empty preferences or real preferences
  const activePreferences = preferencesOverridden ? {} : preferences;

  // BADU Streaming hook
  const {
    startStream,
    stopStream,
    isStreaming,
    streamedText,
    metadata,
    error: streamError,
  } = useBaduStream({
    onMetadata: (meta) => {
      console.log('[BADU] Stream metadata:', meta);
    },
    onComplete: (fullText) => {
      try {
        const parsed = JSON.parse(fullText);
        const assistantMsg: Message = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: parsed,
          responseType: parsed.type || 'help',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e) {
        console.error('[BADU] Failed to parse response:', e);
      }
      setIsThinking(false);
    },
    onError: (error) => {
      console.error('[BADU] Stream error:', error);
      const errorMsg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: {
          title: 'Streaming Error',
          message: error.message || 'Failed to stream response',
          type: 'error',
        },
        responseType: 'error',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsThinking(false);
    },
  });

  // Resize state
  const [width, setWidth] = useState(400);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  // Using empty dependency array so cleanup only runs on unmount, not on every URL addition
  useEffect(() => {
    const blobUrls = blobUrlsRef.current;
    return () => {
      blobUrls.forEach(url => URL.revokeObjectURL(url));
      blobUrls.clear();
    };
  }, []);

  // Handle resize
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'ew-resize';
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      const delta = startXRef.current - e.clientX;
      const newWidth = clampValue(startWidthRef.current + delta, 300, 520);
      setWidth(newWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  // Track if we're already processing a request to prevent duplicates from React StrictMode
  const isProcessingRef = useRef(false);

  // Handle send with SSE streaming
  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isThinking || isStreaming || isProcessingRef.current) return;
    
    // Set processing flag to prevent duplicate calls
    isProcessingRef.current = true;

    // Convert files to base64 for API and create blob URLs for display
    const attachmentDataPromises = attachments.map(async (file) => {
      const base64 = await fileToBase64(file);
      const blobUrl = URL.createObjectURL(file); // blob URL for display
      return {
        name: file.name,
        type: file.type,
        data: base64, // base64 for API
        displayUrl: blobUrl,
      };
    });

    const attachmentData = await Promise.all(attachmentDataPromises);
    
    // Track blob URLs for cleanup (add to ref, not state, to avoid triggering re-renders)
    attachmentData.forEach(att => blobUrlsRef.current.add(att.displayUrl));

    // Create display attachments (with blob URLs)
    const displayAttachments = attachmentData.map(att => ({
      name: att.name,
      type: att.type,
      data: att.displayUrl, // Use blob URL for display
    }));

    // Create API attachments (with base64)
    const apiAttachments = attachmentData.map(att => ({
      name: att.name,
      type: att.type,
      data: att.data, // Use base64 for API
    }));

    const userMsg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      attachments: displayAttachments.length > 0 ? displayAttachments : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);
    setAttachments([]);

    try {
      // Start SSE streaming with RAG, structured output, and vision
      await startStream(
        trimmed,
        [...messages, userMsg],
        apiAttachments.length > 0 ? apiAttachments : undefined,
        preferencesOverridden // Skip preferences if overridden
      );
    } catch (error) {
      console.error('[Badu Enhanced] Error in handleSend:', error);
      setIsThinking(false);
    } finally {
      isProcessingRef.current = false;
    }
  }, [inputValue, isThinking, isStreaming, messages, attachments, startStream, preferencesOverridden]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];
    
    // Check total attachment count
    if (attachments.length + fileArray.length > MAX_ATTACHMENTS) {
      errors.push(`Maximum ${MAX_ATTACHMENTS} attachments allowed. You already have ${attachments.length}.`);
    } else {
      // Validate each file
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else if (validation.error) {
          errors.push(validation.error);
        }
      }
      
      // Add valid files
      if (validFiles.length > 0) {
        setAttachments(prev => [...prev, ...validFiles]);
      }
    }
    
    // Show errors if any
    if (errors.length > 0) {
      // Display error to user
      const errorMsg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: {
          title: 'Attachment Error',
          message: errors.join('\n\n'),
          type: 'validation_error',
        },
        responseType: 'error',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [attachments]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <>
      {/* Premium Launcher Button */}
      <PremiumBaduLauncher 
        isOpen={isOpen} 
        onClick={() => setIsOpen(!isOpen)}
        hasNotification={false}
      />

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="fixed bottom-24 right-6 z-[90] flex flex-col rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl"
            style={{
              width: `${width}px`,
              maxHeight: '600px',
              background: 'linear-gradient(180deg, rgba(12, 18, 28, 0.86), rgba(10, 15, 24, 0.82))',
              boxShadow: '0 18px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-base font-semibold tracking-wide" style={{ color: 'rgba(241,246,255,0.95)' }}>
                BADU
              </h3>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                  style={{ color: 'rgba(231,236,243,0.70)' }}
                  aria-label="Close"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="badu-messages-container flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ minHeight: '200px' }}>
              {/* Preference Override Modal */}
              {showPreferenceOverride && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowPreferenceOverride(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-purple-500/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-lg font-semibold text-white mb-3">Override Preferences</h3>
                    <p className="text-sm text-slate-300 mb-4">
                      BADU will stop using your learned preferences and won't auto-fill settings. You'll need to select everything manually.
                    </p>
                    <p className="text-xs text-purple-300/60 mb-4">
                      💡 This only affects this session. Your preferences will be used again next time you open BADU.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setPreferencesOverridden(true)
                          setShowPreferenceOverride(false)
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                      >
                        Override for Session
                      </button>
                      <button
                        onClick={() => setShowPreferenceOverride(false)}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Preferences Callout - Only show if not overridden */}
              {!preferencesOverridden && !prefsLoading && preferences && Object.keys(preferences).length > 0 && (
                <PreferencesCallout
                  preferences={preferences}
                  onOverride={() => setShowPreferenceOverride(true)}
                />
              )}
              
              {/* Override Active Banner */}
              {preferencesOverridden && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border-l-4 border-orange-400/50 bg-orange-900/10 p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-orange-400 text-sm">⚠️</span>
                      <span className="text-xs text-orange-200/80">
                        Preferences overridden - BADU won't auto-fill settings
                      </span>
                    </div>
                    <button
                      onClick={() => setPreferencesOverridden(false)}
                      className="text-xs text-orange-300 hover:text-orange-100 underline transition-colors"
                    >
                      Re-enable
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Streaming Metadata */}
              {metadata && isStreaming && (
                <StreamingMetadata metadata={metadata} className="mb-4" />
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' ? (
                    <div className="max-w-[95%]">
                      {typeof msg.content === 'object' ? (
                        <StructuredResponse response={msg.content} type={msg.responseType || 'help'} />
                      ) : (
                        <div className="text-[13px] leading-relaxed text-white/85">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        alignItems: 'flex-end',
                      }}
                    >
                      {/* Attachments (if any) */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {msg.attachments.map((attachment, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm"
                              style={{ maxWidth: '200px' }}
                            >
                              {attachment.type.startsWith('image/') ? (
                                <img
                                  src={attachment.data}
                                  alt={attachment.name}
                                  className="w-full h-auto"
                                  style={{ maxHeight: '150px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-2">
                                  <ImageIcon className="h-4 w-4 text-white/60" />
                                  <span className="text-xs text-white/80 truncate">
                                    {attachment.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Text message */}
                      <div
                        className="rounded-2xl px-4 py-2.5 text-sm"
                        style={{
                          background: 'linear-gradient(90deg, #3E8BFF, #6B70FF)',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(62,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                          width: 'fit-content',
                          maxWidth: '100%',
                        }}
                      >
                        {msg.content as string}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Thinking Animation - Show when starting or streaming without text yet */}
              {(isThinking || isStreaming) && !streamedText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[95%]">
                    <ThinkingSteps isThinking={true} />
                  </div>
                </motion.div>
              )}

              {/* Streaming Text */}
              {isStreaming && streamedText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[95%] rounded-lg border border-blue-500/20 bg-gradient-to-br from-slate-900/40 to-slate-800/40 p-4 backdrop-blur-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-white/90 whitespace-pre-wrap">{streamedText}</p>
                        <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Premium Input Composer */}
            {/* Attachments Display */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-2 flex flex-wrap gap-2"
                >
                  {attachments.map((file, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <ImageIcon className="h-4 w-4 text-white/60" />
                      <span className="text-xs text-white/80 truncate max-w-[100px]">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="ml-1 text-white/40 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Shadcn-style Prompt Input */}
            <div className="px-5 pb-4">
              <PromptInput
                value={inputValue}
                onValueChange={setInputValue}
                isLoading={isThinking}
                onSubmit={handleSend}
                maxHeight={120}
                className="w-full"
              >
                <PromptInputTextarea 
                  placeholder="Ask BADU anything..." 
                  onKeyDown={handleKeyDown}
                />
                <PromptInputActions className="justify-between pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isThinking}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white/90 disabled:opacity-50"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <PromptInputAction tooltip={isThinking ? "Generating..." : "Send message"}>
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isThinking}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                    </button>
                  </PromptInputAction>
                </PromptInputActions>
              </PromptInput>
            </div>

            {/* Resize Handle */}
            <div
              ref={resizeRef}
              onPointerDown={handleResizeStart}
              className="absolute bottom-0 left-0 h-full w-2 cursor-ew-resize hover:bg-blue-500/20 active:bg-blue-500/30"
              style={{ borderRadius: '24px 0 0 24px' }}
              aria-label="Resize panel"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

