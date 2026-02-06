import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Mail, Phone, MessageSquare, MapPin, Calculator, ArrowRightLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatGBP } from '../services/formatters';
import { api } from '../services/api';

const VATCalculator = () => {
  const [amount, setAmount] = useState<string>('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  const numAmount = parseFloat(amount) || 0;
  const rate = 0.20;
  
  let net = 0, vat = 0, total = 0;

  if (amount) {
      if (mode === 'add') {
        net = numAmount;
        vat = net * rate;
        total = net + vat;
      } else {
        total = numAmount;
        net = total / (1 + rate);
        vat = total - net;
      }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 dark:bg-slate-700 rounded-lg flex items-center justify-center text-uk-blue dark:text-blue-400">
            <Calculator size={20} />
        </div>
        <h3 className="text-xl font-bold dark:text-white">VAT Calculator</h3>
      </div>

      {/* Toggles */}
      <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-6">
        <button 
            onClick={() => setMode('add')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'add' ? 'bg-white dark:bg-slate-600 text-uk-blue dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
            Add VAT
        </button>
        <button 
            onClick={() => setMode('remove')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'remove' ? 'bg-white dark:bg-slate-600 text-uk-blue dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
            Remove VAT
        </button>
      </div>

      {/* Input */}
      <div className="mb-8">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            {mode === 'add' ? 'Enter Net Price (ex. VAT)' : 'Enter Total Price (inc. VAT)'}
        </label>
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</span>
            <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-4 text-2xl font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-uk-blue dark:text-white transition-all"
            />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Net Price</span>
            <span className={`font-medium ${mode === 'add' ? 'text-slate-900 dark:text-white' : ''}`}>{formatGBP(net)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>VAT (20%)</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatGBP(vat)}</span>
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
        <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-slate-900 dark:text-white">Total</span>
            <span className="font-bold text-2xl text-uk-blue dark:text-blue-400">{formatGBP(total)}</span>
        </div>
      </div>
    </div>
  );
};

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  orderNumber: string;
  message: string;
}

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    orderNumber: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>({ type: 'idle' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setStatus({ type: 'loading' });

    try {
      const response = await api.post('/contact', formData);
      
      if (response.success) {
        setStatus({ 
          type: 'success', 
          message: response.message || 'Your message has been sent successfully! We\'ll get back to you within 24 hours.' 
        });
        // Clear form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          orderNumber: '',
          message: '',
        });
      } else {
        setStatus({ 
          type: 'error', 
          message: response.message || 'Failed to send message. Please try again.' 
        });
      }
    } catch (error: any) {
      console.error('Contact form error:', error);
      setStatus({ 
        type: 'error', 
        message: error.message || 'An unexpected error occurred. Please try again later.' 
      });
    }
  };

  const resetForm = () => {
    setStatus({ type: 'idle' });
  };

  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-2xl font-bold mb-6 dark:text-white">Send us a message</h3>
      
      <AnimatePresence mode="wait">
        {status.type === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h4>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              {status.message}
            </p>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-uk-blue text-white rounded-lg font-medium hover:bg-blue-900 transition-colors"
            >
              Send Another Message
            </button>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span className="text-uk-red">*</span>
                </label>
                <input 
                  type="text" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-uk-blue focus:border-transparent dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span className="text-uk-red">*</span>
                </label>
                <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Smith"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-uk-blue focus:border-transparent dark:text-white transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email <span className="text-uk-red">*</span>
              </label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.smith@example.com"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-uk-blue focus:border-transparent dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Order Number (Optional)</label>
              <input 
                type="text" 
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                placeholder="e.g., ORD-123456"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-uk-blue focus:border-transparent dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Message <span className="text-uk-red">*</span>
              </label>
              <textarea 
                rows={4} 
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="How can we help you today?"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-uk-blue focus:border-transparent dark:text-white transition-all resize-none"
              />
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {status.type === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <AlertCircle className="text-red-500 shrink-0" size={20} />
                  <p className="text-sm text-red-600 dark:text-red-400">{status.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={status.type === 'loading'}
              className="w-full py-4 bg-uk-blue hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {status.type === 'loading' ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SupportPage = () => {
  return (
    <div className="min-h-screen">
       <Section title="How can we help?" subtitle="Our UK-based team is ready to assist you">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
           {/* Contact Channels */}
           <div className="space-y-6">
             <motion.div 
               whileHover={{ y: -4 }}
               className="flex items-center gap-4 p-6 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md rounded-xl border border-slate-100 dark:border-slate-700 transition-all cursor-pointer"
             >
               <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 text-uk-blue dark:text-blue-400 rounded-lg flex items-center justify-center">
                 <Phone size={24} />
               </div>
               <div>
                 <h3 className="font-bold dark:text-white">Call Us</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">020 7946 0123 (9am - 5pm)</p>
               </div>
             </motion.div>
             <motion.a 
               href="mailto:support@techbritannia.co.uk"
               whileHover={{ y: -4 }}
               className="flex items-center gap-4 p-6 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md rounded-xl border border-slate-100 dark:border-slate-700 transition-all"
             >
               <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 text-uk-blue dark:text-blue-400 rounded-lg flex items-center justify-center">
                 <Mail size={24} />
               </div>
               <div>
                 <h3 className="font-bold dark:text-white">Email Us</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">support@techbritannia.co.uk</p>
               </div>
             </motion.a>
             <motion.div 
               whileHover={{ y: -4 }}
               className="flex items-center gap-4 p-6 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md rounded-xl border border-slate-100 dark:border-slate-700 transition-all cursor-pointer"
             >
               <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 text-uk-blue dark:text-blue-400 rounded-lg flex items-center justify-center">
                 <MessageSquare size={24} />
               </div>
               <div>
                 <h3 className="font-bold dark:text-white">Live Chat</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Available 24/7</p>
               </div>
             </motion.div>
           </div>

           {/* Contact Form */}
           <ContactForm />
         </div>
       </Section>

       {/* Tools Section */}
       <Section title="Tools & Resources" subtitle="Useful tools for your business needs" className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block py-1 px-3 rounded bg-blue-100 dark:bg-blue-900/30 text-uk-blue dark:text-blue-400 text-xs font-bold mb-4">BUSINESS TOOLS</span>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Quick VAT Calculator</h3>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-6">
                Need to quickly calculate VAT for your expenses or invoices? Use our handy calculator to convert between Net and Gross prices instantly using the standard UK 20% rate.
              </p>
              <ul className="space-y-3">
                {[
                  "Standard UK Rate (20%)",
                  "Calculate Net to Gross",
                  "Calculate Gross to Net",
                  "Instant Results"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
               {/* Decorative Background Blob */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl -z-10"></div>
               <VATCalculator />
            </div>
         </div>
       </Section>
    </div>
  );
};