'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the hidden admin portal route
    router.replace('/admin-portal');
  }, [router]);

  return null;
}
