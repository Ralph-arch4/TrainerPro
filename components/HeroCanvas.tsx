'use client'

const R = '#E53232'
const O = '#FF6B2B'
const L = '#FF9A6C'
const W = 'rgba(245,240,232,0.85)'
const D = 'rgba(245,240,232,0.4)'

// Corner bracket element (HUD style)
function Bracket({ x, y, size = 14, flip = false }: { x: number; y: number; size?: number; flip?: boolean }) {
  const sx = flip ? -1 : 1
  const sy = flip ? -1 : 1
  return (
    <g>
      <line x1={x} y1={y + sy * size} x2={x} y2={y} stroke={R} strokeWidth="1.5" strokeOpacity="0.8" />
      <line x1={x} y1={y} x2={x + sx * size} y2={y} stroke={R} strokeWidth="1.5" strokeOpacity="0.8" />
    </g>
  )
}

// Horizontal stat bar
function StatBar({ x, y, label, value, pct, color = O }: {
  x: number; y: number; label: string; value: string; pct: number; color?: string
}) {
  return (
    <g>
      <text x={x} y={y} fill={D} fontSize="6.5" fontWeight="600" letterSpacing="1" fontFamily="monospace">{label}</text>
      <text x={x + 90} y={y} fill={color} fontSize="6.5" fontWeight="900" fontFamily="monospace" textAnchor="end">{value}</text>
      {/* Bar track */}
      <rect x={x} y={y + 3} width="90" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
      {/* Bar fill */}
      <rect x={x} y={y + 3} width={90 * pct / 100} height="3" rx="1.5" fill={color} opacity="0.75" />
    </g>
  )
}

