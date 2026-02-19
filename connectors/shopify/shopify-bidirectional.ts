import axios from 'axios';

// ============================================================
// STORE CONNECTOR ENGINE — Shopify Bidirectionnel complet
// Lecture + Écriture produits, prix, images, commandes, pixel
// ============================================================

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: 'active' | 'draft' | 'archived';
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  tags: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  inventory_quantity: number;
  weight: number;
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  src: string;
  alt: string | null;
  position: number;
}

export interface ShopifyOrder {
  id: number;
  name: string;
  total_price: string;
  subtotal_price: string;
  financial_status: string;
  created_at: string;
  line_items: any[];
}

export interface BoutiqueAnalytics {
  cvr: number;
  aov: number;
  total_revenue: number;
  total_orders: number;
  avg_margin: number;
  best_sellers: BestSeller[];
  dead_products: DeadProduct[];
  funnel: FunnelData;
}

export interface BestSeller {
  product_id: number;
  title: string;
  units_sold: number;
  revenue: number;
  margin: number;
}

export interface DeadProduct {
  product_id: number;
  title: string;
  days_without_sale: number;
  inventory: number;
}

export interface FunnelData {
  visitors: number;
  add_to_cart: number;
  checkout: number;
  purchase: number;
  cart_rate: number;
  checkout_rate: number;
  purchase_rate: number;
}

export class ShopifyBidirectionalConnector {
  private shopDomain: string;
  private accessToken: string | null = null;
  private baseUrl: string;

  constructor(shopDomain: string, accessToken?: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken || null;
    this.baseUrl = `https://${shopDomain}/admin/api/2024-01`;
  }

  private get headers() {
    return { 'X-Shopify-Access-Token': this.accessToken || '', 'Content-Type': 'application/json' };
  }

  async connect(accessToken: string): Promise<boolean> {
    try {
      this.accessToken = accessToken;
      const res = await axios.get(`${this.baseUrl}/shop.json`, { headers: this.headers });
      return res.status === 200;
    } catch { return false; }
  }

  // ─── LECTURE ────────────────────────────────────────────────

  async getProducts(limit = 250): Promise<ShopifyProduct[]> {
    const res = await axios.get(`${this.baseUrl}/products.json?limit=${limit}`, { headers: this.headers });
    return res.data.products;
  }

  async getProduct(productId: number): Promise<ShopifyProduct> {
    const res = await axios.get(`${this.baseUrl}/products/${productId}.json`, { headers: this.headers });
    return res.data.product;
  }

  async getOrders(limit = 250, status = 'paid'): Promise<ShopifyOrder[]> {
    const res = await axios.get(`${this.baseUrl}/orders.json?limit=${limit}&status=${status}`, { headers: this.headers });
    return res.data.orders;
  }

  // ─── ÉCRITURE BIDIRECTIONNELLE ───────────────────────────────

  async updateProductContent(productId: number, updates: { title?: string; body_html?: string; tags?: string }): Promise<ShopifyProduct> {
    const res = await axios.put(`${this.baseUrl}/products/${productId}.json`, { product: updates }, { headers: this.headers });
    return res.data.product;
  }

  async updateVariantPrice(variantId: number, price: string, compareAtPrice?: string): Promise<ShopifyVariant> {
    const payload: any = { variant: { id: variantId, price } };
    if (compareAtPrice) payload.variant.compare_at_price = compareAtPrice;
    const res = await axios.put(`${this.baseUrl}/variants/${variantId}.json`, payload, { headers: this.headers });
    return res.data.variant;
  }

  async replaceProductImages(productId: number, imageSrcs: string[]): Promise<ShopifyImage[]> {
    const product = await this.getProduct(productId);
    for (const img of product.images) {
      await axios.delete(`${this.baseUrl}/products/${productId}/images/${img.id}.json`, { headers: this.headers });
    }
    const newImages: ShopifyImage[] = [];
    for (const src of imageSrcs) {
      const res = await axios.post(`${this.baseUrl}/products/${productId}/images.json`, { image: { src } }, { headers: this.headers });
      newImages.push(res.data.image);
    }
    return newImages;
  }

  async createBundle(title: string, components: { productId: number; qty: number }[], price: string): Promise<ShopifyProduct> {
    const res = await axios.post(`${this.baseUrl}/products.json`, {
      product: {
        title,
        body_html: `<p>Bundle AEGIS — ${components.map(c => `${c.qty}x #${c.productId}`).join(', ')}</p>`,
        product_type: 'Bundle',
        tags: 'bundle,aegis-generated',
        variants: [{ price, inventory_management: null }],
      }
    }, { headers: this.headers });
    return res.data.product;
  }

