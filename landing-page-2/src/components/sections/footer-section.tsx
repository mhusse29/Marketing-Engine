"use client";

import { Facebook, Instagram, Mail } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="w-full py-8 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="mailto:info@sinaiq.com"
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Email"
          >
            <Mail className="w-5 h-5" />
          </a>
        </div>
        <p className="text-center text-white/40 text-sm mt-4">
          © {new Date().getFullYear()} SINAIQ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
