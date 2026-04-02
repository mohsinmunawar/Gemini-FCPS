import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, UserProgress, MockExam } from '../types';
import { 
  BookOpen, 
  GraduationCap, 
  Zap, 
  Trophy, 
  Clock, 
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalAttempted: 0,
    correctCount: 0,
    accuracy: 0,
    recentExams: [] as MockExam[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      try {
        // Fetch user progress
        const progressQuery = query(collection(db, 'userProgress'), where('userId', '==', profile.uid));
        const progressSnap = await getDocs(progressQuery);
        const progressData = progressSnap.docs.map(doc => doc.data() as UserProgress);
        
        const correct = progressData.filter(p => p.status === 'correct').length;
        const total = progressData.length;
        
        // Fetch recent exams
        const examsQuery = query(
          collection(db, 'mockExams'), 
          where('userId', '==', profile.uid),
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        const examsSnap = await getDocs(examsQuery);
        const examsData = examsSnap.docs.map(doc => {
          const docData = doc.data() as any;
          return { id: doc.id, ...docData } as MockExam;
        });

        setStats({
          totalAttempted: total,
          correctCount: correct,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          recentExams: examsData,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'dashboard-stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-2">
            Hello, Dr. {profile?.displayName?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-slate-500 text-lg">
            You're preparing for <span className="text-primary font-bold">{profile?.targetExam}</span>. Keep up the great work!
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/exam-selection" 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Change Exam
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Questions Attempted', value: stats.totalAttempted, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Correct Answers', value: stats.correctCount, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Overall Accuracy', value: `${stats.accuracy}%`, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Study Streak', value: '5 Days', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              Start Practicing
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link 
                to="/study" 
                className="group bg-primary p-8 rounded-3xl text-white shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Study Mode</h3>
                <p className="text-blue-100 mb-6">Structured learning by Book, Chapter, and Topic.</p>
                <div className="flex items-center font-bold">
                  Start Learning <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <Link 
                to="/exam/quick" 
                className="group bg-white p-8 rounded-3xl text-slate-900 border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-primary transition-all transform hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-500">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Quick Review</h3>
                <p className="text-slate-500 mb-6">25 randomized high-yield questions for a fast check.</p>
                <div className="flex items-center font-bold text-primary">
                  Start Review <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link 
                to="/exam/mock" 
                className="group bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all transform hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-amber-400">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Custom Mock</h3>
                <p className="text-slate-400 mb-6">Personalized exam with choice of subjects and time.</p>
                <div className="flex items-center font-bold text-amber-400">
                  Start Exam <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold">Recent Mock Exams</h2>
              <Link to="/exam/mock" className="text-primary font-bold text-sm hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {stats.recentExams.length > 0 ? (
                stats.recentExams.map((exam) => (
                  <div key={exam.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Mock Exam #{exam.id.slice(-4)}</p>
                        <p className="text-xs text-slate-500">{new Date(exam.timestamp?.toDate()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{exam.score}%</p>
                      <p className="text-xs text-slate-500">{exam.totalQuestions} Questions</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No mock exams attempted yet.</p>
                  <Link to="/exam/mock" className="text-primary font-bold mt-2 inline-block">Take your first mock</Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <section className="bg-amber-50 p-8 rounded-3xl border border-amber-100">
            <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              Upgrade to Pro
            </h3>
            <p className="text-amber-800/80 mb-6 text-sm leading-relaxed">
              Get unlimited access to all past papers, detailed analytics, and our full question bank of over 10,000 MCQs.
            </p>
            <button className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20">
              Go Premium
            </button>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Weak Areas</h3>
            <div className="space-y-6">
              {[
                { label: 'Pharmacology', progress: 45, color: 'bg-danger' },
                { label: 'Physiology', progress: 62, color: 'bg-amber-500' },
                { label: 'Anatomy', progress: 78, color: 'bg-success' }
              ].map((area, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-700">{area.label}</span>
                    <span className="text-slate-500">{area.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", area.color)} 
                      style={{ width: `${area.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 text-primary font-bold text-sm hover:underline">
              View Detailed Analytics
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
