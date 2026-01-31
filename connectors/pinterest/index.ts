import axios from 'axios';

export class PinterestConnector {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private baseURL = 'https://api.pinterest.com/v5';

  constructor(appId: string, appSecret: string, accessToken?: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.accessToken = accessToken || null;
  }

  async connect(accessToken: string): Promise<boolean> {
    try {
      this.accessToken = accessToken;
      const response = await axios.get(`${this.baseURL}/user_accounts`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Pinterest connection failed:', error);
      return false;
    }
  }

  async syncCampaigns(adAccountId: string): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    
    try {
      const response = await axios.get(`${this.baseURL}/ad_accounts/${adAccountId}/campaigns`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      return response.data;
    } catch (error) {
      console.error('Campaign sync failed:', error);
      throw error;
    }
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const response = await axios.get(`${this.baseURL}/user_accounts`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    console.log('Pinterest webhook received:', { type: payload.event_type });
  }
}
