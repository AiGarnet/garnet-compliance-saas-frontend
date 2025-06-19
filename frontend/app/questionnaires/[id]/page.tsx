"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestionnairePage({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // First check if this ID corresponds to a vendor
        const vendorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/vendors/${params.id}`);
        
        if (vendorResponse.ok) {
          // This is a vendor ID, redirect to vendor questionnaire
          router.replace(`/vendors/${params.id}/questionnaire`);
          return;
        }
        
        // Check if it's a questionnaire ID
        const questionnaireResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/questionnaires/${params.id}`);
        
        if (questionnaireResponse.ok) {
          // This is a questionnaire ID, redirect to chat
          router.replace(`/questionnaires/${params.id}/chat`);
          return;
        }
        
        // Neither vendor nor questionnaire found, redirect to questionnaires list
        router.replace('/questionnaires');
      } catch (error) {
        console.error('Error checking ID type:', error);
        // On error, redirect to questionnaires list
        router.replace('/questionnaires');
      }
    };

    checkAndRedirect();
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
} 