'use client';

import { useParams } from 'next/navigation';
import { SectionPage } from '@/components/forms/SectionPage';

// Staff cannot edit this section. The page exists for the emergency operator on an emergency case;
// the server decides whether the form is editable or read-only.
export default function SectionCViewPage() {
  const id = useParams().id as string;
  return (
    <SectionPage
      section="C"
      id={id}
      shellRole="HOSPITAL"
      activeNav="dashboard"
      title="Section C"
      subtitle="Emergency entry. Read-only unless you are the emergency operator on an emergency case."
      backLink={{ href: `/hospital/requests/${id}`, label: 'Back to case' }}
      doneHref={`/hospital/requests/${id}`}
    />
  );
}
