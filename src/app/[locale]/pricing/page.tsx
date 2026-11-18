import React from 'react';
import PricingHubPage from '@/app/pricing/page';
import { SUPPORTED_LOCALES } from '@/i18n';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES
    .filter((l) => l.code !== 'en')
    .map((l) => ({ locale: l.code }));
}

export default function LocalizedPricingPage() {
  return <PricingHubPage />;
}
