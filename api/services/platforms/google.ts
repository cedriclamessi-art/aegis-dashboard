export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

export interface GoogleUserInfo {
  user_id: string
  username: string
  id?: string
  name?: string
  email?: string
}

export class GoogleService {
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id'
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret'
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/oauth/google/callback'
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords',
      redirect_uri: this.redirectUri,
      state,
      access_type: 'offline',
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
    // MOCK
    return {
      access_token: `google_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refresh_token: `google_refresh_${Math.random().toString(36).substr(2, 9)}`,
      expires_in: 3599,
    }
  }

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    // MOCK
    return {
      user_id: `google_${Math.random().toString(36).substr(2, 9)}`,
      username: `google_user_${Math.random().toString(36).substr(2, 6)}`,
      id: `google_${Math.random().toString(36).substr(2, 9)}`,
      name: `Google User ${Math.floor(Math.random() * 9999)}`,
      email: `google_user_${Math.random().toString(36).substr(2, 6)}@gmail.example.com`,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    // MOCK
    return `google_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
