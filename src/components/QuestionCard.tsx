import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Question } from '../types';
import { CheckCircle2, XCircle, Info, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuestionCardProps {
  question: Question;
  selectedOption: number | null;
  onSelect: (index: number) => void;
  showExplanation: boolean;
  isCorrect?: boolean;
}

export default function QuestionCard({ 
  question, 
  selectedOption, 
  onSelect, 
  showExplanation,
  isCorrect 
}: QuestionCardProps) {
  return (
    <div className="space-y-8">
      {/* Question Text */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-start justify-between gap-4 mb-6">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
            {question.topic}
          </span>
          <button className="text-slate-300 hover:text-primary transition-colors">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
          {question.text}
        </h2>
        {question.imageUrl && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-slate-100">
            <img src={question.imageUrl} alt="Question visual" className="w-full h-auto" referrerPolicy="no-referrer" />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid gap-4">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrectAnswer = index === question.correctAnswerIndex;
          
          let stateClasses = "bg-white border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-slate-50";
          
          if (showExplanation) {
            if (isCorrectAnswer) {
              stateClasses = "bg-success/10 border-success text-success shadow-sm";
            } else if (isSelected) {
              stateClasses = "bg-danger/10 border-danger text-danger shadow-sm";
            } else {
              stateClasses = "bg-white border-slate-100 text-slate-400 opacity-60";
            }
          } else if (isSelected) {
            stateClasses = "bg-primary border-primary text-white shadow-lg shadow-primary/20";
          }

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.98 }}
              onClick={() => !showExplanation && onSelect(index)}
              disabled={showExplanation}
              className={cn(
                "w-full text-left p-5 rounded-2xl border-2 font-bold text-lg transition-all flex items-center justify-between group",
                stateClasses
              )}
            >
              <div className="flex items-center gap-4">
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-colors",
                  isSelected ? "bg-white/20" : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </div>
              
              {showExplanation && isCorrectAnswer && <CheckCircle2 className="w-6 h-6 text-success" />}
              {showExplanation && isSelected && !isCorrectAnswer && <XCircle className="w-6 h-6 text-danger" />}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6 text-primary">
            <Info className="w-6 h-6" />
            <h3 className="text-xl font-bold uppercase tracking-tight">Explanation</h3>
          </div>
          <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
            <ReactMarkdown>{question.explanation}</ReactMarkdown>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Source: <span className="text-slate-200 font-bold">{question.book}</span>
            </div>
            <button className="text-primary font-bold text-sm hover:underline">
              Add Personal Note
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
