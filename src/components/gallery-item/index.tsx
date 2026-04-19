import React from 'react';
import { getUrl } from '../../utils/index';
import type { GalleryItemProps } from '@/types';

export const GalleryItem = ({ imageSrc, delay }: GalleryItemProps) => {
  return (
    <li className="wow fadeInUp" data-wow-delay={`${delay}ms`}>
      <div className="gallery-one__img-box">
        <picture style={{ display: 'block', width: '310px', height: '317px', overflow: 'hidden' }}>
          <source srcSet={imageSrc} type="image/webp" />
          <img
            src={imageSrc}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.4)' }} />
        </picture>

        <div className="gallery-one__iocn">
          <a className="img-popup" href={getUrl(imageSrc)}>
            <i className="fab fa-whatsapp"></i>
          </a>
        </div>
      </div>
    </li>
  );
};

