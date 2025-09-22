import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

import { cn } from '../../lib/format';
import { menuSurface } from '../../ui/tokens';

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;
export const HoverCardPortal = HoverCardPrimitive.Portal;
export const HoverCardArrow = HoverCardPrimitive.Arrow;

export const HoverCardContent = forwardRef<
  ElementRef<typeof HoverCardPrimitive.Content>,
  ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'center', collisionPadding = 12, sideOffset = 12, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      collisionPadding={collisionPadding}
      sideOffset={sideOffset}
      className={cn(menuSurface, className)}
      {...props}
    />
  </HoverCardPrimitive.Portal>
));

HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;
