import axios from 'axios';

export class ShopifyConnector {
  private apiKey: string;
  private apiSecret: string;
  private shopDomain: string;
  private accessToken: string | null = null;

  constructor(apiKey: string, apiSecret: string, shopDomain: string, accessToken?: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.shopDomain = shopDomain;
    this.accessToken = accessToken || null;
  }

  async connect(accessToken: string): Promise<boolean> {
    try {
      this.accessToken = accessToken;
      const response = await axios.get(`https://${this.shopDomain}/admin/api/2024-01/shop.json`, {
        headers: { 'X-Shopify-Access-Token': this.accessToken }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Shopify connection failed:', error);
      return false;
    }
  }

  async syncProducts(): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    
    try {
      const response = await axios.get(
        `https://${this.shopDomain}/admin/api/2024-01/products.json`,
        {
          headers: { 'X-Shopify-Access-Token': this.accessToken }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Products sync failed:', error);
      throw error;
    }
  }

  async syncOrders(): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    
    try {
      const response = await axios.get(
        `https://${this.shopDomain}/admin/api/2024-01/orders.json`,
        {
          headers: { 'X-Shopify-Access-Token': this.accessToken }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Orders sync failed:', error);
      throw error;
    }
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const response = await axios.get(`https://${this.shopDomain}/admin/api/2024-01/shop.json`, {
        headers: { 'X-Shopify-Access-Token': this.accessToken }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    console.log('Shopify webhook received:', { topic: payload.topic });
  }
}
