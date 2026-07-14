'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code, ChevronDown, Loader2, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { buttonVariants } from '@/components/ui/button';
import { NeonButton } from '@/components/ui/neon-button';
import { HeroBackground } from './HeroBackground';
import { Input } from '@/components/ui/input';
import { useChatStore } from '@/store/useChatStore';
import { useRepoStore } from '@/store/useRepoStore';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const { clearMessages, resetSession } = useChatStore();
  const { setRepoId } = useRepoStore();

  const ingestMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: url })
      });
      if (!res.ok) throw new Error('Failed to start ingestion');
      return res.json();
    },
    onSuccess: () => {
      clearMessages();
      resetSession();
      setRepoId('latest');
    }
  });

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      ingestMutation.mutate(repoUrl.trim());
    }
  };

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (!isReducedMotion) {
        gsap.fromTo(
          '.hero-element',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
        );

        gsap.to(contentRef.current, {
          y: '30vh',
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section ref={containerRef} className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-background">
      <HeroBackground />
      
      <div ref={contentRef} className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-4xl">
        <h1 className="hero-element text-5xl md:text-7xl font-bold font-heading tracking-tight text-white mb-6 text-balance">
          Understand Your Codebase at the Speed of Thought
        </h1>
        
        <p className="hero-element text-xl text-slate-300 mb-10 max-w-2xl text-balance">
          CodeAtlas is an n8n-native AI intelligence platform that maps your entire repository into an interactive, queryable structural graph.
        </p>
        
        <div className="hero-element w-full max-w-md mx-auto">
          <form onSubmit={handleIngest} className="relative flex items-center w-full">
            <Input
              type="url"
              placeholder="https://github.com/user/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={ingestMutation.isPending}
              className="pr-32 py-6 rounded-full bg-background/50 backdrop-blur-sm border-white/20 focus-visible:ring-primary text-base text-white placeholder:text-muted-foreground w-full shadow-2xl [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
              required
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
            <NeonButton 
              type="submit"
              disabled={ingestMutation.isPending || !repoUrl}
              className="absolute right-1 top-1 bottom-1 h-auto rounded-full px-6 flex items-center disabled:opacity-50 transition-opacity"
            >
              {ingestMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingesting...</>
              ) : ingestMutation.isSuccess ? (
                <><Code className="mr-2 h-4 w-4" /> Ready</>
              ) : (
                <>Analyze <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </NeonButton>
          </form>
          {ingestMutation.isError && (
             <p className="text-red-400 text-sm mt-3 font-medium">Failed to analyze repository. Check your orchestrator.</p>
          )}
          {ingestMutation.isSuccess && (
             <p className="text-green-400 text-sm mt-3 font-medium">Repository analysis complete! Scroll down to explore.</p>
          )}
        </div>
      </div>



      <button 
        aria-label="Scroll down to next section"
        className="hero-element absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-slate-400 hover:text-white transition-colors cursor-pointer group" 
        onClick={scrollToNext}
      >
        <span className="text-xs mb-2 uppercase tracking-widest font-medium opacity-70 group-hover:opacity-100 transition-opacity">Scroll</span>
        <ChevronDown className="h-5 w-5 animate-bounce opacity-70 group-hover:opacity-100 transition-opacity" />
      </button>
    </section>
  );
}
