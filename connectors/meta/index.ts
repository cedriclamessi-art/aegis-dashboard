import axios from 'axios';

export class MetaConnector {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private baseURL = 'https://graph.instagram.com/v18.0';

  constructor(appId: string, appSecret: string, accessToken?: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.accessToken = accessToken || null;
  }

  async connect(businessAccountId: string, accessToken: string): Promise<boolean> {
    try {
      this.accessToken = accessToken;
      const response = await axios.get(`${this.baseURL}/${businessAccountId}`, {
        params: { access_token: this.accessToken }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Meta connection failed:', error);
      return false;
    }
  }

  async syncCampaigns(businessAccountId: string): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    
    try {
      const response = await axios.get(`${this.baseURL}/${businessAccountId}/campaigns`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,status,objective,budget,spend,insights'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Campaign sync failed:', error);
      throw error;
    }
  }

  async syncAds(adAccountId: string): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    
    try {
      const response = await axios.get(`${this.baseURL}/act_${adAccountId}/ads`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,status,insights'
        }
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
      const response = await axios.get(`${this.baseURL}/me`, {
        params: { access_token: this.accessToken }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    console.log('Meta webhook received:', { type: payload.entry?.[0]?.messaging?.[0]?.type });
  }
}
