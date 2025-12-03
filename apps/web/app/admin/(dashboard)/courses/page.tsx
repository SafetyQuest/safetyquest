'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 9;

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch courses with pagination
  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['courses', search, difficulty, tag, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (difficulty) params.append('difficulty', difficulty);
      if (tag) params.append('tag', tag);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      
      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
  });

  const courses = data?.courses || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  // Fetch tags for filter
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    }
  });

  // Delete course
  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete course');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleDeleteCourse = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete course "${title}"?`)) {
      deleteCourse.mutate(id);
    }
  };

  const handleEditCourse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/admin/courses/${id}/edit`);
  };

  const handleCardClick = (id: string) => {
    router.push(`/admin/courses/${id}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
    setCurrentPage(1);
  };

  const handleTagChange = (value: string) => {
    setTag(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Link
          href="/admin/courses/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          
          <select
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          
          <select
            value={tag}
            onChange={(e) => handleTagChange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Tags</option>
            {tags?.map((tag: any) => (
              <option key={tag.id} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading || isRefetching ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          Loading courses...
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="mb-4">No courses found. Create your first course!</p>
          <Link
            href="/admin/courses/new"
            className="text-blue-600 hover:text-blue-800"
          >
            + New Course
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <div
                key={course.id}
                onClick={() => handleCardClick(course.id)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col"
              >
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{course.title}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {course.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {course.description || 'No description provided.'}
                  </p>
                  
                  <div className="mb-3">
                    <span className="font-semibold text-sm">Lessons:</span>{' '}
                    <span className="text-gray-600">
                      {course.lessons.length} lesson(s)
                    </span>
                  </div>
                  
                  {course.tags.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm">Tags:</span>{' '}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {course.tags.map((ct: any) => (
                          <span
                            key={ct.tagId}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {ct.tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <span className="text-sm">Used in:</span>{' '}
                    <span className="text-gray-600">
                      {course.programs.length} program(s)
                    </span>
                  </div>

                  <div className="flex-grow"></div>
                  
                  <div className="flex gap-2 pt-4 border-t mt-auto">
                    <button
                      onClick={(e) => handleEditCourse(e, course.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit Course"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteCourse(e, course.id, course.title)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Course"
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