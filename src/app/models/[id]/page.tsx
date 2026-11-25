import type { Metadata } from 'next';
import { MODELS_DATA } from '@/lib/models-data';
import ModelDetailPage, { buildModelMetadata } from '@/components/ModelDetailPage';

export async function generateStaticParams() {
  return MODELS_DATA.map((m) => ({
    id: m.modelId,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return buildModelMetadata(params.id, 'en');
}

export default function Page({ params }: { params: { id: string } }) {
  return <ModelDetailPage params={params} />;
}
