import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingCart, Check, ArrowRight, Minus, Plus, AlertTriangle, XCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatGBP } from '../services/formatters';
import { useWishlist } from '../context/WishlistContext';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Reset quantity when product changes
  React.useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const isWishlisted = isInWishlist(product.id || '');

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  const stock = product.stock || 0;
  let StockIcon = Check;
  let stockColor = "text-green-600 dark:text-green-400";
  let stockText = "In Stock";
  let stockBg = "bg-green-100 dark:bg-green-900/30";

  if (stock === 0) {
    StockIcon = XCircle;
    stockColor = "text-red-600 dark:text-red-400";
    stockText = "Out of Stock";
    stockBg = "bg-red-100 dark:bg-red-900/30";
  } else if (stock <= 10) {
    StockIcon = AlertTriangle;
    stockColor = "text-orange-600 dark:text-orange-400";
    stockText = `Low Stock (${stock} left)`;
    stockBg = "bg-orange-100 dark:bg-orange-900/30";
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2 max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            >
              <X size={24} />
            </button>

            {/* Image Section */}
            <div className="bg-slate-100 dark:bg-slate-800 relative h-64 md:h-full">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              {product.isRecentlyAdded && (
                <span className="absolute top-4 left-4 bg-uk-blue text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  NEW ARRIVAL
                </span>
              )}
            </div>

            {/* Info Section */}
            <div className="p-8 flex flex-col h-full">
              <div className="mb-auto">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-uk-blue dark:text-blue-400 font-bold text-xs uppercase tracking-wider block mt-1">
                    {product.category}
                  </span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${stockBg} ${stockColor}`}>
                    <StockIcon size={12} />
                    {stockText}
                  </div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                  {product.name}
                </h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="fill-current" size={16} />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{product.rating}</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{product.reviews} reviews</span>
                </div>

                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {formatGBP(product.price)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Inc. VAT & Free Next Day Delivery
                </p>

                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed line-clamp-3">
                  {product.description || "Experience premium technology with this high-performance device. Built for professionals and enthusiasts alike."}
                </p>

                {/* Specs Preview */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.specs.map((spec, i) => (
                    <span key={i} className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-4">
                  <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white h-12 w-32 justify-between px-2 shrink-0">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={stock === 0}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold text-sm">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                      disabled={stock === 0 || quantity >= stock}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={handleAddToCart}
                    disabled={stock === 0}
                    className="flex-1 bg-uk-blue hover:bg-blue-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={18} /> {stock === 0 ? 'Out of Stock' : 'Add to Basket'}
                  </button>
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className={`h-12 w-12 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isWishlisted ? 'text-uk-red border-uk-red dark:border-uk-red' : 'text-slate-400 dark:text-white'}`}
                    aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
                  </button>
                </div>
                
                <Link 
                  to={`/product/${product.id}`}
                  onClick={onClose}
                  className="block w-full text-center text-sm font-bold text-slate-500 hover:text-uk-blue dark:text-slate-400 dark:hover:text-white transition-colors py-2"
                >
                  View Full Product Details <ArrowRight size={14} className="inline ml-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};