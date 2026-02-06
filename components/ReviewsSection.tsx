import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, Quote } from 'lucide-react';
import { Section } from './Section';
import { storefrontApi } from '../services/storefrontApi';

type FeaturedReview = {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  productImage?: string;
  isVerified: boolean;
  createdAt?: string;
  location?: string;
};

const MOCK_REVIEWS: FeaturedReview[] = [
  {
    id: '1',
    userName: 'Emma Wilson',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    comment:
      'Absolutely love my new laptop from TechBritannia – blazing fast delivery and everything was perfectly packaged.',
    productImage:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    location: 'Manchester, UK',
  },
  {
    id: '2',
    userName: 'James Parker',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    comment:
      'Customer support was brilliant. They helped me choose the perfect gaming setup within my budget.',
    productImage:
      'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    location: 'London, UK',
  },
  {
    id: '3',
    userName: 'Sophie Turner',
    userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    rating: 4.5,
    comment:
      'Great prices and super quick delivery. The headphones sound incredible – will definitely order again.',
    productImage:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    location: 'Bristol, UK',
  },
];

const mapApiReview = (raw: any): FeaturedReview => {
  const id = String(raw._id || raw.id || crypto.randomUUID());

  const userName = raw.userName || raw.name || 'Anonymous';
  const comment = raw.comment || raw.text || '';

  return {
    id,
    userName,
    userAvatar: raw.userAvatar,
    rating: typeof raw.rating === 'number' ? raw.rating : 5,
    comment,
    productImage: raw.productImage,
    isVerified: typeof raw.isVerified === 'boolean' ? raw.isVerified : true,
    createdAt: raw.createdAt,
    location: raw.location,
  };
};

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await storefrontApi.getFeaturedReviews();
        if (!isMounted) return;

        const mapped = data.map(mapApiReview);
        setReviews(mapped.length > 0 ? mapped : MOCK_REVIEWS);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to fetch featured reviews';
        console.error('Error fetching featured reviews:', err);
        setError(message);
        setReviews(MOCK_REVIEWS);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  const sectionStyle = {
    '--color-card-bg': 'rgb(255 255 255 / 1)',
    '--color-card-border': 'rgb(226 232 240 / 1)',
    '--color-card-shadow': '0 10px 25px rgb(15 23 42 / 0.05)',
    '--color-primary': '#e11d48',
    '--color-accent': '#2563eb',
    '--color-star': '#fbbf24',
    '--color-verified': '#16a34a',
  } as CSSProperties;

  const content = (
    <>
      {/* Mobile: horizontal snap carousel */}
      <div className="md:hidden -mx-4">
        <div className="flex snap-x snap-mandatory overflow-x-auto gap-4 px-4 pb-4">
          {(loading ? MOCK_REVIEWS : reviews).map((review, index) => (
            <motion.article
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="snap-start shrink-0 min-w-[85%] pr-2 last:pr-4"
            >
              <ReviewCard review={review} />
            </motion.article>
          ))}
        </div>
      </div>

      {/* Desktop: 3-column grid, 4 on 2xl */}
      <div className="hidden md:grid md:grid-cols-3 2xl:grid-cols-4 gap-6 2xl:gap-8">
        {(loading ? MOCK_REVIEWS : reviews).map((review, index) => (
          <motion.article
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <ReviewCard review={review} />
          </motion.article>
        ))}
      </div>

      {error && (
        <p className="mt-6 text-center text-sm text-slate-400">
          Showing sample reviews while we connect to live data.
        </p>
      )}
    </>
  );

  return (
    <Section
      title="What Our Customers Say"
      subtitle="Real reviews from UK-based verified buyers"
      className="bg-slate-50 dark:bg-slate-900"
    >
      <div
        className="relative"
        style={sectionStyle}
      >
        {/* Subtle background quote icon */}
        <Quote
          className="hidden md:block absolute -top-8 -right-4 size-16 text-slate-300/30 dark:text-slate-700/40"
        />
        {content}
      </div>
    </Section>
  );
};

const ReviewCard: React.FC<{ review: FeaturedReview }> = ({ review }) => {
  return (
    <div className="group h-full rounded-2xl border border-[--color-card-border] bg-[--color-card-bg] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-[--color-card-shadow]">
      <div className="flex flex-col h-full p-6 gap-4">
        {/* Rating + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1 text-[--color-star]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={18}
                className={i < Math.round(review.rating) ? 'fill-[--color-star]' : 'text-slate-200 dark:text-slate-700'}
              />
            ))}
          </div>
          {review.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[--color-verified] dark:bg-emerald-900/20">
              <CheckCircle2 size={14} />
              Verified Buyer
            </span>
          )}
        </div>

        {/* Comment */}
        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          “{review.comment}”
        </p>

        {/* Footer: user + product */}
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-200">
              {review.userAvatar ? (
                <img
                  src={review.userAvatar}
                  alt={review.userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                review.userName.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                {review.userName}
              </p>
              {review.location && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {review.location}
                </p>
              )}
            </div>
          </div>

          {review.productImage && (
            <div className="hidden sm:block size-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              <img
                src={review.productImage}
                alt="Purchased product"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

