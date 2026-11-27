import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SchemaOrg from '@/components/seo/SchemaOrg';
import SubscriptionCatalog from './SubscriptionCatalog';
import SubscriptionPicker from './SubscriptionPicker';
import SubscriptionBreakevenCard from './SubscriptionBreakevenCard';
import SubscriptionOutbound from './SubscriptionOutbound';
import { getTranslation } from '@/i18n';
import { subscriptionAlternates, subscriptionComparisons, subscriptionHref, subscriptionProducts } from '@/lib/ai-subscriptions';
import type { SubscriptionLocale, SubscriptionPlan, SubscriptionProduct } from '@/lib/ai-subscriptions';

interface Props {
  locale: SubscriptionLocale;
  productId?: string;
  comparisonId?: string;
}

function resolvePage({ locale, productId, comparisonId }: Props) {
  const { subscriptions: t } = getTranslation(locale);
  const comparison = comparisonId && subscriptionComparisons.find(item => item.slug === comparisonId);
  const ids = comparison ? comparison.products : productId ? [productId] : null;
  if (comparisonId && !comparison) notFound();
  const products = ids ? ids.map(id => subscriptionProducts.find(item => item.id === id) ?? notFound()) : subscriptionProducts;
  const title = ids ? products.map(product => product.name).join(' vs ') : t.title;
  const path = comparison ? `compare/${comparison.slug}/` : productId ? `${productId}/` : '';
  return { title, path, products, t };
}

export function subscriptionMetadata(props: Props): Metadata {
  const { title, path, t } = resolvePage(props);
  const alternates = subscriptionAlternates(path, props.locale);
  return {
    title: `${title} | TokenCosts AI`,
    description: t.description,
    alternates,
    openGraph: { title, description: t.description, url: alternates.canonical, type: 'website' },
  };
}

function PlanCard({ product, plan, locale }: { product: SubscriptionProduct; plan: SubscriptionPlan; locale: SubscriptionLocale }) {
  const { subscriptions: t } = getTranslation(locale);
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const rate = (value: number | null, prefix: string) => value === null ? t.missing : `${prefix}${number.format(value)}`;
  const monthly = rate(plan.monthlyUSD, 'US$');
  const fields = [
    [t.monthlyUSD, plan.monthlyUSDMax === null ? monthly : `${monthly}–${rate(plan.monthlyUSDMax, 'US$')}`],
    [t.yearlyUSD, rate(plan.yearlyUSD, 'US$')],
    [t.monthlyCNY, rate(plan.monthlyCNY, '¥')],
    [t.yearlyCNY, rate(plan.yearlyCNY, '¥')],
    [t.limits, plan.limits?.join(' · ') ?? t.missing],
    [t.models, plan.models?.join(' · ') ?? t.missing],
    [t.features, plan.features?.join(' · ') ?? t.missing],
  ];
  return (
    <article className="space-y-3 rounded-xl border border-zinc-200/90 bg-white/90 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm dark:shadow-none">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{plan.name ?? t.missing}</h3>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {fields.map(([label, value]) => <div key={label}>
          <dt className="text-xs text-zinc-600 dark:text-zinc-400">{label}</dt><dd className="font-medium tabular-nums">{value}</dd>
        </div>)}
      </dl>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <SubscriptionOutbound product={product.id} href={plan.url}>{t.source}</SubscriptionOutbound>
        <span className="font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-400">{t.verified.replace('{date}', plan.verifiedAt ?? t.missing)}</span>
      </div>
    </article>
  );
}

export default function SubscriptionsPage(props: Props) {
  const { locale, productId, comparisonId } = props;
  const { title, path, t, products } = resolvePage(props);
  const isHome = !productId && !comparisonId;
  const latest = products.flatMap(product => product.plans.map(plan => plan.verifiedAt ?? '')).sort().at(-1) || t.missing;
  const faqs = [{ question: t.faqBilling, answer: t.faqBillingAnswer }, { question: t.faqMissing, answer: t.faqMissingAnswer }];
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <SchemaOrg type="collection" name={title} description={t.description}
        url={subscriptionAlternates(path, locale).canonical} inLanguage={locale} faqs={faqs} />
      {!isHome && <Link className="text-sm text-indigo-700 underline dark:text-indigo-300" href={subscriptionHref(locale)}>{t.title}</Link>}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.description}</p>
        <p className="font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-400">{t.verified.replace('{date}', latest)}</p>
      </header>
      {isHome ? <>
        <SubscriptionCatalog products={products} />
        <SubscriptionPicker />
        <SubscriptionBreakevenCard locale={locale} />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t.comparisons}</h2>
          <ul className="flex flex-wrap gap-2">
            {subscriptionComparisons.map(comparison => <li key={comparison.slug}>
              <Link className="block rounded-xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 px-3.5 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors"
                href={subscriptionHref(locale, `compare/${comparison.slug}/`)}>
                {comparison.products.map(id => subscriptionProducts.find(product => product.id === id)?.name).join(' vs ')}
              </Link>
            </li>)}
          </ul>
        </section>
      </> : (
        <div className={products.length === 2 ? 'grid gap-6 md:grid-cols-2' : 'space-y-6'}>
          {products.map(product => <section key={product.id} className="space-y-3">
            <h2 className="text-xl font-semibold">{product.name} · {product.vendor}</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div><dt className="text-zinc-600 dark:text-zinc-400">{t.useCases}</dt><dd>{product.useCases.map(use => t[use]).join(' · ')}</dd></div>
              <div><dt className="text-zinc-600 dark:text-zinc-400">{t.china}</dt><dd>{product.availableInChina === null ? t.missing : product.availableInChina ? t.yes : t.no}</dd></div>
              <div><dt className="text-zinc-600 dark:text-zinc-400">{t.free}</dt><dd>{product.freeTier ?? t.missing}</dd></div>
            </dl>
            {product.plans.map((plan, index) => <PlanCard key={plan.name ?? index} product={product} plan={plan} locale={locale} />)}
            {product.affiliateUrl && <SubscriptionOutbound product={product.id} affiliate href={product.affiliateUrl}>{t.referral}</SubscriptionOutbound>}
          </section>)}
        </div>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.faq}</h2>
        {faqs.map(item => <details className="rounded-xl border border-zinc-200/90 bg-white/90 p-3.5 text-sm dark:border-zinc-800/80 dark:bg-zinc-900/60" key={item.question}>
          <summary className="cursor-pointer font-medium">{item.question}</summary><p className="mt-2 text-zinc-600 dark:text-zinc-400">{item.answer}</p>
        </details>)}
      </section>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="text-indigo-700 underline dark:text-indigo-300" href={locale === 'zh-CN' ? '/zh-CN/' : '/'}>{t.simulator}</Link>
        <Link className="text-indigo-700 underline dark:text-indigo-300" href={`${locale === 'zh-CN' ? '/zh-CN' : ''}/deals/?category=subscription`}>{t.consumerDeals}</Link>
        {locale === 'zh-CN' && (
          <Link className="text-amber-800 underline dark:text-amber-300" href="/zh-CN/domestic-models/">
            对比国内大模型人民币 API 与官方直付通道 →
          </Link>
        )}
      </div>
    </div>
  );
}
