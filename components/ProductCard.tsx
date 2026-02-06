import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatGBP } from '../services/formatters';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onQuickView }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id || '');
  
  const isSale = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isSale 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) 
    : 0;

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800 group overflow-hidden flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800 block">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img 
            src={product.image} 
            alt={product.name} 
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 pointer-events-none">
          {product.isRecentlyAdded && (
            <span className="bg-uk-blue/90 backdrop-blur-sm text-white text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg shadow-sm border border-white/20">
              New Arrival
            </span>
          )}
          {isSale && (
            <span className="bg-uk-red/90 backdrop-blur-sm text-white text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg shadow-sm border border-white/20">
              Sale {discountPercent > 0 && `-${discountPercent}%`}
            </span>
          )}
        </div>
        
        {/* Floating Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button 
             onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm translate-x-4 group-hover:translate-x-0 focus:translate-x-0 outline-none focus:ring-2 focus:ring-uk-blue ${isWishlisted ? 'text-uk-red' : 'text-slate-400 hover:text-uk-red'}`}
            aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart size={18} className={isWishlisted ? "fill-current" : ""} />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 delay-75 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-uk-blue dark:text-slate-400 shadow-sm translate-x-4 group-hover:translate-x-0 focus:translate-x-0 outline-none focus:ring-2 focus:ring-uk-blue"
            aria-label="Quick View"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 uppercase tracking-wide">
          {product.category}
        </div>
        <Link to={`/product/${product.id}`} className="font-bold text-lg text-slate-900 dark:text-white mb-2 leading-tight hover:text-uk-blue dark:hover:text-blue-400 transition-colors">
          {product.name}
        </Link>
        
        <div className="flex items-center gap-1 mb-4">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{product.rating}</span>
          <span className="text-sm text-slate-400">({product.reviews})</span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="block text-2xl font-bold text-slate-900 dark:text-white">
                {formatGBP(product.price)}
              </span>
              {isSale && (
                <span className="text-sm text-slate-400 line-through decoration-slate-400/50">
                  {formatGBP(product.originalPrice!)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Inc. VAT
            </span>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product);
            }}
            className="p-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg hover:bg-uk-blue dark:hover:bg-blue-100 transition-colors flex items-center gap-2"
            aria-label="Add to cart"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};