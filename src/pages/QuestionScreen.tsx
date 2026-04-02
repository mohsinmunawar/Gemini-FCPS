import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Question, OperationType } from '../types';
import QuestionCard from '../components/QuestionCard';
import { handleFirestoreError } from '../lib/firestoreUtils';

interface QuestionScreenProps {
  mode: 'study' | 'quick';
}

import { localDb } from '../lib/localDb';

export default function QuestionScreen({ mode }: QuestionScreenProps) {
  const { bookId, chapterId, topicId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        let data: Question[] = [];
        
        // Check if it's a local topic (numeric ID)
        const isLocal = topicId && !isNaN(Number(topicId));
        
        if (mode === 'study') {
          if (isLocal) {
            const localQuestions = await localDb.questions.where('topicId').equals(Number(topicId)).toArray();
            data = localQuestions.map(lq => ({
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
          } else {
            const q = query(
              collection(db, 'questions'), 
              where('topicId', '==', topicId)
            );
            const snap = await getDocs(q);
            data = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Question));
          }
        } else {
          // Quick Review: Combine cloud and local
          let cloudData: Question[] = [];
          try {
            const q = query(collection(db, 'questions'), limit(25));
            const snap = await getDocs(q);
            cloudData = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Question));
          } catch (e) {}

          const localData = await localDb.questions.limit(25).toArray();
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

          data = [...cloudData, ...localQuestions];
          data = data.sort(() => Math.random() - 0.5).slice(0, 25);
        }

        setQuestions(data);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, mode === 'study' ? `questions?topicId=${topicId}` : 'questions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [mode, topicId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = async (index: number) => {
    setSelectedOption(index);
    setShowExplanation(true);
    
    if (!profile) return;

    const isCorrect = index === questions[currentIndex].correctAnswerIndex;
    
    try {
      await addDoc(collection(db, 'userProgress'), {
        userId: profile.uid,
        questionId: questions[currentIndex].id,
        status: isCorrect ? 'correct' : 'wrong',
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'userProgress');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Finish session
      navigate('/dashboard');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading questions...</div>;
  if (questions.length === 0) return (
    <div className="max-w-2xl mx-auto mt-20 text-center space-y-6">
      <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
      <h2 className="text-2xl font-bold">No questions found</h2>
      <p className="text-slate-500">We couldn't find any questions for this topic yet. Please try another one.</p>
      <button onClick={() => navigate(-1)} className="text-primary font-bold">Go Back</button>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
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

        <div className="flex items-center gap-2 text-slate-500 font-mono font-bold text-sm">
          <Clock className="w-4 h-4" />
          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
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
            selectedOption={selectedOption}
            onSelect={handleSelect}
            showExplanation={showExplanation}
          />
        </motion.div>
      </AnimatePresence>

      {/* Footer Actions */}
      {showExplanation && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 md:relative md:bg-transparent md:border-none md:p-0 md:mt-10"
        >
          <button 
            onClick={handleNext}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-dark transition-all"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
