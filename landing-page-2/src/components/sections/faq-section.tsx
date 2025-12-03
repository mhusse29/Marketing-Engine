"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

interface FAQItem {
  id: string;
  title: string;
  content: string | React.ReactNode;
}

interface FAQCategory {
  category: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    category: "General",
    items: [
      {
        id: "general-1",
        title: "What is SINAIQ?",
        content:
          "SINAIQ is an AI-powered marketing platform that combines intelligent content creation, image generation, video production, and media planning—all in one place. We help marketers, creators, and businesses produce professional marketing assets in minutes, not hours.",
      },
      {
        id: "general-2",
        title: "What does SINAIQ stand for?",
        content:
          "SINAIQ is inspired by Sinai—the legendary Egyptian land that has connected continents, cultures, and civilizations throughout history. A crossroads of ancient trade routes, religious significance, and pivotal historical events, Sinai represents the bridge between worlds. We paired this with IQ (Intelligence Quotient) and AI (Artificial Intelligence) to represent our mission: bridging human creativity with machine intelligence. Just as Sinai connected East and West, SINAIQ connects your vision with the power of AI to craft marketing that moves people. SINA (The Land) + IQ (Intelligence) + AI (Artificial Craft) = SINAIQ",
      },
      {
        id: "general-3",
        title: "Who is SINAIQ for?",
        content:
          "Solo creators building their personal brand, marketing teams scaling content production, agencies managing multiple client campaigns, small businesses competing with enterprise-level marketing, and entrepreneurs launching products and services.",
      },
    ],
  },
  {
    category: "Platform & Features",
    items: [
      {
        id: "platform-1",
        title: "What can I create with SINAIQ?",
        content:
          "Content: AI-written copy for ads, social posts, emails, landing pages. Images: Professional visuals using DALL·E, FLUX, Stability, and Ideogram. Videos: Marketing videos with Runway and Luma AI models. Media Plans: Data-driven campaign planning with our Media Planner.",
      },
      {
        id: "platform-2",
        title: "What is the Media Planner?",
        content:
          "Our Media Planner is a free tool that helps you calculate budgets, forecast reach, and plan campaigns across platforms. It's included free in all tiers—no credits required.",
      },
      {
        id: "platform-3",
        title: "What is BADU?",
        content:
          "BADU is your AI marketing assistant built into SINAIQ. Ask BADU anything about your campaigns, get creative suggestions, analyze your content, or learn how to use the platform. BADU understands your brand context and provides personalized recommendations.",
      },
      {
        id: "platform-4",
        title: "Which AI models do you use?",
        content:
          "Content: GPT-4o-mini, GPT-4o, GPT-5. Images: DALL·E 3, FLUX Pro, Stability SD 3.5, Ideogram. Video: Runway Gen-4 Turbo, Runway Gen-3 Alpha, Veo 3, Luma Ray-2.",
      },
      {
        id: "platform-5",
        title: "Can I upload my own images for video generation?",
        content:
          "Yes! Both Runway and Luma support image-to-video generation. Upload a reference image and our AI will animate it into a professional video.",
      },
    ],
  },
  {
    category: "Professional Services",
    items: [
      {
        id: "services-1",
        title: "Do you offer professional marketing support?",
        content:
          "Yes! Beyond our AI tools, SINAIQ has a team of professional marketers and designers ready to help you succeed. Services include: Campaign strategy & planning, Brand identity development, Custom creative direction, Content calendar creation, Ad campaign setup & optimization, Landing page design, and Full campaign execution. Contact us at support@sinaiq.com to discuss your needs.",
      },
      {
        id: "services-2",
        title: "How much do professional services cost?",
        content:
          "Professional services are quoted based on project scope and complexity. Some requests may require additional credits or custom pricing beyond your subscription. We'll provide a clear quote before any work begins.",
      },
      {
        id: "services-3",
        title: "Can your team manage my entire campaign?",
        content:
          "Yes! Our team can handle everything from strategy to execution. This is ideal for businesses that want expert-crafted campaigns without the learning curve. Contact support@sinaiq.com for a consultation.",
      },
      {
        id: "services-4",
        title: "What's the difference between AI tools and professional services?",
        content:
          "AI Tools (Self-Service): Instant speed, credits only cost, you create with full control—best for daily content needs. Professional Services: 2-5 business days, custom quote, we create for you—best for major campaigns and launches.",
      },
    ],
  },
  {
    category: "Credits & Pricing",
    items: [
      {
        id: "credits-1",
        title: "How do credits work?",
        content:
          "Credits are the universal currency in SINAIQ. Each action costs credits based on complexity: Content generation: 1-2 credits, Image generation: 4-8 credits, Video generation: 10-50 credits, BADU messages: 1 credit.",
      },
      {
        id: "credits-2",
        title: "Do unused credits expire?",
        content:
          "Subscription plans: Credits roll over to the next month (limits apply per tier). Pay As You Go: Credits are valid for 12 months from purchase.",
      },
      {
        id: "credits-3",
        title: "Can I upgrade or downgrade my plan?",
        content:
          "Yes! You can change your plan anytime. When upgrading, you get immediate access to new features. When downgrading, changes take effect at your next billing cycle.",
      },
      {
        id: "credits-4",
        title: "Is there a free trial?",
        content:
          "Yes! Our Free tier gives you 50 credits per month forever—no credit card required. Experience the full platform before committing.",
      },
      {
        id: "credits-5",
        title: "What payment methods do you accept?",
        content:
          "We accept all major credit cards, debit cards, and PayPal. Enterprise customers can pay via invoice.",
      },
      {
        id: "credits-6",
        title: "Do you offer refunds?",
        content:
          "We offer a 14-day money-back guarantee on all subscription plans. If you're not satisfied, contact us for a full refund.",
      },
    ],
  },
  {
    category: "Video Generation",
    items: [
      {
        id: "video-1",
        title: "How long can my videos be?",
        content:
          "Luma Ray-2: 5 or 9 seconds. Runway Gen-4/Gen-3: 5 or 10 seconds. Veo 3: 8 seconds (fixed).",
      },
      {
        id: "video-2",
        title: "What video formats are supported?",
        content:
          "All videos are exported in MP4 format at high resolution, optimized for social media platforms.",
      },
      {
        id: "video-3",
        title: "Can I control camera movement in videos?",
        content:
          "Yes! Luma Ray-2 offers 19 creative parameters including camera movement, angles, lighting, mood, and motion intensity.",
      },
      {
        id: "video-4",
        title: "How long does video generation take?",
        content:
          "Luma: ~30-45 seconds. Runway: ~60-90 seconds. Veo 3: ~60-120 seconds.",
      },
    ],
  },
  {
    category: "Image Generation",
    items: [
      {
        id: "image-1",
        title: "What image sizes are available?",
        content:
          "We support all standard aspect ratios: Square (1:1) - Instagram feed, Portrait (9:16) - Stories, Reels, TikTok, Landscape (16:9) - YouTube, websites, and more custom ratios per provider.",
      },
      {
        id: "image-2",
        title: "Can I generate images with text/logos?",
        content:
          "Yes! Ideogram specializes in typography and text-in-image generation. Perfect for branded assets and social graphics.",
      },
      {
        id: "image-3",
        title: "What's the difference between Standard and HD images?",
        content:
          "Standard: Fast generation, good for drafts and social media. HD: Higher detail, better for print and professional use (costs more credits).",
      },
    ],
  },
  {
    category: "Content Generation",
    items: [
      {
        id: "content-1",
        title: "What types of content can I generate?",
        content:
          "Social media posts (all platforms), Ad copy (Facebook, Google, LinkedIn), Email campaigns, Landing page copy, Product descriptions, Blog outlines, Video scripts, and more.",
      },
      {
        id: "content-2",
        title: "Can I set my brand voice?",
        content:
          "Yes! BADU learns your preferences over time, and Entrepreneur/Enterprise tiers include custom brand presets for consistent messaging.",
      },
      {
        id: "content-3",
        title: "How many content variants do I get?",
        content:
          "Each generation produces multiple variants so you can A/B test and choose the best performing copy.",
      },
    ],
  },
  {
    category: "Security & Privacy",
    items: [
      {
        id: "security-1",
        title: "Is my data secure?",
        content:
          "Yes. We use enterprise-grade encryption (AES-256) for all data at rest and in transit. Your content and assets are stored securely on Supabase infrastructure.",
      },
      {
        id: "security-2",
        title: "Do you train AI on my content?",
        content:
          "No. Your generated content is yours. We do not use your creations to train AI models.",
      },
      {
        id: "security-3",
        title: "Who owns the content I create?",
        content:
          "You do. All content, images, and videos you generate are 100% yours to use commercially without attribution.",
      },
      {
        id: "security-4",
        title: "Is SINAIQ GDPR compliant?",
        content:
          "Yes. We comply with GDPR, CCPA, and other privacy regulations. You can request data export or deletion at any time.",
      },
    ],
  },
  {
    category: "Enterprise & Teams",
    items: [
      {
        id: "enterprise-1",
        title: "Can I add team members?",
        content:
          "Team collaboration is available on Enterprise plans. Contact sales for team pricing.",
      },
      {
        id: "enterprise-2",
        title: "Do you offer API access?",
        content:
          "Yes! Enterprise customers get full API access to integrate SINAIQ into their workflows.",
      },
      {
        id: "enterprise-3",
        title: "Can I white-label SINAIQ?",
        content:
          "Custom white-label solutions are available for Enterprise customers. Contact sales for details.",
      },
      {
        id: "enterprise-4",
        title: "Do you offer custom integrations?",
        content:
          "Yes. Enterprise plans include custom integrations with your existing marketing stack (CRM, DAM, social schedulers, etc.).",
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        id: "support-1",
        title: "How do I get help?",
        content:
          "Free: BADU assistant + Email support. Pro: Email support (24-48hr response). Entrepreneur: Priority email support (same-day response). Enterprise: Dedicated account manager + 24/7 support. Professional Services: Expert marketers & designers available at support@sinaiq.com.",
      },
      {
        id: "support-2",
        title: "Do you have tutorials?",
        content:
          "Yes! BADU can guide you through any feature. We also have video tutorials and documentation available in-app.",
      },
      {
        id: "support-3",
        title: "How do I report a bug?",
        content:
          "Use the feedback button in the app or email support@sinaiq.com. We typically respond within 24 hours.",
      },
      {
        id: "support-4",
        title: "How do I request professional help with my campaign?",
        content:
          "Email support@sinaiq.com with details about your project. Our team will respond within 24 hours with guidance or a custom quote for hands-on assistance.",
      },
    ],
  },
  {
    category: "Getting Started",
    items: [
      {
        id: "started-1",
        title: "How do I sign up?",
        content:
          "Click \"Get Started Free\" on our homepage. No credit card required—just your email.",
      },
      {
        id: "started-2",
        title: "Can I import existing content?",
        content:
          "Yes! You can upload reference images and existing copy to help BADU understand your brand style.",
      },
      {
        id: "started-3",
        title: "How quickly can I start creating?",
        content:
          "Immediately. Sign up takes 30 seconds, and you can generate your first content within a minute.",
      },
    ],
  },
];

