import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, BarChart3, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-primary py-20 text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Master Your Medical Exams with Confidence
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
              The ultimate MCQ preparation platform for FCPS 1, IMM, and FCPS 2. 
              Curated questions, detailed explanations, and real-time analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/auth" 
                className="bg-white text-primary px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center hover:bg-blue-50 transition-colors shadow-lg"
              >
                Get Started for Free <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="bg-primary-dark text-white px-8 py-4 rounded-xl font-semibold text-lg border border-white/20 hover:bg-primary-dark/80 transition-colors">
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 transform translate-x-1/2"></div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Why Choose MedPrep MCQ?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Designed by doctors for doctors, our platform provides everything you need to excel in your postgraduate medical examinations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, title: 'Structured Learning', desc: 'Navigate through Books, Chapters, and Topics with ease.' },
              { icon: ShieldCheck, title: 'Curated Questions', desc: 'Thousands of high-yield MCQs with smart, detailed explanations.' },
              { icon: GraduationCap, title: 'Exam Simulation', desc: 'Real-time mock exams with timers to build your stamina.' },
              { icon: BarChart3, title: 'Deep Analytics', desc: 'Track your progress and identify weak areas automatically.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 card-hover"
              >
                <div className="w-12 h-12 bg-blue-100 text-primary rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Coverage Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Comprehensive Coverage</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                We cover the entire syllabus for major postgraduate medical exams in Pakistan and internationally. 
                Our content is updated regularly based on the latest exam patterns.
              </p>
              <ul className="space-y-4">
                {['FCPS Part 1 (All Specialties)', 'IMM (Intermediate Module)', 'FCPS Part 2', 'Past Papers (Last 5 Years)'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700 font-medium">
                    <div className="w-6 h-6 bg-success/10 text-success rounded-full flex items-center justify-center mr-3">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-8">
                <div className="bg-blue-600 h-48 rounded-2xl shadow-xl flex items-center justify-center text-white text-2xl font-bold">FCPS 1</div>
                <div className="bg-slate-800 h-64 rounded-2xl shadow-xl flex items-center justify-center text-white text-2xl font-bold">IMM</div>
              </div>
              <div className="space-y-4">
                <div className="bg-amber-500 h-64 rounded-2xl shadow-xl flex items-center justify-center text-white text-2xl font-bold">FCPS 2</div>
                <div className="bg-emerald-500 h-48 rounded-2xl shadow-xl flex items-center justify-center text-white text-2xl font-bold">PAST PAPERS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-8">Ready to Start Your Journey?</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join thousands of student doctors who are already preparing with MedPrep MCQ.
          </p>
          <Link 
            to="/auth" 
            className="inline-block bg-primary text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-primary-dark transition-all transform hover:scale-105 shadow-2xl shadow-primary/20"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>© 2026 MedPrep MCQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
