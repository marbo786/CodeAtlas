'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';

export function VisionSection() {
  return (
    <section id="vision-section" className="w-full py-24 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center transition-transform will-change-transform">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-2xl"
      >
        <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight mb-4">
          See the unseen.
        </h2>
        <p className="text-lg text-muted-foreground">
          CodeAtlas transforms static files into a living, intelligent graph. Navigate, understand, and secure your entire architecture effortlessly.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-6xl">
        {/* Card 1: Large left card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-5 md:row-span-2 relative rounded-3xl overflow-hidden border border-border bg-card/50 shadow-sm group"
        >
          <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end bg-gradient-to-t from-background/90 via-background/40 to-transparent">
            <span className="text-sm font-medium text-primary mb-2">Not another chatbot bolted onto your repo.</span>
            <h3 className="text-2xl md:text-3xl font-semibold text-white">AI that actually reads your code</h3>
          </div>
          <div className="relative h-[400px] md:h-full min-h-[500px] w-full transform transition-transform duration-700 group-hover:scale-105">
            <Image 
              src="/assets/AI_that_actually_reads_your_code.png" 
              alt="Code editor visualization" 
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-left-top"
            />
          </div>
        </motion.div>

        {/* Card 2: Dark text card with Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-4 relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm group min-h-[250px]"
        >
          <div className="absolute inset-0 z-0">
            <Image 
              src="/assets/Zero_Blind_Spots.png" 
              alt="Zero Blind Spots" 
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover opacity-30 transform transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="relative z-10 p-8 flex flex-col justify-center h-full bg-gradient-to-t from-slate-950/80 to-slate-950/20">
            <h3 className="text-2xl font-semibold text-white mb-3">Zero Blind Spots</h3>
            <p className="text-slate-300 leading-relaxed">
              Every function, every call, every dependency — mapped and queryable. Nothing left unexplained.
            </p>
          </div>
        </motion.div>

        {/* Card 3: Image + Caption */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:col-span-3 rounded-3xl overflow-hidden border border-border bg-card shadow-sm flex flex-col group"
        >
          <div className="relative h-[180px] w-full overflow-hidden bg-muted">
            <Image 
              src="/assets/Vulnerability_scan.png" 
              alt="Vulnerability scan" 
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transform transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="p-6 flex-1 flex items-center">
            <p className="text-sm text-muted-foreground">
              Stop shipping undocumented risk. Catch vulnerabilities before they reach production.
            </p>
          </div>
        </motion.div>

        {/* Card 4: Wide bottom card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-7 rounded-3xl overflow-hidden border border-border bg-card shadow-sm relative group min-h-[250px]"
        >
          <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end bg-gradient-to-t from-background/90 via-background/40 to-transparent">
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">Automated Documentation</h3>
          </div>
          <div className="relative h-full w-full opacity-80 transform transition-transform duration-700 group-hover:scale-105">
            <Image 
              src="/assets/Automated_Documentation.png" 
              alt="Automated documentation diagram" 
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover object-center"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
