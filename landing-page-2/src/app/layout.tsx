import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import NavigationHeader from "@/components/navigation-header";
import ScrollProgressIndicator from "@/components/ui/scroll-progress-indicator";
import Script from "next/script";

export const metadata: Metadata = {
  title: "SINAIQ - Explore AI Models",
  description: "Explore AI-powered marketing tools and models",
};

/**
 * Total sections in landing-page-2:
 * - StickyCardGallery (intro cards): 3
 * - AIGallery: 1
 * - ScrollExpandSection: 1
 * - WavyTextSection: 1
 * - MaskedDivDemo: 1
 * - LinkPreviewSection: 1
 * - FoggyBlend: 1
 * - DisplayCardsSection: 1
 * - CpuArchitectureSection: 1
 * - PricingSection: 1
 * - FooterSection: 1
 * Total: 13 sections
 */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        <NavigationHeader />
        <ScrollProgressIndicator totalSections={13} />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
