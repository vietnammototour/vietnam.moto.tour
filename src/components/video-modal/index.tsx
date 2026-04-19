'use client';

import {useEffect} from 'react';
import type {VideoModalProps} from '@/types';

export function VideoModal({videoUrl, isOpen, onClose}: VideoModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Convert YouTube watch URL to embed URL
  const embedUrl = videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl hover:text-on-surface-secondary transition-colors"
          aria-label="Close video"
        >
          <i className="fa fa-times" />
        </button>
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-lg"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video"
        />
      </div>
    </div>
  );
}
