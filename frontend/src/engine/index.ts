// AEGIS Engine - Main Entry Point
// Usage: import { scoreOpportunity, evaluateStopLoss, rememberDecision, resolveChannel } from './engine'

export {
    resolveChannel,
    getActiveChannels,
    registerChannel,
    type IChannel,
    type ChannelMetrics,
    type ChannelAllocation,
  } from './channels';

export {
    evaluateStopLoss,
    executeStopLoss,
    getStopLossHistory,
    getActiveStopLossAlerts,
    type StopLossConfig,
    type StopLossEvaluation,
    type StopLossResult,
  } from './stoploss';

export {
    rememberDecision,
    resolveDecision,
    recallSimilarDecisions,
    getDecisionWinRate,
    scoreDecisionWithMemory,
    type DecisionRecord,
    type MemoryQuery,
  } from './memory';

export {
    scoreOpportunity,
    getTopOpportunities,
    getProductHistory,
    type OpportunityInput,
    type OpportunityScore,
  } from './opportunity';
