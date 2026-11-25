'use client';

import React from 'react';
import { Locale } from '@/i18n/types';
import { detectAffiliatePartner, trackEvent } from '@/lib/analytics';
import { buildAffiliateOutboundUrl } from '@/lib/utils';

export type AffiliatePageType =
  | 'model_detail'
  | 'calculator_detail'
  | 'compare_detail'
  | 'models_directory'
  | 'home_simulator'
  | 'pricing_topic'
  | 'harness_detail'
  | 'global_nav';

interface TrackedAffiliateLinkProps {
  href: string;
  modelId: string;
  pageType: AffiliatePageType;
  locale: Locale;
  placement: string;
  provider?: string;
  campaign?: string;
  compareSlug?: string;
  includeRef?: boolean;
  extraParams?: Record<string, unknown>;
  rel?: string;
  className?: string;
  children: React.ReactNode;
}

export default function TrackedAffiliateLink({
  href,
  modelId,
  pageType,
  locale,
  placement,
  provider,
  campaign,
  compareSlug,
  includeRef,
  extraParams,
  rel = 'nofollow sponsored noopener noreferrer',
  className,
  children,
}: TrackedAffiliateLinkProps) {
  const resolvedProvider = provider || detectAffiliatePartner(href);
  const resolvedCampaign = campaign || compareSlug || modelId;
  const outboundUrl = buildAffiliateOutboundUrl(href, {
    medium: pageType,
    campaign: resolvedCampaign,
    includeRef,
  });

  const handleClick = () => {
    trackEvent('affiliate_click', {
      model_id: modelId,
      page_type: pageType,
      locale,
      provider: resolvedProvider,
      partner: resolvedProvider,
      placement,
      ...(compareSlug ? { compare_slug: compareSlug } : {}),
      ...(extraParams || {}),
      outbound_url: outboundUrl,
    });
  };

  return (
    <a
      href={outboundUrl}
      target="_blank"
      rel={rel}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
