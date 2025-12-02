// apps/web/app/admin/quizzes/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import GameRenderer from '@/components/GameRenderer';

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [previewGame, setPreviewGame] = useState<{ type: string; config: any } | null>(null);
  
  // Fetch quiz details
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/quizzes/${quizId}`);
      if (!res.ok) throw new Error('Failed to fetch quiz');
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading quiz details...</div>;
  }

  if (!quiz) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          Quiz not found.
          <div className="mt-4">
            <Link href="/admin/quizzes" className="text-blue-600 hover:text-blue-800">
              Back to Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to generate a readable quiz type
  const getQuizTypeLabel = (type: string) => {
    switch(type) {
      case 'gap_assessment': return 'Gap Assessment';
      case 'lesson': return 'Lesson Quiz';
      case 'course': return 'Course Quiz';
      default: return 'Quiz';
    }
  };
  
  // Helper function to get a text preview of the question
  const getQuestionPreview = (question: any) => {
    let config = {};
    try { config = typeof question.gameConfig === 'string' ? JSON.parse(question.gameConfig) : question.gameConfig || {}; } 
    catch { config = {}; }
    return `Preview: ${question.gameType} game`;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <div className="mt-1">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              quiz.type === 'gap_assessment' ? 'bg-purple-100 text-purple-800' :
              quiz.type === 'lesson' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {getQuizTypeLabel(quiz.type)}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/quizzes/${quizId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Quiz
          </Link>
          <Link
            href="/admin/quizzes"
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Quizzes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Quiz Questions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Quiz Questions ({quiz.questions.length})</h2>
            
            {quiz.questions.length === 0 ? (
              <p className="text-gray-600">This quiz doesn't have any questions yet.</p>
            ) : (
              <div className="space-y-3">
                {quiz.questions
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((question: any, index: number) => (
                    <div key={question.id} className="border rounded-md p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold mr-2">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="font-medium">
                              {question.gameType.charAt(0).toUpperCase() + question.gameType.slice(1).replace('-', ' ')}
                            </h3>
                            <div className="text-sm text-gray-600">
                              <span className="mr-3">Difficulty: {question.difficulty}/5</span>
                              <span>Points: {question.points}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-3 bg-white border rounded-md">
                        <div className="text-gray-700">
                          {getQuestionPreview(question)}
                        </div>
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                          onClick={() =>
                            setPreviewGame({
                              type: question.gameType,
                              config: typeof question.gameConfig === 'string' ? JSON.parse(question.gameConfig) : question.gameConfig,
                            })
                          }
                        >
                          Preview Question
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <AnimatePresence>
              {previewGame && (
                <motion.div
                  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPreviewGame(null)}
                >
                  <motion.div
                    className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                      onClick={() => setPreviewGame(null)}
                    >
                      ✕
                    </button>

                    <GameRenderer type={previewGame.type} config={previewGame.config} mode="preview" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quiz Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Quiz Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Description</h3>
                <p className="mt-1">
                  {quiz.description || 'No description provided.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Usage</h3>
                <p className="mt-1">
                  {quiz.type === 'gap_assessment' && 'Used for knowledge gap assessment'}
                  {quiz.type === 'lesson' && (
                    quiz.lessonUsage 
                      ? <Link href={`/admin/lessons/${quiz.lessonUsage.id}`} className="text-blue-600 hover:text-blue-800">
                          Used in lesson: {quiz.lessonUsage.title}
                        </Link>
                      : 'Not currently assigned to any lesson'
                  )}
                  {quiz.type === 'course' && (
                    quiz.courseUsage 
                      ? <Link href={`/admin/courses/${quiz.courseUsage.id}`} className="text-blue-600 hover:text-blue-800">
                          Used in course: {quiz.courseUsage.title}
                        </Link>
                      : 'Not currently assigned to any course'
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Slug</h3>
                <p className="mt-1">{quiz.slug}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">ID</h3>
                <p className="mt-1">{quiz.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div>
          {/* Quiz Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-3">Quiz Statistics</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium">{quiz.questions.length}</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(100, quiz.questions.length * 10)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {quiz.questions.length < 5 
                    ? 'Recommendation: Add more questions for better assessment'
                    : quiz.questions.length >= 10
                      ? 'Excellent question count'
                      : 'Good question count'}
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Points:</span>
                  <span className="font-medium">{quiz.questions.reduce((sum: number, q: any) => sum + q.points, 0)}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Passing Score:</span>
                  <span className="font-medium">{quiz.passingScore}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      quiz.passingScore < 60 ? 'bg-green-500' : 
                      quiz.passingScore > 80 ? 'bg-red-500' : 
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${quiz.passingScore}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {quiz.passingScore < 60 
                    ? 'Low difficulty threshold'
                    : quiz.passingScore > 80
                      ? 'High difficulty threshold'
                      : 'Moderate difficulty threshold'}
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Question Types:</span>
                </div>
                <div className="mt-2 text-sm">
                  {Array.from(new Set(quiz.questions.map((q: any) => q.gameType))).map((type: any) => (
                    <div key={type} className="flex justify-between mb-1">
                      <span>{type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}:</span>
                      <span>
                        {quiz.questions.filter((q: any) => q.gameType === type).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Quiz Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-3">Quiz Actions</h2>
            
            <div className="space-y-3">
              <Link
                href={`/admin/quizzes/${quizId}/edit`}
                className="block w-full px-3 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Quiz
              </Link>
              
              <button
                type="button"
                className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this quiz?')) {
                    try {
                      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
                        method: 'DELETE'
                      });
                      
                      if (!res.ok) {
                        const error = await res.json();
                        
                        if (error.blockers) {
                          let message = 'This quiz cannot be deleted because it is in use:\n\n';
                          
                          if (error.blockers.lessons && error.blockers.lessons.length > 0) {
                            message += `Lessons:\n${error.blockers.lessons.map((l: any) => ` - ${l.title}`).join('\n')}\n\n`;
                          }
                          
                          if (error.blockers.courses && error.blockers.courses.length > 0) {
                            message += `Courses:\n${error.blockers.courses.map((c: any) => ` - ${c.title}`).join('\n')}`;
                          }
                          
                          alert(message);
                          return;
                        }
                        
                        throw new Error(error.error || 'Failed to delete quiz');
                      }
                      
                      router.push('/admin/quizzes');
                    } catch (error: any) {
                      alert(error.message);
                    }
                  }
                }}
              >
                Delete Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}