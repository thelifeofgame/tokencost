import React from 'react';
import CompareClient from '@/app/compare/CompareClient';
import { SUPPORTED_LOCALES } from '@/i18n';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES
    .filter((l) => l.code !== 'en')
    .map((l) => ({ locale: l.code }));
}

export default function LocalizedComparePage() {
  return <CompareClient />;
}
