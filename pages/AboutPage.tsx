import React from 'react';
import { Section } from '../components/Section';
import { ShieldCheck, Users, Globe, Award } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <Section className="bg-slate-900 text-white" title="Our Story">
        <div className="max-w-3xl mx-auto text-center">
           <p className="text-xl text-slate-300 leading-relaxed mb-8">
             Founded in London in 2010, TechBritannia started with a simple mission: to bring the world's most premium technology to the UK market with unmatched service and speed.
           </p>
           <p className="text-lg text-slate-400 leading-relaxed">
             Today, we are the UK's largest independent electronics retailer, serving over 1 million happy customers from Land's End to John o' Groats.
           </p>
        </div>
      </Section>

      <Section title="Why Choose Us">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: ShieldCheck, title: "Official Stockist", desc: "Direct partnerships with Apple, Sony, and Samsung." },
            { icon: Users, title: "UK Support", desc: "Our support team is based right here in Manchester." },
            { icon: Globe, title: "Sustainability", desc: "We plant a tree for every order over £100." },
            { icon: Award, title: "Award Winning", desc: "Voted 'Best Tech Retailer' 2023 by TechRadar." }
          ].map((item, i) => (
            <div key={i} className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="w-16 h-16 bg-blue-100 dark:bg-slate-700 text-uk-blue dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2 dark:text-white">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section dark title="Our Headquarters">
        <div className="aspect-video w-full rounded-2xl overflow-hidden relative">
          <img src="https://picsum.photos/seed/office/1200/600" alt="Office" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
             <div className="text-white">
               <h3 className="text-2xl font-bold">Tech Hub London</h3>
               <p>12 Tech Avenue, Shoreditch, London</p>
             </div>
          </div>
        </div>
      </Section>
    </div>
  );
};