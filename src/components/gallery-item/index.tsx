'use client';

import { useState } from 'react';
import type { GalleryItemProps } from '@/types';

export const GalleryItem = ({ imageSrc }: GalleryItemProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setLightboxOpen(true)}
        className="group relative block overflow-hidden rounded-lg aspect-square cursor-pointer"
      >
        <img
          src={imageSrc}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-neutral-900">
            <i className="fa fa-expand" />
          </span>
        </div>
      </button>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white text-2xl hover:text-neutral-300 transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <i className="fa fa-times" />
          </button>
          <img
            src={imageSrc}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
