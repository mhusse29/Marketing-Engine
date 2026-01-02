import { useState } from "react";
import { StaggeredMenu } from "./StaggeredMenu";
import type { StaggeredMenuItem, StaggeredMenuSocialItem } from "./StaggeredMenu";

// Use localhost:3000 for landing-page-2 in dev, deployed URL in production
const featuresAppBase = import.meta.env.DEV ? 'http://localhost:3000' : 'https://landing-page-2-ashen.vercel.app';
const landingPage2Url = featuresAppBase;
const aboutPageUrl = `${featuresAppBase}/about`;
const pricingUrl = `${featuresAppBase}/#pricing`;

const menuItems: StaggeredMenuItem[] = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/landing' },
  { label: 'Features', ariaLabel: 'Explore AI Models & Features', link: landingPage2Url },
  { label: 'Pricing', ariaLabel: 'View pricing plans', link: pricingUrl },
  { label: 'App', ariaLabel: 'Open Marketing Engine App', link: '/' },
  { label: 'FAQ', ariaLabel: 'Frequently Asked Questions', link: '/faq' },
  { label: 'About', ariaLabel: 'Learn about SINAIQ', link: aboutPageUrl }
];

const socialItems: StaggeredMenuSocialItem[] = [
  { label: 'Twitter', link: 'https://twitter.com' },
  { label: 'GitHub', link: 'https://github.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' }
];

export default function NavigationMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleMenu = () => {
    if (menuOpen) {
      // Menu is closing - start animation, hide icon during shrink
      setIsAnimating(true);
    }
    setMenuOpen(prev => !prev);
  };

  const handleMenuClose = () => {
    // Called when close animation completes - show icon again
    setTimeout(() => {
      setIsAnimating(false);
    }, 350); // Match the close animation duration (0.32s + buffer)
  };

  // Icon should be hidden when menu is open OR when closing animation is in progress
  const showIcon = !menuOpen && !isAnimating;

  return (
    <>
      {/* Side Menu - matches landing page 1 design */}
      {/* Hidden when menu is open or during close animation */}
      {showIcon && (
        <div className="fixed left-10 top-1/2 -translate-y-1/2 z-[50] flex flex-col items-center gap-10">
          {/* Hamburger Icon */}
          <div 
            onClick={toggleMenu}
            className="w-[30px] h-[30px] flex flex-col justify-between cursor-pointer transition-all duration-300"
          >
            <span className="w-full h-[2px] bg-white/80 transition-all duration-300 hover:bg-white" />
            <span className="w-full h-[2px] bg-white/80 transition-all duration-300 hover:bg-white" />
            <span className="w-full h-[2px] bg-white/80 transition-all duration-300 hover:bg-white" />
          </div>
          
          {/* Vertical Text */}
          <div 
            className="text-white/60 text-sm font-bold tracking-[4px] uppercase"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            MENU
          </div>
        </div>
      )}

      {/* Staggered Menu */}
      <StaggeredMenu
        position="left"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        colors={['#00e676']}
        accentColor="#00e676"
        isFixed={true}
        isOpen={menuOpen}
        onToggle={toggleMenu}
        onMenuClose={handleMenuClose}
      />
    </>
  );
}
