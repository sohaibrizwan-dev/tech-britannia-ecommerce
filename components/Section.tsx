import React from 'react';
import { motion } from 'framer-motion';
import { SectionProps } from '../types';

export const Section: React.FC<SectionProps> = ({ 
  id, 
  className = "", 
  children, 
  title, 
  subtitle,
  dark = false
}) => {
  // If 'dark' prop is true, force dark styles.
  // If false, adapt to global theme (light -> white, dark -> slate-950)
  const bgClass = dark 
    ? 'bg-slate-900 text-white' 
    : 'bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50';

  const subTitleClass = dark 
    ? 'text-slate-300' 
    : 'text-slate-600 dark:text-slate-400';

  return (
    <section 
      id={id} 
      className={`py-16 md:py-24 2xl:py-32 relative overflow-hidden transition-colors duration-300 ${bgClass} ${className}`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8 2xl:px-12 relative z-10 max-w-[2400px]">
        {(title || subtitle) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 2xl:mb-16 text-center max-w-2xl 2xl:max-w-3xl mx-auto"
          >
            {title && (
              <h2 className="text-3xl md:text-4xl 2xl:text-5xl font-bold tracking-tight mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={`text-lg 2xl:text-xl ${subTitleClass}`}>
                {subtitle}
              </p>
            )}
            <div className={`h-1 w-20 2xl:w-24 mx-auto mt-6 rounded-full ${dark ? 'bg-uk-red' : 'bg-uk-blue'}`} />
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
};