'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

export default function QuizzesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const queryClient = useQueryClient();

  // Fetch quizzes
  const { data: quizzes, isLoading, isRefetching } = useQuery({
    queryKey: ['quizzes', search, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      
      const res = await fetch(`/api/admin/quizzes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch quizzes');
      return res.json();
    }
  });

  // Delete quiz
  const deleteQuiz = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete quiz');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleDeleteQuiz = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete quiz "${title}"?`)) {
      deleteQuiz.mutate(id);
    }
  };

  const getQuizTypeLabel = (type: string) => {
    switch (type) {
      case 'gap_assessment': return 'Gap Assessment';
      case 'lesson': return 'Lesson Quiz';
      case 'course': return 'Course Quiz';
      default: return 'Quiz';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quizzes</h1>
        <Link
          href="/admin/quizzes/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Quiz
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Quiz Types</option>
            <option value="gap_assessment">Gap Assessment</option>
            <option value="lesson">Lesson Quiz</option>
            <option value="course">Course Quiz</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      {isLoading || isRefetching ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          Loading quizzes...
        </div>
      ) : quizzes?.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="mb-4">No quizzes found. Create your first quiz!</p>
          <Link
            href="/admin/quizzes/new"
            className="text-blue-600 hover:text-blue-800"
          >
            + New Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes?.map((quiz: any) => (
            <div
              key={quiz.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold">{quiz.title}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    quiz.type === 'gap_assessment' ? 'bg-purple-100 text-purple-800' :
                    quiz.type === 'lesson' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getQuizTypeLabel(quiz.type)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {quiz.description || 'No description provided.'}
                </p>
                
                <div className="mb-3">
                  <span className="font-semibold text-sm">Questions:</span>{' '}
                  <span className="text-gray-600">
                    {quiz.questions.length} question(s)
                  </span>
                </div>
                
                <div className="mb-3">
                  <span className="font-semibold text-sm">Passing Score:</span>{' '}
                  <span className="text-gray-600">
                    {quiz.passingScore || 70}%
                  </span>
                </div>
                
                <div className="flex mt-4">
                  <Link
                    href={`/admin/quizzes/${quiz.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/admin/quizzes/${quiz.id}/edit`}
                    className="text-green-600 hover:text-green-800 text-sm font-medium mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}