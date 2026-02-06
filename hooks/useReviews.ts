import { useEffect, useState } from 'react';
import { Review } from '../types';
import { storefrontApi } from '../services/storefrontApi';

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await storefrontApi.getReviews();
        setReviews(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
        setError(message);
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return { reviews, loading, error };
};
