import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, SlidersHorizontal, Star, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { formatGBP } from '../services/formatters';
import { productService } from '../services/productService';
import { useCategories } from '../hooks/useProducts';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (p: Product, q?: number) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onAddToCart }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search and filter
  useEffect(() => {
    // Only search if there is a query or if filters are modified from default
    const isDefaultFilters = selectedCategory === 'All' && maxPrice === 5000 && minRating === 0;
    
    if (query.length > 0 || !isDefaultFilters) {
      const timer = setTimeout(async () => {
        try {
          setLoading(true);
          const response = await productService.getProducts({
            search: query,
            category: selectedCategory === 'All' ? undefined : selectedCategory,
            maxPrice: maxPrice < 5000 ? maxPrice : undefined, // Only send if restricted
            minRating: minRating > 0 ? minRating : undefined,
            limit: 12
          });
          setResults(response.data);
        } catch (err) {
          console.error("Search error:", err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query, selectedCategory, maxPrice, minRating]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset filters when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedCategory('All');
      setMaxPrice(5000);
      setMinRating(0);
      setShowFilters(false);
      setResults([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-xl flex flex-col overflow-y-auto"
      >
        <div className="container mx-auto px-4 py-8 min-h-full flex flex-col">
          {/* Header / Close */}
          <div className="flex justify-between items-center mb-8">
             <h2 className="text-white font-bold text-xl flex items-center gap-2">
               <Search size={20} className="text-uk-blue" /> Search Store
             </h2>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
              aria-label="Close search"
            >
              <X size={24} />
            </button>
          </div>

          <div className="max-w-4xl mx-auto w-full flex-1">
            {/* Search Input */}
            <div className="relative mb-6">
              <input
                type="text"
                autoFocus
                placeholder="Search products (e.g. 'Sony', 'Laptop')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-700 text-3xl md:text-5xl text-white font-bold py-4 focus:outline-none focus:border-uk-blue placeholder-slate-600 transition-colors"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {loading && <Loader2 className="animate-spin text-uk-blue" size={24} />}
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all ${showFilters ? 'bg-uk-blue text-white' : 'bg-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <SlidersHorizontal size={16} /> Filters
                  </button>
              </div>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-8"
                >
                  <div className="bg-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-white/10">
                    
                    {/* Category Filter */}
                    <div>
                      <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Category</label>
                      <div className="relative">
                        <select 
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 appearance-none border border-slate-700 focus:border-uk-blue focus:outline-none cursor-pointer"
                        >
                          <option value="All">All Categories</option>
                          {categoriesLoading && (
                            <option value="" disabled>Loading categories...</option>
                          )}
                          {categoriesError && !categoriesLoading && (
                            <option value="" disabled>Failed to load categories</option>
                          )}
                          {!categoriesLoading && !categoriesError && categories.map(cat => (
                            <option key={cat.id} value={cat.name.split(' ')[0]}>{cat.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                    </div>

                    {/* Price Filter */}
                    <div>
                      <div className="flex justify-between mb-2">
                         <label className="block text-slate-400 text-xs font-bold uppercase">Max Price</label>
                         <span className="text-uk-blue font-bold text-sm">{formatGBP(maxPrice)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="5000" 
                        step="50"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-uk-blue"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>£0</span>
                        <span>£5000+</span>
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Min Rating</label>
                      <div className="flex gap-2">
                        {[0, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            onClick={() => setMinRating(stars)}
                            className={`flex-1 py-2 rounded-lg border transition-colors flex items-center justify-center gap-1 text-sm font-bold ${
                              minRating === stars 
                                ? 'bg-uk-blue border-uk-blue text-white' 
                                : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {stars === 0 ? 'Any' : <>{stars}<Star size={10} className="fill-current" /></>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Grid */}
            <div className="grid gap-4">
              {results.length > 0 ? (
                results.map(product => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer border border-transparent hover:border-white/10"
                    onClick={() => { onAddToCart(product); onClose(); }}
                  >
                    <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg bg-white" />
                    <div className="flex-1">
                      <h4 className="text-white font-bold group-hover:text-uk-blue transition-colors">{product.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-slate-400 text-sm bg-white/5 px-2 py-0.5 rounded text-xs">{product.category}</span>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs">
                          <Star size={12} className="fill-current" /> {product.rating}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-white font-bold text-lg">{formatGBP(product.price)}</span>
                      <button className="text-xs text-uk-blue hover:text-white font-bold mt-1 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                   {query || (selectedCategory !== 'All' || maxPrice !== 5000 || minRating !== 0) ? (
                     <>
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <Search size={32} />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{loading ? "Searching..." : "No products found"}</h3>
                      <p className="text-slate-400">Try adjusting your filters or search terms.</p>
                     </>
                   ) : (
                     <div className="text-slate-500">Start typing to search products...</div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
