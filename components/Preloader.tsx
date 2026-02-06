import React from 'react';
import type { FC } from 'react';
import { motion } from 'framer-motion';

export const Preloader: FC = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-[#00205b] text-white"
    >
      <div className="relative flex flex-col items-center gap-5">
        {/* Soft glow with custom fade animation from @theme */}
        <div className="pointer-events-none absolute -inset-10 rounded-full bg-white/5 blur-3xl animate-preloader-fade" />

        {/* Logo block */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [0.9, 1.03, 1], opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-tr-3xl rounded-bl-3xl bg-[#c8102e] shadow-2xl shadow-red-500/40"
          >
            <span className="text-4xl font-extrabold tracking-tight text-white">T</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="text-2xl font-bold uppercase tracking-[0.25em]"
          >
            TechBritannia
          </motion.h1>
        </motion.div>

        {/* Progress bar */}
        <div className="relative z-10 mt-2 h-2 w-56 overflow-hidden rounded-full bg-white/20">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            className="h-full rounded-full bg-white"
          />
        </div>
      </div>
    </motion.div>
  );
};