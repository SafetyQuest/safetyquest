'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 9;

export default function QuizzesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch quizzes with pagination
  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['quizzes', search, type, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      
      const res = await fetch(`/api/admin/quizzes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch quizzes');
      return res.json();
    }
  });

  const quizzes = data?.quizzes || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 0;

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

  const handleDeleteQuiz = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation(); // Prevent card click
    if (confirm(`Are you sure you want to delete quiz "${title}"?`)) {
      deleteQuiz.mutate(id);
    }
  };

  const handleEditQuiz = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card click
    router.push(`/admin/quizzes/${id}/edit`);
  };

  const handleCardClick = (id: string) => {
    router.push(`/admin/quizzes/${id}`);
  };

  const getQuizTypeLabel = (type: string) => {
    switch (type) {
      case 'gap_assessment': return 'Gap Assessment';
      case 'lesson': return 'Lesson Quiz';
      case 'course': return 'Course Quiz';
      default: return 'Quiz';
    }
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setCurrentPage(1);
  };

  // Pagination calculations
  const paginatedQuizzes = quizzes;

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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
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
      ) : totalItems === 0 ? (
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedQuizzes.map((quiz: any) => (
              <div
                key={quiz.id}
                onClick={() => handleCardClick(quiz.id)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col"
              >
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{quiz.title}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
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
                  
                  <div className="mb-4">
                    <span className="font-semibold text-sm">Passing Score:</span>{' '}
                    <span className="text-gray-600">
                      {quiz.passingScore || 70}%
                    </span>
                  </div>
                  
                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-grow"></div>
                  
                  <div className="flex gap-2 pt-4 border-t mt-auto">
                    <button
                      onClick={(e) => handleEditQuiz(e, quiz.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit Quiz"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteQuiz(e, quiz.id, quiz.title)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </div>
  );
}