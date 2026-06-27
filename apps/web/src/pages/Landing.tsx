import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { TrustedBy } from '../components/landing/TrustedBy';
import { CLIDemo } from '../components/landing/CLIDemo';
import { DeveloperWorkflow } from '../components/landing/DeveloperWorkflow';
import { Features } from '../components/landing/Features';
import { PricingPreview } from '../components/landing/PricingPreview';
import { FAQ } from '../components/landing/FAQ';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';
import { Background } from '../components/landing/Background';

export function Landing() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace('/', '');
    if (path) {
      setTimeout(() => {
        const element = document.getElementById(path);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[#080808] overflow-x-hidden font-sans text-white selection:bg-white/20">
      <Background />
      
      <Navbar />
      
      <main className="relative z-10 pt-20 pb-24 flex flex-col items-center">
        <Hero />
        <CLIDemo />
        <TrustedBy />
        <div id="features" className="w-full flex flex-col items-center">
          <Features />
        </div>
        <div id="how-it-works" className="w-full flex flex-col items-center">
          <DeveloperWorkflow />
        </div>
        <div id="pricing" className="w-full flex flex-col items-center">
          <PricingPreview />
        </div>
        <div id="faq" className="w-full flex flex-col items-center">
          <FAQ />
        </div>
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
