import AIGallery from "@/components/sections/ai-gallery";
import CpuArchitectureSection from "@/components/sections/cpu-architecture-section";
import DisplayCardsSection from "@/components/sections/display-cards-section";
import { FooterSection } from "@/components/sections/footer-section";
import LinkPreviewSection from "@/components/sections/link-preview-section";
import MaskedDivDemo from "@/components/sections/masked-div-demo";
import PricingSection from "@/components/sections/pricing-section";
import ScrollExpandSection from "@/components/sections/scroll-expand-section";
import StickyCardGallery from "@/components/sections/sticky-card-gallery";
import WavyTextSection from "@/components/sections/wavy-text-section";
import FoggyBlend from "@/components/ui/foggy-blend";

export default function Home() {
  return (
    <StickyCardGallery>
      {/* AIGallery appears after the sticky cards */}
      <AIGallery />
      {/* Scroll Expand Media section */}
      <ScrollExpandSection />
      {/* Wavy Text section */}
      <WavyTextSection />
      {/* MaskedDiv demo section */}
      <MaskedDivDemo />
      {/* Link Preview section with integrated Ruler Carousel */}
      <LinkPreviewSection />
      {/* Foggy blend transition from white to black */}
      <FoggyBlend />
      {/* Display Cards section */}
      <DisplayCardsSection />
      {/* CPU Architecture visualization */}
      <CpuArchitectureSection />
      {/* Pricing section */}
      <PricingSection />
      {/* Footer */}
      <FooterSection />
    </StickyCardGallery>
  );
}