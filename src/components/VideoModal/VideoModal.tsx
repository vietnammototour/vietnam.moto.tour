'use client';

import {Modal} from '@/components/ui';

type Props = {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
};

export function VideoModal({videoUrl, isOpen, onClose}: Props) {
  const embedUrl = videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1';

  return (
    <Modal open={isOpen} onClose={onClose} size="full">
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video"
        />
      </div>
    </Modal>
  );
}
