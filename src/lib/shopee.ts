// Shopee affiliate link builders.
// Affiliate ID: 11319481705 (mluthfikhalil)
//
// Priority chain when resolving Shopee URL for a part:
//  1. affiliate_url (admin override — pre-generated short link or deeplink)
//  2. Product deeplink if shopee_product_id + shopee_shop_id set
//  3. Search by title with sortBy=sales (best-seller first) — always works
//
// All outbound links get af_id=<affiliate> + utm_source=riderhub appended,
// except short links (s.shopee.co.id) which already bake the tracking in.

export const SHOPEE_AFFILIATE_ID = '11319481705';
export const SHOPEE_UTM_SOURCE = 'riderhub';

interface PartAffiliateInput {
  title: string;
  affiliate_url?: string | null;
  shopee_product_id?: string | null;
  shopee_shop_id?: string | null;
  category?: string | null;
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);

const appendAffiliate = (url: string): string => {
  // Parse existing query string so we don't duplicate params
  const hasQuery = url.includes('?');
  const separator = hasQuery ? '&' : '?';
  const params = new URLSearchParams();
  params.set('af_id', SHOPEE_AFFILIATE_ID);
  params.set('utm_source', SHOPEE_UTM_SOURCE);
  // sub_id helps track conversion by product in affiliate dashboard
  return `${url}${separator}${params.toString()}`;
};

export const buildShopeeUrl = (part: PartAffiliateInput): string => {
  // 1. Admin-provided affiliate_url wins
  if (part.affiliate_url && part.affiliate_url.trim()) {
    const url = part.affiliate_url.trim();
    // Pre-generated short links already carry tracking
    if (url.includes('s.shopee.co.id')) return url;
    return appendAffiliate(url);
  }

  // 2. Product deeplink if we have the IDs
  if (part.shopee_product_id && part.shopee_shop_id) {
    const slug = slugify(part.title);
    return appendAffiliate(
      `https://shopee.co.id/${slug}-i.${part.shopee_shop_id}.${part.shopee_product_id}`,
    );
  }

  // 3. Search fallback — sortBy=sales pushes the top seller to #1
  const keyword = encodeURIComponent(part.title);
  return appendAffiliate(
    `https://shopee.co.id/search?keyword=${keyword}&sortBy=sales`,
  );
};