export default function HeroCanvas() {
  return (
    <div className="w-full h-full" style={{ minHeight: 400 }}>
      <svg viewBox="0 0 520 580" width="100%" height="100%" style={{ overflow: 'visible' }} aria-hidden>
        <defs>
          <filter id="hud-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="hud-glow-sm" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="b2" />
            <feMerge><feMergeNode in="b2" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="hud-glow-xs" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="b3" />
            <feMerge><feMergeNode in="b3" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="body-aura" cx="50%" cy="44%" r="38%">
            <stop offset="0%" stopColor={R} stopOpacity="0.2" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="chest-orb">
            <stop offset="0%" stopColor={L} stopOpacity="1" />
            <stop offset="45%" stopColor={R} stopOpacity="0.7" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="scan-h" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={R} stopOpacity="0" />
            <stop offset="35%"  stopColor={R} stopOpacity="0.12" />
            <stop offset="50%"  stopColor={L} stopOpacity="0.85" />
            <stop offset="65%"  stopColor={R} stopOpacity="0.12" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="body-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={O} stopOpacity="0.08" />
            <stop offset="100%" stopColor={R} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* ── Ambient body glow ── */}
        <ellipse cx="260" cy="280" rx="140" ry="230" fill="url(#body-aura)" />

        {/* ── TOP STATUS BAR ──────────────────────────────────────────────── */}
        <rect x="5" y="5" width="510" height="22" rx="3"
          fill="rgba(229,50,50,0.06)" stroke={R} strokeOpacity="0.25" strokeWidth="0.7" />
        <text x="14" y="19" fill={D} fontSize="7" fontWeight="700" fontFamily="monospace" letterSpacing="1">
          ID#M7-TR4-992
        </text>
        <circle cx="130" cy="14" r="3" fill="#22c55e">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="136" y="19" fill="#22c55e" fontSize="7" fontWeight="700" fontFamily="monospace">OPERATIVO</text>
        <text x="260" y="19" fill={D} fontSize="7" fontFamily="monospace" textAnchor="middle">
          ANALISI BIOMECCANICA ATTIVA
        </text>
        <text x="506" y="19" fill={O} fontSize="7" fontWeight="700" fontFamily="monospace" textAnchor="end">
          00:48
        </text>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <rect x="5" y="33" width="116" height="360" rx="3"
          fill="rgba(10,5,15,0.7)" stroke={R} strokeOpacity="0.2" strokeWidth="0.7" />
        {/* Corner brackets */}
        <Bracket x={5}   y={33}  size={10} />
        <Bracket x={121} y={33}  size={10} flip />
        <Bracket x={5}   y={393} size={10} flip />
        <Bracket x={121} y={393} size={10} />

        <text x="63" y="48" fill={R} fontSize="7" fontWeight="700" letterSpacing="2"
          textAnchor="middle" fontFamily="monospace">BIOMETRIA</text>
        <line x1="14" y1="52" x2="112" y2="52" stroke={R} strokeOpacity="0.2" strokeWidth="0.5" />

        <StatBar x={14} y={68}  label="MASSA MAGRA" value="82%"  pct={82} color={O} />
        <StatBar x={14} y={89}  label="GRASSO %"    value="12%"  pct={12} color={R} />
        <StatBar x={14} y={110} label="IDRATAZIONE" value="74%"  pct={74} color={O} />
        <StatBar x={14} y={131} label="VO2 MAX"     value="58ml" pct={58} color={L} />
        <StatBar x={14} y={152} label="POTENZA"     value="91%"  pct={91} color={R} />
        <StatBar x={14} y={173} label="VOLUME"      value="+12%" pct={72} color={O} />

        <line x1="14" y1="193" x2="112" y2="193" stroke={R} strokeOpacity="0.15" strokeWidth="0.5" />

        {/* Waveform (fake ECG) */}
        <text x="63" y="204" fill={D} fontSize="6" textAnchor="middle" fontFamily="monospace" letterSpacing="1">
          HEART BEAT · 68 BPM
        </text>
        <polyline
          points="14,226 24,226 28,210 32,242 36,218 40,226 50,226 54,212 58,240 62,222 66,226 76,226 80,213 84,239 88,224 92,226 112,226"
          fill="none" stroke={R} strokeWidth="1" strokeOpacity="0.7">
          <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" />
        </polyline>

        {/* Axis labels */}
        {['H','F','P'].map((l, i) => (
          <text key={l} x={14 + i * 34} y={266} fill={D} fontSize="8" fontWeight="900" fontFamily="monospace">{l}</text>
        ))}
        {['62%','58%','91%'].map((v, i) => (
          <text key={v} x={14 + i * 34} y={278} fill={O} fontSize="6.5" fontFamily="monospace">{v}</text>
        ))}

        {/* Connection line to body */}
        <line x1="121" y1="185" x2="195" y2="185" stroke={R} strokeOpacity="0.3" strokeWidth="0.6" strokeDasharray="3 2" />
        <circle cx="195" cy="185" r="2.5" fill={R} opacity="0.6" />

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <rect x="399" y="33" width="116" height="360" rx="3"
          fill="rgba(10,5,15,0.7)" stroke={R} strokeOpacity="0.2" strokeWidth="0.7" />
        <Bracket x={399} y={33}  size={10} />
        <Bracket x={515} y={33}  size={10} flip />
        <Bracket x={399} y={393} size={10} flip />
        <Bracket x={515} y={393} size={10} />

        <text x="457" y="48" fill={R} fontSize="7" fontWeight="700" letterSpacing="2"
          textAnchor="middle" fontFamily="monospace">PERFORMANCE</text>
        <line x1="408" y1="52" x2="506" y2="52" stroke={R} strokeOpacity="0.2" strokeWidth="0.5" />

        {/* Circular radar gauge */}
        {[50, 35, 20].map(r => (
          <circle key={r} cx="457" cy="135" r={r}
            fill="none" stroke={R} strokeOpacity={0.08 + (50 - r) * 0.006} strokeWidth="0.6" strokeDasharray="3 2" />
        ))}
        {/* Radar axes (5 axes = 72° apart) */}
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle - 90) * Math.PI / 180
          return (
            <line key={i}
              x1={457} y1={135}
              x2={457 + Math.cos(rad) * 50} y2={135 + Math.sin(rad) * 50}
              stroke={R} strokeOpacity="0.2" strokeWidth="0.5" />
          )
        })}
        {/* Radar axis labels */}
        {[['FORZA','92',0],['VELOC','71',72],['RESIST','78',144],['FLEX','65',216],['RECUP','84',288]].map(([label, val, angle], i) => {
          const rad = (Number(angle) - 90) * Math.PI / 180
          const lx = 457 + Math.cos(rad) * 62
          const ly = 135 + Math.sin(rad) * 62
          return (
            <text key={i} x={lx} y={ly + 2} textAnchor="middle"
              fill={D} fontSize="5.5" fontFamily="monospace">{label}</text>
          )
        })}
        {/* Radar polygon (performance data) */}
        <polygon
          points={[0,72,144,216,288].map((angle, i) => {
            const vals = [92, 71, 78, 65, 84]
            const r = vals[i] * 50 / 100
            const rad = (angle - 90) * Math.PI / 180
            return `${457 + Math.cos(rad) * r},${135 + Math.sin(rad) * r}`
          }).join(' ')}
          fill={R} fillOpacity="0.12"
          stroke={R} strokeWidth="1.2" strokeOpacity="0.65"
          filter="url(#hud-glow-xs)" />
        {/* Polygon vertex dots */}
        {[0,72,144,216,288].map((angle, i) => {
          const vals = [92, 71, 78, 65, 84]
          const r = vals[i] * 50 / 100
          const rad = (angle - 90) * Math.PI / 180
          return (
            <circle key={i}
              cx={457 + Math.cos(rad) * r}
              cy={135 + Math.sin(rad) * r}
              r="2.8" fill={O}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          )
        })}

        <line x1="408" y1="197" x2="506" y2="197" stroke={R} strokeOpacity="0.15" strokeWidth="0.5" />

        {/* Right data rows */}
        {[
          ['FC', '68 BPM', '#22c55e'],
          ['TEMP', '36.8 °C', O],
          ['SESS', '48:22', R],
          ['HRV', '62 ms', L],
        ].map(([label, val, col], i) => (
          <g key={label}>
            <text x="410" y={215 + i * 18} fill={D} fontSize="6.5" fontFamily="monospace">{label}</text>
            <text x="505" y={215 + i * 18} fill={col} fontSize="7" fontWeight="900"
              textAnchor="end" fontFamily="monospace">{val}</text>
            <line x1="410" y1={218 + i * 18} x2="505" y2={218 + i * 18}
              stroke={R} strokeOpacity="0.07" strokeWidth="0.4" />
          </g>
        ))}

        {/* Connection line to body */}
        <line x1="325" y1="185" x2="399" y2="185" stroke={R} strokeOpacity="0.3" strokeWidth="0.6" strokeDasharray="3 2" />
        <circle cx="325" cy="185" r="2.5" fill={R} opacity="0.6" />

        {/* ── BODY FIGURE (CENTER) ──────────────────────────────────────── */}
        <g filter="url(#hud-glow-sm)">

          {/* Body volume fill */}
          <g style={{ animation: 'athlete-breathe 4s ease-in-out infinite' }}>

            {/* TORSO SHAPE — filled with barely-visible gradient */}
            <path
              d="M232,112 L205,126 C188,136 180,154 178,178 L175,258 L183,308 L220,320 L220,315 L300,315 L300,320 L337,308 L345,258 L342,178 C340,154 332,136 315,126 L288,112 L278,100 Q260,82 242,100 Z"
              fill="url(#body-grad)"
              stroke={O} strokeWidth="1.4" strokeOpacity="0.65" />

            {/* HEAD */}
            <ellipse cx="260" cy="68" rx="32" ry="38"
              fill="rgba(229,50,50,0.05)"
              stroke={O} strokeWidth="1.3" strokeOpacity="0.82" />
            {/* Head inner lines */}
            <line x1="260" y1="30" x2="260" y2="106" stroke={O} strokeOpacity="0.15" strokeWidth="0.6" />
            <line x1="228" y1="68" x2="292" y2="68" stroke={O} strokeOpacity="0.15" strokeWidth="0.6" />
            {/* Jaw detail */}
            <path d="M238,88 Q260,106 282,88" fill="none" stroke={O} strokeOpacity="0.3" strokeWidth="0.7" />

            {/* NECK */}
            <rect x="248" y="106" width="24" height="28" rx="3"
              fill="rgba(229,50,50,0.04)" stroke={O} strokeWidth="1.1" strokeOpacity="0.55" />

            {/* LEFT ARM — upper */}
            <path d="M205,128 L182,152 L162,245 L168,247 L202,148 L212,132 Z"
              fill="rgba(229,50,50,0.04)" stroke={O} strokeWidth="1.2" strokeOpacity="0.6" />
            {/* LEFT ARM — forearm */}
            <path d="M163,244 L143,330 L148,332 L166,330 L170,248 Z"
              fill="rgba(229,50,50,0.03)" stroke={O} strokeWidth="1.1" strokeOpacity="0.55" />
            {/* Left hand */}
            <ellipse cx="148" cy="336" rx="10" ry="6" fill="none" stroke={O} strokeOpacity="0.45" strokeWidth="1" />

            {/* RIGHT ARM — upper */}
            <path d="M315,128 L338,152 L358,245 L352,247 L318,148 L308,132 Z"
              fill="rgba(229,50,50,0.04)" stroke={O} strokeWidth="1.2" strokeOpacity="0.6" />
            {/* RIGHT ARM — forearm */}
            <path d="M357,244 L377,330 L372,332 L354,330 L350,248 Z"
              fill="rgba(229,50,50,0.03)" stroke={O} strokeWidth="1.1" strokeOpacity="0.55" />
            {/* Right hand */}
            <ellipse cx="372" cy="336" rx="10" ry="6" fill="none" stroke={O} strokeOpacity="0.45" strokeWidth="1" />

            {/* LEFT LEG — thigh */}
            <path d="M220,318 L210,430 L215,432 L238,432 L240,420 L232,318 Z"
              fill="rgba(229,50,50,0.04)" stroke={O} strokeWidth="1.2" strokeOpacity="0.6" />
            {/* LEFT LEG — shin */}
            <path d="M211,430 L205,528 L210,530 L228,530 L230,528 L240,430 Z"
              fill="rgba(229,50,50,0.03)" stroke={O} strokeWidth="1.1" strokeOpacity="0.55" />
            {/* Left foot */}
            <path d="M204,528 L195,542 L226,542 L228,530 Z"
              fill="rgba(229,50,50,0.04)" stroke={O} strokeWidth="1" strokeOpacity="0.5" />

            {/* RIGHT LEG — thigh */}
            <path d="M300,318 L290,318 L280,420 L282,432 L305,432 L310,430 Z"
              fill="rgba(229,50,50,0.04)" stroke={O} strokeWidth="1.2" strokeOpacity="0.6" />
            {/* RIGHT LEG — shin */}
            <path d="M280,430 L270,528 L272,530 L290,530 L295,528 L307,430 Z"
              fill="rgba(229,50,50,0.03)" stroke={O} strokeWidth="1.1" strokeOpacity="0.55" />
            {/* Right foot */}
            <path d="M268,528 L264,542 L294,542 L292,530 Z"
              fill="rgba(229,50,50,0.04)" stroke={O} strokeWidth="1" strokeOpacity="0.5" />

            {/* ── Interior muscle detail lines ── */}
            <g stroke={R} strokeWidth="0.6" fill="none" strokeOpacity="0.3">
              {/* Clavicles */}
              <path d="M248,112 Q230,122 208,126" />
              <path d="M272,112 Q290,122 312,126" />
              {/* Pec separation */}
              <line x1="260" y1="134" x2="260" y2="178" />
              {/* Pec lines */}
              <path d="M185,158 Q222,170 260,168 Q298,170 335,158" />
              {/* Abs */}
              <line x1="260" y1="180" x2="260" y2="308" strokeOpacity="0.2" />
              {[200,220,240,262,284].map(y => (
                <line key={y} x1={195 + (y-200)*0.3} y1={y} x2={325 - (y-200)*0.3} y2={y} strokeOpacity="0.18" />
              ))}
              {/* Deltoid shoulder cap */}
              <path d="M205,126 Q190,138 185,155" />
              <path d="M315,126 Q330,138 335,155" />
              {/* Quad lines */}
              <path d="M225,325 Q218,378 214,430" />
              <path d="M295,325 Q288,378 286,430" />
              {/* Knee cap detail */}
              <ellipse cx="226" cy="432" rx="10" ry="5" />
              <ellipse cx="294" cy="432" rx="10" ry="5" />
            </g>

            {/* ── Measurement rings ── */}
            <ellipse cx="260" cy="140" rx="55" ry="10"
              fill="none" stroke={R} strokeOpacity="0.22" strokeWidth="0.7" strokeDasharray="5 3">
              <animateTransform attributeName="transform" type="rotate"
                from="0 260 140" to="360 260 140" dur="16s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="260" cy="185" rx="52" ry="9"
              fill="none" stroke={O} strokeOpacity="0.16" strokeWidth="0.6" strokeDasharray="4 4">
              <animateTransform attributeName="transform" type="rotate"
                from="0 260 185" to="-360 260 185" dur="20s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="260" cy="265" rx="40" ry="8"
              fill="none" stroke={R} strokeOpacity="0.14" strokeWidth="0.5" strokeDasharray="3 4">
              <animateTransform attributeName="transform" type="rotate"
                from="0 260 265" to="360 260 265" dur="26s" repeatCount="indefinite" />
            </ellipse>

            {/* ── CHEST CORE (arc reactor) ── */}
            <circle cx="260" cy="185" r="22" fill="rgba(229,50,50,0.08)"
              stroke={R} strokeWidth="1.2" strokeOpacity="0.5" />
            <circle cx="260" cy="185" r="14" fill="rgba(255,107,43,0.12)"
              stroke={O} strokeWidth="1" strokeOpacity="0.7" />
            <circle cx="260" cy="185" r="7" fill="url(#chest-orb)" filter="url(#hud-glow)">
              <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Core rays */}
            {[0,45,90,135,180,225,270,315].map(angle => {
              const rad = angle * Math.PI / 180
              return (
                <line key={angle}
                  x1={260 + Math.cos(rad) * 9} y1={185 + Math.sin(rad) * 9}
                  x2={260 + Math.cos(rad) * 19} y2={185 + Math.sin(rad) * 19}
                  stroke={O} strokeWidth="0.8" strokeOpacity="0.5" />
              )
            })}

            {/* Joint dots */}
            {[
              [260,106], [205,126], [315,126],
              [164,244], [356,244], [148,334], [372,334],
              [260,316], [220,318], [300,318],
              [212,432], [308,432], [208,528], [282,528],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="3.5" fill={R}
                style={{ animation: `athlete-node ${1.8 + (i % 4) * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.12}s` }} />
            ))}
          </g>
        </g>

        {/* ── SCAN LINE (full width of figure) ── */}
        <rect x="178" y="0" width="164" height="18"
          fill="url(#scan-h)"
          style={{ animation: 'athlete-scan 3.5s ease-in-out infinite' }} />

        {/* ── BOTTOM STATUS BAR ─────────────────────────────────────────── */}
        <rect x="5" y="553" width="510" height="22" rx="3"
          fill="rgba(229,50,50,0.06)" stroke={R} strokeOpacity="0.25" strokeWidth="0.7" />
        <text x="14" y="567" fill={D} fontSize="6.5" fontFamily="monospace">SETT. 4 · GIORNO 2</text>
        <text x="260" y="567" fill={O} fontSize="6.5" fontWeight="700"
          textAnchor="middle" fontFamily="monospace">M7-R4-99 ● ONLINE</text>
        <text x="506" y="567" fill={D} fontSize="6.5" fontFamily="monospace" textAnchor="end">
          ANALISI 94% ▓▓▓▓▓▓▓▓░░
        </text>

        {/* ── GRID FLOOR ────────────────────────────────────────────────── */}
        {[0,1,2,3].map(i => (
          <line key={`gf${i}`} x1={130 + i * 10} y1={543 + i * 4} x2={390 - i * 10} y2={543 + i * 4}
            stroke={R} strokeOpacity={0.07 - i * 0.015} strokeWidth="0.5" />
        ))}
        {[-4,-3,-2,-1,0,1,2,3,4].map(i => (
          <line key={`gv${i}`} x1={260 + i * 12} y1="543" x2={260 + i * 55} y2="558"
            stroke={R} strokeOpacity="0.05" strokeWidth="0.5" />
        ))}

        {/* Corner accent markers (full canvas) */}
        <Bracket x={5}   y={5}   size={6} />
        <Bracket x={515} y={5}   size={6} flip />
        <Bracket x={5}   y={575} size={6} flip />
        <Bracket x={515} y={575} size={6} />
      </svg>
    </div>
  )
}
