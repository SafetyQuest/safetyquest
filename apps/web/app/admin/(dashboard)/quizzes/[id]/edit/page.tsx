'use client';

import { useParams } from 'next/navigation';
import QuizForm from '@/components/admin/QuizForm';

export default function EditQuizPage() {
  const params = useParams();
  const quizId = params.id as string;

  return <QuizForm quizId={quizId} />;
}