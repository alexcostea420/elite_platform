#!/usr/bin/env python3
"""
generate_dashboard.py - Build an interactive HTML dashboard from tracked data.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

from fear_greed import get_history as get_fng_history

SENTIMENT_FILE = Path("sentiment_history.json")
PRICE_FILE     = Path("price_history.json")
SIGNAL_LOG     = Path("signal_log.jsonl")
OUTPUT         = Path("dashboard.html")


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []

def load_jsonl(path):
    if not path.exists(): return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").strip().split("\n") if l.strip()]

def shift_date(date_str, days=-1):
    d = datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=days)
    return d.strftime("%Y-%m-%d")


def build_dashboard():
    sentiment = load_json(SENTIMENT_FILE)
    prices    = load_json(PRICE_FILE)
    signals   = load_jsonl(SIGNAL_LOG)

    # Shift sentiment -1 day: record date is scan date, videos are from day before.
    # Plotting at video date aligns sentiment with price when videos were created.
    sentiment_shifted = [dict(e, date=shift_date(e["date"], -1)) for e in sentiment]

    try:
        fng = get_fng_history(90)
        fng_data = sorted([
            {"date": datetime.fromtimestamp(int(d["timestamp"])).strftime("%Y-%m-%d"), "value": d["value"]}
            for d in fng if "value" in d
        ], key=lambda x: x["date"])
    except Exception:
        fng_data = []

    all_channels = sorted({ch for e in sentiment for ch in e.get("scores", {})})
    updated = datetime.now().strftime("%Y-%m-%d %H:%M")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contrarian Signal Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
html {{ overflow-x:hidden; }}
body {{
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0d0d12; color: #c8c8d0; padding: 28px 24px;
}}
.header {{
  max-width:1440px; margin:0 auto 22px;
  display:flex; align-items:baseline; justify-content:space-between;
  border-bottom:1px solid #1c1c28; padding-bottom:14px;
}}
.header h1 {{ font-size:.85em; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:#e0e0ec; }}
.header .updated {{ font-size:.75em; color:#33334a; }}
.stats-bar {{
  max-width:1440px; margin:0 auto 18px;
  display:grid; grid-template-columns:repeat(4,1fr); gap:12px;
}}
.stat {{
  background:#11111a; border:1px solid #1c1c28; border-radius:10px; padding:16px 20px;
}}
.stat .lbl {{ font-size:.68em; text-transform:uppercase; letter-spacing:.09em; color:#33334a; margin-bottom:6px; }}
.stat .val {{ font-size:1.7em; font-weight:700; color:#e0e0ec; line-height:1; }}
.stat .sub {{ font-size:.7em; color:#33334a; margin-top:5px; }}
.stat.bearish .val {{ color:#d95555; }}
.stat.bullish .val {{ color:#27b86e; }}
.stat.neutral  .val {{ color:#c88c0a; }}
.grid {{
  display:grid; grid-template-columns:1fr 1fr; gap:14px;
  max-width:1440px; margin:0 auto;
}}
.card {{ background:#11111a; border:1px solid #1c1c28; border-radius:10px; padding:20px 22px; min-width:0; overflow:hidden; }}
.card.full {{ grid-column:1/-1; }}
.card h2 {{ font-size:.68em; font-weight:600; text-transform:uppercase; letter-spacing:.11em; color:#33334a; margin-bottom:14px; }}
.chart-container {{ position:relative; }}
.ch-main {{ height:400px; }}
.ch-half {{ height:290px; }}
table {{ width:100%; border-collapse:collapse; font-size:.82em; }}
th, td {{ padding:9px 12px; text-align:left; border-bottom:1px solid #171720; }}
tr:last-child td {{ border-bottom:none; }}
tr:hover td {{ background:#13131e; }}
th {{ color:#33334a; font-size:.68em; text-transform:uppercase; letter-spacing:.07em; font-weight:600; }}
.bar-wrap {{ background:#171720; border-radius:3px; height:5px; width:110px; overflow:hidden; display:inline-block; }}
.bar-fill {{ height:100%; border-radius:3px; }}
.pill {{ display:inline-block; padding:2px 9px; border-radius:5px; font-size:.78em; font-weight:600; }}
.pill-long    {{ background:rgba(39,184,110,.13); color:#27b86e; }}
.pill-short   {{ background:rgba(217,85,85,.13);  color:#d95555; }}
.pill-correct {{ background:rgba(39,184,110,.12); color:#27b86e; }}
.pill-pending {{ background:rgba(60,60,85,.2);    color:#55556a; }}
.pill-wrong   {{ background:rgba(217,85,85,.12);  color:#d95555; }}

/* Heatmap table */
.heatmap {{ border-collapse:collapse; width:100%; font-size:.72em; }}
.heatmap th {{ color:#33334a; font-weight:500; padding:4px 6px; white-space:nowrap; border:none; font-size:.7em; text-transform:none; letter-spacing:0; }}
.heatmap td {{ padding:3px 4px; border:1px solid #0d0d12; text-align:center; font-weight:600; border-radius:3px; }}
.heatmap .ch-name {{ text-align:left; color:#55556a; font-weight:500; white-space:nowrap; padding-right:10px; background:none; border:none; }}
@media (max-width:860px) {{
  .grid {{ grid-template-columns:1fr; }}
  .stats-bar {{ grid-template-columns:repeat(2,1fr); }}
}}
</style>
</head>
<body>

<div class="header">
  <h1>Contrarian Signal Dashboard</h1>
  <span class="updated">Updated {updated} &nbsp;·&nbsp; Sentiment plotted at video date (scan date − 1)</span>
</div>

<div class="stats-bar" id="statsBar"></div>

<div class="grid">

  <div class="card full">
    <h2>YouTube Sentiment vs BTC Price</h2>
    <div class="chart-container ch-main"><canvas id="mainChart"></canvas></div>
  </div>

  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h2 style="margin-bottom:0">Per-Channel Sentiment — Heatmap</h2>
      <div style="display:flex;align-items:center;gap:8px">
        <button id="hmPrev" onclick="hmNav(-1)" style="background:#1c1c28;border:1px solid #252535;color:#c8c8d0;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:.85em">&#8592;</button>
        <span id="hmRange" style="font-size:.68em;color:#55556a;white-space:nowrap"></span>
        <button id="hmNext" onclick="hmNav(1)" style="background:#1c1c28;border:1px solid #252535;color:#c8c8d0;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:.85em">&#8594;</button>
      </div>
    </div>
    <div id="heatmapWrap" style="overflow-x:auto"></div>
  </div>

  <div class="card">
    <h2>Fear &amp; Greed vs YouTube Sentiment</h2>
    <div class="chart-container ch-half"><canvas id="fngChart"></canvas></div>
  </div>

  <div class="card full">
    <h2>Latest Channel Scores</h2>
    <table id="scoresTable">
      <thead><tr><th>Channel</th><th>Score</th><th style="width:130px">Bar</th><th>vs Prev Run</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>

  <div class="card full">
    <h2>Signal History</h2>
    <table id="signalTable">
      <thead><tr><th>Date</th><th>Consensus</th><th>Signal</th><th>BTC Entry</th><th>Outcome</th><th>P&amp;L</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>

</div>

<script>
const sentimentData    = {json.dumps(sentiment)};
const sentimentShifted = {json.dumps(sentiment_shifted)};
const priceData        = {json.dumps(prices)};
const signalData       = {json.dumps(signals)};
const fngData          = {json.dumps(fng_data)};
const allChannels      = {json.dumps(all_channels)};

const GRID  = '#151520';
const TICK  = '#2e2e42';
const TTIP  = {{ backgroundColor:'#181820', borderColor:'#252535', borderWidth:1, titleColor:'#c8c8d0', bodyColor:'#66667a', padding:10 }};

function sentAvg(e) {{
  const v = Object.values(e.scores||{{}}).filter(s=>s>0);
  return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : null;
}}

function rollingAvg(arr, w=3) {{
  return arr.map((v,i) => {{
    if (v==null) return null;
    const sl = arr.slice(Math.max(0,i-w+1),i+1).filter(x=>x!=null);
    return sl.length ? Math.round(sl.reduce((a,b)=>a+b,0)/sl.length) : null;
  }});
}}

// ── Stats ──
(function renderStats() {{
  const bar  = document.getElementById('statsBar');
  const last = sentimentData[sentimentData.length-1];
  const lp   = priceData[priceData.length-1];
  const lfng = fngData[fngData.length-1];
  if (!last) return;
  const avg  = sentAvg(last)||0;
  const cls  = avg<35?'bearish':avg>65?'bullish':'neutral';
  const sig  = avg<35?'LONG contra signal':avg>65?'SHORT contra signal':'No clear signal';
  const res  = signalData.filter(s=>['CORRECT','INCORRECT'].includes(s.outcome));
  const acc  = res.length ? Math.round(res.filter(s=>s.outcome==='CORRECT').length/res.length*100)+'%' : '--';
  const pend = signalData.filter(s=>s.outcome==='PENDING').length;
  const fl   = lfng ? (lfng.value<25?'Extreme Fear':lfng.value<45?'Fear':lfng.value<55?'Neutral':lfng.value<75?'Greed':'Extreme Greed') : '';
  const fc   = lfng ? (lfng.value<25?'bearish':lfng.value>60?'bullish':'') : '';
  bar.innerHTML =
    '<div class="stat '+cls+'"><div class="lbl">YouTube Sentiment</div><div class="val">'+avg+'<small style="font-size:.42em;color:#33334a;font-weight:400">/100</small></div><div class="sub">'+sig+'</div></div>' +
    '<div class="stat"><div class="lbl">BTC Price</div><div class="val">'+(lp?'$'+Math.round(lp.btc).toLocaleString():'--')+'</div><div class="sub">ETH $'+(lp?Math.round(lp.eth).toLocaleString():'--')+'</div></div>' +
    '<div class="stat '+fc+'"><div class="lbl">Fear &amp; Greed</div><div class="val">'+(lfng?lfng.value:'--')+'</div><div class="sub">'+fl+'</div></div>' +
    '<div class="stat"><div class="lbl">Signal Accuracy</div><div class="val">'+acc+'</div><div class="sub">'+pend+' pending &middot; '+sentimentData.length+' runs</div></div>';
}})();

// ── Main Chart (shifted -1d) ──
(function renderMain() {{
  const ctx = document.getElementById('mainChart').getContext('2d');
  const allDates = [...new Set([...sentimentShifted.map(d=>d.date),...priceData.map(d=>d.date)])].sort();
  const pm = Object.fromEntries(priceData.map(d=>[d.date,d.btc]));
  const sm = {{}};
  sentimentShifted.forEach(d=>{{ sm[d.date]=sentAvg(d); }});
  const raw    = allDates.map(d=>sm[d]??null);
  const smooth = rollingAvg(raw,3);

  new Chart(ctx, {{
    type:'line',
    data:{{ labels:allDates, datasets:[
      {{ label:'Sentiment (raw)', data:raw,
         borderColor:'rgba(217,85,85,.2)', borderWidth:1, fill:false,
         pointRadius:raw.map(v=>v!=null?3:0), pointBackgroundColor:'rgba(217,85,85,.45)',
         yAxisID:'y1', tension:.2, spanGaps:true }},
      {{ label:'Sentiment 3d avg', data:smooth,
         borderColor:'#d95555', borderWidth:2.5, fill:false,
         pointRadius:0, yAxisID:'y1', tension:.45, spanGaps:true }},
      {{ label:'BTC Price', data:allDates.map(d=>pm[d]??null),
         borderColor:'#27b86e', backgroundColor:'rgba(39,184,110,.04)',
         fill:true, borderWidth:2, pointRadius:0,
         yAxisID:'y2', tension:.3, spanGaps:true }},
    ]}},
    options:{{
      responsive:true, maintainAspectRatio:false,
      interaction:{{ mode:'index', intersect:false }},
      plugins:{{
        legend:{{ labels:{{ color:'#44445a', font:{{size:11}}, boxWidth:22, padding:14 }} }},
        tooltip:{{ ...TTIP, callbacks:{{ label:c=>c.datasetIndex<2?'Sentiment: '+c.raw+'/100':'BTC: $'+c.raw?.toLocaleString() }} }}
      }},
      scales:{{
        x:{{ type:'time', time:{{ unit:'day', tooltipFormat:'MMM d' }}, ticks:{{ color:TICK, maxTicksLimit:14 }}, grid:{{ color:GRID }} }},
        y1:{{ position:'left', min:0, max:100, title:{{ display:true, text:'Sentiment', color:'#44445a', font:{{size:10}} }}, ticks:{{ color:TICK, stepSize:25 }}, grid:{{ color:GRID }} }},
        y2:{{ position:'right', title:{{ display:true, text:'BTC USD', color:'#44445a', font:{{size:10}} }}, ticks:{{ color:TICK, callback:v=>'$'+Math.round(v/1000)+'k' }}, grid:{{ drawOnChartArea:false }} }},
      }},
    }},
  }});
}})();

// ── Heatmap (paginated, 15 days) ──
const HM_PAGE = 15;
let hmOffset = 0; // 0 = latest page

(function initHeatmap() {{
  const allDates = sentimentData.map(d=>d.date);
  // start at last page
  hmOffset = Math.max(0, allDates.length - HM_PAGE);
  renderHeatmap();
}})();

function scoreColor(s) {{
  if (s==null || s===0) return '#161620';
  if (s<20) return '#7a1e1e';
  if (s<30) return '#a02828';
  if (s<40) return '#7a3a10';
  if (s<50) return '#4a4010';
  if (s<60) return '#1a3a2a';
  if (s<70) return '#1a5235';
  return '#166b3a';
}}
function textColor(s) {{ return (s==null||s===0) ? '#252535' : s<45 ? '#ffb3b3' : s>55 ? '#b3ffd9' : '#e0d080'; }}

function renderHeatmap() {{
  const wrap = document.getElementById('heatmapWrap');
  const allDates = sentimentData.map(d=>d.date);
  const page = allDates.slice(hmOffset, hmOffset + HM_PAGE);

  const shortDate = d => {{ const p=d.split('-'); return p[1]+'/'+p[2]; }};

  // update range label & button states
  document.getElementById('hmRange').textContent = page.length ? shortDate(page[0])+' – '+shortDate(page[page.length-1]) : '';
  document.getElementById('hmPrev').disabled = hmOffset <= 0;
  document.getElementById('hmNext').disabled = hmOffset + HM_PAGE >= allDates.length;
  document.getElementById('hmPrev').style.opacity = hmOffset <= 0 ? '0.3' : '1';
  document.getElementById('hmNext').style.opacity = hmOffset + HM_PAGE >= allDates.length ? '0.3' : '1';

  let html = '<table class="heatmap"><thead><tr><th></th>';
  page.forEach(d => {{ html += '<th>'+shortDate(d)+'</th>'; }});
  html += '</tr></thead><tbody>';

  allChannels.forEach(ch => {{
    html += '<tr><td class="ch-name">'+ch+'</td>';
    page.forEach(d => {{
      const e = sentimentData.find(x=>x.date===d);
      const s = e?.scores?.[ch];
      const bg = scoreColor(s);
      const tc = textColor(s);
      html += '<td style="background:'+bg+';color:'+tc+'">'+(s!=null&&s>0?s:'')+'</td>';
    }});
    html += '</tr>';
  }});

  html += '</tbody></table>';
  wrap.innerHTML = html;
}}

function hmNav(dir) {{
  const allDates = sentimentData.map(d=>d.date);
  hmOffset = Math.max(0, Math.min(allDates.length - HM_PAGE, hmOffset + dir * HM_PAGE));
  renderHeatmap();
}}

// ── F&G Chart — bar chart for sentiment + line for F&G ──
(function renderFng() {{
  const ctx = document.getElementById('fngChart').getContext('2d');

  // Use shifted dates for sentiment alignment
  const sentMap = {{}};
  sentimentShifted.forEach(d=>{{ sentMap[d.date]=sentAvg(d); }});

  // Only show dates where we have F&G data, plus sentiment dates
  const allDates = [...new Set([...fngData.map(d=>d.date),...Object.keys(sentMap)])].sort();
  const fm = Object.fromEntries(fngData.map(d=>[d.date,d.value]));

  // Bar colors for sentiment: green zone = fear (low score) = contra LONG, red = greed
  const sentVals = allDates.map(d=>sentMap[d]??null);
  const barColors = sentVals.map(v => {{
    if (v==null) return 'transparent';
    if (v<35) return 'rgba(39,184,110,.55)';
    if (v>65) return 'rgba(217,85,85,.55)';
    return 'rgba(200,140,10,.45)';
  }});

  new Chart(ctx, {{
    type:'bar',
    data:{{ labels:allDates, datasets:[
      {{ label:'YouTube Sentiment', data:sentVals,
         backgroundColor:barColors, borderWidth:0,
         borderRadius:3, order:2 }},
      {{ label:'Fear & Greed', data:allDates.map(d=>fm[d]??null),
         borderColor:'#c88c0a', borderWidth:2,
         pointRadius:0, tension:.3, spanGaps:true, fill:false,
         type:'line', order:1 }},
    ]}},
    options:{{
      responsive:true, maintainAspectRatio:false,
      interaction:{{ mode:'index', intersect:false }},
      plugins:{{
        legend:{{ labels:{{ color:'#44445a', font:{{size:11}}, boxWidth:14, padding:12, usePointStyle:true }} }},
        tooltip:{{ ...TTIP }}
      }},
      scales:{{
        x:{{ type:'time', time:{{ unit:'day', tooltipFormat:'MMM d' }},
             ticks:{{ color:TICK, maxTicksLimit:12 }}, grid:{{ color:GRID }} }},
        y:{{ min:0, max:100,
             ticks:{{ color:TICK, stepSize:25 }}, grid:{{ color:GRID }} }},
      }},
    }},
  }});
}})();

// ── Scores Table ──
(function renderScores() {{
  const tbody = document.querySelector('#scoresTable tbody');
  const last  = sentimentData[sentimentData.length-1];
  const prev  = sentimentData.length>=2 ? sentimentData[sentimentData.length-2] : null;
  if (!last) return;
  allChannels.forEach(ch => {{
    const s = last.scores?.[ch];
    const p = prev?.scores?.[ch];
    const tr = document.createElement('tr');
    let trend = '<span style="color:#252535">—</span>';
    if (s!=null && p!=null) {{
      const d=s-p, sign=d>0?'+':'';
      trend = d>5 ? '<span style="color:#27b86e">'+sign+d+' ↑</span>'
            : d<-5 ? '<span style="color:#d95555">'+sign+d+' ↓</span>'
            : '<span style="color:#33334a">'+sign+d+' →</span>';
    }}
    const bc = !s?'#252535':s<35?'#d95555':s>65?'#27b86e':'#c88c0a';
    tr.innerHTML = s!=null
      ? '<td style="color:#c8c8d0;font-weight:500">'+ch+'</td><td style="color:#c8c8d0">'+s+'<small style="color:#33334a">/100</small></td><td><div class="bar-wrap"><div class="bar-fill" style="width:'+s+'%;background:'+bc+'"></div></div></td><td>'+trend+'</td>'
      : '<td style="color:#252535">'+ch+'</td><td style="color:#252535">—</td><td></td><td></td>';
    tbody.appendChild(tr);
  }});
}})();

// ── Signal Table ──
(function renderSignals() {{
  const tbody = document.querySelector('#signalTable tbody');
  const seen  = new Set();
  [...signalData].reverse().forEach(s => {{
    const key = s.date+'-'+s.signal;
    if (seen.has(key)) return;
    seen.add(key);
    const out    = s.outcome||'PENDING';
    const sigLbl = (s.signal||'').replace('_BTC_ETH','').replace(/_/g,' ');
    const sigCls = sigLbl.includes('LONG')?'pill-long':sigLbl.includes('SHORT')?'pill-short':'';
    const outCls = out==='CORRECT'?'pill-correct':out==='PENDING'?'pill-pending':'pill-wrong';
    const pnl    = s.outcome_pct!=null
      ? '<span style="color:'+(s.outcome_pct>0?'#27b86e':'#d95555')+'">'+(s.outcome_pct>0?'+':'')+s.outcome_pct+'%</span>'
      : '<span style="color:#252535">—</span>';
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="color:#55556a">'+s.date+'</td>'+
      '<td>'+s.consensus+' <small style="color:#33334a">'+s.strength+'</small></td>'+
      '<td><span class="pill '+sigCls+'">'+sigLbl+'</span></td>'+
      '<td style="color:#55556a">'+(s.btc_at_signal?'$'+Number(s.btc_at_signal).toLocaleString():'—')+'</td>'+
      '<td><span class="pill '+outCls+'">'+out+'</span></td>'+
      '<td>'+pnl+'</td>';
    tbody.appendChild(tr);
  }});
}})();
</script>
</body>
</html>"""

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"Dashboard generated: {OUTPUT.absolute()}")


if __name__ == "__main__":
    build_dashboard()
