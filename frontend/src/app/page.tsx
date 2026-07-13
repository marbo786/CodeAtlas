import { HeroSection } from '@/components/HeroSection';
import { VisionSection } from '@/components/VisionSection';
import { ChatSection } from '@/components/ChatSection';
import { DocsSection } from '@/components/DocsSection';
import { VulnerabilitySection } from '@/components/VulnerabilitySection';
import { FooterSection } from '@/components/FooterSection';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <HeroSection />
      <VisionSection />
      <ChatSection />
      <DocsSection />
      <VulnerabilitySection />
      <FooterSection />
    </main>
  );
}
