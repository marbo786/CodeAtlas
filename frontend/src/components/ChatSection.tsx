'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { useMutation } from '@tanstack/react-query';
import { Editor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Removed ScrollArea import
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useChatStore, ChatMessage } from '@/store/useChatStore';

// --- CONFIGURABLE ANIMATION VARIABLES ---
// Initial state parameters for the cinematic entrance
const INITIAL_SCALE = 0.55;
const INITIAL_OPACITY = 0.25;
const INITIAL_BLUR = 8;
const INITIAL_TRANSLATE_Y = 120;
const INITIAL_ROTATE_X = 8;
const INITIAL_ROTATE_Y = -2;
const INITIAL_SHADOW = "0px 10px 30px rgba(0, 0, 0, 0.1)";
const FINAL_SHADOW = "0px 25px 60px rgba(0, 0, 0, 0.4)";

// Scroll mapping parameters
// Tracks the scroll progress from 0 (section enters viewport bottom) to 1 (section center reaches viewport center)
const SCROLL_START = 0; 
const SCROLL_END = 0.75; // Animation finishes smoothly slightly before the exact center

// 3D Perspective intensity
const PERSPECTIVE = 1200;

// Variables controlling how the previous section gracefully fades
const FOCUS_FADE = 0.35; // Final opacity of previous section
const FOCUS_TRANSLATE = -30; // Upward movement of previous section (px)
// ----------------------------------------

export function ChatSection() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const { messages, status, addMessage, appendStreamChunk, setStatus, sessionId } = useChatStore();

  const mutation = useMutation({
    mutationFn: async (query: string) => {
      setStatus('sending');
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sessionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      setStatus('streaming');

      // Check if it's a streaming response
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            // Process SSE data chunks (simplified)
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
            for (const line of lines) {
              const data = line.replace('data: ', '').trim();
              if (data && data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) appendStreamChunk(parsed.text);
                } catch (e) {
                  appendStreamChunk(data);
                }
              }
            }
          }
        }
      } else {
        // Standard JSON response
        const data = await res.json();
        // Assuming n8n returns { output: "..." }
        const text = data.output || data.response || data.text || JSON.stringify(data);
        
        appendStreamChunk(text);
      }
    },
    onSettled: () => {
      setStatus('idle');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== 'idle') return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };
    
    addMessage(userMsg);
    setInput('');
    mutation.mutate(userMsg.content);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // --- SCROLL ANIMATION LOGIC ---
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // "start end" = top of target hits bottom of viewport (0 progress)
    // "center center" = center of target hits center of viewport (1 progress)
    offset: ["start end", "center center"] 
  });

  // Calculate interpolated transform values based on scroll progress
  const scale = useTransform(scrollYProgress, [SCROLL_START, SCROLL_END], [INITIAL_SCALE, 1]);
  const opacity = useTransform(scrollYProgress, [SCROLL_START, SCROLL_END], [INITIAL_OPACITY, 1]);
  const blurVal = useTransform(scrollYProgress, [SCROLL_START, SCROLL_END], [INITIAL_BLUR, 0]);
  const filter = useTransform(blurVal, (v) => `blur(${v}px)`);
  const y = useTransform(scrollYProgress, [SCROLL_START, SCROLL_END], [INITIAL_TRANSLATE_Y, 0]);
  const rotateX = useTransform(scrollYProgress, [SCROLL_START, SCROLL_END], [INITIAL_ROTATE_X, 0]);
  const rotateY = useTransform(scrollYProgress, [SCROLL_START, SCROLL_END], [INITIAL_ROTATE_Y, 0]);
  const boxShadow = useTransform(scrollYProgress, [SCROLL_START, SCROLL_END], [INITIAL_SHADOW, FINAL_SHADOW]);

  // Gracefully transition the focus away from the previous section
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const visionSection = document.getElementById('vision-section');
    if (visionSection) {
      // Normalize progress mapping directly within [SCROLL_START, SCROLL_END]
      const progress = Math.min(Math.max((latest - SCROLL_START) / (SCROLL_END - SCROLL_START), 0), 1);
      const fade = 1 - progress * (1 - FOCUS_FADE);
      const move = progress * FOCUS_TRANSLATE;
      
      // Apply styles to the previous section bypassing React render lifecycle for performance
      visionSection.style.opacity = fade.toString();
      visionSection.style.transform = `translateY(${move}px)`;
    }
  });

  return (
    <section ref={sectionRef} className="w-full py-24 px-4 md:px-8 max-w-5xl mx-auto flex flex-col items-center">
      <motion.div 
        style={{ perspective: PERSPECTIVE }}
        className="w-full flex flex-col items-center"
      >
        {/* Animated immersive wrapper */}
        <motion.div 
          style={{ 
            scale, 
            opacity, 
            filter, 
            y, 
            rotateX, 
            rotateY,
            boxShadow,
            transformOrigin: "center center" 
          }}
          className="w-full flex flex-col items-center will-change-transform rounded-2xl"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight mb-4">
              Chat with your architecture.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ask questions in plain English. CodeAtlas traverses the structural graph to give you precise answers with context.
            </p>
          </div>

          {/* Chat Interface */}
          <div className="w-full rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-[600px] shadow-xl">
            <div className="border-b border-border bg-muted/50 p-4 flex items-center px-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="mx-auto text-sm font-medium text-muted-foreground flex items-center">
                <Bot className="w-4 h-4 mr-2" />
                CodeAtlas Agent
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar" ref={scrollRef}>
              <div className="space-y-6 max-w-4xl mx-auto pb-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className={`h-8 w-8 border ${msg.role === 'user' ? 'border-primary/20' : 'border-border'}`}>
                        <AvatarFallback className={msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex-1 space-y-2 ${msg.role === 'user' ? 'flex items-end flex-col' : ''}`}>
                        <div className={`inline-block rounded-2xl px-5 py-3 text-sm max-w-[85%] ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-muted/50 border border-border rounded-tl-sm text-foreground prose prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0'
                        }`}>
                          {msg.role === 'user' ? (
                            msg.content
                          ) : (
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <div className="my-4 rounded-md overflow-hidden border border-border">
                                      <div className="bg-slate-900 px-4 py-2 text-xs text-slate-400 font-mono border-b border-border/50">
                                        {match[1]}
                                      </div>
                                      <Editor
                                        height="200px"
                                        language={match[1]}
                                        theme="vs-dark"
                                        value={String(children).replace(/\n$/, '')}
                                        options={{
                                          readOnly: true,
                                          minimap: { enabled: false },
                                          scrollBeyondLastLine: false,
                                          fontSize: 13,
                                          padding: { top: 16, bottom: 16 },
                                          lineNumbers: 'off',
                                          folding: false,
                                          scrollbar: { alwaysConsumeMouseWheel: false }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-[13px]" {...props}>
                                      {children}
                                    </code>
                                  )
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {status === 'sending' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-muted text-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-sm px-5 py-3 h-10 flex items-center space-x-1">
                      <motion.div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the architecture, how authentication works, or find unused functions..."
                  className="pr-12 py-6 rounded-xl bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50 text-base"
                  disabled={status !== 'idle'}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-2 h-9 w-9 rounded-lg"
                  disabled={!input.trim() || status !== 'idle'}
                >
                  {status !== 'idle' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
