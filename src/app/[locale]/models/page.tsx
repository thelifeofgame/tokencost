import React from 'react';
import ModelsClient from '@/app/models/ModelsClient';
import { SUPPORTED_LOCALES } from '@/i18n';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES
    .filter((l) => l.code !== 'en')
    .map((l) => ({ locale: l.code }));
}

export default function LocalizedModelsPage() {
  return <ModelsClient />;
}
