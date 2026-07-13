'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MOCK_GENERATED_README } from '@/mock/docs';

// --- CONFIGURABLE ANIMATION VARIABLES ---
const EDITOR_START = 0;
const EDITOR_END = 0.95;
const PARAGRAPH_STAGGER = 0.05;
const SECTION_DELAY = 0.02;
const INITIAL_BLUR = 6;
const INITIAL_TRANSLATE = 40;
const INITIAL_SCALE = 0.985;
// ----------------------------------------

// Custom component to handle individual paragraph/block AI generation animation
function AnimatedMarkdownBlock({ 
  block, 
  index, 
  scrollYProgress 
}: { 
  block: string; 
  index: number; 
  scrollYProgress: any;
}) {
  const start = 0.20 + index * PARAGRAPH_STAGGER;
  const end = start + PARAGRAPH_STAGGER - 0.01;
  
  const y = useTransform(scrollYProgress, [start, end], [10, 0]);
  const blurRaw = useTransform(scrollYProgress, [start, end], [2, 0]);
  const blur = useTransform(blurRaw, (v) => `blur(${v}px)`);
  const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);
  
  // AI Mask Reveal Effect
  const maskPercentage = useTransform(scrollYProgress, [start, end], [-10, 110]);
  const maskImage = useTransform(maskPercentage, (v) => `linear-gradient(to right, black ${v}%, transparent ${v + 10}%)`);

  const isCode = block.startsWith('```');

  // Code Block specific animations
  const codeX = useTransform(scrollYProgress, [start, end], [-12, 0]);
  const shimmerProgress = useTransform(scrollYProgress, [start, end + 0.05], [-100, 200]);
  
  // Caret visibility (only visible while this specific block is generating)
  const caretOpacity = useTransform(scrollYProgress, [start - 0.01, start, end, end + 0.01], [0, 1, 1, 0]);

  return (
    <motion.div 
      style={isCode ? { opacity, x: codeX } : { opacity, y, filter: blur, WebkitMaskImage: maskImage, maskImage }}
      className={`relative mb-6 will-change-transform ${isCode ? "" : "prose prose-invert prose-headings:font-bold prose-h1:text-4xl prose-a:text-primary prose-a:no-underline"}`}
    >
      <ReactMarkdown>
        {block}
      </ReactMarkdown>
      
      {isCode && (
        <motion.div
           style={{ left: useTransform(shimmerProgress, v => `${v}%`) }}
           className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] pointer-events-none z-10"
        />
      )}

      {/* Generating Caret Indicator */}
      <motion.div 
        style={{ opacity: caretOpacity }}
        className="absolute -bottom-1 -right-2 w-2 h-5 bg-primary/80 animate-pulse pointer-events-none"
      />
    </motion.div>
  );
}

