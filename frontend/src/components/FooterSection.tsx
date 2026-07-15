'use client';

import { motion } from 'motion/react';
import { Code } from 'lucide-react';
import { GlowEffect } from '@/components/motion-primitives/glow-effect';
import { Card } from '@/components/ui/card';
import { InteractiveCTA } from '@/components/InteractiveCTA';

const STACK = [
  { name: 'n8n', role: 'Workflow Orchestration', desc: 'Drives the ingestion, query, and analysis pipelines automatically.' },
  { name: 'Tree-sitter', role: 'AST Parsing', desc: 'Parses raw code into a high-fidelity structural syntax tree.' },
  { name: 'FastAPI', role: 'Backend Service', desc: 'Handles the API layer and asynchronous Python processing.' },
  { name: 'Qdrant', role: 'Vector Database', desc: 'Stores code embeddings for semantic search and retrieval.' },
  { name: 'PostgreSQL', role: 'Metadata Database', desc: 'Stores relational metadata, schemas, and historical logs.' },
  { name: 'Google Gemini', role: 'AI Reasoning', desc: 'Synthesizes context and provides intelligent conversational answers.' },
];

const FOOTER_LINKS = [
  { label: 'GitHub', href: 'https://github.com/marbo786/CodeAtlas', external: true },
  { label: 'Documentation', href: '#docs' },
  { label: 'License', href: 'https://github.com/marbo786/CodeAtlas/blob/main/LICENSE', external: true },
  { label: 'Privacy Policy', href: 'https://github.com/marbo786/CodeAtlas', external: true },
];

export function FooterSection() {

  return (
    <footer className="w-full bg-background border-t border-border mt-12">
      {/* Stack & CTA Section */}
      <section className="w-full py-24 px-4 md:px-8 max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Powered by a Modern Stack
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            CodeAtlas relies on best-in-class open source and enterprise technologies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-24">
          {STACK.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative h-full group"
            >
              <div className="absolute inset-[-1px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl pointer-events-none z-0">
                <GlowEffect
                  colors={['#0894FF', '#C959DD', '#FF2E54', '#FF9004']}
                  mode="static"
                  blur="medium"
                />
              </div>
              <Card className="relative p-6 h-full bg-card/90 hover:bg-muted/90 transition-colors border-border/60 z-10 backdrop-blur-sm">
                <h3 className="font-semibold text-lg text-foreground flex justify-between items-center">
                  {item.name}
                  <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-full">{item.role}</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <InteractiveCTA />
      </section>

      {/* Premium Spacious Footer */}
      <div className="relative w-full overflow-hidden pt-32 pb-12 mt-12 border-t border-border/10">
        
        {/* Giant Background Wordmark */}
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 0.04 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute bottom-[-10%] md:bottom-[-15%] left-0 w-full flex justify-center pointer-events-none select-none z-0"
        >
          <span className="text-[18vw] font-black font-heading tracking-tighter leading-none text-foreground whitespace-nowrap">
            CODEATLAS
          </span>
        </motion.div>

        {/* Foreground Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center">
          
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
            className="flex items-center gap-3 text-foreground font-bold text-2xl font-heading tracking-widest uppercase mb-12"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Code className="w-4 h-4 text-primary" />
            </div>
            CodeAtlas
          </motion.div>
          
          {/* Main Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 mb-12">
            {FOOTER_LINKS.map((link, index) => (
              <motion.a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.08 * (index + 1), ease: "easeOut" }}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          {/* Copyright */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.08 * 5, ease: "easeOut" }}
            className="text-sm text-muted-foreground/50"
          >
            &copy; {new Date().getFullYear()} CodeAtlas. All rights reserved.
          </motion.p>
        </div>
      </div>
    </footer>
  );
}
