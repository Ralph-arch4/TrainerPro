'use client'

const R = '#E53232'
const O = '#FF6B2B'
const L = '#FF9A6C'
const D = 'rgba(245,240,232,0.38)'

function Bracket({ x, y, s = 12, fx = 1, fy = 1 }: { x: number; y: number; s?: number; fx?: number; fy?: number }) {
  return (
    <g>
      <line x1={x} y1={y + fy * s} x2={x} y2={y} stroke={R} strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1={x} y1={y} x2={x + fx * s} y2={y} stroke={R} strokeWidth="1.4" strokeOpacity="0.75" />
    </g>
  )
}

function Bar({ x, y, label, val, pct, c = O }: { x: number; y: number; label: string; val: string; pct: number; c?: string }) {
  return (
    <g>
      <text x={x} y={y} fill={D} fontSize="6" fontWeight="600" letterSpacing="1" fontFamily="monospace">{label}</text>
      <text x={x + 88} y={y} fill={c} fontSize="6.5" fontWeight="900" fontFamily="monospace" textAnchor="end">{val}</text>
      <rect x={x} y={y + 2} width="88" height="2.8" rx="1.4" fill="rgba(255,255,255,0.06)" />
      <rect x={x} y={y + 2} width={88 * pct / 100} height="2.8" rx="1.4" fill={c} opacity="0.72" />
    </g>
  )
}

