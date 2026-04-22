'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('pmgpt_access_token');
    router.replace(token ? '/dashboard' : '/onboarding/signup');
  }, [router]);
  return null;
}
