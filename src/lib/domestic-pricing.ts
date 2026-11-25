export interface CnyRate {
  input: number | null;
  output: number | null;
  cached: number | null;
}

export interface DomesticProvider {
  id: string;
  name: string;
  modelId: string;
  url: string;
  cnyPerMillion: CnyRate;
  priceVerifiedAt: string | null;
  paymentMethods: string[] | null;
  paymentSource: string | null;
  paymentVerifiedAt: string | null;
}

export interface UsdQuote {
  key: string;
  name: string;
  region: 'domestic' | 'foreign';
  peak?: boolean;
  modelId: string;
  input: number;
  output: number;
  url: string;
  verifiedAt: string;
}

export function convertUsdPriceRate(quote: Pick<UsdQuote, 'input' | 'output'>, cnyPerUsd: number) {
  if (!Number.isFinite(cnyPerUsd) || cnyPerUsd <= 0 || cnyPerUsd > 1000) return null;
  return { input: quote.input * cnyPerUsd, output: quote.output * cnyPerUsd };
}
