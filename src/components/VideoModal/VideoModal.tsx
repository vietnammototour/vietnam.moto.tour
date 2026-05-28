'use client';

import {useTranslations} from 'next-intl';
import {Modal} from '@/components/ui';

type Props = {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
};

export function VideoModal({videoUrl, isOpen, onClose}: Props) {
  const t = useTranslations('home');
  const embedUrl = videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1';

  return (
    <Modal open={isOpen} onClose={onClose} size="full">
      <div className="aspect-video border border-on-surface-tertiary bg-surface-deep">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title={t('videoIframeTitle')}
        />
      </div>
    </Modal>
  );
}
