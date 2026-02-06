import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, ShoppingCart, Heart, Check, Truck, ShieldCheck, 
  ChevronRight, Minus, Plus, RefreshCw, Loader2
} from 'lucide-react';
import { Product } from '../types';
import { formatGBP, calculateVAT } from '../services/formatters';
import { ProductCard } from '../components/ProductCard';
import { Section } from '../components/Section';
import { ProductGallery } from '../components/ProductGallery';
import { useWishlist } from '../context/WishlistContext';
import { useProduct } from '../hooks/useProducts';
import { useReviews } from '../hooks/useReviews';

interface ProductDetailPageProps {
  addToCart: (p: Product, quantity: number) => void;
  onQuickView: (p: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ addToCart, onQuickView }) => {
  const { id } = useParams<{ id: string }>();
  // Use the hook to fetch product and related items
  const { product, relatedProducts, loading, error } = useProduct(id);
  const { reviews, loading: reviewsLoading, error: reviewsError } = useReviews();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="animate-spin text-uk-blue" size={48} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-white bg-white dark:bg-slate-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-slate-500 mb-4">{error || "The product you are looking for does not exist."}</p>
          <Link to="/shop" className="text-uk-blue dark:text-blue-400 hover:underline">Return to Shop</Link>
        </div>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id || product._id || '');
  const vatAmount = calculateVAT(product.price);
  
  // Gallery Images Logic
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const isSale = product.originalPrice && product.originalPrice > product.price;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      
      {/* 1. Breadcrumbs & Header */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 lg:px-8 2xl:px-12 py-4 max-w-[2400px]">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-uk-blue dark:hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <Link to="/shop" className="hover:text-uk-blue dark:hover:text-white">Shop</Link>
            <ChevronRight size={14} />
            <span className="text-slate-900 dark:text-white font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 2xl:px-12 py-12 2xl:py-16 max-w-[2400px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 2xl:gap-20 mb-20">
          
          {/* 2. Product Gallery */}
          <ProductGallery 
            images={images} 
            name={product.name} 
            isRecentlyAdded={product.isRecentlyAdded} 
          />

          {/* 3. Core Product Info / Buy Box */}
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-start">
                 <span className="text-uk-blue dark:text-blue-400 font-bold tracking-wide text-sm uppercase mb-2 block">{product.category}</span>
                 {isSale && product.originalPrice && (
                   <span className="bg-uk-red text-white text-xs font-bold px-3 py-1 rounded-full">
                     SAVE {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                   </span>
                 )}
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="fill-current" size={18} />
                  <span className="font-bold text-slate-900 dark:text-white">{product.rating || 0}</span>
                </div>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 dark:text-slate-400 hover:text-uk-blue cursor-pointer underline">{product.reviews || 0} verified reviews</span>
                <span className="text-slate-400">|</span>
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <Check size={16} /> {(product.stock && product.stock > 0) ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{formatGBP(product.price)}</span>
                {isSale && product.originalPrice && (
                   <span className="text-lg text-slate-400 line-through">{formatGBP(product.originalPrice)}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">
                Price includes VAT of {formatGBP(vatAmount)} (20%)
              </p>

              {/* Quick Specs */}
              {product.specs && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {product.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <Check size={14} className="text-uk-blue dark:text-blue-400" /> {spec}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white h-14 w-32 justify-between px-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={!product.stock || product.stock <= 0}
                  className="flex-1 bg-uk-blue hover:bg-blue-900 text-white font-bold h-14 rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} /> {(product.stock && product.stock > 0) ? 'Add to Basket' : 'Out of Stock'}
                </button>
                <button 
                  onClick={() => toggleWishlist(product)}
                  className={`h-14 w-14 border border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isWishlisted ? 'text-uk-red border-uk-red dark:border-uk-red' : 'text-slate-400 dark:text-white'}`}
                  aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
                </button>
              </div>

              {/* Service Benefits */}
              <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Truck size={18} className="text-uk-blue dark:text-blue-400" />
                  <span>Free next-day delivery on orders placed before 10pm</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <ShieldCheck size={18} className="text-uk-blue dark:text-blue-400" />
                  <span>2 Year TechBritannia Guarantee included</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                   <RefreshCw size={18} className="text-uk-blue dark:text-blue-400" />
                   <span>30-day hassle-free returns policy</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 4/5/6 Tabs Section: Description, Specs, Reviews */}
        <div className="mb-20">
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
            {[
              { id: 'desc', label: 'Description' },
              { id: 'specs', label: 'Technical Specifications' },
              { id: 'reviews', label: 'Customer Reviews' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-uk-blue text-uk-blue dark:border-blue-400 dark:text-blue-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 md:p-12 min-h-[400px]">
            {activeTab === 'desc' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-2xl font-bold mb-6 dark:text-white">Product Overview</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-6">
                  {product.description || "No description available."}
                </p>
                <div className="grid md:grid-cols-2 gap-8 mt-12">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                      <ShieldCheck size={32} className="text-uk-blue dark:text-blue-400 mb-4" />
                      <h4 className="font-bold text-lg mb-2 dark:text-white">Official UK Stock</h4>
                      <p className="text-slate-600 dark:text-slate-400">All products are sourced directly from manufacturers with full UK warranties and support.</p>
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                      <Truck size={32} className="text-uk-blue dark:text-blue-400 mb-4" />
                      <h4 className="font-bold text-lg mb-2 dark:text-white">Premium Delivery</h4>
                      <p className="text-slate-600 dark:text-slate-400">Handled with care by our premium courier partners to ensure it arrives in perfect condition.</p>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'specs' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 <h3 className="text-2xl font-bold mb-6 dark:text-white">Technical Specifications</h3>
                 {product.technicalSpecs ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      {Object.entries(product.technicalSpecs).map(([key, value], idx) => (
                        <div key={idx} className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                           <span className="font-bold text-slate-700 dark:text-slate-300">{key}</span>
                           <span className="text-slate-600 dark:text-slate-400 text-right">{value}</span>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <p className="text-slate-500">Detailed specifications are not available for this product.</p>
                 )}
               </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col md:flex-row gap-12 mb-12">
                  <div className="text-center md:text-left">
                    <h3 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-2">{product.rating}</h3>
                    <div className="flex justify-center md:justify-start gap-1 text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={20} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-300 dark:text-slate-700'} />
                      ))}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Based on {product.reviews} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-3 text-sm">
                        <span className="w-8 font-bold text-slate-700 dark:text-slate-300">{star} ★</span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                           <div className="h-full bg-yellow-400" style={{ width: star === 5 ? '70%' : star === 4 ? '20%' : '5%' }}></div>
                        </div>
                        <span className="w-8 text-slate-400 text-right">{star === 5 ? '70%' : star === 4 ? '20%' : '5%'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-uk-blue" size={28} />
                  </div>
                ) : reviewsError ? (
                  <div className="text-center text-red-500 py-6">Failed to load reviews.</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center text-slate-500 py-6">No reviews yet for this product.</div>
                ) : (
                  <div className="space-y-6">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                         <div className="flex justify-between mb-4">
                           <div>
                             <h4 className="font-bold text-slate-900 dark:text-white">{review.name}</h4>
                             <span className="text-xs text-slate-400 flex items-center gap-1"><Check size={10} /> Verified Buyer</span>
                           </div>
                           <div className="flex gap-1 text-yellow-400">
                             {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < review.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'} />
                             ))}
                           </div>
                         </div>
                         <p className="text-slate-600 dark:text-slate-300 italic">"{review.text}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

      </div>

      {/* 7. Related Products Section */}
      {relatedProducts.length > 0 && (
        <Section title="Frequently Bought Together" subtitle="Complementary items and similar products" className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
           <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-6 2xl:gap-8">
              {relatedProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ProductCard product={p} onAddToCart={addToCart} onQuickView={onQuickView} />
                </motion.div>
              ))}
           </div>
        </Section>
      )}
    </div>
  );
};