function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    
    // We need to wait a tiny bit for the AnimatePresence layout to finish mounting
    // the container into the DOM before mermaid tries to calculate dimensions.
    const timer = setTimeout(() => {
      if (containerRef.current && chart && chart.includes('graph')) {
        try {
          mermaid.render('mermaid-svg', chart).then(({ svg }) => {
            if (containerRef.current) {
              containerRef.current.innerHTML = svg;
            }
          });
        } catch (e) {
          console.error("Mermaid parsing failed", e);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [chart]);

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center p-8 overflow-auto" />;
}

export function DocsSection() {
  const [activeTab, setActiveTab] = useState('readme');
  const sectionRef = useRef<HTMLElement>(null);
  
  const { data: apiData } = useQuery({
    queryKey: ['repo', 'latest'],
    queryFn: async () => {
      const res = await fetch('/api/repo/latest');
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 5000
  });

  const safeReadme = (apiData?.readme === "undefined" || !apiData?.readme) ? null : apiData.readme;
  const safeDiagram = (apiData?.mermaid_dependency === "undefined" || !apiData?.mermaid_dependency) ? null : apiData.mermaid_dependency;

  const readmeContent = safeReadme ?? "No README generated yet. Run the ingestion workflow!";
  const readmeBlocks = readmeContent.split('\n\n').filter(Boolean);
  const diagramContent = safeDiagram ?? 'graph TD\n    A[No Diagram] --> B[Generate in n8n]';

  // --- ANIMATION MAPPINGS ---
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 80%"]
  });

  // Phase 1: Editor Initialization (0 to 0.15)
  const editorOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);
  const editorY = useTransform(scrollYProgress, [0, 0.15], [INITIAL_TRANSLATE, 0]);
  const editorScale = useTransform(scrollYProgress, [0, 0.15], [INITIAL_SCALE, 1]);
  const editorBlurRaw = useTransform(scrollYProgress, [0, 0.15], [INITIAL_BLUR, 0]);
  const editorBlur = useTransform(editorBlurRaw, (v) => `blur(${v}px)`);

  // Phase 2: Tab Activation (0.15 to 0.20)
  const readmeTabOpacity = useTransform(scrollYProgress, [0.15, 0.17], [0, 1]);
  const activeIndicatorWidth = useTransform(scrollYProgress, [0.16, 0.18], ["0%", "100%"]);
  const archTabOpacity = useTransform(scrollYProgress, [0.18, 0.20], [0, 1]);

  // Phase 5: Architecture Tab Preview (0.85 to 0.95)
  const archTabScale = useTransform(scrollYProgress, [0.85, 0.88, 0.91], [1, 1.05, 1]);
  const archTabUnderlineScale = useTransform(scrollYProgress, [0.85, 0.90], [0, 1]);
  const archTabGlow = useTransform(scrollYProgress, [0.85, 0.90], ["rgba(255,255,255,0)", "rgba(255,255,255,0.1)"]);

  // Status Message
  const [statusMessage, setStatusMessage] = useState("");
  const [statusOpacity, setStatusOpacity] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // If the data is fully loaded and valid, immediately show completion
    if (safeReadme && safeReadme !== "undefined") {
      if (statusMessage !== "Documentation complete ✓") {
        setStatusMessage("Documentation complete ✓");
        setStatusOpacity(1);
      }
      return;
    }

    if (latest > 0.10 && latest <= 0.3) {
      if (statusMessage !== "Generating README...") {
        setStatusMessage("Generating README...");
        setStatusOpacity(1);
      }
    } else if (latest > 0.3 && latest <= 0.5) {
      if (statusMessage !== "Analyzing modules...") {
        setStatusMessage("Analyzing modules...");
        setStatusOpacity(1);
      }
    } else if (latest > 0.5 && latest <= 0.8) {
      if (statusMessage !== "Building architecture...") {
        setStatusMessage("Building architecture...");
        setStatusOpacity(1);
      }
    } else if (latest > 0.8 && latest <= 0.95) {
      if (statusMessage !== "Finalizing documentation...") {
        setStatusMessage("Finalizing documentation...");
        setStatusOpacity(1);
      }
    } else if (latest > 0.95) {
      if (statusMessage !== "Documentation complete ✓") {
        setStatusMessage("Documentation complete ✓");
        setStatusOpacity(1);
      }
    } else {
      if (statusOpacity !== 0) setStatusOpacity(0);
    }
  });

  return (
    <section ref={sectionRef} className="w-full py-24 px-4 md:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Header (Fades in normally) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 font-heading">
            Documentation that writes itself.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CodeAtlas generates comprehensive READMEs and living architecture diagrams that stay perfectly in sync with your codebase.
          </p>

          {/* Dynamic Status Text */}
          <div 
            className="mt-6 h-6 flex items-center justify-center transition-opacity duration-300"
            style={{ opacity: statusOpacity }}
          >
            <span className="text-sm font-mono text-muted-foreground bg-card px-3 py-1 rounded-full border border-border flex items-center">
              {statusMessage !== "Documentation complete ✓" && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-2" />
              )}
              {statusMessage}
            </span>
          </div>
        </motion.div>

        {/* Phase 1: Editor Initialization */}
        <motion.div
          style={{ opacity: editorOpacity, y: editorY, scale: editorScale, filter: editorBlur }}
          className="w-full bg-card border border-border shadow-lg rounded-2xl overflow-hidden min-h-[600px] flex flex-col will-change-transform"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border bg-muted/40 p-4 pb-0 flex justify-center sm:justify-start">
              <TabsList className="bg-transparent mb-[-1px] rounded-b-none border-0 h-auto p-0">
                
                {/* README Tab (Phase 2) */}
                <motion.div style={{ opacity: readmeTabOpacity }} className="relative">
                  <TabsTrigger 
                    value="readme" 
                    className="px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base data-[state=active]:bg-card data-[state=active]:shadow-none data-[state=active]:border-border border border-transparent border-b-0 rounded-t-lg transition-colors"
                  >
                    README.md
                  </TabsTrigger>
                  {/* Active Indicator Slide */}
                  {activeTab === 'readme' && (
                    <motion.div 
                      style={{ width: activeIndicatorWidth }}
                      className="absolute bottom-0 left-0 h-[2px] bg-primary z-10"
                    />
                  )}
                </motion.div>

                {/* Architecture Tab (Phase 2 & 5) */}
                <motion.div style={{ opacity: archTabOpacity, scale: archTabScale, backgroundColor: archTabGlow }} className="relative rounded-t-lg transition-colors">
                  <TabsTrigger 
                    value="diagram" 
                    className="px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base data-[state=active]:bg-card data-[state=active]:shadow-none data-[state=active]:border-border border border-transparent border-b-0 rounded-t-lg transition-colors"
                  >
                    Architecture Diagram
                  </TabsTrigger>
                  {/* Phase 5: Architecture Tab Preview Underline */}
                  <motion.div 
                    style={{ scaleX: archTabUnderlineScale, transformOrigin: 'left' }}
                    className="absolute bottom-0 left-4 right-4 h-[1px] bg-primary/50"
                  />
                  {activeTab === 'diagram' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary z-10"
                    />
                  )}
                </motion.div>

              </TabsList>
            </div>

            <div className="flex-1 relative bg-card p-6 md:p-10 overflow-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'readme' ? (
                  <motion.div
                    key="readme"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-4xl mx-auto"
                  >
                    {/* Phase 3 & 4: AI Writing & Code Blocks */}
                    {readmeBlocks.map((block: string, i: number) => (
                      <AnimatedMarkdownBlock 
                        key={i} 
                        block={block} 
                        index={i} 
                        scrollYProgress={scrollYProgress} 
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="diagram"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-slate-950/50 flex items-center justify-center"
                  >
                    <Mermaid chart={diagramContent} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}
