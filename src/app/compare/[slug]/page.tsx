import type { Metadata } from 'next';
import { getAllCompareStaticSlugs } from '@/lib/models-data';
import ComparePage, { buildCompareMetadata } from '@/components/ComparePage';

export async function generateStaticParams() {
  const slugs = getAllCompareStaticSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return buildCompareMetadata(params.slug, 'en');
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ComparePage params={params} />;
}
