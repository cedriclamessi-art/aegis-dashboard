export interface MetaTokenResponse {
  access_token: string
  expires_in: number
}

export interface MetaUserInfo {
  id: string
  name: string
  email: string
}

export class MetaService {
  private appId: string
  private appSecret: string
  private redirectUri: string

  constructor() {
    this.appId = process.env.META_APP_ID || 'mock-meta-app-id'
    this.appSecret = process.env.META_APP_SECRET || 'mock-meta-app-secret'
    this.redirectUri = process.env.META_REDIRECT_URI || 'http://localhost:3001/api/auth/oauth/meta/callback'
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      response_type: 'code',
      scope: 'ads_management,business_management',
      redirect_uri: this.redirectUri,
      state,
    })
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
  }

  async exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
    // MOCK
    return {
      access_token: `meta_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expires_in: 86400 * 30,
    }
  }

  async getUserInfo(accessToken: string): Promise<MetaUserInfo> {
    // MOCK
    return {
      id: `meta_${Math.random().toString(36).substr(2, 9)}`,
      name: `Meta User ${Math.floor(Math.random() * 9999)}`,
      email: `meta_user_${Math.random().toString(36).substr(2, 6)}@meta.example.com`,
    }
  }
}
