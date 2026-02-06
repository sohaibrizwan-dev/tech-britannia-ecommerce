import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  name: string;
  isRecentlyAdded?: boolean;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, name, isRecentlyAdded }) => {
  const [[page, direction], setPage] = useState([0, 0]);

  // Calculate active index safely
  const imageIndex = Math.abs(page % images.length);
  
  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const jumpTo = (index: number) => {
    const diff = index - imageIndex;
    if (diff !== 0) {
      setPage([page + diff, diff > 0 ? 1 : -1]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Carousel Area */}
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden group">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={page}
            src={images[imageIndex]}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 w-full h-full object-cover"
            alt={`${name} view ${imageIndex + 1}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
          />
        </AnimatePresence>

        {isRecentlyAdded && (
          <span className="absolute top-4 left-4 bg-uk-blue text-white px-3 py-1 text-xs font-bold rounded-full z-10 shadow-lg pointer-events-none">
            NEW ARRIVAL
          </span>
        )}

        {/* Navigation Arrows (Only show if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => paginate(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 shadow-lg z-20 outline-none focus:ring-2 focus:ring-uk-blue"
              aria-label="Previous Image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 shadow-lg z-20 outline-none focus:ring-2 focus:ring-uk-blue"
              aria-label="Next Image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => jumpTo(idx)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${
                imageIndex === idx
                  ? 'border-uk-blue ring-2 ring-blue-100 dark:ring-blue-900 opacity-100'
                  : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Swipe helpers
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};