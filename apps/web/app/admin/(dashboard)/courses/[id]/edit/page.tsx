'use client';

import { useParams } from 'next/navigation';
import CourseForm from '@/components/admin/CourseForm';

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;

  return <CourseForm courseId={courseId} />;
}