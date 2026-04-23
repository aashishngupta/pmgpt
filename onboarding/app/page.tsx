'use client';
import { useEffect } from 'react';

// Middleware rewrites / to /landing.html (static file).
// This component runs if client-side navigation lands on / directly.
export default function Root() {
  useEffect(() => {
    const token = localStorage.getItem('pmgpt_access_token');
    window.location.replace(token ? '/dashboard' : '/landing.html');
  }, []);
  return null;
}
