————// AEGIS Stop-Loss Engine
// Rule: no allocation without stop-loss. Cuts automatically when thresholds are breached.

import { createClient } from '@supabase/supabase-js'

export interface StopLossConfig {
  roasMin: number
    perteMaxJour: number
      depenseMaxJour: number
        cpaMax?: number
          killSwitch: boolean
            mode: 'humain' | 'semi_auto' | 'full_auto'
            }

            export interface CampaignSnapshot {
              id: string; channelKey: string; name: string
                spend: number; revenue: number; roas: number; cpa: number
                  status: 'active' | 'paused' | 'stopped'
                  }

                  export type StopLossVerdict = 'ok' | 'warn' | 'stop' | 'kill'

                  export interface StopLossEvaluation {
                    campaignId: string; verdict: StopLossVerdict; reason: string
                      action: 'none' | 'alert' | 'pause' | 'stop'
                        metrics: { roas: number; spend: number; cpa: number }
                        }

                        export const evaluateCampaign = (c: CampaignSnapshot, cfg: StopLossConfig): StopLossEvaluation => {
                          const m = { roas: c.roas, spend: c.spend, cpa: c.cpa }

                            if (cfg.killSwitch)
                                return { campaignId: c.id, verdict: 'kill', reason: 'Kill switch global', action: 'stop', metrics: m }

                                  if (c.roas < cfg.roasMin && c.spend > 50) {
                                      const hard = c.roas < cfg.roasMin * 0.7
                                          return { campaignId: c.id, verdict: hard ? 'stop' : 'warn',
                                                reason: `ROAS ${c.roas.toFixed(2)}x < min ${cfg.roasMin}x`,
                                                      action: hard ? 'pause' : 'alert', metrics: m }
                                                        }

                                                          if (c.spend >= cfg.depenseMaxJour)
                                                              return { campaignId: c.id, verdict: 'stop',
                                                                    reason: `Spend ${c.spend}EUR >= max ${cfg.depenseMaxJour}EUR/day`,
                                                                          action: 'pause', metrics: m }

                                                                            if (cfg.cpaMax && c.cpa > cfg.cpaMax && c.spend > 30)
                                                                                return { campaignId: c.id, verdict: 'warn',
                                                                                      reason: `CPA ${c.cpa.toFixed(2)}EUR > max ${cfg.cpaMax}EUR`,
                                                                                            action: 'alert', metrics: m }

                                                                                              return { campaignId: c.id, verdict: 'ok', reason: 'All metrics within thresholds', action: 'none', metrics: m }
                                                                                              }

                                                                                              export const evaluatePortfolio = (campaigns: CampaignSnapshot[], cfg: StopLossConfig) => {
                                                                                                const evaluations = campaigns.map(c => evaluateCampaign(c, cfg))
                                                                                                  return {
                                                                                                      evaluations,
                                                                                                          totalSpend: campaigns.reduce((s, c) => s + c.spend, 0),
                                                                                                              avgRoas: campaigns.length ? campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length : 0,
                                                                                                                  alerts: evaluations.filter(e => e.verdict === 'warn').length,
                                                                                                                      stops: evaluations.filter(e => ['stop','kill'].includes(e.verdict)).length
                                                                                                                        }
                                                                                                                        }
                                                                                                                        
                                                                                                                        export const persistStopLossEvent = async (
                                                                                                                          supabase: ReturnType<typeof createClient>,
                                                                                                                            tenantId: string, evaluation: StopLossEvaluation, executed: boolean
                                                                                                                            ) => {
                                                                                                                              await supabase.from('stoploss_events').insert({
                                                                                                                                  tenant_id: tenantId, campaign_id: evaluation.campaignId,
                                                                                                                                      verdict: evaluation.verdict, reason: evaluation.reason,
                                                                                                                                          action_taken: evaluation.action, executed,
                                                                                                                                              roas_at_event: evaluation.metrics.roas,
                                                                                                                                                  spend_at_event: evaluation.metrics.spend,
                                                                                                                                                      cpa_at_event: evaluation.metrics.cpa,
                                                                                                                                                          created_at: new Date().toISOString()
                                                                                                                                                            })
                                                                                                                                                            }
