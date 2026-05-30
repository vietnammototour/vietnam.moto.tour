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
      <div className="relative aspect-video border border-on-surface-tertiary bg-surface-deep">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center border border-border bg-surface-elevated text-on-surface-secondary hover:text-on-surface transition-colors cursor-pointer"
        >
          <i className="fa fa-times text-lg" aria-hidden="true" />
        </button>
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
