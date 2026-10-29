'use client';

import type { CSSProperties } from 'react';
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

/**
 * Shared shadcn/ui toast outlet backed by sonner.
 * Mount once near the app root; trigger notifications with the re-exported `toast`.
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      richColors
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { toast };
export type { ToasterProps };
