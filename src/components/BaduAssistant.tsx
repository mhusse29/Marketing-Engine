import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Paperclip, Minus, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/format';
import { getApiBase } from '../lib/api';
import baduIcon from '../assets/badu-icon.svg';
import { MarkdownMessage } from './MarkdownMessage';

// ========== TYPES ==========

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean; // Phase 1: Track if message is currently streaming
  isComplete?: boolean; // Phase 1: Track if streaming is complete
  attachments?: Array<{
    name: string;
    type: string;
    data: string; // base64 data URL
  }>;
};

type LauncherStyle = {
  scale: number;
  rotation: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
  borderColor: string;
  borderOpacity: number;
  glowColor: string;
  glowOpacity: number;
  bgColor: string;
  bgOpacity: number;
};

// ========== HELPERS ==========

const clampValue = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Real API call to Badu chat endpoint (Phase 1: TRUE STREAMING)
const callBaduAPIStreaming = async (
  userMessage: string, 
  messageHistory: Message[], 
  attachments: File[] = [],
  onToken: (token: string) => void
): Promise<void> => {
  try {
    const history = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Process attachments to include actual file data
    const attachmentData = await Promise.all(
      attachments.map(async (file) => {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64
        };
      })
    );

    const response = await fetch(`${getApiBase()}/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        history: history.slice(-20), // EXPANDED: Was -6, now -20 (Phase 1)
        attachments: attachmentData
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            if (data.done) {
              return; // Stream complete
            }
            
            if (data.token) {
              onToken(data.token); // Send token to callback
            }
          } catch (e) {
            console.error('[Badu Stream] Parse error:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('[Badu] API Error:', error);
    onToken("\n\nI'm having trouble connecting to the server. Please check your connection and try again.");
  }
};

// StreamingMessage - Renders content as it arrives (Phase 1: TRUE STREAMING)
const StreamingMessage = ({ content, isComplete, onUpdate }: { content: string; isComplete: boolean; onUpdate?: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevContentRef = useRef('');

  useEffect(() => {
    if (content !== prevContentRef.current) {
      prevContentRef.current = content;
      if (onUpdate) {
        onUpdate();
      }
    }
  }, [content, onUpdate]);

  return (
    <div ref={containerRef} className="text-[13px] leading-relaxed w-full">
      <MarkdownMessage content={content} />
      {!isComplete && (
        <span 
          className="inline-block ml-0.5"
          style={{ 
            width: '2px',
            height: '14px',
            backgroundColor: 'rgba(62,139,255,0.6)',
            verticalAlign: 'text-bottom',
            animation: 'badu-cursor 1s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
};

const CROP_CONTROLS = [
  { key: 'cropTop' as const, label: 'Top' },
  { key: 'cropRight' as const, label: 'Right' },
  { key: 'cropBottom' as const, label: 'Bottom' },
  { key: 'cropLeft' as const, label: 'Left' },
];

// ========== COMPONENT ==========

export function BaduAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hey there! I'm BADU, your AI creative partner from SINAIQ.\n\nI'm here to make your marketing life smoother, smarter, and way more fun. ✨\n\nWhat are we working on today?\n\nYou can ask me things like:\n• \"Help me plan a media campaign\"\n• \"Write ad copy for Instagram\"\n• \"Generate a visual for a brand launch\"\n• \"Create a video concept\"\n\nLet's make something amazing together! 🚀",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Resize state
  const [width, setWidth] = useState(400);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  
  // Launcher styling state
  const [launcherStyle, setLauncherStyle] = useState<LauncherStyle>({
    scale: 1,
    rotation: 0,
    cropTop: 0,
    cropRight: 0,
    cropBottom: 0,
    cropLeft: 0,
    borderColor: '#3E8BFF',
    borderOpacity: 0.3,
    glowColor: '#3E8BFF',
    glowOpacity: 0.4,
    bgColor: '#3E8BFF',
    bgOpacity: 0.05,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom - smooth and gentle
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);
  
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
  
  // Phase 1: NEW STREAMING handleSend
  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isThinking) return;
    
    // Convert attachments to stored format before clearing
    const attachmentData = attachments.map(file => ({
      name: file.name,
      type: file.type,
      data: URL.createObjectURL(file),
    }));
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      attachments: attachmentData.length > 0 ? attachmentData : undefined,
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);
    
    // Save for regeneration (Phase 1)
    setLastUserMessage(trimmed);
    setLastAttachments(attachments);
    
    // Create placeholder message for streaming response
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      isComplete: false,
    };
    
    setMessages((prev) => [...prev, assistantMsg]);
    setIsThinking(false);
    
    try {
      // Call streaming API
      await callBaduAPIStreaming(
        trimmed, 
        [...messages, userMsg], 
        attachments,
        (token: string) => {
          // Update message content as tokens arrive
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMsgId 
                ? { ...msg, content: msg.content + token, isStreaming: true, isComplete: false }
                : msg
            )
          );
        }
      );
      
      // Mark as complete
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMsgId 
            ? { ...msg, isStreaming: false, isComplete: true }
            : msg
        )
      );
      
      setAttachments([]); // Clear attachments after sending
    } catch (error) {
      console.error('[Badu] Error in handleSend:', error);
      
      // Update with error message
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: msg.content || "Sorry, I encountered an error. Please try again.",
                isStreaming: false,
                isComplete: true
              }
            : msg
        )
      );
    }
  }, [inputValue, isThinking, messages, attachments]);

  // Phase 1: Response Regeneration
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [lastAttachments, setLastAttachments] = useState<File[]>([]);
  
  const handleRegenerate = useCallback(async () => {
    if (!lastUserMessage || isThinking) return;
    
    // Remove last assistant message
    setMessages((prev) => {
      const filtered = prev.filter((msg) => !(msg.role === 'assistant' && msg.id === prev[prev.length - 1]?.id));
      return filtered;
    });
    
    setIsThinking(true);
    
    // Create new placeholder message
    const assistantMsgId = Date.now().toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      isComplete: false,
    };
    
    setMessages((prev) => [...prev, assistantMsg]);
    setIsThinking(false);
    
    try {
      await callBaduAPIStreaming(
        lastUserMessage,
        messages.slice(0, -1), // Exclude last assistant message
        lastAttachments,
        (token: string) => {
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMsgId 
                ? { ...msg, content: msg.content + token, isStreaming: true, isComplete: false }
                : msg
            )
          );
        }
      );
      
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMsgId 
            ? { ...msg, isStreaming: false, isComplete: true }
            : msg
        )
      );
    } catch (error) {
      console.error('[Badu] Error in handleRegenerate:', error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: msg.content || "Sorry, I encountered an error. Please try again.",
                isStreaming: false,
                isComplete: true
              }
            : msg
        )
      );
    }
  }, [lastUserMessage, lastAttachments, isThinking, messages]);
  
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
    if (files && files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Launcher computed styles
  const launcherClipPath = `inset(${launcherStyle.cropTop}% ${launcherStyle.cropRight}% ${launcherStyle.cropBottom}% ${launcherStyle.cropLeft}%)`;
  const launcherTransform = `scale(${launcherStyle.scale}) rotate(${launcherStyle.rotation}deg)`;
  
  return (
    <>
      {/* Launcher Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[90] flex h-16 w-16 items-center justify-center rounded-full border shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]"
        style={{
          borderColor: hexToRgba(launcherStyle.borderColor, launcherStyle.borderOpacity),
          backgroundColor: hexToRgba(launcherStyle.bgColor, launcherStyle.bgOpacity),
          boxShadow: `0 0 24px ${hexToRgba(launcherStyle.glowColor, launcherStyle.glowOpacity)}, 0 8px 32px rgba(0,0,0,0.45)`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Close Badu Assistant' : 'Open Badu Assistant'}
        aria-expanded={isOpen}
      >
        <img
          src={baduIcon}
          alt=""
          role="presentation"
          className="h-10 w-10 transition-all duration-200"
          style={{
            clipPath: launcherClipPath,
            transform: launcherTransform,
          }}
        />
      </motion.button>

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
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg p-2 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                  style={{ color: 'rgba(231,236,243,0.70)' }}
                  aria-label="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
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
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
      {msg.role === 'assistant' ? (
        <StreamingMessage
          key={msg.id}
          content={msg.content}
          isComplete={msg.isComplete !== false}
          onUpdate={scrollToBottom}
        />
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
                      {/* Show image attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div 
                          style={{
                            display: 'grid',
                            gridTemplateColumns: msg.attachments.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                            gap: '8px',
                            width: '100%',
                          }}
                        >
                          {msg.attachments.map((att, idx) => (
                            att.type.startsWith('image/') && (
                              <div
                                key={idx}
                                style={{
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  border: '2px solid rgba(62,139,255,0.3)',
                                }}
                              >
                                <img
                                  src={att.data}
                                  alt={att.name}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '200px',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              </div>
                            )
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
                        {msg.content}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex gap-1.5">
                      <motion.div
                        className="h-2 w-2 rounded-full bg-white/40"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="h-2 w-2 rounded-full bg-white/40"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="h-2 w-2 rounded-full bg-white/40"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Tuner - Reserved for future feature - Intentionally disabled */}
            {/* eslint-disable-next-line no-constant-binary-expression */}
            {false && (
            <AnimatePresence>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/10"
                >
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(231,236,243,0.70)' }}>
                        Launcher Tuner
                      </span>
                      {/* Button disabled since tuner feature is disabled */}
                      {/* <button
                        onClick={() => setShowTuner(false)}
                        className="rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button> */}
                    </div>
                    
                    {/* Scale & Rotation */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                          Scale
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={launcherStyle.scale}
                          onChange={(e) => setLauncherStyle((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-500"
                        />
                        <div className="mt-1 text-xs text-white/40">{launcherStyle.scale.toFixed(2)}</div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                          Rotation
                        </label>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={launcherStyle.rotation}
                          onChange={(e) => setLauncherStyle((prev) => ({ ...prev, rotation: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-500"
                        />
                        <div className="mt-1 text-xs text-white/40">{launcherStyle.rotation}°</div>
                      </div>
                    </div>

                    {/* Crop Controls */}
                    <div>
                      <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                        Crop Edges
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CROP_CONTROLS.map((ctrl) => (
                          <div key={ctrl.key} className="flex items-center gap-2">
                            <span className="text-xs text-white/50 w-12">{ctrl.label}</span>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              step="1"
                              value={launcherStyle[ctrl.key]}
                              onChange={(e) => setLauncherStyle((prev) => ({ ...prev, [ctrl.key]: parseFloat(e.target.value) }))}
                              className="flex-1 accent-blue-500"
                            />
                            <span className="text-xs text-white/40 w-8">{launcherStyle[ctrl.key]}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Border Color & Opacity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                          Border Color
                        </label>
                        <input
                          type="color"
                          value={launcherStyle.borderColor}
                          onChange={(e) => setLauncherStyle((prev) => ({ ...prev, borderColor: e.target.value }))}
                          className="h-8 w-full rounded border border-white/10 bg-white/5"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                          Border Opacity
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={launcherStyle.borderOpacity}
                          onChange={(e) => setLauncherStyle((prev) => ({ ...prev, borderOpacity: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-500"
                        />
                        <div className="mt-1 text-xs text-white/40">{(launcherStyle.borderOpacity * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    {/* Glow Color & Opacity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                          Glow Color
                        </label>
                        <input
                          type="color"
                          value={launcherStyle.glowColor}
                          onChange={(e) => setLauncherStyle((prev) => ({ ...prev, glowColor: e.target.value }))}
                          className="h-8 w-full rounded border border-white/10 bg-white/5"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                          Glow Opacity
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={launcherStyle.glowOpacity}
                          onChange={(e) => setLauncherStyle((prev) => ({ ...prev, glowOpacity: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-500"
                        />
                        <div className="mt-1 text-xs text-white/40">{(launcherStyle.glowOpacity * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    {/* Background Color & Opacity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                          Background
                        </label>
                        <input
                          type="color"
                          value={launcherStyle.bgColor}
                          onChange={(e) => setLauncherStyle((prev) => ({ ...prev, bgColor: e.target.value }))}
                          className="h-8 w-full rounded border border-white/10 bg-white/5"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: 'rgba(231,236,243,0.70)' }}>
                          BG Opacity
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={launcherStyle.bgOpacity}
                          onChange={(e) => setLauncherStyle((prev) => ({ ...prev, bgOpacity: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-500"
                        />
                        <div className="mt-1 text-xs text-white/40">{(launcherStyle.bgOpacity * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
            </AnimatePresence>
              )}

            {/* Input Composer */}
            <div className="px-5 py-4">
              {/* Regenerate Button (Phase 1) */}
              {lastUserMessage && messages.length > 1 && messages[messages.length - 1]?.role === 'assistant' && (
                <div className="mb-3">
                  <button
                    onClick={handleRegenerate}
                    disabled={isThinking}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all',
                      !isThinking
                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/20'
                        : 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'
                    )}
                    title="Regenerate last response"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate Response
                  </button>
                </div>
              )}
              
              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs"
                      style={{ color: 'rgba(231,236,243,0.80)' }}
                    >
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="text-white/50 hover:text-white/80 transition-colors"
                        aria-label="Remove attachment"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask BADU anything..."
                  disabled={isThinking}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm transition-colors focus:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                  style={{
                    color: 'rgba(231,236,243,0.90)',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isThinking}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                    inputValue.trim() && !isThinking
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-[1px]'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
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
