
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, User, Moon, Sun, LogOut, Settings, Heart, LayoutDashboard } from 'lucide-react';
import { gsap } from 'gsap';

// Components
import { Section } from './components/Section';
import { ProductCard } from './components/ProductCard';
import { Preloader } from './components/Preloader';
import { SearchOverlay } from './components/SearchOverlay';
import { QuickViewModal } from './components/QuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { Skeleton, ProductCardSkeleton, CategorySkeleton } from './components/SkeletonLoader';
import { ReviewsSection } from './components/ReviewsSection';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Stripe
import { StripeProvider } from './components/StripeProvider';

// Pages
import { ShopPage } from './pages/ShopPage';
import { AboutPage } from './pages/AboutPage';
import { SupportPage } from './pages/SupportPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CartPage } from './pages/CartPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

// Data/Types
import { Product, CartItem } from './types';
import { formatGBP, calculateVAT } from './services/formatters';
import { ShieldCheck, Truck, Lock, Star, ChevronRight, ArrowRight, MapPin, Phone, Mail, Facebook, Twitter, Instagram, CreditCard, Loader2 } from 'lucide-react';
import { useFeaturedProducts, useCategories, useBestSellers } from './hooks/useProducts';

// --- ROUTE GUARDS ---

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null; // Or loading spinner
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated && user?.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />;
};

// --- LAYOUT COMPONENTS ---

const UserMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <Link to="/login" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300">
        <User size={20} />
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        <div className="w-8 h-8 bg-uk-blue text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden md:block max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
            <div className="p-2">
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 w-full p-2 text-sm font-bold text-uk-blue dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg mb-1">
                   <LayoutDashboard size={16} /> Admin Dashboard
                </Link>
              )}
              <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-2 w-full p-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                 <User size={16} /> My Account
              </Link>
              <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-2 w-full p-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                 <ShoppingBag size={16} /> Orders
              </Link>
              <button 
                onClick={() => { logout(); setIsOpen(false); }}
                className="flex items-center gap-2 w-full p-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1"
              >
                 <LogOut size={16} /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar = ({ toggleTheme, isDark, onOpenSearch }: { toggleTheme: () => void, isDark: boolean, onOpenSearch: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { cartCount, setIsDrawerOpen } = useCart();
  
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="bg-uk-blue text-white text-xs py-2 text-center font-medium">
        Free Next Day Delivery on orders over £50 | UK-Based Support 24/7
      </div>
      <div className="container mx-auto px-4 lg:px-8 2xl:px-12 h-20 2xl:h-24 flex items-center justify-between max-w-[2400px]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-uk-red rounded-tr-xl rounded-bl-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-xl 2xl:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tech<span className="text-uk-blue dark:text-blue-400">Britannia</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8 2xl:gap-12 font-medium text-slate-600 dark:text-slate-300 2xl:text-lg">
          <Link to="/" className="hover:text-uk-blue dark:hover:text-white transition-colors">Home</Link>
          <Link to="/shop" className="hover:text-uk-blue dark:hover:text-white transition-colors">Shop</Link>
          <Link to="/about" className="hover:text-uk-blue dark:hover:text-white transition-colors">About</Link>
          <Link to="/support" className="hover:text-uk-blue dark:hover:text-white transition-colors">Support</Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onOpenSearch} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300">
            <Search size={20} />
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Menu Replaces Simple Icon */}
          <UserMenu />
          
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-uk-red text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button className="md:hidden p-2 dark:text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4 dark:text-white">
              <Link to="/" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Home</Link>
              <Link to="/shop" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Shop</Link>
              <Link to="/about" className="text-lg font-medium" onClick={() => setIsOpen(false)}>About</Link>
              <Link to="/support" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Support</Link>
              {!isAuthenticated ? (
                 <Link to="/login" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Login</Link>
              ) : (
                <>
                  <Link to="/account" className="text-lg font-medium" onClick={() => setIsOpen(false)}>My Account</Link>
                  {user?.role === 'admin' && (
                     <Link to="/admin" className="text-lg font-medium text-uk-blue dark:text-blue-400" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
    <div className="container mx-auto px-4 lg:px-8 2xl:px-12 max-w-[2400px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-8 lg:gap-12 2xl:gap-16 mb-16">
        <div>
          <div className="flex items-center gap-2 mb-6">
             <div className="w-8 h-8 bg-uk-red rounded-tr-xl rounded-bl-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-white">Tech<span className="text-blue-400">Britannia</span></span>
          </div>
          <p className="text-sm leading-relaxed mb-6">
            The UK's premier destination for high-end electronics. Registered in England & Wales. Company No. 12345678.
          </p>
          <div className="flex gap-4">
            <Facebook size={20} className="hover:text-white cursor-pointer transition-colors" />
            <Twitter size={20} className="hover:text-white cursor-pointer transition-colors" />
            <Instagram size={20} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-6">Shop</h4>
          <ul className="space-y-4 text-sm">
            <li><Link to="/shop" className="hover:text-white transition-colors">Laptops & Computers</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Smartphones</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Cameras & Drones</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Gaming & VR</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Support</h4>
          <ul className="space-y-4 text-sm">
            <li><Link to="/support" className="hover:text-white transition-colors">Track Your Order</Link></li>
            <li><Link to="/support" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
            <li><Link to="/support" className="hover:text-white transition-colors">VAT Invoices</Link></li>
            <li><Link to="/support" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="shrink-0 text-blue-400" />
              <span>10 Downing Street, Tech Park, London, EC1A 1BB</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="shrink-0 text-blue-400" />
              <span>020 7946 0123</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="shrink-0 text-blue-400" />
              <span>support@techbritannia.co.uk</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <p>&copy; {new Date().getFullYear()} TechBritannia Ltd. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
          <a href="#" className="hover:text-white">Cookie Policy</a>
        </div>
        <div className="flex gap-3 text-slate-500">
           <span className="bg-slate-800 px-2 py-1 rounded">Visa</span>
           <span className="bg-slate-800 px-2 py-1 rounded">Mastercard</span>
           <span className="bg-slate-800 px-2 py-1 rounded">PayPal</span>
        </div>
      </div>
    </div>
  </footer>
);

// --- HERO SECTION - FLASH SALE DESIGN ---

const HeroSection = () => {
  const comp = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Initial states
      gsap.set(".hero-fade-up", { opacity: 0, y: 40 });
      gsap.set(".hero-scale", { opacity: 0, scale: 0.8 });
      gsap.set(".hero-stat", { opacity: 0, y: 20 });
      gsap.set(".category-card", { opacity: 0, x: 60 });
      gsap.set(".category-icons img", { opacity: 0, y: 20 });

      // Animation sequence
      tl.to(".hero-fade-up", { opacity: 1, y: 0, stagger: 0.1, duration: 0.8 }, 0.3);
      tl.to(".hero-scale", { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, 0.5);
      tl.to(".category-icons img", { opacity: 1, y: 0, stagger: 0.05, duration: 0.4 }, 0.6);
      tl.to(".hero-stat", { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 }, 0.8);
      tl.to(".category-card", { opacity: 1, x: 0, stagger: 0.15, duration: 0.7, ease: "power2.out" }, 0.5);

      // Floating animation for quality badge
      gsap.to(".quality-badge", {
        y: -8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2
      });

    }, comp);

    return () => ctx.revert();
  }, []);

  // Category card data
  const categoryCards = [
    {
      title: "Gaming & VR",
      discount: "78% OFF",
      image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=300&h=200&fit=crop",
      link: "/shop?category=Gaming"
    },
    {
      title: "Electronics",
      discount: "45% OFF",
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=200&fit=crop",
      link: "/shop?category=Laptops"
    },
    {
      title: "Audio & Headphones",
      discount: "60% OFF",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
      link: "/shop?category=Audio"
    }
  ];

  // Category icons for the headline area
  const categoryIcons = [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop",
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=60&h=60&fit=crop",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&h=60&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=60&h=60&fit=crop"
  ];

  return (
    <section 
      ref={comp} 
      className="relative min-h-[85vh] flex items-center bg-slate-50 dark:bg-slate-900 overflow-hidden py-12 lg:py-0"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 border border-slate-200 dark:border-slate-700 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-slate-200 dark:border-slate-700 rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-slate-200 dark:border-slate-700 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 2xl:px-16 relative z-10 max-w-[2400px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 2xl:gap-24 items-center">
          
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="hero-fade-up inline-flex items-center gap-2 px-4 py-2 bg-uk-blue/10 dark:bg-uk-blue/20 rounded-full text-uk-blue dark:text-blue-400 text-sm font-bold mb-6 border border-uk-blue/20">
              <span className="w-2 h-2 rounded-full bg-uk-blue animate-pulse"></span>
              #1 TECH RETAILER IN THE UK 2026
            </div>

            {/* Main Headline */}
            <h1 className="hero-fade-up text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-4 2xl:mb-6">
              Don't Miss Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-uk-blue to-blue-600">
                Massive Flash Sale!
              </span>
            </h1>

            {/* Category Icons Row */}
            <div className="hero-fade-up flex items-center gap-4 mb-6">
              <div className="category-icons flex -space-x-2">
                {categoryIcons.map((icon, idx) => (
                  <img 
                    key={idx}
                    src={icon}
                    alt="Category"
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 object-cover shadow-sm"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white">14</strong> Product Categories
              </span>
            </div>

            {/* Description */}
            <p className="hero-fade-up text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
              Get ready to save big on everything you love! Dive into amazing deals on tech, gaming, audio, and more. 
              Limited stock and time – start shopping now and score up to <strong className="text-uk-red">70% OFF!</strong>
            </p>

            {/* CTA Buttons */}
            <div className="hero-fade-up flex flex-col sm:flex-row gap-4 mb-10">
              <Link 
                to="/shop" 
                className="px-8 py-4 bg-uk-blue text-white font-bold rounded-lg transition-all hover:bg-blue-900 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                Discover
                <ArrowRight size={18} />
              </Link>
              <Link 
                to="/shop" 
                className="px-8 py-4 bg-transparent border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all flex items-center justify-center gap-2"
              >
                Explore All Products
              </Link>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-8 lg:gap-12">
              <div className="hero-stat">
                <span className="block text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">1.2M</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Monthly Traffic</span>
              </div>
              <div className="hero-stat">
                <span className="block text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">500K</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Happy Customers</span>
              </div>
              <div className="hero-stat">
                <span className="block text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">30K</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Verified Reviews</span>
              </div>
            </div>
          </div>

          {/* Right Content - Category Cards */}
          <div className="order-1 lg:order-2 relative">
            {/* Quality Badge */}
            <div className="quality-badge hero-scale absolute top-1/2 left-0 lg:-left-8 -translate-y-1/2 z-20 hidden lg:flex">
              <div className="relative w-32 h-32">
                {/* Rotating Text */}
                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
                  <defs>
                    <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none"/>
                  </defs>
                  <text className="text-[8px] fill-slate-600 dark:fill-slate-400 font-semibold uppercase tracking-[0.3em]">
                    <textPath href="#circlePath">
                      • Quality • Fast Delivery • Affordable • Curated 
                    </textPath>
                  </text>
                </svg>
                {/* Play Button Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-14 h-14 bg-uk-blue text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Cards Stack */}
            <div className="space-y-4 lg:pl-12">
              {categoryCards.map((card, idx) => (
                <Link 
                  key={idx}
                  to={card.link}
                  className={`category-card block`}
                >
                  <motion.div 
                    whileHover={{ scale: 1.02, x: -5 }}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transition-all hover:shadow-xl group"
                  >
                    {/* Image */}
                    <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden shrink-0">
                      <img 
                        src={card.image} 
                        alt={card.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <span className="inline-block px-3 py-1 bg-uk-red/10 dark:bg-uk-red/20 text-uk-red text-xs font-bold rounded-full mb-2">
                        {card.discount}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-uk-blue dark:group-hover:text-blue-400 transition-colors">
                        {card.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-sm text-uk-blue dark:text-blue-400 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        See Collection <ChevronRight size={14} />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none"></div>
    </section>
  );
};

const HomePage = ({ addToCart, onQuickView }: { addToCart: (p: Product, quantity?: number) => void, onQuickView: (p: Product) => void }) => {
  const { products: bestSellers, loading: bestSellersLoading, error: bestSellersError } = useBestSellers(4);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Featured Categories */}
      <Section title="Shop by Category" subtitle="Explore our wide range of premium electronics">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 2xl:grid-cols-8 gap-4 2xl:gap-6">
          {categoriesLoading && (
            Array.from({ length: 6 }).map((_, idx) => (
              <CategorySkeleton key={idx} />
            ))
          )}
          {categoriesError && !categoriesLoading && (
            <div className="col-span-full text-center text-red-500">Failed to load categories.</div>
          )}
          {!categoriesLoading && !categoriesError && categories.length === 0 && (
            <div className="col-span-full text-center text-slate-500">No categories available.</div>
          )}
          {!categoriesLoading && !categoriesError && categories.slice(0, 6).map((cat, idx) => (
            <Link 
              key={cat.id} 
              to={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3 relative">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                </div>
                <h3 className="font-semibold text-center text-slate-800 dark:text-slate-200 group-hover:text-uk-blue dark:group-hover:text-blue-400 transition-colors">{cat.name}</h3>
              </motion.div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Best Selling Products */}
      <Section title="Best Sellers" subtitle="The hottest tech in the UK right now" className="bg-slate-50 dark:bg-slate-900">
        {bestSellersLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6 2xl:gap-8">
                 {Array.from({ length: 4 }).map((_, idx) => <ProductCardSkeleton key={idx} />)}
             </div>
        ) : bestSellersError ? (
             <div className="text-center py-12 text-red-500">Failed to load Best Sellers.</div>
        ) : bestSellers.length === 0 ? (
             <div className="text-center py-12 text-slate-500">No best sellers available yet.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6 2xl:gap-8">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} onQuickView={onQuickView} />
              ))}
            </div>
        )}
        <div className="mt-12 text-center">
          <Link to="/shop" className="inline-flex items-center gap-2 text-uk-blue dark:text-blue-400 font-bold hover:underline">
            View All Best Sellers <ChevronRight size={16} />
          </Link>
        </div>
      </Section>

      {/* Promotional Banner */}
      <section className="py-20 bg-uk-blue overflow-hidden relative">
        <div className="container mx-auto px-4 lg:px-8 2xl:px-16 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 2xl:gap-20 max-w-[2400px]">
           <div className="text-white max-w-xl">
             <span className="inline-block py-1 px-3 rounded bg-uk-red text-white text-xs font-bold mb-4">LIMITED TIME OFFER</span>
             <h2 className="text-4xl md:text-5xl font-bold mb-6">Upgrade Your Workspace</h2>
             <p className="text-blue-100 text-lg mb-8">Get up to 20% off selected monitors and peripherals. Perfect for your home office setup.</p>
             <Link 
               to="/shop" 
               className="inline-flex items-center justify-center px-8 py-3 bg-white text-uk-blue font-bold rounded-lg hover:bg-slate-100 transition-colors"
             >
               Shop the Sale
             </Link>
           </div>
           <div className="relative">
             <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                <div className="text-center">
                  <span className="block text-6xl font-bold text-white mb-2">20%</span>
                  <span className="block text-xl text-blue-200 uppercase tracking-widest">OFF</span>
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* Brand Trust */}
      <Section className="bg-white dark:bg-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto bg-blue-100 dark:bg-slate-800 text-uk-blue dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">UK Warranty</h3>
            <p className="text-slate-600 dark:text-slate-400">Minimum 2-year warranty on all electronics, compliant with UK Consumer Rights Act 2015.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto bg-green-100 dark:bg-slate-800 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
              <Truck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Fast Delivery</h3>
            <p className="text-slate-600 dark:text-slate-400">Free next-day delivery via Royal Mail Tracked 24 or DPD for orders over £50.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-400 rounded-full flex items-center justify-center mb-6">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Secure Payments</h3>
            <p className="text-slate-600 dark:text-slate-400">PCI-DSS compliant payments. We accept all major UK cards, PayPal, and Klarna.</p>
          </div>
        </div>
      </Section>

      {/* Customer Reviews */}
      <ReviewsSection />

      {/* Newsletter */}
      <Section dark title="Join the Tech Club" subtitle="Get exclusive deals and the latest tech news delivered to your inbox">
        <div className="max-w-xl mx-auto">
          <form 
            className="flex flex-col gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const email = (e.target as any).querySelector('input[type="email"]').value;
              try {
                const res = await fetch('/api/newsletter/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.success) {
                  alert(data.message);
                  (e.target as any).reset();
                } else {
                  alert(data.message || 'Subscription failed');
                }
              } catch (err) {
                alert('Network error. Please try again later.');
              }
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                required
                className="flex-1 px-5 py-4 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-uk-blue transition-all"
              />
              <button className="px-8 py-4 bg-uk-red hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20">
                Subscribe
              </button>
            </div>
            
            <div className="flex items-start gap-3 px-1">
              <input 
                id="newsletter-consent" 
                type="checkbox" 
                required
                className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-uk-blue focus:ring-uk-blue focus:ring-offset-slate-900 cursor-pointer accent-uk-blue" 
              />
              <label htmlFor="newsletter-consent" className="text-sm text-slate-400 cursor-pointer select-none leading-relaxed text-left">
                I agree to the <a href="#" className="text-blue-400 hover:text-blue-300 underline font-medium">Privacy Policy</a> and consent to TechBritannia processing my data for marketing emails.
              </label>
            </div>
          </form>
          <p className="text-center text-slate-600 text-xs mt-6">
            Protected by reCAPTCHA. Google <a href="#" className="hover:text-slate-400 underline">Privacy</a> and <a href="#" className="hover:text-slate-400 underline">Terms</a> apply.
          </p>
        </div>
      </Section>
    </div>
  );
};

const AppContent = () => {
  const { cart, addToCart, updateQuantity, clearCart } = useCart();
  const [isDark, setIsDark] = useState(false); // Default light
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Show premium preloader on every page load
  const [showPreloader, setShowPreloader] = useState<boolean>(true);

  useEffect(() => {
    if (!showPreloader) return;

    // Show preloader for 2 seconds on every page load
    const timer = window.setTimeout(() => {
      setShowPreloader(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [showPreloader]);

  // Theme effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <Router>
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
          <AnimatePresence mode="wait">
          {showPreloader && <Preloader key="preloader" />}
          </AnimatePresence>

        {!showPreloader && (
          <>
            <Navbar 
              toggleTheme={toggleTheme} 
              isDark={isDark} 
              onOpenSearch={() => setIsSearchOpen(true)} 
            />
            
            <CartDrawer />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
                <Route path="/shop" element={<ShopPage addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
                <Route path="/product/:id" element={<ProductDetailPage addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
                <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateQuantity} />} />
                <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                
                {/* Protected Routes */}
                <Route path="/account" element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />

            {/* Overlays */}
            <SearchOverlay 
              isOpen={isSearchOpen} 
              onClose={() => setIsSearchOpen(false)} 
              onAddToCart={addToCart} 
            />
            
            <QuickViewModal 
              product={quickViewProduct} 
              isOpen={!!quickViewProduct} 
              onClose={() => setQuickViewProduct(null)} 
              onAddToCart={addToCart} 
            />
          </>
        )}
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <StripeProvider>
            <AppContent />
          </StripeProvider>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
};

export default App;
