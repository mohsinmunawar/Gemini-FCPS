export type ExamType = 'FCPS 1' | 'IMM' | 'FCPS 2';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  targetExam?: ExamType;
  subscriptionStatus: 'free' | 'paid';
  role: 'user' | 'admin' | 'curator';
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  bookId: string;
  chapterId: string;
  topicId: string;
  book?: string; // Optional title for display
  topic?: string; // Optional title for display
  type: 'text' | 'image' | 'formula';
  imageUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  examType: ExamType;
}

export interface Chapter {
  id: string;
  title: string;
  bookId: string;
}

export interface Topic {
  id: string;
  title: string;
  chapterId: string;
  notes?: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  questionId: string;
  status: 'correct' | 'wrong';
  timestamp: any;
}

export interface MockExam {
  id: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  duration: number; // in seconds
  timeSpent: number; // in seconds
  timestamp: any;
  questionIds: string[];
  subjects: string[];
  weakAreas?: string[];
  aiAnalysis?: string;
}

export interface MockExamConfig {
  subjects: string[];
  numQuestions: number;
  timeLimit: number; // in minutes
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
