import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Settings, 
  Search, Plus, Edit2, Trash2, MoreVertical, TrendingUp, DollarSign,
  X, Upload, CheckCircle, Loader2, AlertCircle, Eye, ChevronDown, Filter, Menu
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product, Order, OrderStatus } from '../types';
import { formatGBP } from '../services/formatters';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';

// Validation Schema
const productFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.string().url("Please enter a valid image URL"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  isRecentlyAdded: z.boolean().default(false),
});

type ProductFormInputs = z.infer<typeof productFormSchema>;

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetch products, orders, and stats in parallel
        const [productsRes, ordersRes, statsRes] = await Promise.allSettled([
           productService.getProducts({ limit: 100 }), // Get first 100 products for admin
           orderService.getAllOrders(1, 20),
           orderService.getOrderStats().catch(() => null) // Fallback if stats fail
        ]);

        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.data);
        }
        
        if (ordersRes.status === 'fulfilled') {
          setOrders(ordersRes.value.data);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setStats(statsRes.value);
        }

      } catch (err) {
        console.error("Failed to fetch admin data", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Handler to refresh products
  const refreshProducts = async () => {
    try {
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to refresh products", err);
    }
  };

  const handleAddProduct = async (productData: Partial<Product>) => {
    try {
      // Ensure specs is at least an empty array if not provided
      const dataToSave = {
        ...productData,
        specs: productData.specs || [],
      };

      // Use _id for updates (MongoDB standard)
      const productId = (productData as any)._id || productData.id;

      if (productId) {
         // Update
         await productService.updateProduct(productId, dataToSave);
      } else {
         // Create
         await productService.createProduct(dataToSave);
      }
      await refreshProducts();
    } catch (err: any) {
      console.error("Error saving product:", err);
      // Construct a better error message if it's a validation error
      if (err.data?.errors && Array.isArray(err.data.errors)) {
        const errorMsg = `Validation failed: ${err.data.errors.join(', ')}`;
        throw new Error(errorMsg);
      }
      throw err; // Re-throw for form to handle
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!id) {
      alert("Invalid product ID");
      return;
    }

    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        // Filter using _id or id (whichever exists)
        setProducts(products.filter(p => {
          const productId = (p as any)._id || p.id;
          return productId !== id;
        }));
      } catch (err: any) {
        console.error("Error deleting product:", err);
        alert(err.message || "Failed to delete product");
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      setOrders(orders.map(o => {
        const oId = (o as any)._id || o.id;
        return oId === orderId ? updatedOrder : o;
      }));
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status");
    }
  };

  // Sidebar Component
  const SidebarItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <motion.button
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm mb-1 ${
        activeTab === id 
          ? 'bg-uk-blue text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      {label}
    </motion.button>
  );

  if (loading && !products.length) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
         <Loader2 className="animate-spin text-uk-blue" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-uk-red rounded-lg flex items-center justify-center font-bold">T</div>
          <span className="font-bold text-lg">TechAdmin</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Overlay - Only on mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col 
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-uk-red rounded-lg flex items-center justify-center font-bold">T</div>
            <span className="font-bold text-lg">TechAdmin</span>
          </div>

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-6 pt-2">
            <div className="w-8 h-8 bg-uk-red rounded-lg flex items-center justify-center font-bold">T</div>
            <span className="font-bold text-lg">TechAdmin</span>
          </div>

          <nav>
            <p className="text-xs font-bold text-slate-500 uppercase mb-4 px-4">Menu</p>
            <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem id="products" icon={Package} label="Products" />
            <SidebarItem id="orders" icon={ShoppingBag} label="Orders" />
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-6 border-t border-slate-800">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-sm">
               AD
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold truncate">Admin User</p>
               <p className="text-xs text-slate-400 truncate">Super Admin</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:flex-1 lg:ml-0 min-h-screen">
        <div className="p-4 md:p-8">
          <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white capitalize"
              >
                {activeTab}
              </motion.h1>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 dark:text-slate-400 text-sm mt-1"
              >
                Welcome back, here's what's happening today.
              </motion.p>
            </div>
          </header>

          {error && (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-100"
             >
               <AlertCircle size={20} /> {error}
             </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <OverviewTab products={products} stats={stats} orders={orders} />}
              {activeTab === 'products' && <ProductsTab products={products} onSaveProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />}
              {activeTab === 'orders' && <OrdersTab orders={orders} onUpdateStatus={handleUpdateOrderStatus} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const OverviewTab = ({ products, stats, orders }: { products: Product[], stats: any, orders: Order[] }) => {
  // Use real stats if available, otherwise fallback/calculate
  const totalRevenue = stats?.totalRevenue || 0;
  const totalOrders = stats?.totalOrders || orders.length;
  const productsSold = stats?.totalProductsSold || 0;
  const activeUsers = stats?.activeUsers || 0;
  const monthlyRevenue = stats?.monthlyRevenue || [];

  // Prepare chart data from real monthly revenue
  const chartHeights = useMemo(() => {
    if (!monthlyRevenue.length) return [40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95];
    const max = Math.max(...monthlyRevenue.map((m: any) => m.revenue));
    return monthlyRevenue.slice().reverse().map((m: any) => (m.revenue / max) * 100);
  }, [monthlyRevenue]);

  const monthLabels = useMemo(() => {
    if (!monthlyRevenue.length) return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return monthlyRevenue.slice().reverse().map((m: any) => monthNames[m._id.month - 1]);
  }, [monthlyRevenue]);

  return (
    <div className="space-y-6">
      <motion.div 
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <StatCard title="Total Revenue" value={formatGBP(totalRevenue)} change="+12.5%" icon={DollarSign} color="blue" />
        <StatCard title="Total Orders" value={totalOrders.toString()} change="+8.2%" icon={ShoppingBag} color="green" />
        <StatCard title="Products Sold" value={productsSold.toString()} change="+2.4%" icon={Package} color="purple" />
        <StatCard title="Active Users" value={activeUsers.toString()} change="+14.1%" icon={Users} color="orange" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Recent Revenue History</h3>
          <div className="h-64 flex items-end justify-between gap-1 md:gap-2">
            {chartHeights.map((h, i) => (
              <div key={i} className="w-full bg-blue-100 dark:bg-slate-800 rounded-t-lg relative group">
                 <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${h}%` }}
                   transition={{ duration: 1, delay: 0.5 + (i * 0.05) }}
                   className="absolute bottom-0 left-0 right-0 bg-uk-blue rounded-t-lg transition-all duration-300 group-hover:bg-blue-600" 
                 />
                 <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                    {formatGBP(monthlyRevenue[monthlyRevenue.length - 1 - i]?.revenue || 0)}
                 </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] md:text-xs text-slate-400">
            {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Latest Products</h3>
          <div className="space-y-4">
            {products.slice(0, 5).map((p, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + (i * 0.1) }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category}</p>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatGBP(p.price)}</span>
              </motion.div>
            ))}
            {products.length === 0 && <p className="text-slate-500 text-sm">No products found.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ProductsTab = ({ 
  products, 
  onSaveProduct, 
  onDeleteProduct 
}: { 
  products: Product[], 
  onSaveProduct: (p: Partial<Product>) => Promise<void>,
  onDeleteProduct: (id: string) => void
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<ProductFormInputs>({
    resolver: zodResolver(productFormSchema)
  });

  const imageUrl = watch('image');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await productService.uploadImage(file);
      setValue('image', url);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const onSubmit = async (data: ProductFormInputs) => {
    try {
      const payload: Partial<Product> = {
         ...data,
      };
      
      if (editingProduct) {
         // Use _id (MongoDB) or id
         (payload as any)._id = (editingProduct as any)._id || editingProduct.id;
         payload.id = editingProduct.id;
      }
      
      await onSaveProduct(payload);
      reset();
      setEditingProduct(null);
      setIsModalOpen(false);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to save product");
    }
  };

  // Helper to open modal and pre-fill data
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    reset({
        name: p.name,
        category: p.category,
        brand: p.brand || '',
        price: p.price,
        description: p.description,
        image: p.image,
        stock: p.stock || 0,
        isRecentlyAdded: p.isRecentlyAdded || false
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
      setEditingProduct(null);
      reset({
          name: '',
          category: '',
          brand: '',
          price: 0,
          description: '',
          image: '',
          stock: 0
      });
      setIsModalOpen(true);
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Product Inventory</h3>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-uk-blue"
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openNewModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-uk-blue text-white rounded-lg hover:bg-blue-900 transition-colors text-sm font-bold whitespace-nowrap"
            >
              <Plus size={16} /> Add Product
            </motion.button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Brand</th>
                <th className="px-6 py-4 font-bold">Price</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence>
                {filteredProducts.map((p, i) => {
                  // Get the proper ID (support both _id and id)
                  const productId = (p as any)._id || p.id;
                  
                  return (
                    <motion.tr 
                      key={productId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                            <img src={p.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.category}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.brand}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatGBP(p.price)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-bold ${
                          (p.stock || 0) > 10 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : (p.stock || 0) > 0 
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {(p.stock || 0) > 10 ? 'In Stock' : (p.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => openEditModal(p)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-600 transition-colors"
                            title="Edit product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteProduct(productId)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-600 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No products found.
            </div>
          )}
        </div>

        {/* Add/Edit Product Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                  <h3 className="text-xl font-bold dark:text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                  <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                  <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                              <input {...register('name')} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-uk-blue outline-none" />
                              {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                              <input {...register('category')} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-uk-blue outline-none" />
                              {errors.category && <span className="text-red-500 text-xs mt-1 block">{errors.category.message}</span>}
                          </div>
                          <div className="sm:col-span-2 md:col-span-1">
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Brand</label>
                              <input {...register('brand')} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-uk-blue outline-none" />
                              {errors.brand && <span className="text-red-500 text-xs mt-1 block">{errors.brand.message}</span>}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Price (£)</label>
                              <input type="number" step="0.01" {...register('price')} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-uk-blue outline-none" />
                              {errors.price && <span className="text-red-500 text-xs mt-1 block">{errors.price.message}</span>}
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Stock</label>
                              <input type="number" {...register('stock')} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-uk-blue outline-none" />
                              {errors.stock && <span className="text-red-500 text-xs mt-1 block">{errors.stock.message}</span>}
                           </div>
                      </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Product Image</label>
                          <div className="flex gap-4 items-start">
                              <div className="flex-1 space-y-2">
                                  <div className="flex gap-2">
                                      <input 
                                          {...register('image')} 
                                          placeholder="Enter image URL..."
                                          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-uk-blue outline-none" 
                                      />
                                      <label className="shrink-0 group cursor-pointer">
                                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm">
                                              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                              <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Upload'}</span>
                                          </div>
                                          <input 
                                              type="file" 
                                              accept="image/*" 
                                              className="hidden" 
                                              onChange={handleImageUpload}
                                              disabled={isUploading}
                                          />
                                      </label>
                                  </div>
                                  {errors.image && <span className="text-red-500 text-xs block">{errors.image.message}</span>}
                              </div>
                              
                              {imageUrl && (
                                  <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
                                      <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                  </div>
                              )}
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                          <textarea {...register('description')} rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-uk-blue outline-none resize-none" />
                          {errors.description && <span className="text-red-500 text-xs mt-1 block">{errors.description.message}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                          <input 
                              type="checkbox" 
                              id="isRecentlyAdded" 
                              {...register('isRecentlyAdded')} 
                              className="w-4 h-4 rounded border-slate-300 text-uk-blue focus:ring-uk-blue"
                          />
                          <label htmlFor="isRecentlyAdded" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              Feature as New Arrival
                          </label>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}
                      className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-lg bg-uk-blue text-white font-bold hover:bg-blue-900 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      {isSubmitting ? 'Saving...' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const StatCard = ({ title, value, change, icon: Icon, color }: { title: string, value: string, change: string, icon: any, color: string }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };
  
  return (
    <motion.div 
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className="text-green-500 font-bold flex items-center">
          <TrendingUp size={16} className="mr-1" />
          {change}
        </span>
        <span className="text-slate-400 ml-2">vs last month</span>
      </div>
    </motion.div>
  );
};

const OrdersTab = ({ orders = [], onUpdateStatus }: { orders: Order[], onUpdateStatus: (id: string, status: OrderStatus) => Promise<void> }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;
    return orders.filter(o => o.status === filterStatus);
  }, [orders, filterStatus]);

  const statusColors = {
    'Processing': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Shipped': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Delivered': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Order History</h3>
        <div className="relative w-full sm:w-auto">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-uk-blue"
          >
            <option value="all">All Orders</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-0 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Orders Found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {filterStatus === 'all' ? 'When you receive new orders, they will appear here.' : `No orders found with status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold">Order ID</th>
                    <th className="px-6 py-4 font-bold">Customer</th>
                    <th className="px-6 py-4 font-bold">Total</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <AnimatePresence>
                    {filteredOrders.map((order, i) => {
                      const orderId = (order as any)._id || order.id;
                      return (
                        <motion.tr 
                          key={orderId} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-6 py-4 font-mono text-slate-500">#{orderId ? orderId.toString().slice(-6) : 'N/A'}</td>
                          <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {order.shippingAddress?.fullName || 'Guest'}
                              </div>
                              <div className="text-xs text-slate-400 font-normal">{order.shippingAddress?.email}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatGBP(order.total)}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                              <div className="relative group min-w-[120px]">
                                <select 
                                    value={order.status}
                                    onChange={(e) => onUpdateStatus(orderId, e.target.value as OrderStatus)}
                                    className={`appearance-none w-full px-3 py-1 pr-8 rounded-full text-[10px] md:text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-uk-blue/50 ${statusColors[order.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-700'}`}
                                >
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                              </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center gap-1 text-uk-blue font-bold hover:text-blue-900 transition-colors ml-auto"
                             >
                                <Eye size={16} /> <span className="hidden sm:inline">View</span>
                             </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
             </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Order Details</h3>
                  <p className="text-sm text-slate-400 font-mono">#{((selectedOrder as any)._id || selectedOrder.id)?.toString().slice(-8)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Customer & Shipping */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Shipping Information</h4>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.shippingAddress?.fullName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{selectedOrder.shippingAddress?.email}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{selectedOrder.shippingAddress?.address}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postcode}
                      </p>
                    </div>
                  </div>

                  {/* Order Status & Payment */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[selectedOrder.status as keyof typeof statusColors]}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Payment Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedOrder.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {selectedOrder.paymentStatus || 'pending'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Order Items</h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-slate-500">Product</th>
                          <th className="px-4 py-3 text-center font-bold text-slate-500">Qty</th>
                          <th className="px-4 py-3 text-right font-bold text-slate-500">Price</th>
                          <th className="px-4 py-3 text-right font-bold text-slate-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatGBP(item.price)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatGBP(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-500">Subtotal</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatGBP(selectedOrder.subtotal || selectedOrder.total - (selectedOrder.shipping || 0) - (selectedOrder.vat || 0))}</td>
                        </tr>
                        {selectedOrder.shipping !== undefined && (
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-500">Shipping</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatGBP(selectedOrder.shipping)}</td>
                          </tr>
                        )}
                        {selectedOrder.vat !== undefined && (
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-500">VAT (20%)</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatGBP(selectedOrder.vat)}</td>
                          </tr>
                        )}
                        <tr className="border-t border-slate-200 dark:border-slate-700">
                          <td colSpan={3} className="px-4 py-4 text-right font-black text-slate-900 dark:text-white text-lg">Total Amount</td>
                          <td className="px-4 py-4 text-right font-black text-uk-blue dark:text-blue-400 text-lg">{formatGBP(selectedOrder.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                  >
                    Close Details
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
