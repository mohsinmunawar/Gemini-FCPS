import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { sampleBooks, sampleQuestions } from '../data/seedData';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Trash2, Plus, AlertTriangle, CheckCircle2, Upload, FileText, Loader2, Book as BookIcon, ChevronLeft, List, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { extractMCQsFromText, ExtractedMCQ } from '../services/geminiService';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType } from '../types';

// Set up PDF.js worker using a direct unpkg URL for version 5+ compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [extractedCount, setExtractedCount] = useState(0);
  const [progress, setProgress] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [counts, setCounts] = useState({ chapters: 0, topics: 0, questions: 0 });
  const [targetExam, setTargetExam] = useState('USMLE Step 1');

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'books'));
      setBooks(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      
      // Fetch counts
      const [chaptersSnap, topicsSnap, questionsSnap] = await Promise.all([
        getDocs(collection(db, 'chapters')),
        getDocs(collection(db, 'topics')),
        getDocs(collection(db, 'questions'))
      ]);
      setCounts({
        chapters: chaptersSnap.size,
        topics: topicsSnap.size,
        questions: questionsSnap.size
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'admin-stats');
    }
  }, []);

  React.useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const seedDatabase = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      // Seed Books
      for (const book of sampleBooks) {
        const q = query(collection(db, 'books'), where('title', '==', book.title));
        const snap = await getDocs(q);
        let bookId;
        
        if (snap.empty) {
          const bookRef = await addDoc(collection(db, 'books'), {
            ...book,
            createdAt: serverTimestamp()
          });
          bookId = bookRef.id;
        } else {
          bookId = snap.docs[0].id;
        }

        // Ensure at least one chapter and topic for the book
        const chapterQuery = query(collection(db, 'chapters'), where('bookId', '==', bookId));
        const chapterSnap = await getDocs(chapterQuery);
        let chapterId;

        if (chapterSnap.empty) {
          const chapterRef = await addDoc(collection(db, 'chapters'), {
            title: 'General Principles',
            bookId: bookId
          });
          chapterId = chapterRef.id;
        } else {
          chapterId = chapterSnap.docs[0].id;
        }

        const topicQuery = query(collection(db, 'topics'), where('chapterId', '==', chapterId));
        const topicSnap = await getDocs(topicQuery);
        let topicId;

        if (topicSnap.empty) {
          const topicRef = await addDoc(collection(db, 'topics'), {
            title: 'Foundations',
            chapterId: chapterId,
            notes: 'Basic foundational principles.'
          });
          topicId = topicRef.id;
        } else {
          topicId = topicSnap.docs[0].id;
        }

        // Seed Questions for this book/topic
        for (const question of sampleQuestions) {
          if (question.book === book.title) {
            const qText = query(collection(db, 'questions'), where('text', '==', question.text));
            const qSnap = await getDocs(qText);
            if (qSnap.empty) {
              await addDoc(collection(db, 'questions'), {
                text: question.text,
                options: question.options,
                correctAnswerIndex: question.correctAnswerIndex,
                explanation: question.explanation,
                bookId: bookId,
                chapterId: chapterId,
                topicId: topicId,
                book: book.title,
                topic: 'Foundations',
                type: 'text',
                createdAt: serverTimestamp()
              });
            }
          }
        }
      }

      setMessage('Database seeded successfully!');
      fetchBooks();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'seed');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    setLoading(true);
    setShowClearConfirm(false);
    try {
      const collections = ['books', 'chapters', 'topics', 'questions', 'mockExams', 'userProgress'];
      for (const coll of collections) {
        const snap = await getDocs(collection(db, coll));
        for (const doc of snap.docs) {
          await deleteDoc(doc.ref);
        }
      }
      setMessage('Database cleared successfully!');
      fetchBooks();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, 'clear-all');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setScraping(true);
    setError('');
    setMessage('');
    setExtractedCount(0);
    setProgress('Reading PDF content...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedArray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';

          // Extract text from all pages
          for (let i = 1; i <= pdf.numPages; i++) {
            setProgress(`Reading PDF: Page ${i} of ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Sort items by vertical position (top to bottom) then horizontal (left to right)
            const items = textContent.items as any[];
            items.sort((a, b) => {
              if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
                return b.transform[5] - a.transform[5]; // Higher Y first
              }
              return a.transform[4] - b.transform[4]; // Lower X first
            });

            let lastY = -1;
            let pageText = '';
            for (const item of items) {
              if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 5) {
                pageText += '\n';
              }
              pageText += item.str + ' ';
              lastY = item.transform[5];
            }
            fullText += pageText + '\n--- PAGE BREAK ---\n';
          }

          // Chunk the text to process with Gemini
          // Larger chunks (10000 chars) with significant overlap (1500 chars)
          // This ensures questions aren't cut off and AI has enough context.
          const chunkSize = 10000; 
          const overlap = 1500;
          const chunks = [];
          
          for (let i = 0; i < fullText.length; i += (chunkSize - overlap)) {
            chunks.push(fullText.slice(i, i + chunkSize));
            if (i + chunkSize >= fullText.length) break;
          }

          let totalCount = 0;
          const concurrencyLimit = 3; // Slightly lower concurrency for larger chunks to avoid rate limits
          
          for (let i = 0; i < chunks.length; i += concurrencyLimit) {
            const currentBatch = chunks.slice(i, i + concurrencyLimit);
            const batchNum = Math.floor(i / concurrencyLimit) + 1;
            const totalBatches = Math.ceil(chunks.length / concurrencyLimit);
            
            setProgress(`AI Scraping: Batch ${batchNum} of ${totalBatches} (${totalCount} MCQs found so far)...`);
            
            const results = await Promise.allSettled(currentBatch.map(chunk => extractMCQsFromText(chunk)));
            
            for (const result of results) {
              if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
                const mcqs = result.value;
                // Save extracted MCQs to Firestore
                for (const mcq of mcqs) {
                  const bookTitle = mcq.book || 'Medical Book';
                  const topicTitle = mcq.topic || 'General';
                  
                  // 1. Ensure Book exists
                  let bookId = '';
                  const bookQuery = query(collection(db, 'books'), where('title', '==', bookTitle));
                  const bookSnap = await getDocs(bookQuery);
                  if (bookSnap.empty) {
                    const bookRef = await addDoc(collection(db, 'books'), {
                      title: bookTitle,
                      description: `Extracted content from ${bookTitle}`,
                      examType: targetExam,
                      image: 'https://images.unsplash.com/photo-1544640808-32ca72ac7f37?w=800&auto=format&fit=crop&q=60'
                    });
                    bookId = bookRef.id;
                  } else {
                    bookId = bookSnap.docs[0].id;
                  }

                  // 2. Ensure Chapter exists
                  let chapterId = '';
                  const chapterQuery = query(collection(db, 'chapters'), 
                    where('bookId', '==', bookId), 
                    where('title', '==', 'Extracted Content')
                  );
                  const chapterSnap = await getDocs(chapterQuery);
                  if (chapterSnap.empty) {
                    const chapterRef = await addDoc(collection(db, 'chapters'), {
                      title: 'Extracted Content',
                      bookId: bookId
                    });
                    chapterId = chapterRef.id;
                  } else {
                    chapterId = chapterSnap.docs[0].id;
                  }

                  // 3. Ensure Topic exists
                  let topicId = '';
                  const topicQuery = query(collection(db, 'topics'), 
                    where('chapterId', '==', chapterId), 
                    where('title', '==', topicTitle)
                  );
                  const topicSnap = await getDocs(topicQuery);
                  if (topicSnap.empty) {
                    const topicRef = await addDoc(collection(db, 'topics'), {
                      title: topicTitle,
                      chapterId: chapterId,
                      notes: `Questions related to ${topicTitle}`
                    });
                    topicId = topicRef.id;
                  } else {
                    topicId = topicSnap.docs[0].id;
                  }

                  // 4. Save Question
                  const correctIndex = mcq.options.findIndex(opt => 
                    opt.toLowerCase().trim() === mcq.correctAnswer.toLowerCase().trim() ||
                    mcq.correctAnswer.toLowerCase().includes(opt.toLowerCase().trim())
                  );

                  await addDoc(collection(db, 'questions'), {
                    text: mcq.text,
                    options: mcq.options,
                    correctAnswerIndex: correctIndex >= 0 ? correctIndex : 0,
                    explanation: mcq.explanation,
                    bookId: bookId,
                    chapterId: chapterId,
                    topicId: topicId,
                    book: bookTitle,
                    topic: topicTitle,
                    type: 'text',
                    createdAt: serverTimestamp()
                  });
                  totalCount++;
                  setExtractedCount(totalCount);
                }
              } else if (result.status === 'fulfilled' && result.value && result.value.length === 0) {
                console.warn('AI returned no MCQs for this chunk.');
              } else if (result.status === 'rejected') {
                console.error('Batch chunk failed:', result.reason);
              }
            }
          }

          if (totalCount === 0) {
            setError('No MCQs could be extracted from this PDF. Try a different file.');
          } else {
            setMessage(`Successfully extracted and saved ${totalCount} MCQs!`);
            setProgress('');
            fetchBooks();
          }
        } catch (err: any) {
          handleFirestoreError(err, OperationType.WRITE, 'pdf-scraping');
          setError(`PDF Processing Error: ${err.message}`);
        } finally {
          setScraping(false);
          setProgress('');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err.message);
      setScraping(false);
      setProgress('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Back to Dashboard</span>
        </button>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">Admin Panel</h1>
        <p className="text-slate-500 text-lg">Manage application content and system configuration.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">Data Management</h3>
          </div>
          
          {message && !scraping && (
            <div className="bg-success/10 text-success p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {message}
            </div>
          )}
          
          {error && (
            <div className="bg-danger/10 text-danger p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={seedDatabase}
              disabled={loading || scraping}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Seed Sample Data
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={loading || scraping}
              className="w-full flex items-center justify-center gap-2 bg-white border border-danger text-danger py-4 rounded-2xl font-bold hover:bg-danger/5 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" /> Clear All Content
            </button>
          </div>
        </section>

        {/* Clear Confirmation Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowClearConfirm(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-danger/10 text-danger rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">Are you sure?</h3>
                <p className="text-slate-500 mb-10 leading-relaxed">
                  This will permanently delete all books, questions, and user progress. This action cannot be undone.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={clearDatabase}
                    className="w-full bg-danger text-white py-4 rounded-2xl font-bold hover:bg-danger-dark transition-all shadow-lg shadow-danger/20"
                  >
                    Yes, Clear Everything
                  </button>
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <section className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-900/20 md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <h3 className="text-xl font-bold">System Status</h3>
            </div>
            <button 
              onClick={fetchBooks}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Refresh Counts
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Books', count: books.length, icon: BookIcon, color: 'text-blue-400' },
              { label: 'Chapters', count: counts.chapters, icon: FileText, color: 'text-purple-400' },
              { label: 'Topics', count: counts.topics, icon: List, color: 'text-amber-400' },
              { label: 'Questions', count: counts.questions, icon: Database, color: 'text-success' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <item.icon className={cn("w-4 h-4", item.color)} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </div>
                <p className="text-3xl font-black">{item.count}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-6 leading-relaxed italic">
            * These counts represent the total records currently stored in your database. If subjects are missing in Study Mode or Mock Exams, ensure the counts above are non-zero.
          </p>
        </section>
      </div>

        <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">AI MCQ Scraper</h3>
          </div>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Upload PDFs to automatically extract MCQs, explanations, and topics using Gemini AI.
          </p>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Exam</label>
            <input 
              type="text" 
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              placeholder="e.g. USMLE Step 1, PLAB, etc."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
            />
          </div>
          
          <div 
            {...getRootProps()} 
            className={`p-10 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-slate-700 hover:border-slate-500'
            } ${scraping ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            {scraping ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-primary font-bold">Extracting MCQs...</p>
                <p className="text-slate-500 text-sm mt-2">{progress || 'This may take a minute depending on PDF size'}</p>
              </div>
            ) : (
              <>
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-slate-600'}`} />
                <p className="text-slate-300 font-bold mb-1">
                  {isDragActive ? 'Drop the PDF here' : 'Drag & drop PDF here'}
                </p>
                <p className="text-slate-500 text-sm">or click to select file</p>
              </>
            )}
          </div>

          {extractedCount > 0 && (
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-primary-light">
                {extractedCount} MCQs added to the database.
              </p>
            </div>
          )}
        </section>

      <section className="mt-12 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookIcon className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">Uploaded Books</h3>
          </div>
          <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
            {books.length} Books
          </span>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {books.map((book) => (
            <div key={book.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{book.title}</h4>
                <button 
                  onClick={async () => {
                    if (window.confirm(`Delete ${book.title} and its content?`)) {
                      setLoading(true);
                      try {
                        // Delete book
                        await deleteDoc(doc(db, 'books', book.id));
                        // Delete related chapters
                        const chaptersSnap = await getDocs(query(collection(db, 'chapters'), where('bookId', '==', book.id)));
                        for (const chapter of chaptersSnap.docs) {
                          // Delete related topics
                          const topicsSnap = await getDocs(query(collection(db, 'topics'), where('chapterId', '==', chapter.id)));
                          for (const topic of topicsSnap.docs) {
                            await deleteDoc(topic.ref);
                          }
                          await deleteDoc(chapter.ref);
                        }
                        // Delete related questions
                        const questionsSnap = await getDocs(query(collection(db, 'questions'), where('bookId', '==', book.id)));
                        for (const q of questionsSnap.docs) {
                          await deleteDoc(q.ref);
                        }
                        setMessage(`Deleted ${book.title} and all its content.`);
                        fetchBooks();
                      } catch (err: any) {
                        handleFirestoreError(err, OperationType.DELETE, `book-${book.id}`);
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="text-slate-300 hover:text-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{book.description}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{book.examType}</span>
              </div>
            </div>
          ))}
          {books.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-400 italic">No books uploaded yet. Use the scraper above to add content.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
