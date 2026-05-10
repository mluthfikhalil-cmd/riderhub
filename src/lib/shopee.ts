// Shopee affiliate link builders.
// Affiliate ID: 11319481705 (mluthfikhalil)
//
// Shopee supports 3 link formats we care about:
//  1. Product deeplink:  https://shopee.co.id/<slug>-i.<shop_id>.<item_id>?af_id=<affiliate_id>
//  2. Search deeplink:   https://shopee.co.id/search?keyword=<query>&af_id=<affiliate_id>
//  3. Short link:        https://s.shopee.co.id/<code>  (pre-generated from affiliate dashboard)
//
// When a part has a `shopee_product_id` + `shopee_shop_id`, prefer (1).
// Otherwise fall back to search by keyword using the part title.
// `affiliate_url` column on `parts` lets admins override with a pre-generated short link.

export const SHOPEE_AFFILIATE_ID = '11319481705';

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
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}af_id=${SHOPEE_AFFILIATE_ID}&utm_source=riderhub`;
};

export const buildShopeeUrl = (part: PartAffiliateInput): string => {
  // 1. Admin-provided affiliate_url wins (typically a short link)
  if (part.affiliate_url && part.affiliate_url.trim()) {
    const url = part.affiliate_url.trim();
    // Short links (s.shopee.co.id) already track — don't append params
    if (url.includes('s.shopee.co.id')) return url;
    return appendAffiliate(url);
  }

  // 2. Product deeplink if IDs available
  if (part.shopee_product_id && part.shopee_shop_id) {
    const slug = slugify(part.title);
    return appendAffiliate(
      `https://shopee.co.id/${slug}-i.${part.shopee_shop_id}.${part.shopee_product_id}`,
    );
  }

  // 3. Fall back to search — always works
  const keyword = encodeURIComponent(part.title);
  return appendAffiliate(`https://shopee.co.id/search?keyword=${keyword}`);
};
