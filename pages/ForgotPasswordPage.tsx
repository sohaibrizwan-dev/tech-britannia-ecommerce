import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordInputs) => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-uk-blue via-uk-red to-uk-blue" />

        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-uk-blue/10 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-uk-blue dark:text-blue-400">
            <Mail size={24} />
          </div>
          <h1 className="text-2xl font-bold dark:text-white">Reset Password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Enter your email to receive reset instructions</p>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center"
             >
               <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-6 rounded-xl border border-green-200 dark:border-green-800 mb-6">
                 <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                 <h3 className="font-bold text-lg mb-2">Check your email</h3>
                 <p className="text-sm">We've sent a password reset link to your email address.</p>
               </div>
               <Link to="/login" className="text-uk-blue dark:text-blue-400 font-bold hover:underline">Return to Login</Link>
             </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-6"
            >
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

              <button 
                disabled={isSubmitting}
                type="submit"
                className="w-full py-4 bg-uk-blue hover:bg-blue-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Send Reset Link <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
              
              <div className="text-center mt-4">
                 <Link to="/login" className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-sm font-medium">Back to Login</Link>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};