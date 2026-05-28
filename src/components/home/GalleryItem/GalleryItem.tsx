'use client';

import {useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';

type Props = {
  imageSrc: string;
  alt: string;
  delay: number;
};

export const GalleryItem = ({imageSrc, alt}: Props) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const tc = useTranslations('common');

  return (
    <>
      <button
        data-testid="gallery-item"
        onClick={() => setLightboxOpen(true)}
        aria-label={alt}
        className="group relative block overflow-hidden aspect-square cursor-pointer bg-surface-alt"
      >
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-colors duration-300 flex items-center justify-center">
          <span className="w-10 h-10 border border-on-surface-accent flex items-center justify-center text-on-surface-accent opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fa fa-expand" aria-hidden="true" />
          </span>
        </div>
      </button>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 border border-on-surface-accent text-on-surface-accent hover:bg-primary hover:text-on-primary transition-colors cursor-pointer flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
            aria-label={tc('close')}
          >
            <i className="fa fa-times" aria-hidden="true" />
          </button>
          <Image
            src={imageSrc}
            alt={alt}
            width={1600}
            height={1200}
            unoptimized
            className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain border border-on-surface-tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
