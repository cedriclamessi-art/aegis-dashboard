// AEGIS Engine - Main Entry Point
export { evaluateStopLoss, executeStopLoss, getStopLossHistory, getActiveStopLossAlerts } from './stoploss';
export type { StopLossConfig, StopLossEvaluation, StopLossResult, ChannelMetrics } from './stoploss';
export { scoreOpportunity, getTopOpportunities, getProductHistory } from './opportunity';
export type { OpportunityInput, OpportunityScore } from './opportunity';
export { rememberDecision, resolveDecision, recallSimilarDecisions, getDecisionWinRate, scoreDecisionWithMemory } from './memory';
export type { DecisionRecord, MemoryQuery } from './memory';
