import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, Topic, MockExamConfig } from '../types';
import { motion } from 'motion/react';
import { Settings, Book, Clock, List, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

import { localDb } from '../lib/localDb';

export default function MockExamSetup() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState(25);
  const [timeLimit, setTimeLimit] = useState(30);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      // Fetch Cloud Topics
      let cloudTopics: Topic[] = [];
      try {
        const snap = await getDocs(collection(db, 'topics'));
        cloudTopics = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
      } catch (e) {}

      // Fetch Local Topics
      const localTopicsData = await localDb.topics.toArray();
      const localTopics = localTopicsData.map(lt => ({
        id: lt.id!.toString(),
        title: lt.title,
        chapterId: lt.chapterId.toString(),
        notes: lt.notes,
        questionCount: lt.questionCount,
        isLocal: true
      } as any));

      // Combine and de-duplicate
      const combined = [...cloudTopics];
      localTopics.forEach(lt => {
        if (!lt.cloudId || !cloudTopics.find(ct => ct.id === lt.cloudId)) {
          combined.push(lt);
        }
      });

      setTopics(combined);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'mock-exam-topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId) 
        : [...prev, topicId]
    );
  };

  const handleStartExam = () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one subject.');
      return;
    }
    
    const config: MockExamConfig = {
      subjects: selectedTopics,
      numQuestions,
      timeLimit
    };
    
    // Pass config via state to the session page
    navigate('/exam/mock/session', { state: { config } });
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading subjects...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-12">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Back to Dashboard</span>
        </button>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">Custom Mock Exam</h1>
        <p className="text-slate-500 text-lg">Configure your exam parameters for a personalized practice session.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-10">
        {/* Left Column: Config */}
        <div className="md:col-span-1 space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <List className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Questions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[10, 25, 50, 100].map(n => (
                <button
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className={cn(
                    "py-3 rounded-xl font-bold text-sm transition-all border",
                    numQuestions === n 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:border-primary/30"
                  )}
                >
                  {n} Qs
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold">Time Limit</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[15, 30, 60, 120].map(m => (
                <button
                  key={m}
                  onClick={() => setTimeLimit(m)}
                  className={cn(
                    "py-3 rounded-xl font-bold text-sm transition-all border",
                    timeLimit === m 
                      ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20" 
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:border-amber-500/30"
                  )}
                >
                  {m} Min
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={handleStartExam}
            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
          >
            Start Exam
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right Column: Subject Selection */}
        <div className="md:col-span-2">
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Book className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold">Select Subjects</h3>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setLoading(true);
                    const fetchTopics = async () => {
                      try {
                        const snap = await getDocs(collection(db, 'topics'));
                        setTopics(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setLoading(false);
                      }
                    };
                    fetchTopics();
                  }}
                  className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
                >
                  Refresh
                </button>
                <button 
                  onClick={() => setSelectedTopics(selectedTopics.length === topics.length ? [] : topics.map(t => t.id))}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {topics.length > 0 ? (
                topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicToggle(topic.id)}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                      selectedTopics.includes(topic.id)
                        ? "bg-primary/5 border-primary text-primary"
                        : "bg-slate-50 border-slate-100 text-slate-600 hover:border-primary/30"
                    )}
                  >
                    <span className="font-bold text-sm">{topic.title}</span>
                    {selectedTopics.includes(topic.id) && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No subjects found</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                    Please upload a PDF in the Admin Panel to extract medical subjects and questions.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