export default function HeroCanvas() {
  // Radar pentagon points (5 axes, values 0-100)
  const radarVals = [92, 71, 78, 65, 84]
  const radarPts = radarVals.map((v, i) => {
    const rad = (i * 72 - 90) * Math.PI / 180
    const r = v * 44 / 100
    return `${457 + Math.cos(rad) * r},${128 + Math.sin(rad) * r}`
  }).join(' ')
  const radarLabels = ['FORZA', 'VELOC', 'RESIST', 'FLEX', 'RECUP']

  return (
    <div className="w-full h-full" style={{ minHeight: 400 }}>
      <svg viewBox="0 0 520 580" width="100%" height="100%" style={{ overflow: 'visible' }} aria-hidden>
        <defs>
          <filter id="g5" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="g2" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="aura" cx="50%" cy="40%" r="42%">
            <stop offset="0%" stopColor={R} stopOpacity="0.22" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orb">
            <stop offset="0%" stopColor={L} stopOpacity="1" />
            <stop offset="50%" stopColor={R} stopOpacity="0.6" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="scanG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={R} stopOpacity="0" />
            <stop offset="42%"  stopColor={R} stopOpacity="0.1" />
            <stop offset="50%"  stopColor={L} stopOpacity="0.9" />
            <stop offset="58%"  stopColor={R} stopOpacity="0.1" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </linearGradient>
          {/* Body fill — very subtle reddish tint */}
          <linearGradient id="bodyFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={O} stopOpacity="0.07" />
            <stop offset="100%" stopColor={R} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Ambient aura */}
        <ellipse cx="260" cy="270" rx="130" ry="220" fill="url(#aura)" />

        {/* ── TOP BAR ──────────────────────────────────────── */}
        <rect x="5" y="5" width="510" height="20" rx="2"
          fill="rgba(229,50,50,0.06)" stroke={R} strokeOpacity="0.22" strokeWidth="0.6" />
        <text x="12" y="18" fill={D} fontSize="6.5" fontFamily="monospace" letterSpacing="1">ID#M7-TR4-992</text>
        <circle cx="122" cy="14" r="3" fill="#22c55e">
          <animate attributeName="opacity" values="1;0.25;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="128" y="18" fill="#22c55e" fontSize="6.5" fontWeight="700" fontFamily="monospace">OPERATIVO</text>
        <text x="260" y="18" fill={D} fontSize="6.5" fontFamily="monospace" textAnchor="middle">SCANSIONE BIOMECCANICA</text>
        <text x="508" y="18" fill={O} fontSize="6.5" fontWeight="700" fontFamily="monospace" textAnchor="end">00:48</text>

        {/* ── LEFT PANEL ───────────────────────────────────── */}
        <rect x="5" y="30" width="114" height="340" rx="2"
          fill="rgba(8,4,12,0.75)" stroke={R} strokeOpacity="0.2" strokeWidth="0.6" />
        <Bracket x={5}   y={30}  />
        <Bracket x={119} y={30}  fx={-1} />
        <Bracket x={5}   y={370} fy={-1} />
        <Bracket x={119} y={370} fx={-1} fy={-1} />

        <text x="62" y="45" fill={R} fontSize="6.5" fontWeight="700" letterSpacing="2.5"
          textAnchor="middle" fontFamily="monospace">BIOMETRIA</text>
        <line x1="12" y1="49" x2="112" y2="49" stroke={R} strokeOpacity="0.18" strokeWidth="0.5" />

        <Bar x={12} y={62}  label="MASSA MAGRA" val="82%"  pct={82} c={O} />
        <Bar x={12} y={80}  label="GRASSO %"    val="12%"  pct={12} c={R} />
        <Bar x={12} y={98}  label="IDRATAZ."    val="74%"  pct={74} c={O} />
        <Bar x={12} y={116} label="VO2 MAX"     val="58ml" pct={58} c={L} />
        <Bar x={12} y={134} label="POTENZA"     val="91%"  pct={91} c={R} />
        <Bar x={12} y={152} label="VOLUME"      val="+12%" pct={72} c={O} />

        <line x1="12" y1="170" x2="112" y2="170" stroke={R} strokeOpacity="0.12" strokeWidth="0.5" />

        {/* ECG */}
        <text x="62" y="180" fill={D} fontSize="5.5" textAnchor="middle" fontFamily="monospace" letterSpacing="0.8">
          FC · 68 BPM
        </text>
        <polyline
          points="12,202 20,202 24,188 28,216 32,196 37,202 46,202 50,190 54,214 58,198 62,202 72,202 76,190 80,215 84,200 88,202 112,202"
          fill="none" stroke={R} strokeWidth="0.9" strokeOpacity="0.75">
          <animate attributeName="stroke-opacity" values="0.75;1;0.75" dur="1.8s" repeatCount="indefinite" />
        </polyline>

        <line x1="12" y1="218" x2="112" y2="218" stroke={R} strokeOpacity="0.12" strokeWidth="0.5" />
        {[['H','62%'],['F','58%'],['P','91%']].map(([l,v],i)=>(
          <g key={l}>
            <text x={12 + i*34} y={233} fill={D} fontSize="7.5" fontWeight="900" fontFamily="monospace">{l}</text>
            <text x={12 + i*34} y={244} fill={O} fontSize="6" fontFamily="monospace">{v}</text>
          </g>
        ))}

        {/* Connector to body */}
        <line x1="119" y1="178" x2="186" y2="178" stroke={R} strokeOpacity="0.28" strokeWidth="0.5" strokeDasharray="3 2" />
        <circle cx="186" cy="178" r="2" fill={R} opacity="0.55" />

        {/* ── RIGHT PANEL ──────────────────────────────────── */}
        <rect x="401" y="30" width="114" height="340" rx="2"
          fill="rgba(8,4,12,0.75)" stroke={R} strokeOpacity="0.2" strokeWidth="0.6" />
        <Bracket x={401} y={30}  />
        <Bracket x={515} y={30}  fx={-1} />
        <Bracket x={401} y={370} fy={-1} />
        <Bracket x={515} y={370} fx={-1} fy={-1} />

        <text x="458" y="45" fill={R} fontSize="6.5" fontWeight="700" letterSpacing="2.5"
          textAnchor="middle" fontFamily="monospace">PERFORMANCE</text>
        <line x1="408" y1="49" x2="508" y2="49" stroke={R} strokeOpacity="0.18" strokeWidth="0.5" />

        {/* Radar rings */}
        {[44,30,16].map(r => (
          <circle key={r} cx="457" cy="128" r={r} fill="none"
            stroke={R} strokeOpacity={0.07 + (44-r)*0.004} strokeWidth="0.5" strokeDasharray="3 2" />
        ))}
        {/* Radar axes */}
        {radarLabels.map((lbl, i) => {
          const rad = (i * 72 - 90) * Math.PI / 180
          return (
            <g key={lbl}>
              <line x1={457} y1={128}
                x2={457 + Math.cos(rad)*44} y2={128 + Math.sin(rad)*44}
                stroke={R} strokeOpacity="0.18" strokeWidth="0.4" />
              <text x={457 + Math.cos(rad)*54} y={128 + Math.sin(rad)*54 + 2}
                textAnchor="middle" fill={D} fontSize="5" fontFamily="monospace">{lbl}</text>
            </g>
          )
        })}
        {/* Radar polygon */}
        <polygon points={radarPts}
          fill={R} fillOpacity="0.14" stroke={R} strokeWidth="1.1" strokeOpacity="0.7"
          filter="url(#g2)" />
        {radarVals.map((v, i) => {
          const rad = (i * 72 - 90) * Math.PI / 180
          const r = v * 44 / 100
          return (
            <circle key={i} cx={457 + Math.cos(rad)*r} cy={128 + Math.sin(rad)*r}
              r="2.5" fill={O}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1.4 + i*0.3}s`} repeatCount="indefinite" />
            </circle>
          )
        })}
        <line x1="408" y1="183" x2="508" y2="183" stroke={R} strokeOpacity="0.12" strokeWidth="0.5" />
        {[['FC','68 BPM','#22c55e'],['TEMP','36.8 °C',O],['SESS','48:22',R],['HRV','62 ms',L]].map(([k,v,c],i)=>(
          <g key={k}>
            <text x="410" y={198+i*17} fill={D} fontSize="6" fontFamily="monospace">{k}</text>
            <text x="507" y={198+i*17} fill={c} fontSize="6.5" fontWeight="900" textAnchor="end" fontFamily="monospace">{v}</text>
            <line x1="410" y1={201+i*17} x2="507" y2={201+i*17} stroke={R} strokeOpacity="0.06" strokeWidth="0.4" />
          </g>
        ))}

        {/* Connector to body */}
        <line x1="334" y1="178" x2="401" y2="178" stroke={R} strokeOpacity="0.28" strokeWidth="0.5" strokeDasharray="3 2" />
        <circle cx="334" cy="178" r="2" fill={R} opacity="0.55" />

        {/* ══════════════════════════════════════════════════
            BODY — V-TAPER ATHLETIC PROPORTIONS
            Center: x=260
            Shoulder outer: x=168 (L) / x=352 (R) — width 184
            Chest max: x=175 (L) / x=345 (R) — width 170
            Waist: x=228 (L) / x=292 (R) — width 64  ← KEY
            Hip: x=224 (L) / x=296 (R) — width 72
        ═════════════════════════════════════════════════ */}
        <g filter="url(#g2)" style={{ animation: 'athlete-breathe 4s ease-in-out infinite' }}>

          {/* ── Measurement rings (rotate around body) ── */}
          <ellipse cx="260" cy="140" rx="58" ry="9" fill="none"
            stroke={R} strokeOpacity="0.22" strokeWidth="0.7" strokeDasharray="5 3">
            <animateTransform attributeName="transform" type="rotate"
              from="0 260 140" to="360 260 140" dur="14s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="260" cy="195" rx="52" ry="8" fill="none"
            stroke={O} strokeOpacity="0.15" strokeWidth="0.5" strokeDasharray="4 4">
            <animateTransform attributeName="transform" type="rotate"
              from="0 260 195" to="-360 260 195" dur="20s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="260" cy="268" rx="35" ry="7" fill="none"
            stroke={R} strokeOpacity="0.14" strokeWidth="0.5" strokeDasharray="3 4">
            <animateTransform attributeName="transform" type="rotate"
              from="0 260 268" to="360 260 268" dur="28s" repeatCount="indefinite" />
          </ellipse>

          {/* ── TORSO — V-taper path ── */}
          {/*  CORRECT proportions:
               Shoulders wide (168–352), waist narrow (228–292)
               Uses cubic bezier to create the dramatic inward curve  */}
          <path
            d={`
              M 248,100
              Q 232,108 210,120
              L 175,128
              C 162,136 158,154 160,174
              L 164,196
              C 164,218 186,248 228,272
              L 228,318
              L 292,318
              L 292,272
              C 334,248 356,218 356,196
              L 360,174
              C 362,154 358,136 345,128
              L 310,120
              Q 288,108 272,100
              L 268,94
              L 252,94
              Z
            `}
            fill="url(#bodyFill)"
            stroke={O} strokeWidth="1.5" strokeOpacity="0.7"
          />

          {/* ── Pec area detail (upper chest bulge hints) ── */}
          {/* Left pec lower arc */}
          <path d="M 170,158 C 182,188 218,200 248,196" fill="none" stroke={O} strokeOpacity="0.28" strokeWidth="0.8" />
          {/* Right pec lower arc */}
          <path d="M 350,158 C 338,188 302,200 272,196" fill="none" stroke={O} strokeOpacity="0.28" strokeWidth="0.8" />
          {/* Pec center line */}
          <line x1="260" y1="128" x2="260" y2="200" stroke={O} strokeOpacity="0.22" strokeWidth="0.7" />
          {/* Clavicles */}
          <path d="M 248,100 Q 225,116 200,122" fill="none" stroke={O} strokeOpacity="0.35" strokeWidth="0.9" />
          <path d="M 272,100 Q 295,116 320,122" fill="none" stroke={O} strokeOpacity="0.35" strokeWidth="0.9" />

          {/* ── Abs grid (inside narrow waist) ── */}
          <line x1="260" y1="200" x2="260" y2="316" stroke={O} strokeOpacity="0.18" strokeWidth="0.6" />
          {[216, 238, 260, 282].map(y => (
            <line key={y}
              x1={242 + (y-200)*0.5} y1={y}
              x2={278 - (y-200)*0.5} y2={y}
              stroke={O} strokeOpacity={0.22 - (y-216)*0.003} strokeWidth="0.6" />
          ))}

          {/* ── Shoulder deltoid caps ── */}
          <path d="M 175,128 C 155,138 152,160 158,178" fill="none" stroke={O} strokeOpacity="0.35" strokeWidth="0.8" />
          <path d="M 345,128 C 365,138 368,160 362,178" fill="none" stroke={O} strokeOpacity="0.35" strokeWidth="0.8" />

          {/* Serratus (side ribs) */}
          {[195,212,228].map((y,i) => (
            <g key={y}>
              <path d={`M ${174+i*4},${y} L ${188+i*2},${y+10}`} fill="none" stroke={O} strokeOpacity="0.18" strokeWidth="0.5" />
              <path d={`M ${346-i*4},${y} L ${332-i*2},${y+10}`} fill="none" stroke={O} strokeOpacity="0.18" strokeWidth="0.5" />
            </g>
          ))}

          {/* ── LEFT ARM ────────────────────────────────────
               Big bicep, slight forward lean, power pose     */}
          {/* Upper arm outline — WIDE */}
          <path
            d="M 175,128 L 152,136 L 130,218 L 136,222 L 148,228 L 168,148 L 184,132 Z"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.3" strokeOpacity="0.65"
          />
          {/* Bicep peak line */}
          <path d="M 152,136 Q 126,188 132,218" fill="none" stroke={O} strokeOpacity="0.3" strokeWidth="0.7" />
          {/* Forearm */}
          <path
            d="M 130,218 L 116,316 L 124,318 L 138,318 L 150,228 L 138,222 Z"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.2" strokeOpacity="0.6"
          />
          {/* Fist/hand */}
          <ellipse cx="127" cy="322" rx="13" ry="8" fill="rgba(229,50,50,0.05)"
            stroke={O} strokeWidth="1" strokeOpacity="0.5" />

          {/* ── RIGHT ARM (mirror) ────────────────────────── */}
          <path
            d="M 345,128 L 368,136 L 390,218 L 384,222 L 372,228 L 352,148 L 336,132 Z"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.3" strokeOpacity="0.65"
          />
          <path d="M 368,136 Q 394,188 388,218" fill="none" stroke={O} strokeOpacity="0.3" strokeWidth="0.7" />
          <path
            d="M 390,218 L 404,316 L 396,318 L 382,318 L 370,228 L 382,222 Z"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.2" strokeOpacity="0.6"
          />
          <ellipse cx="393" cy="322" rx="13" ry="8" fill="rgba(229,50,50,0.05)"
            stroke={O} strokeWidth="1" strokeOpacity="0.5" />

          {/* ── HEAD ─────────────────────────────────────────
               Slightly forward-tilted, intense look           */}
          <ellipse cx="260" cy="62" rx="30" ry="36"
            fill="rgba(229,50,50,0.05)" stroke={O} strokeWidth="1.4" strokeOpacity="0.8" />
          {/* Jawline */}
          <path d="M 234,76 Q 260,94 286,76" fill="none" stroke={O} strokeOpacity="0.32" strokeWidth="0.8" />
          {/* Brow ridge */}
          <path d="M 240,52 Q 260,48 280,52" fill="none" stroke={O} strokeOpacity="0.28" strokeWidth="0.7" />
          {/* Eyes */}
          <line x1="244" y1="56" x2="254" y2="56" stroke={R} strokeOpacity="0.6" strokeWidth="1.2" />
          <line x1="266" y1="56" x2="276" y2="56" stroke={R} strokeOpacity="0.6" strokeWidth="1.2" />
          {/* Neck */}
          <rect x="249" y="98" width="22" height="24" rx="3"
            fill="rgba(229,50,50,0.04)" stroke={O} strokeWidth="1.1" strokeOpacity="0.55" />

          {/* ── CHEST CORE (arc reactor) ── */}
          <circle cx="260" cy="178" r="20" fill="rgba(229,50,50,0.07)"
            stroke={R} strokeWidth="1.1" strokeOpacity="0.4" />
          <circle cx="260" cy="178" r="12" fill="rgba(255,107,43,0.1)"
            stroke={O} strokeWidth="0.9" strokeOpacity="0.6" />
          <circle cx="260" cy="178" r="6" fill="url(#orb)" filter="url(#g5)">
            <animate attributeName="r" values="6;8;6" dur="2.2s" repeatCount="indefinite" />
          </circle>
          {[0,45,90,135,180,225,270,315].map(a => {
            const rad = a * Math.PI / 180
            return (
              <line key={a}
                x1={260 + Math.cos(rad)*8} y1={178 + Math.sin(rad)*8}
                x2={260 + Math.cos(rad)*17} y2={178 + Math.sin(rad)*17}
                stroke={O} strokeWidth="0.7" strokeOpacity="0.45" />
            )
          })}

          {/* Joint nodes */}
          {[
            [260,98],[175,128],[345,128],
            [148,228],[372,228],
            [127,320],[393,320],
            [260,318],[228,318],[292,318],
          ].map(([cx,cy],i)=>(
            <circle key={i} cx={cx} cy={cy} r="3.2" fill={R}
              style={{ animation:`athlete-node ${1.8+(i%4)*0.5}s ease-in-out infinite`, animationDelay:`${i*0.13}s` }} />
          ))}

          {/* ── LEGS (lower portion) ── */}
          {/* Left thigh */}
          <path d="M 228,318 L 220,435 L 235,437 L 248,318 Z"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.2" strokeOpacity="0.58" />
          {/* Right thigh */}
          <path d="M 292,318 L 300,435 L 285,437 L 272,318 Z"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.2" strokeOpacity="0.58" />
          {/* Left shin */}
          <path d="M 220,434 L 214,528 L 228,528 L 236,436 Z"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.1" strokeOpacity="0.5" />
          {/* Right shin */}
          <path d="M 300,434 L 306,528 L 292,528 L 284,436 Z"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.1" strokeOpacity="0.5" />
          {/* Feet */}
          <path d="M 212,528 L 200,542 L 232,542 L 228,528 Z" fill="none" stroke={O} strokeOpacity="0.45" strokeWidth="0.9" />
          <path d="M 308,528 L 320,542 L 288,542 L 292,528 Z" fill="none" stroke={O} strokeOpacity="0.45" strokeWidth="0.9" />
          {/* Knee caps */}
          <ellipse cx="228" cy="436" rx="9" ry="5" fill="none" stroke={O} strokeOpacity="0.35" strokeWidth="0.8" />
          <ellipse cx="292" cy="436" rx="9" ry="5" fill="none" stroke={O} strokeOpacity="0.35" strokeWidth="0.8" />
        </g>

        {/* ── SCAN LINE ── */}
        <rect x="138" y="0" width="244" height="16"
          fill="url(#scanG)"
          style={{ animation: 'athlete-scan 3.6s ease-in-out infinite' }} />

        {/* ── GRID FLOOR ── */}
        {[0,1,2,3].map(i=>(
          <line key={i} x1={140+i*8} y1={544+i*4} x2={380-i*8} y2={544+i*4}
            stroke={R} strokeOpacity={0.06-i*0.012} strokeWidth="0.5" />
        ))}
        {[-4,-3,-2,-1,0,1,2,3,4].map(i=>(
          <line key={i} x1={260+i*13} y1="543" x2={260+i*58} y2="558"
            stroke={R} strokeOpacity="0.045" strokeWidth="0.4" />
        ))}

        {/* ── BOTTOM BAR ── */}
        <rect x="5" y="560" width="510" height="18" rx="2"
          fill="rgba(229,50,50,0.06)" stroke={R} strokeOpacity="0.2" strokeWidth="0.6" />
        <text x="12" y="572" fill={D} fontSize="6" fontFamily="monospace">SETT. 4 · GIORNO 2</text>
        <text x="260" y="572" fill={O} fontSize="6" fontWeight="700" textAnchor="middle" fontFamily="monospace">
          M7-R4-99 ● ONLINE
        </text>
        <text x="508" y="572" fill={D} fontSize="6" fontFamily="monospace" textAnchor="end">
          ANALISI 94% ▓▓▓▓▓▓▓░░░
        </text>

        {/* Canvas corner brackets */}
        <Bracket x={5}   y={5}   s={8} />
        <Bracket x={515} y={5}   s={8} fx={-1} />
        <Bracket x={5}   y={577} s={8} fy={-1} />
        <Bracket x={515} y={577} s={8} fx={-1} fy={-1} />
      </svg>
    </div>
  )
}
