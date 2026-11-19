import React from 'react';
import HarnessDirectoryClient from '@/components/HarnessDirectoryClient';
import { SUPPORTED_LOCALES } from '@/i18n';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES
    .filter((l) => l.code !== 'en')
    .map((l) => ({ locale: l.code }));
}

export default function LocalizedHarnessPage() {
  return <HarnessDirectoryClient />;
}
