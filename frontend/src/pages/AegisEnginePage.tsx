import React, { useState } from 'react';
import { scoreOpportunity, evaluateStopLoss, rememberDecision } from '../engine';
import type { OpportunityInput, StopLossConfig } from '../engine';

const C = {
      page: { padding: 24, color: '#e2e8f0' },
      h1: { fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 },
      sub: { fontSize: 13, color: '#64748b', marginBottom: 28 },
      grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 } as React.CSSProperties,
      card: { background: '#07070f', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 },
      ct: { fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 14 },
      lbl: { fontSize: 11, color: '#475569', marginBottom: 3 },
      inp: { width: '100%', background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 7, padding: '7px 11px', color: '#e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' as const },
      btn: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, width: '100%', marginTop: 4 },
      res: { marginTop: 14, padding: 14, background: '#0d0d1a', borderRadius: 8, fontSize: 12 },
      row: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 } as React.CSSProperties,
      tag: { background: '#1e1e3a', borderRadius: 5, padding: '2px 7px', fontSize: 11, color: '#94a3b8' },
      red: { background: '#1a0000', border: '1px solid #7f1d1d', borderRadius: 7, padding: '10px 14px', marginBottom: 6 },
      grn: { background: '#001500', border: '1px solid #14532d', borderRadius: 7, padding: '10px 14px', marginBottom: 6 },
};

const scoreColor = (v: number) => v >= 65 ? '#22c55e' : v >= 40 ? '#f59e0b' : '#ef4444';
const verdictStyle = (v: string) => ({
      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: v === 'go' ? '#14532d' : v === 'wait' ? '#78350f' : '#7f1d1d',
      color: v === 'go' ? '#86efac' : v === 'wait' ? '#fde68a' : '#fca5a5',
});

