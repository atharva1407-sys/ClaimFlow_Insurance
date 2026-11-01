'use client';

import { useParams } from 'next/navigation';
import { SectionPage } from '@/components/forms/SectionPage';

export default function SectionAPage() {
  const id = useParams().id as string;
  return (
    <SectionPage
      section="A"
      id={id}
      shellRole="HOSPITAL"
      activeNav="dashboard"
      title="Section A - Details of the Provider"
      subtitle="Prefilled from the hospital profile. Check each value, then submit."
      backLink={{ href: `/hospital/requests/${id}`, label: 'Back to case' }}
      doneHref={`/hospital/requests/${id}`}
    />
  );
}
