"use client";

import Link from "next/link";
import React from "react";

type NavItem = {
  label: string;
  href: string;
  isFree?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigationData: NavSection[] = [
  {
    title: "Out of the box",
    items: [
      { href: "/v1/skiper1", label: "Anime js scrollbar" },
      { href: "/v1/skiper2", label: "Dynamic island" },
      { href: "/v1/skiper5", label: "Things drag and scroll" },
      { href: "/v1/skiper24", label: "Tik tik color list" },
      { href: "/v1/skiper29", label: "Siena parallax" },
      { href: "/v1/skiper73", label: "Infinite canvas" },
      { href: "/v1/skiper76", label: "Apple Feature Block" },
      { href: "/v1/skiper80", label: "Projects Showcase" },
    ],
  },
  {
    title: "Minimal interactions",
    items: [
      { href: "/v1/skiper3", label: "Apple play button", isFree: true },
      { href: "/v1/skiper4", label: "Theme toggle buttons", isFree: true },
      { href: "/v1/skiper25", label: "Music toggle btn", isFree: true },
      { href: "/v1/skiper26", label: "Theme toggle btn", isFree: true },
      { href: "/v1/skiper27", label: "Rolling text" },
      { href: "/v1/skiper37", label: "Animated number", isFree: true },
      { href: "/v1/skiper40", label: "CssLink", isFree: true },
      { href: "/v1/skiper42", label: "Animated icons" },
      { href: "/v1/skiper58", label: "Text roll navigation", isFree: true },
      { href: "/v1/skiper61", label: "Mouse follow animations", isFree: true },
      { href: "/v1/skiper63", label: "Apple squicircle effect", isFree: true },
      { href: "/v1/skiper64", label: "Gooey Effect", isFree: true },
      { href: "/v1/skiper66", label: "SVG clip path mask", isFree: true },
      { href: "/v1/skiper67", label: "Video player", isFree: true },
      { href: "/v1/skiper68", label: "Animated number input" },
      { href: "/v1/skiper69", label: "Skiper Number flow" },
      { href: "/v1/skiper70", label: "Text reveal box" },
      { href: "/v1/skiper72", label: "Horizontal Text reveal" },
      { href: "/v1/skiper86", label: "Apple Ai gradient" },
      { href: "/v1/skiper87", label: "Scroll with fade effect", isFree: true },
    ],
  },
  {
    title: "Crazy Hover",
    items: [
      { href: "/v1/skiper6", label: "Hover members" },
      { href: "/v1/skiper18", label: "Image cursor trail" },
      { href: "/v1/skiper35", label: "Image trail hover" },
    ],
  },
];

const Divider = () => <span className="block h-[1px] w-[32px] bg-foreground/20" />;

const SectionHeader = ({ title }: { title: string }) => (
  <div className="group relative flex h-px cursor-pointer items-center gap-3 after:absolute after:left-0 after:top-1/2 after:size-full after:-translate-y-1/2 after:py-[14px]">
    <span className="inline-block h-[1px] w-[32px] bg-foreground"></span>
    <span className="whitespace-nowrap text-foreground transition-all ease-out">{title}</span>
  </div>
);

const NavLink = ({ href, label, isFree }: NavItem) => (
  <Link
    href={href}
    className="group relative flex h-px cursor-pointer items-center gap-3 after:absolute after:left-0 after:top-1/2 after:size-full after:-translate-y-1/2 after:py-[14px]"
  >
    <span className="inline-block h-[1px] w-[32px] bg-foreground/20 transition-colors duration-200 ease-out group-hover:bg-sky-500" />
    <span className="whitespace-nowrap text-foreground/40 opacity-100 transition-all duration-200 ease-out group-hover:text-sky-500 group-hover:text-opacity-100">
      {label}{" "}
      {isFree && <sup className="text-[10px] font-medium">free</sup>}
    </span>
  </Link>
);


export default function SidebarNavigation() {
  return (
    <aside className="fixed left-2 top-0 z-20 h-[100dvh] w-[300px] p-2">
      <div
        data-lenis-prevent="true"
        className="relative h-full w-full overflow-y-scroll rounded-3xl bg-sidebar-background/[0.6] pl-3 text-[15px] tracking-tight backdrop-blur-xl [scrollbar-width:none] dark:bg-sidebar-background"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-32 w-full bg-gradient-to-b from-sidebar-background to-transparent dark:from-sidebar-background" />
        <div className="relative flex h-fit flex-col gap-2 pb-[15vh] pt-[32vh]">
          {navigationData.map((section, sectionIndex) => (
            <React.Fragment key={section.title}>
              <SectionHeader title={section.title} />
              <Divider />
              <Divider />
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={item.href}>
                  <NavLink {...item} />
                  {itemIndex < section.items.length - 1 ? (
                    <>
                      <Divider />
                      <Divider />
                    </>
                  ) : (
                    <>
                      <Divider />
                      <Divider />
                      <Divider />
                      <Divider />
                      <Divider />
                      <Divider />
                    </>
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-32 w-full bg-gradient-to-t from-sidebar-background to-transparent dark:from-sidebar-background" />
      </div>
    </aside>
  );
}