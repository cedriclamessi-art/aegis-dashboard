export interface TikTokAuthCode {
  code: string
  state: string
}

export interface TikTokTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface TikTokUserInfo {
  user_id: string
  username: string
  display_name: string
}

export class TikTokService {
  private appId: string
  private appSecret: string
  private redirectUri: string

  constructor() {
    this.appId = process.env.TIKTOK_APP_ID || 'mock-tiktok-app-id'
    this.appSecret = process.env.TIKTOK_APP_SECRET || 'mock-tiktok-app-secret'
    this.redirectUri = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3001/api/auth/oauth/tiktok/callback'
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.appId,
      response_type: 'code',
      scope: 'ad_manage,user.profile.read',
      redirect_uri: this.redirectUri,
      state,
    })
    return `https://ads.tiktok.com/oauth`
  }

  async exchangeCodeForToken(code: string): Promise<TikTokTokenResponse> {
    // MOCK: En production, appeler l'API TikTok réelle
    return {
      access_token: `ttk_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refresh_token: `ttk_refresh_${Math.random().toString(36).substr(2, 9)}`,
      expires_in: 86400 * 30,
    }
  }

  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    // MOCK: En production, appeler l'API TikTok réelle
    return {
      user_id: `ttk_${Math.random().toString(36).substr(2, 9)}`,
      username: `tiktok_user_${Math.random().toString(36).substr(2, 6)}`,
      display_name: `TikTok User ${Math.floor(Math.random() * 9999)}`,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    // MOCK
    return `ttk_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
