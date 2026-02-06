import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, ChevronLeft, ChevronRight, Loader2, X, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { Product } from '../types';
import { useProducts } from '../hooks/useProducts';

const ITEMS_PER_PAGE = 9;

type SortOption = {
  label: string;
  value: string;
  sortBy: 'price' | 'rating' | 'name' | 'createdAt';
  order: 'asc' | 'desc';
};

const SORT_OPTIONS: SortOption[] = [
  { label: 'Featured', value: 'featured', sortBy: 'createdAt', order: 'desc' },
  { label: 'Newest First', value: 'newest', sortBy: 'createdAt', order: 'desc' },
  { label: 'Price: Low to High', value: 'price-asc', sortBy: 'price', order: 'asc' },
  { label: 'Price: High to Low', value: 'price-desc', sortBy: 'price', order: 'desc' },
  { label: 'Rating: High to Low', value: 'rating-desc', sortBy: 'rating', order: 'desc' },
  { label: 'Name: A to Z', value: 'name-asc', sortBy: 'name', order: 'asc' },
];

// Active Filter Chip Component
const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <motion.span
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-uk-blue/10 text-uk-blue text-sm font-medium rounded-full"
  >
    {label}
    <button 
      onClick={onRemove}
      className="p-0.5 hover:bg-uk-blue/20 rounded-full transition-colors"
    >
      <X size={12} />
    </button>
  </motion.span>
);

export const ShopPage = ({ addToCart, onQuickView }: { addToCart: (p: Product, q?: number) => void, onQuickView: (p: Product) => void }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [minRating, setMinRating] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Update URL when category changes
  useEffect(() => {
    if (selectedCategory === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', selectedCategory);
    }
    setSearchParams(searchParams);
    setCurrentPage(1); // Reset page on filter change
  }, [selectedCategory, setSearchParams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrands, priceRange, minRating, sortOption]);

  // Fetch products from backend with filters
  const { products, loading, error, pagination } = useProducts({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
    maxPrice: priceRange,
    minPrice: 0,
    minRating: minRating,
    sortBy: sortOption.sortBy,
    order: sortOption.order,
  });

  const filteredProducts = products;

  const handlePageChange = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.pages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedBrands([]);
    setPriceRange(5000);
    setMinRating(0);
    setSortOption(SORT_OPTIONS[0]);
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedBrands.length > 0 || priceRange < 5000 || minRating > 0;

  // Pagination with ellipsis
  const renderPagination = () => {
    if (!pagination || pagination.pages <= 1) return null;
    
    const pages: (number | string)[] = [];
    const { pages: totalPages } = pagination;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="mt-12 flex justify-center items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-4 py-2 rounded-lg transition-colors bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-sm"
          aria-label="Previous Page"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((page, idx) => 
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
            ) : (
              <button 
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 font-medium ${
                  page === currentPage 
                  ? 'bg-uk-blue text-white shadow-lg shadow-uk-blue/25 scale-105' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-uk-blue'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.pages}
          className="flex items-center gap-1 px-4 py-2 rounded-lg transition-colors bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-sm"
          aria-label="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-pulse"></div>
            <Loader2 size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-uk-blue" />
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Failed to Load</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-uk-blue text-white rounded-xl hover:bg-blue-900 transition-colors font-medium shadow-lg shadow-uk-blue/25"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-10 pb-20 bg-slate-50/50 dark:bg-slate-950">
      <div className="container mx-auto px-4 lg:px-8 2xl:px-12 max-w-[2400px]">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                {selectedCategory === 'All' ? 'All Products' : selectedCategory}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Showing {products.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}-{Math.min(currentPage * ITEMS_PER_PAGE, pagination?.total || 0)} of {pagination?.total || 0} products
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Mobile Filters Button */}
              <button 
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 transition-all shadow-sm"
              >
                <SlidersHorizontal size={18} />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-uk-blue"></span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div ref={sortRef} className="relative flex-1 lg:flex-initial">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full lg:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-slate-400" />
                    <span className="text-sm font-medium">{sortOption.label}</span>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 lg:left-auto lg:right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden min-w-[200px]"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortOption(option);
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            sortOption.value === option.value 
                              ? 'bg-uk-blue/10 text-uk-blue font-medium' 
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-4 overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">Active filters:</span>
                  
                  {selectedCategory !== 'All' && (
                    <FilterChip
                      label={`Category: ${selectedCategory}`}
                      onRemove={() => setSelectedCategory('All')}
                    />
                  )}
                  
                  {selectedBrands.map(brand => (
                    <FilterChip
                      key={brand}
                      label={brand}
                      onRemove={() => setSelectedBrands(selectedBrands.filter(b => b !== brand))}
                    />
                  ))}
                  
                  {priceRange < 5000 && (
                    <FilterChip
                      label={`Under £${priceRange.toLocaleString()}`}
                      onRemove={() => setPriceRange(5000)}
                    />
                  )}
                  
                  {minRating > 0 && (
                    <FilterChip
                      label={`${minRating}+ Stars`}
                      onRemove={() => setMinRating(0)}
                    />
                  )}

                  <button
                    onClick={handleClearAllFilters}
                    className="text-sm text-uk-red hover:text-red-700 dark:hover:text-red-400 font-medium ml-2 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 2xl:grid-cols-5 gap-8 2xl:gap-10">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <FilterSidebar 
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                minRating={minRating}
                setMinRating={setMinRating}
                totalProducts={pagination?.total}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3 2xl:col-span-4">
            {filteredProducts.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 2xl:gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id || product._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <ProductCard 
                        product={product} 
                        onAddToCart={addToCart} 
                        onQuickView={onQuickView} 
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Filter className="text-slate-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No products found</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                  We couldn't find any products matching your current filters. Try adjusting your criteria.
                </p>
                <button 
                  onClick={handleClearAllFilters}
                  className="px-6 py-3 bg-uk-blue text-white rounded-xl hover:bg-blue-900 transition-colors font-medium shadow-lg shadow-uk-blue/25"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
            
            {/* Pagination */}
            {renderPagination()}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-50 dark:bg-slate-950 z-50 lg:hidden shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <FilterSidebar 
                  selectedCategory={selectedCategory}
                  setSelectedCategory={(c) => {
                    setSelectedCategory(c);
                  }}
                  selectedBrands={selectedBrands}
                  setSelectedBrands={setSelectedBrands}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  totalProducts={pagination?.total}
                  onClose={() => setIsMobileFiltersOpen(false)}
                />
                
                {/* Apply Filters Button (Mobile) */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="w-full py-3 bg-uk-blue text-white rounded-xl font-medium hover:bg-blue-900 transition-colors shadow-lg shadow-uk-blue/25"
                  >
                    Show {pagination?.total || 0} Results
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
