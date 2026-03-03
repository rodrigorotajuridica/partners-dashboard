import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GOOGLE_COLOR = "#4A9EFF";
const META_COLOR = "#FF7043";
const CONTRACT_COLOR = "#00D48A";
const SHEET_ID = "1v1UiO41AHGiZik9bLJK3QrK0vdrTYAQ7hCxveJq0lfM";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function parseCSV(text) {
  const lines = text.trim().split("\n").map(l => l.replace(/\r/g, ""));
  return lines.slice(1).map((line, i) => {
    const cols = line.split(",");
    const n = (idx) => parseFloat(cols[idx]?.replace(",", ".") || "0") || 0;
    return {
      mes: MESES[i] ?? cols[0],
      invGoogle:n(1), leadsGoogle:n(2), qualGoogle:n(3), agendGoogle:n(4), reunGoogle:n(5), contGoogle:n(6),
      invMeta:n(7), leadsMeta:n(8), qualMeta:n(9), agendMeta:n(10), reunMeta:n(11), contMeta:n(12),
    };
  });
}

const fmt  = (n) => (n ?? 0).toLocaleString("pt-BR");
const fmtR = (n) => `R$ ${(n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct  = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) + "%" : "—";
const calcCAC = (inv, cont) => cont > 0 ? fmtR(inv / cont) : "—";
const calcCPL = (inv, leads) => leads > 0 ? fmtR(inv / leads) : "—";

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:"#12161E", border:`1px solid ${accent}22`, borderTop:`2px solid ${accent}`, borderRadius:12, padding:"20px 22px" }}>
      <div style={{ color:"#6B7280", fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"monospace", marginBottom:6 }}>{label}</div>
      <div style={{ color:"#F0F4FF", fontSize:26, fontWeight:800, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ color:"#6B7280", fontSize:12, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function FunnelCard({ label, value, convLabel, convValue, accent }) {
  return (
    <div style={{ background:"#12161E", border:`1px solid ${accent}22`, borderTop:`2px solid ${accent}`, borderRadius:12, padding:"20px 22px" }}>
      <div style={{ color:"#6B7280", fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"monospace", marginBottom:6 }}>{label}</div>
      <div style={{ color:"#F0F4FF", fontSize:26, fontWeight:800, lineHeight:1.1 }}>{value}</div>
      {convLabel && (
        <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ background:`${accent}22`, borderRadius:20, padding:"2px 10px" }}>
            <span style={{ color:accent, fontSize:12, fontWeight:700, fontFamily:"monospace" }}>{convValue}</span>
          </div>
          <span style={{ color:"#4A5568", fontSize:11 }}>{convLabel}</span>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
      <div style={{ width:3, height:16, background:`linear-gradient(180deg, ${GOOGLE_COLOR}, ${META_COLOR})`, borderRadius:2 }} />
      <span style={{ color:"#8A94A6", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>{children}</span>
    </div>
  );
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1C2130", border:"1px solid #2A3347", borderRadius:8, padding:"10px 14px" }}>
      <p style={{ color:"#8A94A6", fontSize:12, marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, fontSize:13, fontWeight:600, margin:"2px 0" }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

function FunnelPanel({ label, color, tl }) {
  const stages = [
    { s:"Leads",        val:tl.leads, conv:null },
    { s:"Qualificados", val:tl.qual,  conv:pct(tl.qual, tl.leads) },
    { s:"Agendamentos", val:tl.ag,    conv:pct(tl.ag,   tl.qual)  },
    { s:"Reuniões",     val:tl.reun,  conv:pct(tl.reun, tl.ag)   },
    { s:"Contratos",    val:tl.cont,  conv:pct(tl.cont, tl.reun) },
  ];
  const max = tl.leads || 1;
  return (
    <div style={{ background:"#12161E", borderRadius:14, padding:24, border:`1px solid ${color}22` }}>
      <SectionTitle>{label} — Funil</SectionTitle>
      {stages.map(({ s, val, conv }, i) => (
        <div key={s} style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
            <span style={{ color:"#6B7280", fontSize:12 }}>{s}</span>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {conv && (
                <span style={{ background:`${i===4?CONTRACT_COLOR:color}18`, color:i===4?CONTRACT_COLOR:color, fontSize:11, fontFamily:"monospace", fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{conv}</span>
              )}
              <span style={{ color:"#C9D1E0", fontSize:15, fontWeight:700, fontFamily:"monospace" }}>{val}</span>
            </div>
          </div>
          <div style={{ height:7, background:"#1C2436", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.max((val/max)*100, val>0?3:0)}%`, borderRadius:4, background:i===4?CONTRACT_COLOR:color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:300, gap:16 }}>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #1C2436", borderTop:`3px solid ${GOOGLE_COLOR}`, animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:"#4A5568", fontSize:13, fontFamily:"monospace" }}>Carregando dados da planilha...</span>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("geral");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(SHEET_URL);
      if (!res.ok) throw new Error("Não foi possível acessar a planilha.");
      const text = await res.text();
      setData(parseCSV(text));
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const T = useMemo(() => data.reduce((a, d) => ({
    invGoogle:a.invGoogle+d.invGoogle,       invMeta:a.invMeta+d.invMeta,
    leadsGoogle:a.leadsGoogle+d.leadsGoogle, leadsMeta:a.leadsMeta+d.leadsMeta,
    qualGoogle:a.qualGoogle+d.qualGoogle,    qualMeta:a.qualMeta+d.qualMeta,
    agendGoogle:a.agendGoogle+d.agendGoogle, agendMeta:a.agendMeta+d.agendMeta,
    reunGoogle:a.reunGoogle+d.reunGoogle,    reunMeta:a.reunMeta+d.reunMeta,
    contGoogle:a.contGoogle+d.contGoogle,    contMeta:a.contMeta+d.contMeta,
  }), {invGoogle:0,invMeta:0,leadsGoogle:0,leadsMeta:0,qualGoogle:0,qualMeta:0,agendGoogle:0,agendMeta:0,reunGoogle:0,reunMeta:0,contGoogle:0,contMeta:0}), [data]);

  const totalInv=T.invGoogle+T.invMeta, totalLeads=T.leadsGoogle+T.leadsMeta, totalCont=T.contGoogle+T.contMeta;
  const TABS=["geral","google","meta","tabela"], TLABELS=["Visão Geral","Google Ads","Meta Ads","Tabela Mensal"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:#0B0E15;} ::-webkit-scrollbar-thumb{background:#2A3347;border-radius:3px;}
        .tb{background:none;border:none;cursor:pointer;padding:8px 16px;color:#4A5568;font-size:13px;font-weight:600;border-radius:8px;transition:all .2s;font-family:inherit;letter-spacing:.03em;}
        .tb:hover{color:#8A94A6;background:#161B26;} .tb.on{color:#F0F4FF;background:#1C2436;border:1px solid #2A3A5C;}
        .rbtn{background:none;border:1px solid #2A3347;cursor:pointer;padding:6px 14px;color:#6B7280;font-size:12px;font-weight:600;border-radius:8px;transition:all .2s;font-family:monospace;display:flex;align-items:center;gap:6px;}
        .rbtn:hover{color:#C9D1E0;border-color:#4A5568;}
        tr:hover td{background:#141A25!important;}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#0B0E15", fontFamily:"'Syne',sans-serif", color:"#F0F4FF" }}>
        <div style={{ borderBottom:"1px solid #161D2B", padding:"0 32px" }}>
          <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, objectFit:"contain" }}><img src="/Logo_Felippe.png" alt="Logo" style={{ width:38, height:38, borderRadius:10, objectFit:"contain" }} /></div>
              <div>
                <div style={{ fontSize:16, fontWeight:800 }}>Partners Dashboard</div>
                <div style={{ fontSize:11, color:"#4A5568", fontFamily:"monospace" }}>Direito de Trânsito · 2026</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {lastUpdate && <span style={{ color:"#2A3347", fontSize:11, fontFamily:"monospace" }}>Atualizado às {lastUpdate}</span>}
              <button className="rbtn" onClick={loadData} disabled={loading}>
                <span style={{ display:"inline-block", animation:loading?"spin 0.8s linear infinite":"none" }}>↻</span> Atualizar
              </button>
              {[[GOOGLE_COLOR,"Google Ads"],[META_COLOR,"Meta Ads"]].map(([c,l]) => (
                <span key={l} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,fontFamily:"monospace",background:`${c}18`,color:c,border:`1px solid ${c}33` }}>
                  <span style={{ width:6,height:6,borderRadius:"50%",background:c }} />{l}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1280, margin:"0 auto", padding:"28px 32px" }}>
          <div style={{ display:"flex", gap:4, marginBottom:30, background:"#10141C", padding:4, borderRadius:12, width:"fit-content", border:"1px solid #161D2B" }}>
            {TABS.map((t,i) => <button key={t} className={`tb${tab===t?" on":""}`} onClick={()=>setTab(t)}>{TLABELS[i]}</button>)}
          </div>

          {error && (
            <div style={{ background:"#1C1215", border:"1px solid #7F1D1D", borderRadius:12, padding:"16px 20px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:"#FCA5A5", fontSize:13 }}>⚠ {error}</span>
              <button className="rbtn" onClick={loadData}>Tentar novamente</button>
            </div>
          )}

          {loading && <Spinner />}

          {!loading && !error && (
            <>
              {tab==="geral" && (
                <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                    <StatCard label="Investimento Total" value={fmtR(totalInv)} accent="#8B5CF6" />
                    <StatCard label="Total de Leads" value={fmt(totalLeads)} sub={`Google: ${T.leadsGoogle} · Meta: ${T.leadsMeta}`} accent={GOOGLE_COLOR} />
                    <StatCard label="Contratos Fechados" value={fmt(totalCont)} sub={pct(totalCont,totalLeads)+" dos leads"} accent={CONTRACT_COLOR} />
                    <StatCard label="CAC Médio" value={calcCAC(totalInv,totalCont)} sub="Custo de aquisição" accent="#EC4899" />
                  </div>
                  <div style={{ background:"#12161E", borderRadius:14, padding:24, border:"1px solid #1C2436" }}>
                    <SectionTitle>Evolução de Contratos por Mês</SectionTitle>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.map(d=>({ mes:d.mes, Google:d.contGoogle, Meta:d.contMeta }))} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C2436" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fill:"#4A5568",fontSize:12,fontFamily:"monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:"#4A5568",fontSize:12,fontFamily:"monospace" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<Tip/>} cursor={{ fill:"#1C2436" }} />
                        <Bar dataKey="Google" fill={GOOGLE_COLOR} radius={[4,4,0,0]} />
                        <Bar dataKey="Meta" fill={META_COLOR} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background:"#12161E", borderRadius:14, padding:24, border:"1px solid #1C2436" }}>
                    <SectionTitle>Evolução de Leads por Mês</SectionTitle>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.map(d=>({ mes:d.mes, Google:d.leadsGoogle, Meta:d.leadsMeta }))} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C2436" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fill:"#4A5568",fontSize:12,fontFamily:"monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:"#4A5568",fontSize:12,fontFamily:"monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<Tip/>} cursor={{ fill:"#1C2436" }} />
                        <Bar dataKey="Google" fill={GOOGLE_COLOR} radius={[4,4,0,0]} />
                        <Bar dataKey="Meta" fill={META_COLOR} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <FunnelPanel label="Google Ads" color={GOOGLE_COLOR} tl={{ leads:T.leadsGoogle, qual:T.qualGoogle, ag:T.agendGoogle, reun:T.reunGoogle, cont:T.contGoogle }} />
                    <FunnelPanel label="Meta Ads" color={META_COLOR} tl={{ leads:T.leadsMeta, qual:T.qualMeta, ag:T.agendMeta, reun:T.reunMeta, cont:T.contMeta }} />
                  </div>
                </div>
              )}

              {tab==="google" && (
                <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                    <StatCard label="Investimento" value={fmtR(T.invGoogle)} accent={GOOGLE_COLOR} />
                    <StatCard label="CPL — Custo por Lead" value={calcCPL(T.invGoogle,T.leadsGoogle)} sub="investimento ÷ leads" accent="#F59E0B" />
                    <StatCard label="CAC — Custo de Aquisição" value={calcCAC(T.invGoogle,T.contGoogle)} sub="investimento ÷ contratos" accent="#EC4899" />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14 }}>
                    <FunnelCard label="Leads" value={fmt(T.leadsGoogle)} accent={GOOGLE_COLOR} />
                    <FunnelCard label="Qualificados" value={fmt(T.qualGoogle)} accent={GOOGLE_COLOR} convLabel="qual. / leads" convValue={pct(T.qualGoogle,T.leadsGoogle)} />
                    <FunnelCard label="Agendamentos" value={fmt(T.agendGoogle)} accent={GOOGLE_COLOR} convLabel="agend. / qual." convValue={pct(T.agendGoogle,T.qualGoogle)} />
                    <FunnelCard label="Reuniões" value={fmt(T.reunGoogle)} accent={GOOGLE_COLOR} convLabel="reun. / agend." convValue={pct(T.reunGoogle,T.agendGoogle)} />
                    <FunnelCard label="Contratos" value={fmt(T.contGoogle)} accent={CONTRACT_COLOR} convLabel="cont. / reun." convValue={pct(T.contGoogle,T.reunGoogle)} />
                  </div>
                  <div style={{ background:"#12161E", borderRadius:14, padding:24, border:`1px solid ${GOOGLE_COLOR}22` }}>
                    <SectionTitle>Desempenho Mensal — Google</SectionTitle>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={data.map(d=>({ mes:d.mes, Leads:d.leadsGoogle, Qualificados:d.qualGoogle, Contratos:d.contGoogle }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C2436" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fill:"#4A5568",fontSize:12,fontFamily:"monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:"#4A5568",fontSize:12,fontFamily:"monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<Tip/>} />
                        <Line type="monotone" dataKey="Leads" stroke={GOOGLE_COLOR} strokeWidth={2.5} dot={{ r:4,fill:GOOGLE_COLOR }} />
                        <Line type="monotone" dataKey="Qualificados" stroke="#F59E0B" strokeWidth={2.5} dot={{ r:4,fill:"#F59E0B" }} />
                        <Line type="monotone" dataKey="Contratos" stroke={CONTRACT_COLOR} strokeWidth={2.5} dot={{ r:4,fill:CONTRACT_COLOR }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {tab==="meta" && (
                <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                    <StatCard label="Investimento" value={fmtR(T.invMeta)} accent={META_COLOR} />
                    <StatCard label="CPL — Custo por Lead" value={calcCPL(T.invMeta,T.leadsMeta)} sub="investimento ÷ leads" accent="#F59E0B" />
                    <StatCard label="CAC — Custo de Aquisição" value={calcCAC(T.invMeta,T.contMeta)} sub="investimento ÷ contratos" accent="#EC4899" />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14 }}>
                    <FunnelCard label="Leads" value={fmt(T.leadsMeta)} accent={META_COLOR} />
                    <FunnelCard label="Qualificados" value={fmt(T.qualMeta)} accent={META_COLOR} convLabel="qual. / leads" convValue={pct(T.qualMeta,T.leadsMeta)} />
                    <FunnelCard label="Agendamentos" value={fmt(T.agendMeta)} accent={META_COLOR} convLabel="agend. / qual." convValue={pct(T.agendMeta,T.qualMeta)} />
                    <FunnelCard label="Reuniões" value={fmt(T.reunMeta)} accent={META_COLOR} convLabel="reun. / agend." convValue={pct(T.reunMeta,T.agendMeta)} />
                    <FunnelCard label="Contratos" value={fmt(T.contMeta)} accent={CONTRACT_COLOR} convLabel="cont. / reun." convValue={pct(T.contMeta,T.reunMeta)} />
                  </div>
                  <div style={{ background:"#12161E", borderRadius:14, padding:24, border:`1px solid ${META_COLOR}22` }}>
                    <SectionTitle>Desempenho Mensal — Meta</SectionTitle>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={data.map(d=>({ mes:d.mes, Leads:d.leadsMeta, Qualificados:d.qualMeta, Contratos:d.contMeta }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C2436" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fill:"#4A5568",fontSize:12,fontFamily:"monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:"#4A5568",fontSize:12,fontFamily:"monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<Tip/>} />
                        <Line type="monotone" dataKey="Leads" stroke={META_COLOR} strokeWidth={2.5} dot={{ r:4,fill:META_COLOR }} />
                        <Line type="monotone" dataKey="Qualificados" stroke="#F59E0B" strokeWidth={2.5} dot={{ r:4,fill:"#F59E0B" }} />
                        <Line type="monotone" dataKey="Contratos" stroke={CONTRACT_COLOR} strokeWidth={2.5} dot={{ r:4,fill:CONTRACT_COLOR }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {tab==="tabela" && (
                <div style={{ background:"#12161E", borderRadius:14, border:"1px solid #1C2436", overflow:"hidden" }}>
                  <div style={{ padding:"20px 24px", borderBottom:"1px solid #1C2436" }}>
                    <SectionTitle>Dados Mensais Completos</SectionTitle>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, fontFamily:"'JetBrains Mono',monospace" }}>
                      <thead>
                        <tr style={{ background:"#10141C" }}>
                          <th style={{ padding:"12px 16px", textAlign:"left", color:"#4A5568", fontWeight:600, borderBottom:"1px solid #1C2436" }}>Mês</th>
                          {["Inv.","Leads","Qual.","Agend.","Reuniões","Contratos"].map(h => (
                            <th key={"g"+h} style={{ padding:"12px 14px", textAlign:"right", color:GOOGLE_COLOR, fontWeight:600, borderBottom:"1px solid #1C2436", fontSize:11, whiteSpace:"nowrap" }}>G · {h}</th>
                          ))}
                          {["Inv.","Leads","Qual.","Agend.","Reuniões","Contratos"].map(h => (
                            <th key={"m"+h} style={{ padding:"12px 14px", textAlign:"right", color:META_COLOR, fontWeight:600, borderBottom:"1px solid #1C2436", fontSize:11, whiteSpace:"nowrap" }}>M · {h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map(d => {
                          const has = d.leadsGoogle>0||d.leadsMeta>0||d.invGoogle>0||d.invMeta>0;
                          return (
                            <tr key={d.mes} style={{ background:has?"#141A25":"transparent", borderBottom:"1px solid #161D2B" }}>
                              <td style={{ padding:"11px 16px", color:"#C9D1E0", fontWeight:600 }}>{d.mes}</td>
                              {[d.invGoogle,d.leadsGoogle,d.qualGoogle,d.agendGoogle,d.reunGoogle,d.contGoogle].map((v,j) => (
                                <td key={j} style={{ padding:"11px 14px", textAlign:"right", color:v>0?"#C9D1E0":"#2A3347" }}>{j===0?fmtR(v):fmt(v)}</td>
                              ))}
                              {[d.invMeta,d.leadsMeta,d.qualMeta,d.agendMeta,d.reunMeta,d.contMeta].map((v,j) => (
                                <td key={j+6} style={{ padding:"11px 14px", textAlign:"right", color:v>0?"#C9D1E0":"#2A3347" }}>{j===0?fmtR(v):fmt(v)}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop:32, paddingTop:20, borderTop:"1px solid #161D2B", display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#2A3347", fontSize:11, fontFamily:"monospace" }}>Partners · Direito de Trânsito</span>
            <span style={{ color:"#2A3347", fontSize:11, fontFamily:"monospace" }}>{lastUpdate ? `Última atualização: ${lastUpdate}` : "2025"}</span>
          </div>
        </div>
      </div>
    </>
  );
}
