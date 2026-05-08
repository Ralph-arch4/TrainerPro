'use client'

const R = '#E53232'
const O = '#FF6B2B'
const L = '#FF9A6C'
const D = 'rgba(245,240,232,0.38)'

function Bracket({ x, y, s = 12, fx = 1, fy = 1 }: {
  x: number; y: number; s?: number; fx?: number; fy?: number
}) {
  return (
    <g>
      <line x1={x} y1={y + fy * s} x2={x} y2={y} stroke={R} strokeWidth="1.4" strokeOpacity="0.8" />
      <line x1={x} y1={y} x2={x + fx * s} y2={y} stroke={R} strokeWidth="1.4" strokeOpacity="0.8" />
    </g>
  )
}

function Bar({ x, y, label, val, pct, c = O }: {
  x: number; y: number; label: string; val: string; pct: number; c?: string
}) {
  return (
    <g>
      <text x={x} y={y} fill={D} fontSize="6" fontWeight="600" letterSpacing="1" fontFamily="monospace">{label}</text>
      <text x={x + 88} y={y} fill={c} fontSize="6.5" fontWeight="900" fontFamily="monospace" textAnchor="end">{val}</text>
      <rect x={x} y={y + 2} width="88" height="2.8" rx="1.4" fill="rgba(255,255,255,0.06)" />
      <rect x={x} y={y + 2} width={88 * pct / 100} height="2.8" rx="1.4" fill={c} opacity="0.75" />
    </g>
  )
}

