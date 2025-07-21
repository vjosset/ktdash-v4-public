// components/CarouselModal.tsx
import useEmblaCarousel from 'embla-carousel-react';
import React, { useCallback, useEffect } from 'react';
import styles from './CarouselModal.module.css';

export type CarouselItem = {
  imageUrl: string,
  title: string
}

type CarouselModalProps = {
  items: CarouselItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
};

const CarouselModal: React.FC<CarouselModalProps> = ({
  items,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(initialIndex);
    }
  }, [emblaApi, initialIndex]);
  
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock scroll
      document.body.style.overflow = '';
    }

    // Clean up on unmount or modal close
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.embla} ref={emblaRef}>
          <div className={styles.emblaContainer}>
            {items.map((item, index) => (
              <div className={styles.emblaSlide} key={index}>
                <div className="text-center bg-black font-title text-main">
                  <h3>{item.title}</h3>
                  <img src={item.imageUrl} alt={item.title} className={styles.image} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.controls}>
          <button onClick={scrollPrev}>←</button>
          <button onClick={scrollNext}>→</button>
        </div>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
      </div>
    </div>
  );
};

export default CarouselModal;
