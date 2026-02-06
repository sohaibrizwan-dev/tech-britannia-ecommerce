import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Package, Heart, Settings, LogOut, ChevronRight, 
  MapPin, CreditCard, Bell, ExternalLink, Loader2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { formatDate, formatGBP } from '../services/formatters';
import { orderService } from '../services/orderService';
import { Link } from 'react-router-dom';
import { Order } from '../types';

export const AccountPage = () => {
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist' | 'settings'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersTotal, setOrdersTotal] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);

        const response = await orderService.getMyOrders(1, 10);
        if (isMounted) {
          setOrders(response.data);
          setOrdersTotal(response.pagination.total);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch orders';
        if (isMounted) {
          setOrdersError(message);
        }
        console.error('Error fetching orders:', err);
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const recentOrders = orders.slice(0, 2);

  if (!user) return null;

  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
        activeTab === id 
          ? 'bg-uk-blue text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sticky top-24">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
                <div className="w-16 h-16 bg-gradient-to-br from-uk-blue to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{user.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{user.email}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <TabButton id="overview" icon={User} label="Overview" />
                <TabButton id="orders" icon={Package} label="My Orders" />
                <TabButton id="wishlist" icon={Heart} label="Wishlist" />
                <TabButton id="settings" icon={Settings} label="Settings" />
                
                <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium text-sm"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-uk-blue dark:text-blue-400 mb-4">
                        <Package size={24} />
                      </div>
                      <h4 className="text-2xl font-bold dark:text-white">
                        {ordersLoading ? <Loader2 className="animate-spin" size={20} /> : (ordersTotal || orders.length)}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="w-12 h-12 bg-green-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                        <Heart size={24} />
                      </div>
                      <h4 className="text-2xl font-bold dark:text-white">{wishlist.length}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Items in Wishlist</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="w-12 h-12 bg-purple-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                        <Bell size={24} />
                      </div>
                      <h4 className="text-2xl font-bold dark:text-white">2</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">New Notifications</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-lg dark:text-white">Recent Orders</h3>
                      <button onClick={() => setActiveTab('orders')} className="text-uk-blue dark:text-blue-400 text-sm font-bold hover:underline">View All</button>
                    </div>
                    <div>
                      {ordersLoading && (
                        <div className="flex items-center justify-center py-10 text-slate-500">
                          <Loader2 className="animate-spin" size={20} />
                        </div>
                      )}
                      {ordersError && !ordersLoading && (
                        <div className="p-6 text-center text-red-500">Failed to load orders.</div>
                      )}
                      {!ordersLoading && !ordersError && recentOrders.length === 0 && (
                        <div className="p-6 text-center text-slate-500">No orders yet.</div>
                      )}
                      {!ordersLoading && !ordersError && recentOrders.map((order, idx) => {
                        const displayId = order.orderNumber ? `#${order.orderNumber}` : order._id ? `#${order._id.slice(-6)}` : `#TB-${idx + 1}`;
                        const displayDate = order.date || (order.createdAt ? formatDate(new Date(order.createdAt)) : '-');
                        const displayTotal = order.total ?? order.subtotal ?? 0;
                        const firstItem = order.items?.[0];

                        return (
                          <div key={order._id || order.id || `${displayId}-${idx}`} className="p-6 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                                {firstItem?.image ? (
                                  <img src={firstItem.image} className="w-full h-full object-cover" alt={firstItem.name || 'Product'} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold dark:text-white text-sm">{displayId}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{displayDate}</p>
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-300 mt-1">{formatGBP(displayTotal)}</p>
                              </div>
                            </div>
                            <div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === 'Delivered' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ORDERS TAB */}
{activeTab === 'orders' && (
                <motion.div 
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 min-h-[500px]"
                >
                  <h3 className="font-bold text-xl mb-6 dark:text-white">Order History</h3>
                  <div className="space-y-4">
                    {ordersLoading && (
                      <div className="flex items-center justify-center py-12 text-slate-500">
                        <Loader2 className="animate-spin" size={20} />
                      </div>
                    )}
                    {ordersError && !ordersLoading && (
                      <div className="text-center text-red-500 py-8">Failed to load orders.</div>
                    )}
                    {!ordersLoading && !ordersError && orders.length === 0 && (
                      <div className="text-center text-slate-500 py-8">You have no orders yet.</div>
                    )}
                    {!ordersLoading && !ordersError && orders.map((order, idx) => {
                      const displayId = order.orderNumber ? `#${order.orderNumber}` : order._id ? `#${order._id.slice(-6)}` : `#TB-${idx + 1}`;
                      const displayDate = order.date || (order.createdAt ? formatDate(new Date(order.createdAt)) : '-');
                      const displayTotal = order.total ?? order.subtotal ?? 0;

                      return (
                        <div key={order._id || order.id || `${displayId}-${idx}`} className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                             <div className="space-y-1">
                               <div className="flex items-center gap-3">
                                 <h4 className="font-bold text-lg dark:text-white">{displayId}</h4>
                                 <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                                    order.status === 'Delivered' 
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}>
                                    {order.status}
                                  </span>
                               </div>
                               <p className="text-sm text-slate-500">{displayDate} - Total: <span className="font-bold text-slate-900 dark:text-white">{formatGBP(displayTotal)}</span></p>
                             </div>
                             <button className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white transition-colors">
                               View Invoice
                             </button>
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-2">
                             {order.items?.length ? order.items.map((item, itemIdx) => (
                               <div key={item._id || item.id || `${order._id}-item-${itemIdx}`} className="flex items-center gap-4 min-w-[200px]">
                                  {item.image ? (
                                    <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-slate-100" alt={item.name} />
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">No Image</div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold dark:text-white line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-slate-500">{formatGBP(item.price)}</p>
                                  </div>
                               </div>
                             )) : (
                               <div className="text-sm text-slate-500">No items found for this order.</div>
                             )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* WISHLIST TAB */}
              {activeTab === 'wishlist' && (
                <motion.div 
                  key="wishlist"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6"
                >
                  <h3 className="font-bold text-xl mb-6 dark:text-white">My Wishlist</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlist.length === 0 && (
                      <div className="col-span-full text-center text-slate-500 py-8">Your wishlist is empty.</div>
                    )}
                    {wishlist.map(product => (
                      <div key={product.id} className="flex gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-uk-blue dark:hover:border-blue-500 transition-colors cursor-pointer group">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0 overflow-hidden">
                           <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={product.name} />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                           <div>
                              <h4 className="font-bold dark:text-white line-clamp-1 group-hover:text-uk-blue transition-colors">{product.name}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{product.category}</p>
                           </div>
                           <div className="flex justify-between items-end">
                              <span className="font-bold text-uk-blue dark:text-blue-400">{formatGBP(product.price)}</span>
                              <button className="text-xs font-bold hover:underline dark:text-white">Add to Cart</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6"
                >
                   <h3 className="font-bold text-xl mb-6 dark:text-white">Account Settings</h3>
                   
                   <div className="space-y-8 max-w-2xl">
                     <div>
                       <h4 className="font-bold text-sm uppercase text-slate-500 dark:text-slate-400 mb-4">Personal Information</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold mb-1 dark:text-slate-300">Full Name</label>
                            <input type="text" defaultValue={user.name} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold mb-1 dark:text-slate-300">Email Address</label>
                            <input type="email" defaultValue={user.email} disabled className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-xs font-bold mb-1 dark:text-slate-300">Phone Number</label>
                            <input type="tel" placeholder="+44 7700 900000" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white" />
                         </div>
                       </div>
                     </div>

                     <div>
                       <h4 className="font-bold text-sm uppercase text-slate-500 dark:text-slate-400 mb-4">Addresses</h4>
                       <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer gap-2">
                          <PlusIcon size={16} /> Add New Address
                       </div>
                     </div>

                     <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button className="px-6 py-3 bg-uk-blue text-white font-bold rounded-lg hover:bg-blue-900 transition-colors">
                          Save Changes
                        </button>
                     </div>
                   </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Settings tab
const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
