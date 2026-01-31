import axios from 'axios';

export class GoogleConnector {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private baseURL = 'https://googleads.googleapis.com/v15';

  constructor(clientId: string, clientSecret: string, accessToken?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken || null;
  }

  async connect(customerId: string, accessToken: string): Promise<boolean> {
    try {
      this.accessToken = accessToken;
      return true;
    } catch (error) {
      console.error('Google connection failed:', error);
      return false;
    }
  }

  async syncCampaigns(customerId: string): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    
    try {
      const response = await axios.post(
        `${this.baseURL}/customers/${customerId.replace('-', '')}/googleAds:search`,
        {
          query: 'SELECT campaign.id, campaign.name, campaign.status FROM campaign ORDER BY campaign.id'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Campaign sync failed:', error);
      throw error;
    }
  }

  async validateCredentials(): Promise<boolean> {
    return this.accessToken !== null;
  }

  async handleWebhook(payload: any): Promise<void> {
    console.log('Google webhook received:', { type: payload.resourceType });
  }
}
