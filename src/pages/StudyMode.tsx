import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, Book, Chapter, Topic } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Book as BookIcon, ChevronRight, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

import { localDb } from '../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';

export default function StudyMode() {
  const { profile } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'book' | 'subject'>('book');
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});

  // Fetch local data using Dexie hooks
  const dexieBooks = useLiveQuery(() => localDb.books.toArray());
  const dexieTopics = useLiveQuery(() => localDb.topics.toArray());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Cloud Books
        let cloudBooks: Book[] = [];
        try {
          let booksQuery;
          if (profile?.targetExam) {
            booksQuery = query(collection(db, 'books'), where('examType', '==', profile.targetExam));
          } else {
            booksQuery = query(collection(db, 'books'));
          }
          const booksSnap = await getDocs(booksQuery);
          cloudBooks = booksSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Book));
        } catch (e) {
          console.warn('Cloud fetch failed, relying on local data');
        }

        // Combine with Local Books (avoiding duplicates if synced)
        const localBooksData = dexieBooks || [];
        const combinedBooks = [...cloudBooks];
        
        localBooksData.forEach(lb => {
          if (!lb.cloudId || !cloudBooks.find(cb => cb.id === lb.cloudId)) {
            combinedBooks.push({
              id: lb.id!.toString(),
              title: lb.title,
              description: lb.description,
              examType: lb.examType,
              image: lb.image,
              questionCount: lb.questionCount,
              isLocal: true
            } as any);
          }
        });

        setBooks(combinedBooks);

        // Fetch All Topics for "By Subject" view
        let cloudTopics: Topic[] = [];
        try {
          const topicsSnap = await getDocs(collection(db, 'topics'));
          cloudTopics = topicsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Topic));
        } catch (e) {}

        const localTopicsData = dexieTopics || [];
        const combinedTopics = [...cloudTopics];
        localTopicsData.forEach(lt => {
          if (!lt.cloudId || !cloudTopics.find(ct => ct.id === lt.cloudId)) {
            combinedTopics.push({
              id: lt.id!.toString(),
              title: lt.title,
              chapterId: lt.chapterId.toString(),
              notes: lt.notes,
              questionCount: lt.questionCount,
              isLocal: true
            } as any);
          }
        });
        setAllTopics(combinedTopics);

        // Update counts
        const counts: { [key: string]: number } = {};
        combinedBooks.forEach(b => { 
          if (b.questionCount !== undefined) counts[b.id] = b.questionCount; 
        });
        combinedTopics.forEach(t => { 
          if (t.questionCount !== undefined) counts[t.id] = t.questionCount; 
        });
        setQuestionCounts(counts);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'study-mode-data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile, dexieBooks, dexieTopics]);

  const handleBookSelect = async (bookId: string | number) => {
    setSelectedBook(bookId);
    setSelectedChapter(null);
    setChapters([]);
    setTopics([]);
    try {
      let combinedChapters: Chapter[] = [];
      
      // Check if it's a local book (numeric ID or marked as local)
      const book = books.find(b => b.id === bookId);
      const isLocal = (book as any)?.isLocal || typeof bookId === 'number';

      if (isLocal) {
        const localChapters = await localDb.chapters.where('bookId').equals(Number(bookId)).toArray();
        combinedChapters = localChapters.map(lc => ({
          id: lc.id!.toString(),
          title: lc.title,
          bookId: lc.bookId.toString(),
          questionCount: lc.questionCount,
          isLocal: true
        } as any));
      } else {
        const chaptersQuery = query(collection(db, 'chapters'), where('bookId', '==', bookId));
        const chaptersSnap = await getDocs(chaptersQuery);
        combinedChapters = chaptersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Chapter));
      }

      setChapters(combinedChapters);
      
      // Update counts for chapters
      setQuestionCounts(prev => {
        const next = { ...prev };
        combinedChapters.forEach(c => { 
          if (c.questionCount !== undefined) next[c.id] = c.questionCount; 
        });
        return next;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `chapters-${bookId}`);
    }
  };

  const handleChapterSelect = async (chapterId: string | number) => {
    setSelectedChapter(chapterId);
    setTopics([]);
    try {
      let combinedTopics: Topic[] = [];
      const chapter = chapters.find(c => c.id === chapterId);
      const isLocal = (chapter as any)?.isLocal || typeof chapterId === 'number';

      if (isLocal) {
        const localTopics = await localDb.topics.where('chapterId').equals(Number(chapterId)).toArray();
        combinedTopics = localTopics.map(lt => ({
          id: lt.id!.toString(),
          title: lt.title,
          chapterId: lt.chapterId.toString(),
          notes: lt.notes,
          questionCount: lt.questionCount,
          isLocal: true
        } as any));
      } else {
        const topicsQuery = query(collection(db, 'topics'), where('chapterId', '==', chapterId));
        const topicsSnap = await getDocs(topicsQuery);
        combinedTopics = topicsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Topic));
      }

      setTopics(combinedTopics);

      // Update counts for topics
      setQuestionCounts(prev => {
        const next = { ...prev };
        combinedTopics.forEach(t => { 
          if (t.questionCount !== undefined) next[t.id] = t.questionCount; 
        });
        return next;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `topics-${chapterId}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading content...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Study Mode</h1>
        <p className="text-slate-500">Navigate through structured content for {profile?.targetExam}.</p>
      </header>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search topics, chapters, or keywords..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('book')}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-sm transition-all",
              viewMode === 'book' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            By Book
          </button>
          <button 
            onClick={() => setViewMode('subject')}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-sm transition-all",
              viewMode === 'subject' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            By Subject
          </button>
        </div>
      </div>

      {viewMode === 'book' ? (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Books Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Books</h3>
            <div className="space-y-2">
              {books.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleBookSelect(book.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                    selectedBook === book.id 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-white border-slate-100 text-slate-700 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-3">
                        <BookIcon className={cn("w-5 h-5", selectedBook === book.id ? "text-white" : "text-primary")} />
                        <span className="font-bold">{book.title}</span>
                      </div>
                      <span className={cn("text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full uppercase tracking-wider", 
                        selectedBook === book.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                        {questionCounts[book.id] || 0} MCQs
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", selectedBook === book.id ? "translate-x-1" : "text-slate-300 group-hover:translate-x-1")} />
                </button>
              ))}
              {books.length === 0 && <p className="text-slate-400 text-sm p-4 italic">No books found for this exam.</p>}
            </div>
          </div>

          {/* Chapters Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Chapters</h3>
            <div className="space-y-2">
              {!selectedBook ? (
                <div className="p-8 bg-slate-100/50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <p className="text-slate-400 text-sm">Select a book to view chapters</p>
                </div>
              ) : (
                chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterSelect(chapter.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                      selectedChapter === chapter.id 
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20" 
                        : "bg-white border-slate-100 text-slate-700 hover:border-slate-900/30"
                    )}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-bold">{chapter.title}</span>
                      <span className={cn("text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full uppercase tracking-wider", 
                        selectedChapter === chapter.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                        {questionCounts[chapter.id] || 0} MCQs
                      </span>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 transition-transform", selectedChapter === chapter.id ? "translate-x-1" : "text-slate-300 group-hover:translate-x-1")} />
                  </button>
                ))
              )}
              {selectedBook && chapters.length === 0 && <p className="text-slate-400 text-sm p-4 italic">No chapters in this book.</p>}
            </div>
          </div>

          {/* Topics Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Topics</h3>
            <div className="space-y-2">
              {!selectedChapter ? (
                <div className="p-8 bg-slate-100/50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <p className="text-slate-400 text-sm">Select a chapter to view topics</p>
                </div>
              ) : (
                topics.map((topic) => (
                  <Link
                    key={topic.id}
                    to={`/study/${selectedBook}/${selectedChapter}/${topic.id}`}
                    className="w-full text-left p-4 rounded-2xl border bg-white border-slate-100 text-slate-700 hover:border-primary hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-bold">{topic.title}</span>
                      <span className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                        {questionCounts[topic.id] || 0} MCQs
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-tighter">Start</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))
              )}
              {selectedChapter && topics.length === 0 && <p className="text-slate-400 text-sm p-4 italic">No topics in this chapter.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allTopics
            .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((topic) => (
            <Link
              key={topic.id}
              to={`/study/all/all/${topic.id}`}
              className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-primary hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-slate-900">{topic.title}</h4>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-tighter">
                  {questionCounts[topic.id] || 0} MCQs
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2">{topic.notes || 'Browse questions for this subject.'}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
          {allTopics.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 italic">No subjects found. Upload content in the Admin Panel to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