export default function HeroCanvas() {
  const radarVals = [92, 71, 78, 65, 84]
  const radarLabels = ['FORZA', 'VELOC', 'RESIST', 'FLEX', 'RECUP']
  const radarPts = radarVals.map((v, i) => {
    const rad = (i * 72 - 90) * Math.PI / 180
    const r = v * 44 / 100
    return `${457 + Math.cos(rad) * r},${128 + Math.sin(rad) * r}`
  }).join(' ')

  return (
    <div className="w-full h-full relative" style={{ minHeight: 400 }}>

      {/* ── Athlete image — screen blend removes dark bg, keeps glow ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/athlete-hero.png"
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          mixBlendMode: 'screen',
          filter: 'saturate(1.15) contrast(1.05)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* ── HUD overlay — SVG panels on top of the image ── */}
      <svg
        viewBox="0 0 520 580"
        width="100%" height="100%"
        style={{ position: 'relative', overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="aura" cx="50%" cy="42%" r="40%">
            <stop offset="0%" stopColor={R} stopOpacity="0.18" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="scanG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={R} stopOpacity="0" />
            <stop offset="45%"  stopColor={R} stopOpacity="0.08" />
            <stop offset="50%"  stopColor={L} stopOpacity="0.85" />
            <stop offset="55%"  stopColor={R} stopOpacity="0.08" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle ambient glow behind figure */}
        <ellipse cx="260" cy="290" rx="130" ry="220" fill="url(#aura)" />

        {/* ── TOP BAR ─────────────────────────────────────── */}
        <rect x="5" y="5" width="510" height="20" rx="2"
          fill="rgba(229,50,50,0.07)" stroke={R} strokeOpacity="0.25" strokeWidth="0.6" />
        <text x="12" y="18" fill={D} fontSize="6.5" fontFamily="monospace" letterSpacing="1">ID#M7-TR4-992</text>
        <circle cx="122" cy="14" r="3" fill="#22c55e">
          <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="128" y="18" fill="#22c55e" fontSize="6.5" fontWeight="700" fontFamily="monospace">OPERATIVO</text>
        <text x="260" y="18" fill={D} fontSize="6.5" fontFamily="monospace" textAnchor="middle">SCANSIONE BIOMECCANICA</text>
        <text x="508" y="18" fill={O} fontSize="6.5" fontWeight="700" fontFamily="monospace" textAnchor="end">00:48</text>

        {/* ── LEFT PANEL ──────────────────────────────────── */}
        <rect x="5" y="30" width="114" height="348" rx="2"
          fill="rgba(6,2,10,0.82)" stroke={R} strokeOpacity="0.22" strokeWidth="0.6" />
        <Bracket x={5}   y={30}  /><Bracket x={119} y={30}  fx={-1} />
        <Bracket x={5}   y={378} fy={-1} /><Bracket x={119} y={378} fx={-1} fy={-1} />

        <text x="62" y="45" fill={R} fontSize="6.5" fontWeight="700" letterSpacing="2.5"
          textAnchor="middle" fontFamily="monospace">BIOMETRIA</text>
        <line x1="12" y1="49" x2="112" y2="49" stroke={R} strokeOpacity="0.2" strokeWidth="0.5" />

        <Bar x={12} y={63}  label="MASSA MAGRA" val="82%"  pct={82} c={O} />
        <Bar x={12} y={81}  label="GRASSO %"    val="12%"  pct={12} c={R} />
        <Bar x={12} y={99}  label="IDRATAZ."    val="74%"  pct={74} c={O} />
        <Bar x={12} y={117} label="VO2 MAX"     val="58ml" pct={58} c={L} />
        <Bar x={12} y={135} label="POTENZA"     val="91%"  pct={91} c={R} />
        <Bar x={12} y={153} label="VOLUME"      val="+12%" pct={72} c={O} />

        <line x1="12" y1="171" x2="112" y2="171" stroke={R} strokeOpacity="0.14" strokeWidth="0.5" />
        <text x="62" y="182" fill={D} fontSize="5.5" textAnchor="middle" fontFamily="monospace" letterSpacing="0.8">FC · 68 BPM</text>

        {/* ECG waveform */}
        <polyline
          points="12,203 20,203 24,189 28,217 32,197 37,203 46,203 50,191 54,215 58,199 62,203 72,203 76,191 80,216 84,201 88,203 112,203"
          fill="none" stroke={R} strokeWidth="0.9" strokeOpacity="0.78">
          <animate attributeName="stroke-opacity" values="0.78;1;0.78" dur="1.8s" repeatCount="indefinite" />
        </polyline>

        <line x1="12" y1="219" x2="112" y2="219" stroke={R} strokeOpacity="0.14" strokeWidth="0.5" />
        {[['H','62%'],['F','58%'],['P','91%']].map(([l, v], i) => (
          <g key={l}>
            <text x={12 + i * 34} y={234} fill={D} fontSize="7.5" fontWeight="900" fontFamily="monospace">{l}</text>
            <text x={12 + i * 34} y={245} fill={O} fontSize="6" fontFamily="monospace">{v}</text>
          </g>
        ))}

        {/* Connector line to body */}
        <line x1="119" y1="178" x2="172" y2="178" stroke={R} strokeOpacity="0.3" strokeWidth="0.5" strokeDasharray="3 2" />
        <circle cx="172" cy="178" r="2" fill={R} opacity="0.6" />

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <rect x="401" y="30" width="114" height="348" rx="2"
          fill="rgba(6,2,10,0.82)" stroke={R} strokeOpacity="0.22" strokeWidth="0.6" />
        <Bracket x={401} y={30}  /><Bracket x={515} y={30}  fx={-1} />
        <Bracket x={401} y={378} fy={-1} /><Bracket x={515} y={378} fx={-1} fy={-1} />

        <text x="458" y="45" fill={R} fontSize="6.5" fontWeight="700" letterSpacing="2.5"
          textAnchor="middle" fontFamily="monospace">PERFORMANCE</text>
        <line x1="408" y1="49" x2="508" y2="49" stroke={R} strokeOpacity="0.2" strokeWidth="0.5" />

        {/* Radar rings */}
        {[44, 30, 16].map(r => (
          <circle key={r} cx="457" cy="128" r={r} fill="none"
            stroke={R} strokeOpacity={0.07 + (44 - r) * 0.004} strokeWidth="0.5" strokeDasharray="3 2" />
        ))}
        {radarLabels.map((lbl, i) => {
          const rad = (i * 72 - 90) * Math.PI / 180
          return (
            <g key={lbl}>
              <line x1={457} y1={128} x2={457 + Math.cos(rad) * 44} y2={128 + Math.sin(rad) * 44}
                stroke={R} strokeOpacity="0.2" strokeWidth="0.4" />
              <text x={457 + Math.cos(rad) * 55} y={128 + Math.sin(rad) * 55 + 2}
                textAnchor="middle" fill={D} fontSize="5" fontFamily="monospace">{lbl}</text>
            </g>
          )
        })}
        <polygon points={radarPts}
          fill={R} fillOpacity="0.15" stroke={R} strokeWidth="1.2" strokeOpacity="0.75"
          filter="url(#soft)" />
        {radarVals.map((v, i) => {
          const rad = (i * 72 - 90) * Math.PI / 180
          const r = v * 44 / 100
          return (
            <circle key={i} cx={457 + Math.cos(rad) * r} cy={128 + Math.sin(rad) * r}
              r="2.5" fill={O}>
              <animate attributeName="opacity" values="0.6;1;0.6"
                dur={`${1.4 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          )
        })}

        <line x1="408" y1="183" x2="508" y2="183" stroke={R} strokeOpacity="0.14" strokeWidth="0.5" />
        {[['FC','68 BPM','#22c55e'],['TEMP','36.8 °C',O],['SESS','48:22',R],['HRV','62 ms',L]].map(([k, v, c], i) => (
          <g key={k}>
            <text x="410" y={198 + i * 18} fill={D} fontSize="6" fontFamily="monospace">{k}</text>
            <text x="507" y={198 + i * 18} fill={c} fontSize="6.5" fontWeight="900"
              textAnchor="end" fontFamily="monospace">{v}</text>
            <line x1="410" y1={201 + i * 18} x2="507" y2={201 + i * 18}
              stroke={R} strokeOpacity="0.06" strokeWidth="0.4" />
          </g>
        ))}

        {/* Connector line to body */}
        <line x1="348" y1="178" x2="401" y2="178" stroke={R} strokeOpacity="0.3" strokeWidth="0.5" strokeDasharray="3 2" />
        <circle cx="348" cy="178" r="2" fill={R} opacity="0.6" />

        {/* ── Scan line across figure ──────────────────────── */}
        <rect x="120" y="0" width="280" height="18" fill="url(#scanG)"
          style={{ animation: 'athlete-scan 3.8s ease-in-out infinite' }} />

        {/* ── Measurement rings (orbit around figure) ─────── */}
        <ellipse cx="260" cy="155" rx="72" ry="12" fill="none"
          stroke={R} strokeOpacity="0.2" strokeWidth="0.7" strokeDasharray="5 3">
          <animateTransform attributeName="transform" type="rotate"
            from="0 260 155" to="360 260 155" dur="16s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="260" cy="290" rx="56" ry="10" fill="none"
          stroke={O} strokeOpacity="0.14" strokeWidth="0.5" strokeDasharray="4 4">
          <animateTransform attributeName="transform" type="rotate"
            from="0 260 290" to="-360 260 290" dur="24s" repeatCount="indefinite" />
        </ellipse>

        {/* ── Grid floor ──────────────────────────────────── */}
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={148 + i * 8} y1={555 + i * 4} x2={372 - i * 8} y2={555 + i * 4}
            stroke={R} strokeOpacity={0.06 - i * 0.012} strokeWidth="0.5" />
        ))}
        {[-4,-3,-2,-1,0,1,2,3,4].map(i => (
          <line key={i} x1={260 + i * 12} y1="554" x2={260 + i * 56} y2="568"
            stroke={R} strokeOpacity="0.04" strokeWidth="0.4" />
        ))}

        {/* ── Bottom bar ──────────────────────────────────── */}
        <rect x="5" y="560" width="510" height="18" rx="2"
          fill="rgba(229,50,50,0.06)" stroke={R} strokeOpacity="0.2" strokeWidth="0.6" />
        <text x="12" y="572" fill={D} fontSize="6" fontFamily="monospace">SETT. 4 · GIORNO 2</text>
        <text x="260" y="572" fill={O} fontSize="6" fontWeight="700"
          textAnchor="middle" fontFamily="monospace">M7-R4-99 ● ONLINE</text>
        <text x="508" y="572" fill={D} fontSize="6" fontFamily="monospace" textAnchor="end">
          ANALISI 94% ▓▓▓▓▓▓░░░
        </text>

        {/* Canvas corner brackets */}
        <Bracket x={5}   y={5}   s={8} /><Bracket x={515} y={5}   s={8} fx={-1} />
        <Bracket x={5}   y={577} s={8} fy={-1} /><Bracket x={515} y={577} s={8} fx={-1} fy={-1} />
      </svg>
    </div>
  )
}
