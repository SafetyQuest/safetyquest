'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;
  const queryClient = useQueryClient();
  
  // Fetch lesson details
  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lessons/${lessonId}`);
      if (!res.ok) throw new Error('Failed to fetch lesson');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          Loading lesson details...
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          Lesson not found.
          <div className="mt-4">
            <Link
              href="/admin/lessons"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Lessons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          <p className="text-gray-600">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              lesson.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
              lesson.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {lesson.difficulty}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/lessons/${lessonId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Lesson
          </Link>
          <Link
            href="/admin/lessons"
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Lessons
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Lesson Steps */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Lesson Steps ({lesson.steps.length})</h2>
            
            {lesson.steps.length === 0 ? (
              <p className="text-gray-600">
                This lesson doesn't have any steps yet.
              </p>
            ) : (
              <div className="space-y-3">
                {lesson.steps
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((step: any, index: number) => (
                    <div 
                      key={step.id} 
                      className="border rounded-md p-4 bg-gray-50"
                    >
                      <div className="flex items-center mb-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full mr-3 text-xs font-bold">
                          {index + 1}
                        </span>
                        <h3 className="font-medium">
                          {step.type === 'content' ? 'Content' : 'Game'}: {' '}
                          {step.type === 'content' ? 
                            (step.contentType.charAt(0).toUpperCase() + step.contentType.slice(1)) :
                            (step.gameType.charAt(0).toUpperCase() + step.gameType.slice(1))
                          }
                        </h3>
                      </div>
                      
                      {/* Preview based on type */}
                      {step.type === 'content' && (
                        <div className="p-2 bg-white border rounded-md">
                          {step.contentType === 'text' && (
                            <div className="prose max-w-none" 
                                 dangerouslySetInnerHTML={{ 
                                   __html: typeof step.contentData === 'string' 
                                     ? JSON.parse(step.contentData).html 
                                     : step.contentData?.html || 'No content' 
                                 }} 
                            />
                          )}
                          
                          {step.contentType === 'image' && (
                            <div className="text-center">
                              <img 
                                src={typeof step.contentData === 'string' 
                                  ? JSON.parse(step.contentData).url 
                                  : step.contentData?.url || ''
                                } 
                                alt={typeof step.contentData === 'string' 
                                  ? JSON.parse(step.contentData).alt 
                                  : step.contentData?.alt || 'Image'
                                }
                                className="max-h-48 mx-auto object-contain"
                              />
                            </div>
                          )}
                          
                          {step.contentType === 'video' && (
                            <div className="text-center">
                              <video 
                                controls
                                src={typeof step.contentData === 'string' 
                                  ? JSON.parse(step.contentData).url 
                                  : step.contentData?.url || ''
                                }
                                poster={typeof step.contentData === 'string' 
                                  ? JSON.parse(step.contentData).thumbnail 
                                  : step.contentData?.thumbnail || ''
                                }
                                className="max-h-48 mx-auto"
                              />
                            </div>
                          )}
                          
                          {step.contentType === 'embed' && (
                            <div className="text-center">
                              <div dangerouslySetInnerHTML={{ 
                                html: typeof step.contentData === 'string' 
                                  ? JSON.parse(step.contentData).html 
                                  : step.contentData?.html || 'No embed content' 
                              }} />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {step.type === 'game' && (
                        <div className="p-2 bg-white border rounded-md">
                          <p className="text-sm text-gray-600">
                            {step.gameType === 'hotspot' && 'Hotspot Game: Click on specific areas of an image'}
                            {step.gameType === 'drag-drop' && 'Drag and Drop Game: Match items to targets'}
                            {step.gameType === 'matching' && 'Matching Game: Connect related items'}
                            {step.gameType === 'sequence' && 'Sequence Game: Arrange items in correct order'}
                            {step.gameType === 'true-false' && 'True/False Game: Evaluate statements'}
                            {step.gameType === 'multiple-choice' && 'Multiple Choice: Select correct answers'}
                            {step.gameType === 'fill-blank' && 'Fill in the Blanks: Complete sentences'}
                            {step.gameType === 'scenario' && 'Scenario Game: Make decisions in situations'}
                          </p>
                          
                          <div className="mt-2 text-center">
                            <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                              Preview Game
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Lesson Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Lesson Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Description</h3>
                <p className="mt-1">
                  {lesson.description || 'No description provided.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Lesson Quiz</h3>
                <p className="mt-1">
                  {lesson.quiz ? (
                    <Link href={`/admin/quizzes/${lesson.quiz.id}`} className="text-blue-600 hover:text-blue-800">
                      {lesson.quiz.title}
                    </Link>
                  ) : (
                    'No quiz assigned'
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Slug</h3>
                <p className="mt-1">{lesson.slug}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">ID</h3>
                <p className="mt-1">{lesson.id}</p>
              </div>
            </div>
          </div>

          {/* Courses Using This Lesson */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Used in Courses</h2>
            
            {lesson.courses.length === 0 ? (
              <p className="text-gray-600">This lesson isn't used in any courses yet.</p>
            ) : (
              <div className="space-y-2">
                {lesson.courses.map((cl: any) => (
                  <div key={cl.course.id} className="p-2 bg-gray-50 rounded border">
                    <div className="flex justify-between items-center">
                      <Link href={`/admin/courses/${cl.course.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {cl.course.title}
                      </Link>
                      <span className="text-xs text-gray-600">Order: {cl.order + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel - Tags & Preview */}
        <div>
          {/* Tags Panel */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-3">Tags</h2>
            
            {lesson.tags.length === 0 ? (
              <p className="text-gray-600">No tags assigned to this lesson.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lesson.tags.map((lt: any) => (
                  <span
                    key={lt.tagId}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {lt.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Preview Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-3">Lesson Preview</h2>
            <p className="text-sm text-gray-600 mb-4">
              See how this lesson will appear to learners.
            </p>
            
            <button
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full"
              disabled={lesson.steps.length === 0}
              onClick={() => {/* TODO: Show preview modal */}}
            >
              Preview Lesson
            </button>
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold mb-2">Lesson Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Content Steps:</span>
                  <span className="ml-1 font-medium">
                    {lesson.steps.filter((s: any) => s.type === 'content').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Game Steps:</span>
                  <span className="ml-1 font-medium">
                    {lesson.steps.filter((s: any) => s.type === 'game').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Est. Duration:</span>
                  <span className="ml-1 font-medium">
                    ~{Math.max(5, lesson.steps.length * 2)} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}