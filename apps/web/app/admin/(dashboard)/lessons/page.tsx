'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Copy } from 'lucide-react';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 9;

export default function LessonsPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch lessons with pagination (LOGIC PRESERVED)
  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['lessons', search, difficulty, tag, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (difficulty) params.append('difficulty', difficulty);
      if (tag) params.append('tag', tag);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const res = await fetch(`/api/admin/lessons?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch lessons');
      return res.json();
    },
  });

  const lessons = data?.lessons || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  // Fetch tags for filter (LOGIC PRESERVED)
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    },
  });

  // Delete lesson (LOGIC PRESERVED)
  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/lessons/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete lesson');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const handleDeleteLesson = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete lesson "${title}"?`)) {
      deleteLesson.mutate(id);
    }
  };

  const handleEditLesson = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/admin/lessons/${id}/edit`);
  };

  const handleCloneLesson = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/admin/lessons/new?clone=${id}`);
  };

  const handleCardClick = (id: string) => {
    router.push(`/admin/lessons/${id}`);
  };

  return (
    <div className="p-8 bg-[var(--surface)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Lessons</h1>
        <Link
          href="/admin/lessons/new"
          className="btn btn-primary px-4 py-2"
        >
          + New Lesson
        </Link>
      </div>

      {/* Filters - UPDATED WITH BRAND COLORS */}
      <div className="bg-[var(--background)] p-4 rounded-lg shadow mb-6 border border-[var(--border)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
          />
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] bg-[var(--background)] text-[var(--text-primary)]"
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <select
            value={tag}
            onChange={(e) => { setTag(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] bg-[var(--background)] text-[var(--text-primary)]"
          >
            <option value="">All Tags</option>
            {tags?.map((t: any) => (
              <option key={t.id} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lessons Grid - UPDATED WITH BRAND COLORS */}
      {isLoading || isRefetching ? (
        <div className="bg-[var(--background)] p-8 rounded-lg shadow text-center border border-[var(--border)]">
          <div className="animate-pulse text-[var(--text-primary)]">Loading lessons...</div>
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-[var(--background)] p-8 rounded-lg shadow text-center border border-[var(--border)]">
          <p className="text-[var(--text-primary)] mb-4">No lessons found. Create your first lesson!</p>
          <Link
            href="/admin/lessons/new"
            className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]"
          >
            + New Lesson
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson: any) => (
              <div
                key={lesson.id}
                onClick={() => handleCardClick(lesson.id)}
                className="bg-[var(--background)] rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-[--transition-base] flex flex-col border border-[var(--border)] hover:border-[var(--primary-light)]"
              >
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{lesson.title}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      lesson.difficulty === 'Beginner' ? 'bg-[var(--success-light)] text-[var(--success-dark)]' :
                      lesson.difficulty === 'Intermediate' ? 'bg-[var(--warning-light)] text-[var(--warning-dark)]' :
                      'bg-[var(--danger-light)] text-[var(--danger-dark)]'
                    }`}>
                      {lesson.difficulty}
                    </span>
                  </div>

                  <p className="text-[var(--text-secondary)] mb-4 line-clamp-2">
                    {lesson.description || 'No description provided.'}
                  </p>

                  <div className="mb-3">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">Steps:</span>{' '}
                    <span className="text-[var(--text-secondary)]">{lesson.steps.length} step(s)</span>
                  </div>

                  {lesson.tags.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-[var(--text-primary)]">Tags:</span>{' '}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lesson.tags.map((lt: any) => (
                          <span
                            key={lt.tagId}
                            className="px-2 py-1 bg-[var(--surface)] text-[var(--text-secondary)] rounded text-xs"
                          >
                            {lt.tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <span className="text-sm text-[var(--text-primary)]">Used in:</span>{' '}
                    <span className="text-[var(--text-secondary)]">{lesson.courses.length} course(s)</span>
                  </div>

                  <div className="flex-grow"></div>

                  <div className="flex gap-2 pt-4 border-t border-[var(--border)] mt-auto flex-wrap">
                    <button
                      onClick={(e) => handleEditLesson(e, lesson.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--success-dark)] hover:bg-[var(--success-light)] rounded-md transition-colors duration-[--transition-base]"
                      title="Edit Lesson"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleCloneLesson(e, lesson.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-surface)] rounded-md transition-colors duration-[--transition-base]"
                      title="Clone Lesson"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Clone</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteLesson(e, lesson.id, lesson.title)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-light)] rounded-md transition-colors duration-[--transition-base]"
                      title="Delete Lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

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