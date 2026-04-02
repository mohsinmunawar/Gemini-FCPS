import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Trophy, Clock, CheckCircle2, XCircle, ArrowLeft, RotateCcw, BarChart3 } from 'lucide-react';
import { MockExam, Question } from '../types';
import { cn, formatTime } from '../lib/utils';

export default function Results() {
  const { examId } = useParams();
  const [exam, setExam] = useState<MockExam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      try {
        const snap = await getDoc(doc(db, 'mockExams', examId));
        if (snap.exists()) {
          setExam({ id: snap.id, ...snap.data() } as MockExam);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  if (loading) return <div className="flex items-center justify-center h-screen">Calculating results...</div>;
  if (!exam) return <div className="text-center mt-20">Exam not found.</div>;

  const isPassed = exam.score >= 70;

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10">
      {/* Result Header */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "p-12 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden",
          isPassed ? "bg-success" : "bg-slate-900"
        )}
      >
        <div className="relative z-10">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-display font-bold mb-4">
            {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-xl opacity-80 mb-10 max-w-md mx-auto">
            {isPassed 
              ? "You've demonstrated excellent knowledge. You're on the right track for your exam." 
              : "Don't be discouraged. Review your weak areas and try again to improve your score."}
          </p>
          
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl">
              <p className="text-sm font-bold opacity-60 uppercase mb-1">Score</p>
              <p className="text-3xl font-black">{exam.score}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl">
              <p className="text-sm font-bold opacity-60 uppercase mb-1">Time</p>
              <p className="text-3xl font-black">{formatTime(exam.duration)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl">
              <p className="text-sm font-bold opacity-60 uppercase mb-1">Accuracy</p>
              <p className="text-3xl font-black">{Math.round((exam.score / 100) * exam.totalQuestions)}/{exam.totalQuestions}</p>
            </div>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/dashboard" 
          className="flex-1 bg-white border border-slate-200 p-6 rounded-3xl font-bold text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </Link>
        <Link 
          to="/exam/mock" 
          className="flex-1 bg-primary text-white p-6 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
        >
          <RotateCcw className="w-5 h-5" /> Retake Exam
        </Link>
      </div>

      {/* Detailed Breakdown */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-display font-bold mb-8 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" /> Performance Breakdown
        </h2>
        
        <div className="space-y-8">
          {[
            { label: 'Physiology', correct: 18, total: 25, color: 'bg-blue-500' },
            { label: 'Pharmacology', correct: 12, total: 20, color: 'bg-amber-500' },
            { label: 'Clinical Anaesthesia', correct: 35, total: 40, color: 'bg-success' },
            { label: 'Critical Care', correct: 8, total: 15, color: 'bg-danger' }
          ].map((item, i) => {
            const percentage = Math.round((item.correct / item.total) * 100);
            return (
              <div key={i}>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.correct} correct out of {item.total}</p>
                  </div>
                  <p className="text-lg font-black text-slate-900">{percentage}%</p>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                    className={cn("h-full rounded-full", item.color)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Review Wrong Questions */}
      <section>
        <h2 className="text-2xl font-display font-bold mb-6">Review Wrong Answers</h2>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
          <div className="p-8 text-center text-slate-500 italic">
            Detailed question review is coming soon. You can currently see your overall score and category breakdown.
          </div>
        </div>
      </section>
    </div>
  );
}