export default function AegisEnginePage() {
      const [opp, setOpp] = useState<OpportunityInput>({
              product_name: '', product_category: 'beauty', estimated_margin: 60,
              market_saturation: 40, competition_level: 50, trend_score: 70,
              avg_order_value: 45, capital_available: 1000, channel_ids: ['meta', 'tiktok'],
      });
      const [oppRes, setOppRes] = useState<any>(null);
      const [oppLoad, setOppLoad] = useState(false);
      const [sl, setSl] = useState({ allocation_id: 'alloc-001', channel_id: 'meta', current_roas: 0.8, roas_threshold: 1.5, current_spend: 200, max_spend: 500, product_name: '' });
      const [slRes, setSlRes] = useState<any>(null);
      const [slLoad, setSlLoad] = useState(false);
      const [mem, setMem] = useState({ type: 'allocation' as const, action: '', capital: 500 });
      const [memRes, setMemRes] = useState<any>(null);

  const doScore = async () => {
          setOppLoad(true);
          try { setOppRes(await scoreOpportunity(opp)); } catch (e: any) { setOppRes({ error: e.message }); }
          setOppLoad(false);
  };

  const doSL = async () => {
          setSlLoad(true);
          try {
                    const cfg: StopLossConfig = { allocation_id: sl.allocation_id, channel_id: sl.channel_id, product_name: sl.product_name, roas_threshold: sl.roas_threshold, max_spend: sl.max_spend };
                    const metrics = { roas: sl.current_roas, spend: sl.current_spend, revenue: sl.current_roas * sl.current_spend, cpm: 12, ctr: 1.2, cpa: 25 };
                    setSlRes(await evaluateStopLoss(cfg, metrics));
          } catch (e: any) { setSlRes({ error: e.message }); }
          setSlLoad(false);
  };

  const doMem = async () => {
          try {
                    const id = await rememberDecision(mem.type, { action: mem.action }, mem.action, mem.capital);
                    setMemRes({ id, ok: true });
          } catch (e: any) { setMemRes({ error: e.message }); }
  };

  return (
          <div style={C.page}>
                    <div style={C.h1}>AEGIS Engine</div>div>
                    <div style={C.sub}>Capital vers profit net ajuste au risque. 4 lois. 0 emotion.</div>div>
                    <div style={C.grid}>
                                <div style={C.card}>
                                              <div style={C.ct}>Score Opportunite</div>div>
                                              <div style={C.lbl}>Produit</div>div>
                                              <input style={C.inp} value={opp.product_name} onChange={e => setOpp(p => ({ ...p, product_name: e.target.value }))} placeholder="Ex: Serum Vitamine C" />
                                              <div style={C.lbl}>Marge (%)</div>div>
                                              <input style={C.inp} type="number" value={opp.estimated_margin} onChange={e => setOpp(p => ({ ...p, estimated_margin: +e.target.value }))} />
                                              <div style={C.lbl}>Tendance (0-100)</div>div>
                                              <input style={C.inp} type="number" value={opp.trend_score} onChange={e => setOpp(p => ({ ...p, trend_score: +e.target.value }))} />
                                              <div style={C.lbl}>Saturation marche (0-100)</div>div>
                                              <input style={C.inp} type="number" value={opp.market_saturation} onChange={e => setOpp(p => ({ ...p, market_saturation: +e.target.value }))} />
                                              <div style={C.lbl}>Capital disponible (EUR)</div>div>
                                              <input style={C.inp} type="number" value={opp.capital_available} onChange={e => setOpp(p => ({ ...p, capital_available: +e.target.value }))} />
                                              <button style={C.btn} onClick={doScore} disabled={oppLoad}>{oppLoad ? 'Analyse...' : 'Scorer ce produit'}</button>button>
                                    {oppRes && !oppRes.error && (
                          <div style={C.res}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                                <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor(oppRes.adjusted_score) }}>{oppRes.adjusted_score}/100</span>span>
                                                                <span style={verdictStyle(oppRes.verdict)}>{oppRes.verdict.toUpperCase()}</span>span>
                                            </div>div>
                                            <div style={C.row}><span>Risque</span>span><span style={C.tag}>{oppRes.risk_level}</span>span></div>div>
                                        <div style={C.row}><span>Allocation recommandee</span>span><span style={{ color: '#22c55e' }}>{oppRes.recommended_allocation} EUR</span>span></div>div>
                                        <div style={C.row}><span>Max</span>span><span style={{ color: '#f59e0b' }}>{oppRes.max_allocation} EUR</span>span></div>div>
                                        <div style={{ marginTop: 8, color: '#64748b' }}>{oppRes.reasoning?.slice(0, 4).map((r: string, i: number) => <div key={i}>- {r}</div>div>)}</div>div>
                          </div>div>
                                          )}
                                    {oppRes?.error && <div style={{ ...C.red, marginTop: 10 }}>{oppRes.error}</div>div>}
                                </div>div>
                            <div style={C.card}>
                                      <div style={C.ct}>Stop-Loss Engine</div>div>
                                      <div style={C.lbl}>ROAS actuel</div>div>
                                      <input style={C.inp} type="number" step="0.1" value={sl.current_roas} onChange={e => setSl(p => ({ ...p, current_roas: +e.target.value }))} />
                                      <div style={C.lbl}>Seuil ROAS minimum</div>div>
                                      <input style={C.inp} type="number" step="0.1" value={sl.roas_threshold} onChange={e => setSl(p => ({ ...p, roas_threshold: +e.target.value }))} />
                                      <div style={C.lbl}>Depense (EUR)</div>div>
                                      <input style={C.inp} type="number" value={sl.current_spend} onChange={e => setSl(p => ({ ...p, current_spend: +e.target.value }))} />
                                      <div style={C.lbl}>Budget max (EUR)</div>div>
                                      <input style={C.inp} type="number" value={sl.max_spend} onChange={e => setSl(p => ({ ...p, max_spend: +e.target.value }))} />
                                      <div style={C.lbl}>Produit</div>div>
                                      <input style={C.inp} value={sl.product_name} onChange={e => setSl(p => ({ ...p, product_name: e.target.value }))} placeholder="Nom du produit" />
                                      <button style={{ ...C.btn, background: slRes?.triggered ? '#dc2626' : '#7c3aed' }} onClick={doSL} disabled={slLoad}>{slLoad ? 'Analyse...' : 'Evaluer Stop-Loss'}</button>button>
                                {slRes && !slRes.error && (
                          <div style={C.res}>
                              {slRes.triggered ? <div style={C.red}>STOP-LOSS DECLENCHE - {slRes.reason}</div>div> : <div style={C.grn}>OK - ROAS au-dessus du seuil</div>div>}
                              {slRes.triggered && <div style={C.row}><span>Action</span>span><span style={{ color: '#fca5a5' }}>{slRes.recommended_action}</span>span></div>div>}
                          </div>div>
                                      )}
                                {slRes?.error && <div style={{ ...C.red, marginTop: 10 }}>{slRes.error}</div>div>}
                            </div>div>
                    </div>div>
                <div style={C.card}>
                        <div style={C.ct}>Memoire Decisionnelle</div>div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                                  <div>
                                              <div style={C.lbl}>Action</div>div>
                                              <input style={{ ...C.inp, marginBottom: 0 }} value={mem.action} onChange={e => setMem(p => ({ ...p, action: e.target.value }))} placeholder="Ex: Scale Meta +50%" />
                                  </div>div>
                                  <div>
                                              <div style={C.lbl}>Type</div>div>
                                              <select style={{ ...C.inp, marginBottom: 0 }} value={mem.type} onChange={e => setMem(p => ({ ...p, type: e.target.value as any }))}>
                                                            <option value="allocation">allocation</option>option>
                                                            <option value="stoploss">stoploss</option>option>
                                                            <option value="scaling">scaling</option>option>
                                                            <option value="creative">creative</option>option>
                                                            <option value="channel">channel</option>option>
                                              </select>select>
                                  </div>div>
                                  <div>
                                              <div style={C.lbl}>Capital (EUR)</div>div>
                                              <input style={{ ...C.inp, marginBottom: 0 }} type="number" value={mem.capital} onChange={e => setMem(p => ({ ...p, capital: +e.target.value }))} />
                                  </div>div>
                                  <button style={{ ...C.btn, width: 'auto', marginTop: 14, whiteSpace: 'nowrap' as const }} onClick={doMem}>Memoriser</button>button>
                        </div>div>
                    {memRes && (
                        <div style={{ ...C.res, marginTop: 10 }}>
                            {memRes.error ? <span style={{ color: '#fca5a5' }}>{memRes.error}</span>span> : <span style={{ color: '#86efac' }}>Decision memorisee - ID: {memRes.id?.slice(0, 8)}...</span>span>}
                        </div>div>
                        )}
                </div>div>
          </div>div>
        );
}</span>
