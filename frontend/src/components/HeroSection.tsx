'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code, ChevronDown } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { NeonButton } from '@/components/ui/neon-button';
import { HeroBackground } from './HeroBackground';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
      
      <div ref={contentRef} className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl">
        <h1 className="hero-element text-5xl md:text-7xl font-bold font-heading tracking-tight text-white mb-6 text-balance">
          Understand Your Codebase at the Speed of Thought
        </h1>
        
        <p className="hero-element text-xl text-slate-300 mb-10 max-w-2xl text-balance">
          CodeAtlas is an n8n-native AI intelligence platform that maps your entire repository into an interactive, queryable structural graph.
        </p>
        
        <div className="hero-element flex justify-center">
          <NeonButton 
            size="lg" 
            className="rounded-full px-8 text-base h-12"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            <Code className="mr-2 h-5 w-5" />
            View Repository
          </NeonButton>
        </div>
      </div>

      <div className="hero-element absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-slate-400 animate-pulse cursor-pointer" onClick={scrollToNext}>
        <span className="text-sm mb-2 uppercase tracking-widest">Scroll</span>
        <ChevronDown className="h-5 w-5" />
      </div>
    </section>
  );
}
