import { getTranslation } from '@/i18n';
import type { Locale } from '@/i18n/types';

export default function PriceVerificationDate({ date, locale }: { date?: string; locale: Locale }) {
  const label = getTranslation(locale).detail.verified;
  if (!date) return null;
  const [before, after] = label.split('{date}');
  return <p className="text-xs text-zinc-600 dark:text-zinc-400">{before}<time dateTime={date}>{date}</time>{after}</p>;
}
