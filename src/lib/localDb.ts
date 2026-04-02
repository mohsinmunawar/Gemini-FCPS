import Dexie, { type Table } from 'dexie';

export interface LocalBook {
  id?: number;
  title: string;
  description: string;
  examType: string;
  image: string;
  questionCount: number;
  createdAt: number;
  source: 'local' | 'cloud';
  cloudId?: string;
}

export interface LocalChapter {
  id?: number;
  bookId: number;
  title: string;
  questionCount: number;
  cloudId?: string;
}

export interface LocalTopic {
  id?: number;
  chapterId: number;
  title: string;
  notes: string;
  questionCount: number;
  cloudId?: string;
}

export interface LocalQuestion {
  id?: number;
  topicId: number;
  chapterId: number;
  bookId: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  book: string;
  topic: string;
  type: 'text';
  createdAt: number;
  cloudId?: string;
}

export class AppDatabase extends Dexie {
  books!: Table<LocalBook>;
  chapters!: Table<LocalChapter>;
  topics!: Table<LocalTopic>;
  questions!: Table<LocalQuestion>;

  constructor() {
    super('MedicalMCQDb');
    this.version(1).stores({
      books: '++id, title, examType, source, cloudId',
      chapters: '++id, bookId, title, cloudId',
      topics: '++id, chapterId, title, cloudId',
      questions: '++id, topicId, chapterId, bookId, text, cloudId'
    });
  }
}

export const localDb = new AppDatabase();
