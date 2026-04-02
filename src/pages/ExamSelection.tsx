import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { ExamType } from '../types';

export default function ExamSelection() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (exam: ExamType) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        targetExam: exam
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exams: { type: ExamType; title: string; desc: string; color: string }[] = [
    { 
      type: 'FCPS 1', 
      title: 'FCPS Part 1', 
      desc: 'Foundational medical knowledge for all specialties.',
      color: 'bg-blue-600'
    },
    { 
      type: 'IMM', 
      title: 'IMM', 
      desc: 'Intermediate Module for specialty training.',
      color: 'bg-slate-800'
    },
    { 
      type: 'FCPS 2', 
      title: 'FCPS Part 2', 
      desc: 'Advanced clinical knowledge and specialty practice.',
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-6">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4 text-slate-900">Choose Your Exam</h1>
          <p className="text-xl text-slate-500">Select the exam you are currently preparing for to personalize your experience.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {exams.map((exam, i) => (
            <motion.button
              key={exam.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(exam.type)}
              disabled={loading}
              className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left hover:shadow-xl hover:border-primary/20 transition-all transform hover:-translate-y-2 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-2 h-full ${exam.color}`}></div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-primary transition-colors">{exam.title}</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">{exam.desc}</p>
              <div className="flex items-center text-primary font-bold">
                Select Exam <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
