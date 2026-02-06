import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain one uppercase letter")
    .regex(/[0-9]/, "Must contain one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormInputs = z.infer<typeof signupSchema>;

export const SignupPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupFormInputs) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      navigate(redirectUrl); // Redirect to original destination or account
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          <div className="w-12 h-12 bg-uk-blue rounded-tr-xl rounded-bl-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
             <User className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold dark:text-white">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Join TechBritannia for exclusive deals</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                {...register("name")}
                type="text" 
                placeholder="John Doe"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 dark:text-white transition-all ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-600 focus:ring-uk-blue'}`}
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                 {...register("email")}
                type="email" 
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 dark:text-white transition-all ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-600 focus:ring-uk-blue'}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                 {...register("password")}
                type="password" 
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 dark:text-white transition-all ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-600 focus:ring-uk-blue'}`}
              />
            </div>
             {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                 {...register("confirmPassword")}
                type="password" 
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 dark:text-white transition-all ${errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-600 focus:ring-uk-blue'}`}
              />
            </div>
             {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            disabled={isSubmitting}
            type="submit"
            className="w-full py-4 bg-uk-blue hover:bg-blue-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-700 pt-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Already have an account? <Link to="/login" className="text-uk-blue dark:text-blue-400 font-bold hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-xs text-center text-slate-400">
           <div className="flex items-center gap-2">
             <CheckCircle size={12} className="text-green-500" /> GDPR Compliant Data Storage
           </div>
           <div className="flex items-center gap-2">
             <CheckCircle size={12} className="text-green-500" /> Secure Bcrypt Hashing
           </div>
        </div>
      </motion.div>
    </div>
  );
};