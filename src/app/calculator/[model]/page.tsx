import type { Metadata } from 'next';
import { MODELS_DATA } from '@/lib/models-data';
import ModelCalculatorPage, { buildCalculatorMetadata } from '@/components/ModelCalculatorPage';

export async function generateStaticParams() {
  return MODELS_DATA.map((m) => ({
    model: m.modelId,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { model: string };
}): Promise<Metadata> {
  return buildCalculatorMetadata(params.model, 'en');
}

export default function Page({ params }: { params: { model: string } }) {
  return <ModelCalculatorPage params={params} />;
}
