'use client';

import type {VideoModalProps} from '@/types';
import {Modal} from '@/components/ui';

export function VideoModal({videoUrl, isOpen, onClose}: VideoModalProps) {
  const embedUrl = videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1';

  return (
    <Modal open={isOpen} onClose={onClose} size="full">
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-lg"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video"
        />
      </div>
    </Modal>
  );
}
