'use client';

import { useParams } from 'next/navigation';
import { SectionPage } from '@/components/forms/SectionPage';

export default function PatientSectionBPage() {
  const requestId = useParams().requestId as string;
  return (
    <SectionPage
      section="B"
      id={requestId}
      shellRole="PATIENT"
      activeNav="my-details"
      title="Section B - Insured details"
      subtitle="Please check and complete your details. You can only see this section."
      doneHref={`/patient/${requestId}`}
    />
  );
}