  async addVariant(productId: number, title: string, price: string, sku: string): Promise<ShopifyVariant> {
    const res = await axios.post(`${this.baseUrl}/products/${productId}/variants.json`, { variant: { title, price, sku } }, { headers: this.headers });
    return res.data.variant;
  }

  async setProductStatus(productId: number, status: 'active' | 'archived' | 'draft'): Promise<ShopifyProduct> {
    const res = await axios.put(`${this.baseUrl}/products/${productId}.json`, { product: { id: productId, status } }, { headers: this.headers });
    return res.data.product;
  }

  async createProduct(data: { title: string; body_html: string; price: string; sku?: string }): Promise<ShopifyProduct> {
    const res = await axios.post(`${this.baseUrl}/products.json`, {
      product: {
        title: data.title,
        body_html: data.body_html,
        tags: 'aegis-created',
        variants: [{ price: data.price, sku: data.sku || '' }],
      }
    }, { headers: this.headers });
    return res.data.product;
  }

  async addUpsell(productId: number, upsellProductId: number): Promise<void> {
    const product = await this.getProduct(productId);
    const currentTags = product.tags ? product.tags.split(',').map(t => t.trim()) : [];
    const newTag = `upsell:${upsellProductId}`;
    if (!currentTags.includes(newTag)) {
      await this.updateProductContent(productId, { tags: [...currentTags, newTag].join(',') });
    }
  }

  // ─── ANALYSE BOUTIQUE ────────────────────────────────────────

  async analyzeBoutique(estimatedSessions = 10000): Promise<BoutiqueAnalytics> {
    const [products, orders] = await Promise.all([this.getProducts(), this.getOrders()]);
    const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_price || '0'), 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const cvr = (totalOrders / estimatedSessions) * 100;

    const salesMap: Record<number, { title: string; units: number; revenue: number }> = {};
    for (const o of orders) {
      for (const item of o.line_items || []) {
        if (!salesMap[item.product_id]) salesMap[item.product_id] = { title: item.title, units: 0, revenue: 0 };
        salesMap[item.product_id].units += item.quantity;
        salesMap[item.product_id].revenue += parseFloat(item.price) * item.quantity;
      }
    }

    const bestSellers: BestSeller[] = Object.entries(salesMap)
      .sort(([, a], [, b]) => b.revenue - a.revenue).slice(0, 10)
      .map(([id, d]) => ({ product_id: +id, title: d.title, units_sold: d.units, revenue: d.revenue, margin: 35 }));

    const soldIds = new Set(Object.keys(salesMap).map(Number));
    const deadProducts: DeadProduct[] = products
      .filter(p => !soldIds.has(p.id) && p.status === 'active').slice(0, 10)
      .map(p => ({ product_id: p.id, title: p.title, days_without_sale: 30, inventory: p.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0) }));

    const atc = Math.floor(estimatedSessions * 0.08);
    const checkout = Math.floor(atc * 0.55);
    const funnel: FunnelData = {
      visitors: estimatedSessions, add_to_cart: atc, checkout, purchase: totalOrders,
      cart_rate: (atc / estimatedSessions) * 100, checkout_rate: (checkout / atc) * 100, purchase_rate: cvr,
    };

    return { cvr: Math.round(cvr * 100) / 100, aov: Math.round(aov * 100) / 100, total_revenue: totalRevenue, total_orders: totalOrders, avg_margin: 35, best_sellers: bestSellers, dead_products: deadProducts, funnel };
  }

  async verifyPixels(): Promise<{ meta: boolean; google: boolean; tiktok: boolean }> {
    try {
      const res = await axios.get(`${this.baseUrl}/script_tags.json`, { headers: this.headers });
      const srcs: string[] = res.data.script_tags.map((s: any) => s.src);
      return {
        meta: srcs.some(s => s.includes('fbevents') || s.includes('connect.facebook.net')),
        google: srcs.some(s => s.includes('googletagmanager') || s.includes('gtag')),
        tiktok: srcs.some(s => s.includes('analytics.tiktok')),
      };
    } catch { return { meta: false, google: false, tiktok: false }; }
  }
}

export default ShopifyBidirectionalConnector;
