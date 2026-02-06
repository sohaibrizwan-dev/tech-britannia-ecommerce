import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = ({ className = '', variant = 'rectangular', width, height }: SkeletonProps) => {
  const baseClasses = 'bg-slate-200 dark:bg-slate-800 animate-pulse';
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4 mb-2',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-4 space-y-4">
    <Skeleton height={200} />
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="text" width="40%" />
    <div className="flex justify-between items-center pt-2">
      <Skeleton variant="text" width="30%" />
      <Skeleton variant="circular" width={40} height={40} />
    </div>
  </div>
);

export const CategorySkeleton = () => (
  <div className="flex flex-col items-center space-y-3">
    <Skeleton variant="circular" width={80} height={80} />
    <Skeleton variant="text" width={60} />
  </div>
);
