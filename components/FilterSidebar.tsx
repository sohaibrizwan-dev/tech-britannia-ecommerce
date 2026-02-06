import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2, ChevronDown, RotateCcw } from 'lucide-react';
import { formatGBP } from '../services/formatters';
import { useCategories, useBrands } from '../hooks/useProducts';

interface FilterSidebarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  priceRange: number;
  setPriceRange: (price: number) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  className?: string;
  totalProducts?: number;
  categoryCounts?: Record<string, number>;
  selectedBrands?: string[];
  setSelectedBrands?: (brands: string[]) => void;
  onClose?: () => void;
}

// Collapsible filter section component
const FilterSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}> = ({ title, children, defaultOpen = true, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {title}
          {badge !== undefined && badge > 0 && (
            <span className="text-xs bg-uk-blue text-white px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 group-hover:text-uk-blue transition-colors"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  className = "",
  totalProducts = 0,
  categoryCounts = {},
  selectedBrands = [],
  setSelectedBrands = (_) => {},
  onClose
}) => {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { brands, loading: brandsLoading, error: brandsError } = useBrands();

  const hasActiveFilters = selectedCategory !== 'All' || selectedBrands.length > 0 || priceRange < 5000 || minRating > 0;

  const handleClearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedBrands([]);
    setPriceRange(5000);
    setMinRating(0);
  };

  const handleBrandToggle = (brandName: string) => {
    if (selectedBrands.includes(brandName)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brandName));
    } else {
      setSelectedBrands([...selectedBrands, brandName]);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 p-6 backdrop-blur-sm ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
          {totalProducts > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {totalProducts} products found
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={handleClearAllFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-uk-red hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
            >
              <RotateCcw size={12} />
              Clear All
            </motion.button>
          )}
          {onClose && (
            <button 
              onClick={onClose} 
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {/* Categories */}
        <FilterSection title="Categories" badge={selectedCategory !== 'All' ? 1 : undefined}>
          <ul className="space-y-1">
            <li 
              onClick={() => setSelectedCategory('All')}
              className={`cursor-pointer transition-all duration-200 flex justify-between items-center px-3 py-2 rounded-lg ${
                selectedCategory === 'All' 
                  ? 'bg-uk-blue/10 text-uk-blue font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-uk-blue'
              }`}
            >
              <span>All Products</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
                {totalProducts}
              </span>
            </li>
            {categoriesLoading && (
              <li className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm px-3 py-2">
                <Loader2 className="animate-spin" size={14} />
                Loading categories...
              </li>
            )}
            {categoriesError && !categoriesLoading && (
              <li className="text-xs text-red-500 px-3 py-2">Failed to load categories.</li>
            )}
            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <li className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2">No categories available.</li>
            )}
            {!categoriesLoading && !categoriesError && categories.length > 0 && categories.map(cat => {
              const isSelected = selectedCategory === cat.name;

              return (
                <motion.li 
                  key={cat.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedCategory(cat.name)} 
                  className={`cursor-pointer transition-all duration-200 flex justify-between items-center px-3 py-2 rounded-lg ${
                    isSelected 
                      ? 'bg-uk-blue/10 text-uk-blue font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-uk-blue'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isSelected && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-uk-blue"
                    />
                  )}
                </motion.li>
              );
            })}
          </ul>
        </FilterSection>
        
        {/* Price Range */}
        <FilterSection title="Price Range" badge={priceRange < 5000 ? 1 : undefined}>
          <div className="px-1">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">Max:</span>
              <span className="text-lg font-bold text-uk-blue">{formatGBP(priceRange)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5000" 
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uk-blue"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-3">
              <span>£0</span>
              <span>£2,500</span>
              <span>£5,000+</span>
            </div>
          </div>
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection title="Minimum Rating" badge={minRating > 0 ? 1 : undefined}>
          <div className="space-y-1">
            {[4, 3, 2, 1].map((rating) => (
              <label 
                key={rating} 
                className={`flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 ${
                  minRating === rating 
                    ? 'bg-uk-blue/10' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input 
                  type="radio" 
                  name="rating" 
                  checked={minRating === rating}
                  onChange={() => setMinRating(rating)}
                  className="w-4 h-4 text-uk-blue border-slate-300 focus:ring-uk-blue cursor-pointer"
                />
                <span className={`flex items-center gap-2 transition-colors ${
                  minRating === rating ? 'text-uk-blue font-medium' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200 dark:text-slate-700"} 
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">& Up</span>
                </span>
              </label>
            ))}
            <label 
              className={`flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 ${
                minRating === 0 
                  ? 'bg-uk-blue/10' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input 
                type="radio" 
                name="rating" 
                checked={minRating === 0}
                onChange={() => setMinRating(0)}
                className="w-4 h-4 text-uk-blue border-slate-300 focus:ring-uk-blue cursor-pointer"
              />
              <span className={`text-sm transition-colors ${
                minRating === 0 ? 'text-uk-blue font-medium' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Any Rating
              </span>
            </label>
          </div>
        </FilterSection>

        {/* Brand Filter */}
        <FilterSection 
          title="Brands" 
          defaultOpen={true}
          badge={selectedBrands.length > 0 ? selectedBrands.length : undefined}
        >
          <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {brandsLoading && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm px-3 py-2">
                <Loader2 className="animate-spin" size={14} />
                Loading brands...
              </div>
            )}
            {brandsError && !brandsLoading && (
              <div className="text-xs text-red-500 px-3 py-2">Failed to load brands.</div>
            )}
            {!brandsLoading && !brandsError && brands.length === 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2">No brands available.</div>
            )}
            {!brandsLoading && !brandsError && brands.length > 0 && brands.map((brand) => {
              const isSelected = selectedBrands.includes(brand.name);
              return (
                <motion.label 
                  key={brand.name} 
                  whileHover={{ x: 2 }}
                  className={`flex items-center justify-between gap-3 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 ${
                    isSelected 
                      ? 'bg-uk-blue/10' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleBrandToggle(brand.name)}
                      className="w-4 h-4 rounded border-slate-300 text-uk-blue focus:ring-uk-blue cursor-pointer" 
                    />
                    <span className={`text-sm transition-colors ${
                      isSelected ? 'text-uk-blue font-semibold' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {brand.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {brand.count}
                  </span>
                </motion.label>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </div>
  );
};
