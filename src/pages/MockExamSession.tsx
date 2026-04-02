import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, Question, MockExamConfig, MockExam } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import { cn } from '../lib/utils';

import { localDb } from '../lib/localDb';

export default function MockExamSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const config = location.state?.config as MockExamConfig;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(config?.timeLimit * 60 || 0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!config) {
      navigate('/exam/mock');
      return;
    }

    const fetchQuestions = async () => {
      try {
        // Separate subjects into cloud and local
        const cloudSubjects = config.subjects.filter(id => isNaN(Number(id)));
        const localSubjects = config.subjects.filter(id => !isNaN(Number(id))).map(Number);

        let allQuestions: Question[] = [];

        // Fetch from Cloud
        if (cloudSubjects.length > 0) {
          const subjectBatches = [];
          for (let i = 0; i < cloudSubjects.length; i += 10) {
            subjectBatches.push(cloudSubjects.slice(i, i + 10));
          }

          for (const batch of subjectBatches) {
            const q = query(
              collection(db, 'questions'),
              where('topicId', 'in', batch),
              limit(config.numQuestions * 2)
            );
            const snap = await getDocs(q);
            const batchQuestions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
            allQuestions = [...allQuestions, ...batchQuestions];
          }
        }

        // Fetch from Local
        if (localSubjects.length > 0) {
          const localData = await localDb.questions
            .where('topicId')
            .anyOf(localSubjects)
            .limit(config.numQuestions * 2)
            .toArray();
          
          const localQuestions = localData.map(lq => ({
            id: lq.id!.toString(),
            text: lq.text,
            options: lq.options,
            correctAnswerIndex: lq.correctAnswerIndex,
            explanation: lq.explanation,
            bookId: lq.bookId.toString(),
            chapterId: lq.chapterId.toString(),
            topicId: lq.topicId.toString(),
            book: lq.book,
            topic: lq.topic,
            type: lq.type,
            isLocal: true
          } as any));
          
          allQuestions = [...allQuestions, ...localQuestions];
        }
        
        // Randomize and slice to requested number
        allQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, config.numQuestions);
        
        setQuestions(allQuestions);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'mock-exam-questions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [config, navigate]);

  useEffect(() => {
    if (loading || isFinished) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, isFinished]);

  const handleSelect = (index: number) => {
    if (isFinished) return;
    setAnswers(prev => ({
      ...prev,
      [questions[currentIndex].id]: index
    }));
  };

  const handleFinish = async () => {
    if (isFinished) return;
    setIsFinished(true);
    setLoading(true);

    try {
      const correctAnswers = questions.filter(q => answers[q.id] === q.correctAnswerIndex).length;
      const score = Math.round((correctAnswers / questions.length) * 100);
      
      const examResult: Partial<MockExam> = {
        userId: profile?.uid,
        score,
        totalQuestions: questions.length,
        correctAnswers,
        duration: config.timeLimit * 60,
        timeSpent: (config.timeLimit * 60) - timeLeft,
        timestamp: serverTimestamp(),
        questionIds: questions.map(q => q.id),
        subjects: config.subjects,
      };

      const docRef = await addDoc(collection(db, 'mockExams'), examResult);
      
      // Also save individual progress for analytics
      for (const q of questions) {
        await addDoc(collection(db, 'userProgress'), {
          userId: profile?.uid,
          questionId: q.id,
          status: answers[q.id] === q.correctAnswerIndex ? 'correct' : 'wrong',
          timestamp: serverTimestamp(),
          examId: docRef.id
        });
      }

      navigate(`/exam/mock/result/${docRef.id}`, { state: { exam: { ...examResult, id: docRef.id }, questions, answers } });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'mock-exam-save');
      setIsFinished(false);
      setLoading(false);
    }
  };

  if (loading && !isFinished) return <div className="flex items-center justify-center h-screen">Preparing your exam...</div>;
  if (questions.length === 0) return <div className="flex items-center justify-center h-screen">No questions found for selected subjects.</div>;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-4xl mx-auto pb-20 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10">
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to quit? Your progress will be lost.')) {
              navigate('/dashboard');
            }
          }} 
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-2 font-mono font-bold text-sm px-4 py-2 rounded-xl border",
          timeLeft < 60 ? "bg-danger/10 text-danger border-danger/20 animate-pulse" : "bg-white text-slate-500 border-slate-100"
        )}>
          <Clock className="w-4 h-4" />
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <QuestionCard 
            question={currentQuestion}
            selectedOption={answers[currentQuestion.id] ?? null}
            onSelect={handleSelect}
            showExplanation={false} // Don't show explanation during mock exam
          />
        </motion.div>
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 md:relative md:bg-transparent md:border-none md:p-0 md:mt-10 flex gap-4">
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          Previous
        </button>
        
        {currentIndex < questions.length - 1 ? (
          <button 
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            Next Question
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
          >
            Finish Exam
            <CheckCircle2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
