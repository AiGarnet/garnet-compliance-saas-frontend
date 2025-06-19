"use client";

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

function QuestionnairesAnswersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const id = searchParams?.get('id');
    
    if (id) {
      // Redirect to the new chat interface route
      router.replace(`/questionnaires/${id}/chat`);
    } else {
      // No ID provided, redirect to questionnaires list
      router.replace('/questionnaires');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to chat interface...</p>
      </div>
    </div>
  );
}

export default function QuestionnairesAnswersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <QuestionnairesAnswersPageContent />
    </Suspense>
  );
} 