'use client';

import type { ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

export default function SubscriptionOutbound({ product, href, affiliate = false, children }: {
  product: string; href: string; affiliate?: boolean; children: ReactNode;
}) {
  return <a href={href} target="_blank" rel={affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'}
    className="text-sm text-indigo-700 underline dark:text-indigo-300"
    onClick={() => trackEvent(affiliate ? 'subs_affiliate_click' : 'subs_official_click', { value: product })}>
    {children}
  </a>;
}
