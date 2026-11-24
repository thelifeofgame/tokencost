'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { isAnalyticsExcludedPath } from '@/lib/analytics';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const hidePublicChrome = isAnalyticsExcludedPath(pathname);

  if (hidePublicChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
