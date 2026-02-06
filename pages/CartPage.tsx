import React from 'react';
import { ShoppingBag, Truck, MapPin, CreditCard, ShieldCheck, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartItem } from '../types';
import { formatGBP, calculateVAT } from '../services/formatters';

interface CartPageProps {
  cart: CartItem[];
  updateQuantity: (id: string, q: number) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ cart, updateQuantity }) => {
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const vat = calculateVAT(subtotal);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-10 pb-20">
      <div className="container mx-auto px-4 lg:px-8 2xl:px-12 max-w-[2400px]">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Your Shopping Basket</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-8 2xl:gap-10">
          {/* Main Cart Area */}
          <div className="lg:col-span-2 2xl:col-span-3 space-y-6">
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                <ShoppingBag size={20} className="text-uk-blue dark:text-blue-400"/> Items ({cart.length})
              </h2>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                   <p className="text-slate-500 dark:text-slate-400 mb-6">Your basket is currently empty.</p>
                   <Link to="/shop" className="px-6 py-3 bg-uk-blue text-white rounded-lg font-bold hover:bg-blue-900 transition-colors">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 py-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <Link to={`/product/${item.id}`} className="font-bold text-slate-900 dark:text-white hover:text-uk-blue transition-colors">
                            {item.name}
                          </Link>
                          <span className="font-bold dark:text-white">{formatGBP(item.price * item.quantity)}</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{item.category}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg dark:text-white">
                            <button 
                              onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              className="px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >-</button>
                            <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >+</button>
                          </div>
                          <button 
                             onClick={() => updateQuantity(item.id, 0)}
                             className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                <Truck size={20} className="text-uk-blue dark:text-blue-400"/> Delivery Estimate
              </h2>
              <div className="p-4 bg-blue-50 dark:bg-slate-700/50 rounded-lg border border-blue-100 dark:border-slate-600 flex gap-3">
                 <div className="mt-1"><MapPin size={18} className="text-uk-blue dark:text-blue-400" /></div>
                 <div>
                   <p className="text-sm font-bold text-uk-blue dark:text-blue-300">Deliver to United Kingdom</p>
                   <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Order before 10pm for Next Day Delivery.</p>
                 </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center py-4 text-slate-400 grayscale opacity-70">
              <CreditCard size={32} />
              <ShieldCheck size={32} />
              <Lock size={32} />
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-24">
              <h2 className="font-bold text-lg mb-6 dark:text-white">Order Summary</h2>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatGBP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatGBP(shipping)}</span>
                </div>
                
                <div className="flex justify-between text-slate-500 dark:text-slate-500 text-xs py-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <span>VAT (20%) included</span>
                  <span>{formatGBP(vat)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-white pt-4 border-t border-slate-100 dark:border-slate-700">
                  <span>Total</span>
                  <span>{formatGBP(total)}</span>
                </div>
              </div>

              {cart.length > 0 && (
                <Link to="/checkout" className="block w-full text-center py-4 bg-uk-blue hover:bg-blue-900 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20 mb-4">
                  Proceed to Checkout
                </Link>
              )}
              
              <div className="text-center">
                 <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                   <Lock size={10} /> Secure SSL Encryption
                 </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold mb-3 dark:text-white">Voucher Code</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Enter code" className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded text-sm dark:text-white" />
                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-600">Apply</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};