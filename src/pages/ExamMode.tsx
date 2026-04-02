import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Play, Pause } from 'lucide-react';
import { Question } from '../types';
import QuestionCard from '../components/QuestionCard';
import { formatTime, cn } from '../lib/utils';

export default function ExamMode() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, 'questions'), limit(100));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => {
          const docData = doc.data() as any;
          return { id: doc.id, ...docData } as Question;
        });
        setQuestions(data);
        setUserAnswers(new Array(data.length).fill(null));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (isPaused || isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isFinished]);

  const handleSelect = (index: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = index;
    setUserAnswers(newAnswers);
  };

  const handleFinish = async () => {
    if (isFinished) return;
    setIsFinished(true);
    
    if (!profile) return;

    let correctCount = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    try {
      const docRef = await addDoc(collection(db, 'mockExams'), {
        userId: profile.uid,
        score,
        totalQuestions: questions.length,
        duration: 7200 - timeLeft,
        timestamp: serverTimestamp(),
        questionIds: questions.map(q => q.id),
        userAnswers,
      });
      navigate(`/results/${docRef.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Preparing your exam...</div>;
  
  if (questions.length === 0) return (
    <div className="max-w-2xl mx-auto mt-20 text-center space-y-6">
      <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
      <h2 className="text-2xl font-bold">No questions available</h2>
      <p className="text-slate-500">The question bank is currently empty. Please contact an admin.</p>
      <button onClick={() => navigate('/dashboard')} className="text-primary font-bold">Return to Dashboard</button>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Exam Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-md py-4 z-20 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Mock Exam</h1>
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg shadow-sm border transition-colors",
            timeLeft < 600 ? "bg-danger/10 border-danger text-danger animate-pulse" : "bg-white border-slate-200 text-slate-700"
          )}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            {isPaused ? <Play className="w-5 h-5 text-success" /> : <Pause className="w-5 h-5 text-slate-600" />}
          </button>
          
          <button 
            onClick={handleFinish}
            className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
          >
            Submit
          </button>
        </div>
      </div>

      {isPaused && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-30 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-10 rounded-3xl text-center max-w-sm shadow-2xl"
          >
            <Pause className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-display font-bold mb-4">Exam Paused</h2>
            <p className="text-slate-500 mb-8">Take a breath. Your progress and timer are saved.</p>
            <button 
              onClick={() => setIsPaused(false)}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
            >
              Resume Exam
            </button>
          </motion.div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full mb-10 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-primary"
        />
      </div>

      {/* Question */}
      <div className="grid lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <QuestionCard 
                question={currentQuestion}
                selectedOption={userAnswers[currentIndex]}
                onSelect={handleSelect}
                showExplanation={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12">
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>
            
            <button 
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-30 transition-all shadow-lg shadow-primary/20"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Grid Sidebar */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-full aspect-square rounded-lg text-xs font-black transition-all flex items-center justify-center border-2",
                    currentIndex === i ? "border-primary bg-primary text-white shadow-md" : 
                    userAnswers[i] !== null ? "border-slate-800 bg-slate-800 text-white" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 border-dashed">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-4">
              <CheckCircle2 className="w-4 h-4" /> Legend
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <div className="w-4 h-4 bg-primary rounded shadow-sm"></div> Current
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <div className="w-4 h-4 bg-slate-800 rounded shadow-sm"></div> Answered
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <div className="w-4 h-4 bg-slate-50 border-2 border-slate-100 rounded"></div> Unanswered
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
