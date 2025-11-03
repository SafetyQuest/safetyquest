'use client';

import { useParams } from 'next/navigation';
import ProgramForm from '@/components/admin/ProgramForm';

export default function EditProgramPage() {
  const params = useParams();
  const programId = params.id as string;

  return <ProgramForm programId={programId} />;
}