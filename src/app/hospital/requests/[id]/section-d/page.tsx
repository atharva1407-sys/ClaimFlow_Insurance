'use client';

import { useParams } from 'next/navigation';
import { SectionPage } from '@/components/forms/SectionPage';

export default function SectionDPage() {
  const id = useParams().id as string;
  return (
    <SectionPage
      section="D"
      id={id}
      shellRole="HOSPITAL"
      activeNav="dashboard"
      title="Section D - Admission and estimated costs"
      subtitle="Admission details and the estimate. Amounts are whole rupees."
      backLink={{ href: `/hospital/requests/${id}`, label: 'Back to case' }}
      doneHref={`/hospital/requests/${id}`}
    />
  );
}
