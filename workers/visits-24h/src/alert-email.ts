import type { Digest, PriceChange } from './alerts-logic';

export type MailLocale = 'en' | 'zh-CN';
const copy = {
  en: {
    confirm: 'Confirm your TokenCosts AI subscription',
    intro: 'Confirm this request to receive a weekly pricing digest and alerts for the models you follow.',
    confirmLink: 'Confirm subscription',
    alert: 'Price drops for models you follow',
    digest: 'TokenCosts AI weekly pricing digest',
    cuts: 'Largest price drops', increases: 'Largest price increases', launches: 'New models', deals: 'Official deals ending soon',
    input: 'Input', output: 'Output', cached: 'Cached input', new: 'New model',
    verify: 'Verified', dealsLink: 'See official deals', unsubscribe: 'Unsubscribe', missing: 'Unavailable',
  },
  'zh-CN': {
    confirm: '确认订阅 TokenCosts AI',
    intro: '确认后，你将收到每周价格周报，以及所关注模型的降价提醒。',
    confirmLink: '确认订阅',
    alert: '你关注的模型降价了',
    digest: 'TokenCosts AI 每周价格周报',
    cuts: '降价幅度最大', increases: '涨价幅度最大', launches: '新上线模型', deals: '即将到期的官方优惠',
    input: '输入', output: '输出', cached: '缓存输入', new: '新模型',
    verify: '核实日期', dealsLink: '查看官方优惠', unsubscribe: '退订', missing: '暂无',
  },
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch
);

function link(url: string, text: string) {
  return `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>`;
}

export function renderEmail(locale: MailLocale, origin: string, unsubscribeUrl: string, message:
  | { kind: 'confirm'; confirmUrl: string }
  | { kind: 'alert'; groups: PriceChange[][] }
  | { kind: 'digest'; digest: Digest }
) {
  const t = copy[locale];
  const prefix = locale === 'zh-CN' ? '/zh-CN' : '';
  const tracked = (path: string) => `${origin}${prefix}${path}${message.kind === 'digest' ? '?utm_source=digest' : ''}`;
  const modelLink = (change: PriceChange) => link(tracked(`/models/${encodeURIComponent(change.modelId)}/`), change.modelName);
  const rate = (value: number | null) => value === null ? t.missing : `$${value}/1M`;
  const label = (change: PriceChange) => change.field === 'new'
    ? t.new
    : `${t[change.field]}: ${rate(change.oldValue)} → ${rate(change.newValue)}${change.percent === null ? '' : ` (${change.percent > 0 ? '+' : ''}${change.percent}%)`}`;
  const list = (title: string, items: string[]) => items.length
    ? `<h2>${escapeHtml(title)}</h2><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`
    : '';

  const subject = t[message.kind];
  let body: string;
  if (message.kind === 'confirm') {
    body = `<p>${t.intro}</p><p>${link(message.confirmUrl, t.confirmLink)}</p>`;
  } else if (message.kind === 'alert') {
    body = `<ul>${message.groups.map(group => `<li>${modelLink(group[0])}<ul>${group.map(change =>
      `<li>${escapeHtml(label(change))}</li>`).join('')}</ul></li>`).join('')}</ul>`;
  } else {
    const { cuts, increases, launches, deals } = message.digest;
    body = list(t.cuts, cuts.map(change => `${modelLink(change)} — ${escapeHtml(label(change))}`))
      + list(t.increases, increases.map(change => `${modelLink(change)} — ${escapeHtml(label(change))}`))
      + list(t.launches, launches.map(modelLink))
      + list(t.deals, deals.map(deal => {
        const source = /^https:\/\//.test(deal.source) ? link(deal.source, deal.title) : escapeHtml(deal.title);
        return `${source} · ${escapeHtml(deal.endsAt)} (${t.verify} ${escapeHtml(deal.verifiedAt)})`;
      }))
      + (deals.length ? `<p>${link(tracked('/deals/'), t.dealsLink)}</p>` : '');
  }
  return {
    subject,
    html: `<!doctype html><html lang="${locale}"><body><main><h1>${subject}</h1>${body}<hr><p>TokenCosts AI · notify@tokencostsai.com</p><p>${link(unsubscribeUrl, t.unsubscribe)}</p></main></body></html>`,
    headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}
