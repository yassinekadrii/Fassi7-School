'use client';

import { useEffect } from 'react';

/**
 * BrandProtection Component
 * Prevents unauthorized copying, dragging, right-click saving, and long-press saving
 * of Fassi7 official brand identity, logos, 3D mascots, and artwork.
 */
export function BrandProtection() {
  useEffect(() => {
    // 1. Prevent right-click context menu on images and brand elements
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isImage =
        target.tagName === 'IMG' ||
        target.tagName === 'PICTURE' ||
        target.tagName === 'SVG' ||
        target.closest('img') ||
        target.closest('picture') ||
        target.closest('.brand-protected') ||
        target.getAttribute('data-protected') === 'true';

      if (isImage) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 2. Prevent dragging images to desktop or other browser windows
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.tagName === 'IMG' || target.closest('img') || target.closest('.brand-protected')) {
        e.preventDefault();
      }
    };

    // 3. Prevent keyboard shortcuts often used to scrape/save images (Ctrl+S / Cmd+S)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
