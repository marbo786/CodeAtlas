'use client';

import * as React from 'react';
import { useRef, useMemo } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Code, ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { NeonButton } from '@/components/ui/neon-button';

// Deterministic path generation to avoid hydration mismatches
function generatePaths() {
  const paths = [];
  const width = 1200;
  const height = 400;
  
  for (let i = 0; i < 32; i++) {
    const isTop = i % 2 === 0;
    
    const startY = isTop ? (Math.sin(i) * 50 + 50) : (height - (Math.cos(i) * 50 + 50));
    const endY = isTop ? (Math.cos(i) * 50 + 50) : (height - (Math.sin(i) * 50 + 50));
    
    const startX = -100 + (i * 40);
    const endX = width + 100 - (i * 30);
    
    const cp1x = startX + (width / 3) + (Math.sin(i) * 100);
    const cp1y = isTop ? height / 3 : height * (2/3);
    
    const cp2x = endX - (width / 3) - (Math.cos(i) * 100);
    const cp2y = isTop ? height * (2/3) : height / 3;
    
    paths.push(`M ${startX.toFixed(2)} ${startY.toFixed(2)} C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`);
  }
  return paths;
}

export function InteractiveCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  // Mouse Parallax Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const pathLayerX = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const pathLayerY = useTransform(springY, [-0.5, 0.5], [-8, 8]);

  const paths = useMemo(() => generatePaths(), []);
  const titleWords = "Ready to see it in action?".split(" ");

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative rounded-3xl overflow-hidden bg-background border border-border p-6 md:p-12 text-center flex flex-col items-center shadow-2xl group"
    >
      {/* Background Interactive Dependency Paths */}
      <motion.div 
        style={{ x: pathLayerX, y: pathLayerY }}
        className="absolute inset-0 z-0 pointer-events-none opacity-0"
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      >
        <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full opacity-[0.85]">
          {paths.map((p, i) => {
            const isLeftToRight = i % 2 === 0;
            const duration = 20 + (i % 10); // 20s to 30s cycle
            
            return (
              <g key={i}>
                {/* Base Faint Path */}
                <path 
                  d={p} 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeOpacity={0.03} 
                  fill="none" 
                />
                {/* Animated Flow Segment */}
                <motion.path
                  d={p}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeOpacity={0.08}
                  fill="none"
                  strokeDasharray="150 1500" // Length of blip vs gap
                  initial={{ strokeDashoffset: isLeftToRight ? 1650 : -1650 }}
                  animate={{ strokeDashoffset: isLeftToRight ? -1650 : 1650 }}
                  transition={{
                    duration,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(var(--primary),0.05)_0%,transparent_60%)]" />

      <div className="relative z-10 w-full">
        {/* Headline Word-by-Word Reveal */}
        <h2 className="text-3xl md:text-5xl font-bold mb-6 flex flex-wrap justify-center gap-x-3">
          {titleWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
              animate={isInView ? { y: 0, opacity: 1, filter: "blur(0px)" } : {}}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: "easeOut" }}
              className="inline-block text-foreground"
            >
              {word}
            </motion.span>
          ))}
        </h2>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ y: 15, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
          className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
        >
          Explore the repository, read the technical documentation, and deploy your own CodeAtlas intelligence agent.
        </motion.p>
        
        {/* Buttons Sequence */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 1.0, duration: 0.5, ease: "easeOut" }}
          >
            <NeonButton 
              size="lg" 
              className="rounded-full px-8 h-12 shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-shadow duration-500"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              <Code className="mr-2 h-5 w-5" />
              View the Repository
            </NeonButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <a 
              href="https://github.com/readme" 
              target="_blank" 
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full px-8 h-12 border-border bg-background/50 hover:bg-muted/30 hover:border-border/80 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)] transition-all duration-300" })}
            >
              Read the Docs <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
