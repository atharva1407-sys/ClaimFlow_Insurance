'use client';

import { useParams } from 'next/navigation';
import { SectionPage } from '@/components/forms/SectionPage';

export default function DoctorSectionCPage() {
  const id = useParams().id as string;
  return (
    <SectionPage
      section="C"
      id={id}
      shellRole="DOCTOR"
      activeNav="worklist"
      title="Section C - Treating doctor"
      subtitle="Clinical details, chronic illness history and the doctor items printed on page 2."
      backLink={{ href: '/doctor/dashboard', label: 'Back to worklist' }}
      doneHref="/doctor/dashboard"
    />
  );
}
