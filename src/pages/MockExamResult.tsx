import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, MockExam, Question } from '../types';
import { motion } from 'motion/react';
import { Trophy, Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeWeakAreas } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export default function MockExamResult() {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<MockExam | null>(location.state?.exam || null);
  const [questions, setQuestions] = useState<Question[]>(location.state?.questions || []);
  const [answers, setAnswers] = useState<Record<string, number>>(location.state?.answers || {});
  const [loading, setLoading] = useState(!exam);
  const [aiAnalysis, setAiAnalysis] = useState<string>(exam?.aiAnalysis || '');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      if (exam) return;
      try {
        const docSnap = await getDoc(doc(db, 'mockExams', examId!));
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as MockExam;
          setExam(data);
          setAiAnalysis(data.aiAnalysis || '');
          
          // Fetch questions
          const qSnap = await getDocs(query(collection(db, 'questions'), where('id', 'in', data.questionIds.slice(0, 10))));
          setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `mock-exam-${examId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId, exam]);

  const handleAnalyze = async () => {
    if (!exam || analyzing) return;
    setAnalyzing(true);
    try {
      const wrongQuestions = questions
        .filter(q => answers[q.id] !== q.correctAnswerIndex)
        .map(q => ({
          text: q.text,
          topic: q.topic,
          explanation: q.explanation
        }));

      const analysis = await analyzeWeakAreas({
        score: exam.score,
        total: exam.totalQuestions,
        subjects: exam.subjects,
        wrongQuestions
      });
      
      setAiAnalysis(analysis);
      // In a real app, we'd update the Firestore document with the analysis
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading results...</div>;
  if (!exam) return <div className="flex items-center justify-center h-screen">Exam not found.</div>;

  const minutes = Math.floor(exam.timeSpent / 60);
  const seconds = exam.timeSpent % 60;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">Exam Results</h1>
        <p className="text-slate-500 text-lg">Detailed breakdown of your performance and AI analysis.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Score</p>
          <p className={cn(
            "text-5xl font-black mb-2",
            exam.score >= 70 ? "text-success" : exam.score >= 50 ? "text-amber-500" : "text-danger"
          )}>
            {exam.score}%
          </p>
          <p className="text-slate-500 font-medium">
            {exam.correctAnswers} / {exam.totalQuestions} Correct
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Time Spent</p>
          <p className="text-5xl font-black text-slate-900 mb-2">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <p className="text-slate-500 font-medium">
            Out of {exam.duration / 60} Min
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Accuracy</p>
          <p className="text-5xl font-black text-primary mb-2">
            {Math.round((exam.correctAnswers / exam.totalQuestions) * 100)}%
          </p>
          <p className="text-slate-500 font-medium">
            Performance Index
          </p>
        </div>
      </div>

      {/* AI Analysis Section */}
      <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/40 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Weak Area Analysis</h2>
              <p className="text-slate-400 text-sm">Personalized feedback based on your mistakes.</p>
            </div>
          </div>

          {!aiAnalysis ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Our AI can analyze your wrong answers to identify specific medical concepts you should focus on.
              </p>
              <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze My Weak Areas'}
              </button>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              <button 
                onClick={() => setAiAnalysis('')}
                className="mt-8 text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" /> Re-generate Analysis
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Question Review */}
      <section className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold">Question Review</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-success">
              <CheckCircle2 className="w-4 h-4" /> Correct
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-danger">
              <XCircle className="w-4 h-4" /> Incorrect
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const isCorrect = answers[q.id] === q.correctAnswerIndex;
            return (
              <div 
                key={q.id}
                className={cn(
                  "p-6 rounded-3xl border transition-all",
                  isCorrect ? "bg-success/5 border-success/20" : "bg-danger/5 border-danger/20"
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500">{i + 1}</span>
                    <h4 className="font-bold text-slate-900 leading-relaxed">{q.text}</h4>
                  </div>
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-danger shrink-0" />
                  )}
                </div>
                
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {q.options.map((opt, optIdx) => (
                    <div 
                      key={optIdx}
                      className={cn(
                        "p-4 rounded-xl text-sm font-medium border",
                        optIdx === q.correctAnswerIndex ? "bg-success/10 border-success/30 text-success" : 
                        optIdx === answers[q.id] ? "bg-danger/10 border-danger/30 text-danger" :
                        "bg-white border-slate-100 text-slate-500"
                      )}
                    >
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white/50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> Explanation
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-12 flex gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all"
        >
          Return to Dashboard
        </button>
        <button 
          onClick={() => navigate('/exam/mock')}
          className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
        >
          New Mock Exam
        </button>
      </div>
    </div>
  );
}
