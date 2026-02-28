// AEGIS Channel Abstraction Layer
// Add a channel: add one object in CHANNELS. Remove a dead one: delete it. Nothing else changes.

export type ChannelStatus = 'active' | 'paused' | 'unavailable'
export type ChannelType = 'paid_social' | 'search' | 'marketplace'

export interface ChannelMetrics {
    roas: number; cpm: number; ctr: number; cpa: number; spend: number; revenue: number
}

export interface ChannelConfig {
    key: string; label: string; icon: string; color: string
    type: ChannelType; status: ChannelStatus
    minDailyBudget: number; maxDailyBudget: number; avgCpmRange: [number, number]
    caps: { video: boolean; image: boolean; search: boolean; retargeting: boolean; shopping: boolean }
}

export const CHANNELS: Record<string, ChannelConfig> = {
    meta: {
          key: 'meta', label: 'Meta Ads', icon: 'META', color: '#1877f2',
          type: 'paid_social', status: 'active',
          minDailyBudget: 5, maxDailyBudget: 50000, avgCpmRange: [8, 35],
          caps: { video: true, image: true, search: false, retargeting: true, shopping: true }
    },
    google: {
          key: 'google', label: 'Google Ads', icon: 'GOOG', color: '#4285f4',
          type: 'search', status: 'active',
          minDailyBudget: 10, maxDailyBudget: 100000, avgCpmRange: [2, 15],
          caps: { video: true, image: true, search: true, retargeting: true, shopping: true }
    },
    tiktok: {
          key: 'tiktok', label: 'TikTok Ads', icon: 'TKTK', color: '#ff0050',
          type: 'paid_social', status: 'active',
          minDailyBudget: 20, maxDailyBudget: 30000, avgCpmRange: [5, 20],
          caps: { video: true, image: false, search: false, retargeting: true, shopping: true }
    },
    snapchat: {
          key: 'snapchat', label: 'Snapchat Ads', icon: 'SNAP', color: '#fffc00',
          type: 'paid_social', status: 'active',
          minDailyBudget: 5, maxDailyBudget: 10000, avgCpmRange: [3, 12],
          caps: { video: true, image: true, search: false, retargeting: true, shopping: false }
    },
    pinterest: {
          key: 'pinterest', label: 'Pinterest Ads', icon: 'PIN', color: '#e60023',
          type: 'paid_social', status: 'active',
          minDailyBudget: 2, maxDailyBudget: 5000, avgCpmRange: [2, 8],
          caps: { video: true, image: true, search: false, retargeting: true, shopping: true }
    }
    // x_ads, youtube, amazon_dsp: copy-paste a block above
}

export const getActiveChannels = (): ChannelConfig[] =>
    Object.values(CHANNELS).filter(c => c.status === 'active')

export const getBestChannelsForBudget = (budgetEur: number): ChannelConfig[] =>
    getActiveChannels()
    .filter(c => budgetEur >= c.minDailyBudget)
    .sort((a, b) => a.avgCpmRange[0] - b.avgCpmRange[0])
