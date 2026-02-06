import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const [authError, setAuthError] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setAuthError(null);
    try {
      await login(data.email, data.password);
      navigate(redirectUrl); // Redirect to original destination or account
    } catch (err: any) {
      setAuthError(err.message || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden"
      >
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-uk-blue via-uk-red to-uk-blue" />

        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-uk-red rounded-tr-xl rounded-bl-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold dark:text-white">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to access your orders and wishlist</p>
        </div>

        <AnimatePresence>
          {authError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              {authError}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                id="email"
                {...register("email")}
                type="email" 
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 dark:text-white transition-all ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-600 focus:ring-uk-blue'}`}
                aria-invalid={errors.email ? "true" : "false"}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 font-medium" role="alert">{errors.email.message}</p>}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-uk-blue dark:text-blue-400 hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                id="password"
                {...register("password")}
                type="password" 
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 dark:text-white transition-all ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-600 focus:ring-uk-blue'}`}
                aria-invalid={errors.password ? "true" : "false"}
              />
            </div>
             {errors.password && <p className="text-red-500 text-xs mt-1 font-medium" role="alert">{errors.password.message}</p>}
          </div>

          <button 
            disabled={isSubmitting}
            type="submit"
            className="w-full py-4 bg-uk-blue hover:bg-blue-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-700 pt-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Don't have an account? <Link to="/signup" className="text-uk-blue dark:text-blue-400 font-bold hover:underline">Create one</Link>
          </p>
        </div>
        
        <div className="mt-6 text-xs text-center text-slate-400">
           Secured by Enterprise Grade Encryption
        </div>
      </motion.div>
    </div>
  );
};