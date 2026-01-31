import axios from 'axios';

export class TikTokConnector {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private baseURL = 'https://business-api.tiktok.com/open_api/v1.3';

  constructor(appId: string, appSecret: string, accessToken?: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.accessToken = accessToken || null;
  }

  async connect(advertiserId: string, accessToken: string): Promise<boolean> {
    try {
      this.accessToken = accessToken;
      const response = await axios.get(`${this.baseURL}/advertiser/info`, {
        headers: { 'Access-Token': this.accessToken }
      });
      return response.status === 200;
    } catch (error) {
      console.error('TikTok connection failed:', error);
      return false;
    }
  }

  async syncCampaigns(advertiserId: string): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    
    try {
      const response = await axios.get(`${this.baseURL}/campaign/get`, {
        headers: { 'Access-Token': this.accessToken },
        params: { advertiser_id: advertiserId }
      });
      return response.data;
    } catch (error) {
      console.error('Campaign sync failed:', error);
      throw error;
    }
  }

  async syncAds(advertiserId: string): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    
    try {
      const response = await axios.get(`${this.baseURL}/ad/get`, {
        headers: { 'Access-Token': this.accessToken },
        params: { advertiser_id: advertiserId }
      });
      return response.data;
    } catch (error) {
      console.error('Ads sync failed:', error);
      throw error;
    }
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const response = await axios.get(`${this.baseURL}/advertiser/info`, {
        headers: { 'Access-Token': this.accessToken }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    console.log('TikTok webhook received:', { type: payload.msg_type });
  }
}