export default function FAQSection() {
  return (
    <section className="relative w-full bg-black py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/5 to-black" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Everything you need to know about SINAIQ
          </p>
        </motion.div>

        {/* FAQ Categories - Nested Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqData.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.05 }}
            >
              <AccordionItem
                value={`category-${categoryIndex}`}
                className="border-white/10 rounded-lg"
              >
                {/* Category Header - Clickable */}
                <AccordionTrigger className="text-left px-6 md:px-14 py-4 text-white/20 duration-200 hover:no-underline cursor-pointer -space-y-6 data-[state=open]:space-y-0 data-[state=open]:text-white [&>svg]:text-white/40 [&[data-state=open]>svg]:text-white [&>svg]:hidden">
                  <h3 className="uppercase text-4xl md:text-6xl font-medium">
                    {category.category}
                  </h3>
                </AccordionTrigger>

                <AccordionContent className="px-0">
                  {/* Inner Accordion for Questions */}
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem
                        value={item.id}
                        key={item.id}
                        className="border-white/10 last:border-b-0"
                      >
                        <AccordionTrigger className="text-left pl-6 md:pl-14 overflow-hidden text-white/20 duration-200 hover:no-underline cursor-pointer -space-y-6 data-[state=open]:space-y-0 data-[state=open]:text-white [&>svg]:text-white/40 [&[data-state=open]>svg]:text-white [&>svg]:hidden">
                          <div className="flex flex-1 items-start gap-4">
                            <p className="text-xs text-white/30 min-w-[20px]">
                              {String(itemIndex + 1).padStart(2, "0")}
                            </p>
                            <h4 className="uppercase text-3xl md:text-5xl font-medium">
                              {item.title}
                            </h4>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="text-white/60 pb-6 pl-6 md:pl-[4.5rem] pr-6 md:pr-14 text-base leading-relaxed">
                          {item.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center space-y-4"
        >
          <p className="text-white text-sm">
            Have a question not answered here?{" "}
            <span className="text-white font-medium">Ask BADU</span> or contact our
            team at{" "}
            <a
              href="mailto:support@sinaiq.com"
              className="text-white font-medium hover:underline"
            >
              support@sinaiq.com
            </a>
          </p>
          <p className="text-white/60 text-xs">
            Need expert help? Our professional marketers and designers are
            available for campaign guidance and custom creative work.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
