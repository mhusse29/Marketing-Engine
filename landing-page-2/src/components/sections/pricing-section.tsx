"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, X, Star, Zap, Building2, CreditCard, Sparkles, Rocket, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

interface Feature {
  name: string;
  included: boolean;
  detail?: string;
}

interface PricingPlan {
  name: string;
  icon: React.ReactNode;
  price: number | string;
  yearlyPrice: number | string;
  period: string;
  credits: string;
  features: Feature[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  savingsPercent?: number;
  badge?: string;
}

interface PayAsYouGoOption {
  credits: number;
  price: number;
  bonus: number;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    icon: <Sparkles className="h-6 w-6" />,
    price: 0,
    yearlyPrice: 0,
    period: "month",
    credits: "50 credits",
    features: [
      { name: "Media Planner", included: true, detail: "Full + Export" },
      { name: "Content", included: true, detail: "GPT-4o-mini" },
      { name: "Images", included: true, detail: "DALL·E Standard" },
      { name: "Video", included: false, detail: "—" },
      { name: "BADU", included: true, detail: "Basic" },
    ],
    description: "Perfect for getting started",
    buttonText: "Get Started Free",
    href: "/signup",
    isPopular: false,
  },
  {
    name: "Pro",
    icon: <Rocket className="h-6 w-6" />,
    price: 29,
    yearlyPrice: 23,
    period: "month",
    credits: "500 credits/month",
    features: [
      { name: "Media Planner", included: true, detail: "Full + Export" },
      { name: "Content", included: true, detail: "GPT-4o" },
      { name: "Images", included: true, detail: "All Providers" },
      { name: "Video", included: true, detail: "All (Luma + Runway)" },
      { name: "BADU", included: true, detail: "Enhanced" },
    ],
    description: "Billed annually at $276/year",
    buttonText: "Start Pro",
    href: "/signup?plan=pro",
    isPopular: true,
    savingsPercent: 20,
    badge: "🚀 Pro",
  },
  {
    name: "Entrepreneur",
    icon: <Briefcase className="h-6 w-6" />,
    price: 79,
    yearlyPrice: 59,
    period: "month",
    credits: "2,000 credits/month",
    features: [
      { name: "Media Planner", included: true, detail: "Full + Export" },
      { name: "Content", included: true, detail: "GPT-4o + GPT-5" },
      { name: "Images", included: true, detail: "All + HD/Ultra" },
      { name: "Video", included: true, detail: "All (Luma + Runway)" },
      { name: "BADU", included: true, detail: "Priority" },
    ],
    description: "Billed annually at $708/year",
    buttonText: "Start Entrepreneur",
    href: "/signup?plan=entrepreneur",
    isPopular: false,
    savingsPercent: 25,
    badge: "💼 Entrepreneur",
  },
  {
    name: "Enterprise",
    icon: <Building2 className="h-6 w-6" />,
    price: "Contact",
    yearlyPrice: "Contact",
    period: "",
    credits: "Custom credits",
    features: [
      { name: "Media Planner", included: true, detail: "Full + Export + Team" },
      { name: "Content", included: true, detail: "All Models" },
      { name: "Images", included: true, detail: "All + Unlimited HD" },
      { name: "Video", included: true, detail: "All Providers" },
      { name: "BADU", included: true, detail: "Dedicated" },
      { name: "Analytics", included: true, detail: "Advanced" },
      { name: "API Access", included: true, detail: "Full" },
      { name: "Support", included: true, detail: "Priority 24/7" },
      { name: "Custom Integrations", included: true, detail: "✓" },
    ],
    description: "Tailored solutions for large teams",
    buttonText: "Contact Sales",
    href: "/contact",
    isPopular: false,
    badge: "🏢 Enterprise",
  },
];

const payAsYouGoOptions: PayAsYouGoOption[] = [
  { credits: 100, price: 8, bonus: 0 },
  { credits: 300, price: 20, bonus: 0 },
  { credits: 700, price: 40, bonus: 0 },
  { credits: 2000, price: 100, bonus: 0 },
];

const payAsYouGoPlan: PricingPlan = {
  name: "Pay As You Go",
  icon: <CreditCard className="h-6 w-6" />,
  price: 5,
  yearlyPrice: 5,
  period: "",
  credits: "Buy credits anytime",
  features: [
    { name: "Media Planner", included: true, detail: "Full + Export" },
    { name: "Content", included: true, detail: "All Models" },
    { name: "Images", included: true, detail: "All Providers" },
    { name: "Video", included: true, detail: "All Providers" },
    { name: "BADU", included: true, detail: "Full" },
  ],
  description: "No subscription required",
  buttonText: "Buy Credits",
  href: "/credits",
  isPopular: false,
  badge: "⚡ Pay As You Go",
};

