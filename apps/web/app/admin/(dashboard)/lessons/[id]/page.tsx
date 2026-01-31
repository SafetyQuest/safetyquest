'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import GameRenderer from '@/components/GameRenderer';

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;
  const queryClient = useQueryClient();
  const [previewStepId, setPreviewStepId] = useState<string | null>(null);
  const [previewGame, setPreviewGame] = useState<{
    type: string;
    config: any;
  } | null>(null);
  
  // Fetch lesson details (LOGIC PRESERVED)
  const {  data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lessons/${lessonId}`);
      if (!res.ok) throw new Error('Failed to fetch lesson');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-[var(--surface)]">
        <div className="bg-[var(--background)] rounded-lg shadow-md p-8 border border-[var(--border)]">
          <div className="animate-pulse text-[var(--text-primary)]">Loading lesson details...</div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center bg-[var(--surface)]">
        <div className="bg-[var(--background)] rounded-lg shadow-md p-8 border border-[var(--border)]">
          <p className="text-[var(--text-primary)]">Lesson not found.</p>
          <div className="mt-4">
            <Link
              href="/admin/lessons"
              className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]"
            >
              Back to Lessons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[var(--surface)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{lesson.title}</h1>
          <p className="mt-1">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              lesson.difficulty === 'Beginner' ? 'bg-[var(--success-light)] text-[var(--success-dark)]' :
              lesson.difficulty === 'Intermediate' ? 'bg-[var(--warning-light)] text-[var(--warning-dark)]' :
              'bg-[var(--danger-light)] text-[var(--danger-dark)]'
            }`}>
              {lesson.difficulty}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/lessons/${lessonId}/edit`}
            className="btn btn-primary px-4 py-2"
          >
            Edit Lesson
          </Link>
          <Link
            href="/admin/lessons"
            className="btn px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            Back to Lessons
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Lesson Steps - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 mb-6 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Lesson Steps ({lesson.steps.length})</h2>
            
            {lesson.steps.length === 0 ? (
              <p className="text-[var(--text-secondary)]">
                This lesson doesn't have any steps yet.
              </p>
            ) : (
              <div className="space-y-3">
                {lesson.steps
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((step: any, index: number) => (
                    <div 
                      key={step.id} 
                      className="border border-[var(--border)] rounded-md p-4 bg-[var(--surface)]"
                    >
                      <div className="flex items-center mb-2">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-bold ${
                          index % 2 === 0 
                            ? 'bg-[var(--primary-surface)] text-[var(--primary-dark)]' 
                            : 'bg-[var(--success-light)] text-[var(--success-dark)]'
                        }`}>
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-[var(--text-primary)]">
                          {step.type === 'content' ? 'Content' : 'Game'}: {' '}
                          {step.type === 'content' ? 
                            (step.contentType.charAt(0).toUpperCase() + step.contentType.slice(1)) :
                            (step.gameType.charAt(0).toUpperCase() + step.gameType.slice(1))
                          }
                        </h3>
                      </div>
                      
                      {/* Preview based on type - UPDATED WITH BRAND COLORS */}
                      {step.type === 'content' && (
                        <div className="p-2 bg-[var(--background)] border border-[var(--border)] rounded-md">
                          {step.contentType === 'text' && (
                            <div className="prose max-w-none" 
                                 dangerouslySetInnerHTML={{ 
                                   __html: typeof step.contentData === 'string' 
                                     ? JSON.parse(step.contentData).html 
                                     : step.contentData?.html || 'No content' 
                                 }} 
                            />
                          )}
                          
                          {/* IMAGE - UPDATED WITH BRAND COLORS */}
                          {step.contentType === 'image' && (() => {
                            const data = typeof step.contentData === 'string'
                              ? JSON.parse(step.contentData)
                              : step.contentData || {};

                            return (
                              <div className="text-center space-y-2">
                                <img
                                  src={data.url || ''}
                                  alt={data.alt || 'Image'}
                                  className="max-h-48 mx-auto object-contain"
                                />

                                {/* Title */}
                                {data.title && (
                                  <p className="font-semibold text-sm text-[var(--text-primary)]">{data.title}</p>
                                )}

                                {/* Description */}
                                {data.description && (
                                  <p className="text-xs text-[var(--text-secondary)]">{data.description}</p>
                                )}
                              </div>
                            );
                          })()}
                          
                          {/* VIDEO - UPDATED WITH BRAND COLORS */}
                          {step.contentType === 'video' && (() => {
                            const data = typeof step.contentData === 'string'
                              ? JSON.parse(step.contentData)
                              : step.contentData || {};

                            return (
                              <div className="text-center space-y-2">
                                <video
                                  controls
                                  src={data.url || ''}
                                  className="max-h-48 mx-auto"
                                />

                                {/* Title */}
                                {data.title && (
                                  <p className="font-semibold text-sm text-[var(--text-primary)]">{data.title}</p>
                                )}

                                {/* Description */}
                                {data.description && (
                                  <p className="text-xs text-[var(--text-secondary)]">{data.description}</p>
                                )}
                              </div>
                            );
                          })()}
                          
                          {step.contentType === 'embed' && (
                            <div className="text-center">
                              <div dangerouslySetInnerHTML={{ 
                                __html: typeof step.contentData === 'string' 
                                  ? JSON.parse(step.contentData).html 
                                  : step.contentData?.html || 'No embed content' 
                              }} />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {step.type === 'game' && (
                        <div className="p-2 bg-[var(--background)] border border-[var(--border)] rounded-md">
                          <p className="text-sm text-[var(--text-secondary)]">
                            {step.gameType === 'hotspot' && 'Hotspot Game: Click on specific areas of an image'}
                            {step.gameType === 'drag-drop' && 'Drag and Drop Game: Match items to targets'}
                            {step.gameType === 'matching' && 'Matching Game: Connect related items'}
                            {step.gameType === 'sequence' && 'Sequence Game: Arrange items in correct order'}
                            {step.gameType === 'true-false' && 'True/False Game: Evaluate statements'}
                            {step.gameType === 'multiple-choice' && 'Multiple Choice: Select correct answers'}
                            {step.gameType === 'scenario' && 'Scenario Game: Make decisions in situations'}
                          </p>
                          
                          <div className="mt-2 text-center">
                            <button
                              className="px-3 py-1 bg-[var(--primary-surface)] text-[var(--primary-dark)] rounded-md text-sm hover:bg-[var(--primary-light)] hover:text-[var(--text-inverse)] transition-colors duration-[--transition-base]"
                              onClick={() =>
                                setPreviewGame({
                                  type: step.gameType,
                                  config: typeof step.gameConfig === 'string' 
                                    ? JSON.parse(step.gameConfig) 
                                    : step.gameConfig,
                                })
                              }
                            >
                              Preview Game
                            </button>
                          </div>
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
                                  className="bg-[var(--background)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-[var(--border)]"
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0.8 }}
                                  onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
                                >
                                  <button
                                    className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-[--transition-base]"
                                    onClick={() => setPreviewGame(null)}
                                  >
                                    ✕
                                  </button>

                                  <GameRenderer
                                    type={previewGame.type}
                                    config={previewGame.config}
                                    mode="preview"
                                  />
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Lesson Details - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 mb-6 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Lesson Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Description</h3>
                <p className="mt-1 text-[var(--text-primary)]">
                  {lesson.description || 'No description provided.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Lesson Quiz</h3>
                <p className="mt-1">
                  {lesson.quiz ? (
                    <Link href={`/admin/quizzes/${lesson.quiz.id}`} className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]">
                      {lesson.quiz.title}
                    </Link>
                  ) : (
                    <span className="text-[var(--text-secondary)]">No quiz assigned</span>
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Slug</h3>
                <p className="mt-1 text-[var(--text-primary)] break-all">{lesson.slug}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">ID</h3>
                <p className="mt-1 text-[var(--text-primary)] break-all">{lesson.id}</p>
              </div>
            </div>
          </div>

          {/* Courses Using This Lesson - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Used in Courses</h2>
            
            {lesson.courses.length === 0 ? (
              <p className="text-[var(--text-secondary)]">This lesson isn't used in any courses yet.</p>
            ) : (
              <div className="space-y-2">
                {lesson.courses.map((cl: any) => (
                  <div key={cl.course.id} className="p-2 bg-[var(--surface)] rounded border border-[var(--border)]">
                    <div className="flex justify-between items-center">
                      <Link href={`/admin/courses/${cl.course.id}`} className="font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]">
                        {cl.course.title}
                      </Link>
                      <span className="text-xs text-[var(--text-muted)]">Order: {cl.order + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel - Tags & Preview - UPDATED WITH BRAND COLORS */}
        <div>
          {/* Tags Panel */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 mb-6 border border-[var(--border)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">Tags</h2>
            
            {lesson.tags.length === 0 ? (
              <p className="text-[var(--text-secondary)]">No tags assigned to this lesson.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lesson.tags.map((lt: any) => (
                  <span
                    key={lt.tagId}
                    className="px-3 py-1 bg-[var(--surface)] text-[var(--text-secondary)] rounded-full text-sm"
                  >
                    {lt.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Preview Panel - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
            <div className="">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Lesson Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-[var(--text-secondary)]">Content Steps:</span>
                  <span className="ml-1 font-medium text-[var(--text-primary)]">
                    {lesson.steps.filter((s: any) => s.type === 'content').length}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Game Steps:</span>
                  <span className="ml-1 font-medium text-[var(--text-primary)]">
                    {lesson.steps.filter((s: any) => s.type === 'game').length}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Est. Duration:</span>
                  <span className="ml-1 font-medium text-[var(--text-primary)]">
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