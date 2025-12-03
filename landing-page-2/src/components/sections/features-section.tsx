"use client";

import React from "react";
import { Smartphone, Camera, Battery, Cpu, Shield, Wifi } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Pro Camera System",
    description: "48MP Main camera with advanced computational photography. Capture stunning photos and videos in any lighting condition.",
  },
  {
    icon: Cpu,
    title: "A18 Pro Chip",
    description: "The fastest chip ever in a smartphone. Incredible performance for gaming, AI, and everyday tasks.",
  },
  {
    icon: Battery,
    title: "All-Day Battery",
    description: "Up to 29 hours of video playback. Fast charging gets you 50% in just 30 minutes.",
  },
  {
    icon: Shield,
    title: "Advanced Security",
    description: "Face ID, end-to-end encryption, and the most secure mobile operating system.",
  },
  {
    icon: Wifi,
    title: "5G & Wi-Fi 7",
    description: "Blazing fast connectivity wherever you go. Download movies in seconds.",
  },
  {
    icon: Smartphone,
    title: "Titanium Design",
    description: "Aerospace-grade titanium. Lighter, stronger, and more durable than ever.",
  },
];

const FeaturesSection = () => {
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Curved transition at the top */}
      <div className="relative h-24 w-full overflow-hidden">
        <div className="absolute inset-0 bg-white rounded-t-[3rem]" />
      </div>
      
      {/* Content */}
      <div className="relative bg-white px-6 py-16 md:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          {/* Section Header removed per request */}
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl bg-gray-50 p-8 transition-all duration-300 hover:bg-gray-100 hover:shadow-lg"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-black text-white transition-transform duration-300 group-hover:scale-110">
                  <feature.icon size={28} />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          
          {/* Call to Action */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 md:text-3xl">
              Experience the future of smartphones
            </h3>
            <p className="mt-4 text-gray-600">
              Starting at $999. Trade-in values available.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:scale-105">
                Buy Now
              </button>
              <button className="rounded-full border border-gray-300 bg-white px-8 py-4 text-sm font-medium text-gray-900 transition-all hover:bg-gray-50 hover:scale-105">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* "Compare Models" block removed per request */}
    </div>
  );
};

export default FeaturesSection;