export default function PricingSection() {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "#22d3ee",
          "#34C759",
          "#a78bfa",
          "#f472b6",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <section className="relative w-full bg-black py-20 md:py-32 overflow-hidden">
      {/* Pure black background */}
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Choose the plan that works for you. All plans include access to our
            platform, lead generation tools, and dedicated support.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center items-center gap-3 mb-12"
        >
          <span className={cn(
            "text-sm font-medium transition-colors",
            isMonthly ? "text-white" : "text-white/50"
          )}>
            Monthly
          </span>
          <Label>
            <Switch
              ref={switchRef as React.RefObject<HTMLButtonElement>}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-white"
            />
          </Label>
          <span className={cn(
            "text-sm font-medium transition-colors",
            !isMonthly ? "text-white" : "text-white/50"
          )}>
            Annual{" "}
            <span className="text-green-400 font-semibold">(Save up to 25%)</span>
          </span>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-3">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{
                y: plan.isPopular && isDesktop ? -10 : 0,
                opacity: 1,
                scale: plan.isPopular && isDesktop ? 1.02 : 1,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: index * 0.1,
              }}
              className={cn(
                "relative rounded-2xl border p-5 bg-white/[0.02] backdrop-blur-sm flex flex-col",
                plan.isPopular
                  ? "border-white/30 shadow-lg shadow-white/5"
                  : "border-white/10 hover:border-white/20",
                "transition-all duration-300"
              )}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[length:200%_100%] bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-shimmer py-1 px-4 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-black text-xs font-semibold">Most Popular</span>
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  plan.isPopular ? "bg-white/10 text-white" : "bg-white/10 text-white/70"
                )}>
                  {plan.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  {typeof plan.price === "number" ? (
                    <>
                      <span className="text-3xl font-bold text-white">
                        <NumberFlow
                          value={isMonthly ? plan.price : (plan.yearlyPrice as number)}
                          format={{
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }}
                          transformTiming={{
                            duration: 500,
                            easing: "ease-out",
                          }}
                          willChange
                        />
                      </span>
                      <span className="text-white/50 text-sm">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-1">
                  {plan.credits}
                </p>
                {plan.savingsPercent && !isMonthly && (
                  <p className="text-green-400 text-xs mt-1 font-medium">
                    Save {plan.savingsPercent}% annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-white/30 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={cn(
                      feature.included ? "text-white/80" : "text-white/40"
                    )}>
                      {feature.name}
                      {feature.detail && feature.included && (
                        <span className="text-white/50 ml-1">· {feature.detail}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full font-semibold transition-all duration-300",
                  plan.isPopular
                    ? "bg-[length:200%_100%] bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-shimmer border-0 text-black shadow-lg"
                    : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                )}
              >
                {plan.buttonText}
              </Link>

              <p className="mt-3 text-xs text-white/40 text-center">
                {plan.description}
              </p>
            </motion.div>
          ))}

          {/* Pay As You Go Card */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.5,
            }}
            className="relative rounded-2xl border border-white/10 p-5 bg-white/[0.02] backdrop-blur-sm flex flex-col hover:border-white/20 transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/10 text-white/70">
                {payAsYouGoPlan.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{payAsYouGoPlan.name}</h3>
            </div>

            {/* Credit Options */}
            <div className="mb-4">
              <p className="text-white/60 text-xs mb-2">Credit Packages:</p>
              <div className="space-y-1.5">
                {payAsYouGoOptions.map((option) => (
                  <div
                    key={option.credits}
                    className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5"
                  >
                    <span className="text-white/80">
                      {option.credits.toLocaleString()} credits
                    </span>
                    <span className="text-white font-medium">${option.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 flex-1 mb-4">
              {payAsYouGoPlan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0" />
                  <span className="text-white/80">
                    {feature.name}
                    {feature.detail && (
                      <span className="text-white/50 ml-1">· {feature.detail}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link
              href={payAsYouGoPlan.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full font-semibold transition-all duration-300",
                "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
              )}
            >
              {payAsYouGoPlan.buttonText}
            </Link>

            <p className="mt-3 text-xs text-white/40 text-center">
              {payAsYouGoPlan.description}
            </p>
          </motion.div>
        </div>

        {/* Professional Services Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="relative rounded-2xl border border-white/10 p-8 md:p-10 bg-white/[0.02] backdrop-blur-sm">

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Description */}
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Need Expert Help?
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Beyond our AI tools, SINAIQ has a team of professional marketers and designers 
                  ready to help you succeed. Whether you need strategic guidance or hands-on 
                  campaign crafting, our experts are here for you.
                </p>
                <div className="pt-2">
                  <Link
                    href="mailto:support@sinaiq.com"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "font-semibold transition-all duration-300",
                      "bg-[#34C759] border-0 text-black hover:bg-[#2db84d] shadow-lg shadow-[#34C759]/25"
                    )}
                  >
                    Contact Our Team
                  </Link>
                </div>
              </div>

              {/* Right Column - Services List */}
              <div className="space-y-3">
                <p className="text-white/40 text-sm font-medium uppercase tracking-wider mb-4">
                  Services Include
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Campaign strategy & planning",
                    "Brand identity development",
                    "Custom creative direction",
                    "Content calendar creation",
                    "Ad campaign setup & optimization",
                    "Landing page design",
                    "Full campaign execution",
                    "Performance analytics",
                  ].map((service, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                      <span className="text-white/80">{service}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-white/40 text-xs pt-4">
                  Professional services are quoted based on project scope. We'll provide a clear quote before any work begins.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
