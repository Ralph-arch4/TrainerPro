'use client'

const A = '#E53232'   // accent red
const G = '#FF6B2B'   // glow orange

const JOINTS: [number, number][] = [
  [200, 108],           // neck base
  [148, 120], [252, 120], // shoulders
  [108, 200], [292, 200], // elbows
  [90,  280], [310, 280], // wrists
  [200, 240],             // waist
  [165, 240], [235, 240], // hips
  [160, 362], [240, 362], // knees
  [156, 480], [244, 480], // ankles
]

const BADGES = [
  { x: 14,  y: 148, label: 'FORZA',      value: '92%',  color: A, delay: '0s' },
  { x: 314, y: 132, label: 'RESISTENZA', value: '78%',  color: A, delay: '0.7s' },
  { x: 14,  y: 318, label: 'RECUPERO',   value: '+48h', color: G, delay: '1.4s' },
  { x: 310, y: 308, label: 'VOLUME',     value: '+12%', color: G, delay: '2.1s' },
]

export default function HeroCanvas() {
  return (
    <div className="w-full h-full" style={{ minHeight: 380 }}>
      <svg
        viewBox="0 0 400 560"
        width="100%" height="100%"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          {/* Red glow filter */}
          <filter id="hc-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Soft ambient glow behind figure */}
          <radialGradient id="hc-bg" cx="50%" cy="46%" r="44%">
            <stop offset="0%"   stopColor={G} stopOpacity="0.13" />
            <stop offset="100%" stopColor={G} stopOpacity="0" />
          </radialGradient>
          {/* Scan-line horizontal gradient */}
          <linearGradient id="hc-scan" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor={A} stopOpacity="0" />
            <stop offset="45%"  stopColor={A} stopOpacity="0.9" />
            <stop offset="55%"  stopColor="#FF9A6C" stopOpacity="1" />
            <stop offset="100%" stopColor={A} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient glow behind body */}
        <ellipse cx="200" cy="255" rx="155" ry="215" fill="url(#hc-bg)" />

        {/* ── Cyber grid floor ── */}
        {[0,1,2,3,4].map(i => (
          <line key={`gh${i}`}
            x1={20 + i * 8} y1={495 + i * 8} x2={380 - i * 8} y2={495 + i * 8}
            stroke={A} strokeOpacity={0.06 - i * 0.01} strokeWidth="0.6" />
        ))}
        {[-5,-4,-3,-2,-1,0,1,2,3,4,5].map(i => (
          <line key={`gv${i}`}
            x1={200 + i * 14} y1="493"
            x2={200 + i * 70} y2="527"
            stroke={A} strokeOpacity="0.055" strokeWidth="0.5" />
        ))}

        {/* ── Orbital measurement rings ── */}
        <ellipse cx="200" cy="148" rx="62" ry="13"
          fill="none" stroke={A} strokeOpacity="0.22" strokeWidth="0.7"
          strokeDasharray="5 3">
          <animateTransform attributeName="transform" type="rotate"
            from="0 200 148" to="360 200 148" dur="14s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="200" cy="210" rx="50" ry="11"
          fill="none" stroke={G} strokeOpacity="0.16" strokeWidth="0.6"
          strokeDasharray="4 4">
          <animateTransform attributeName="transform" type="rotate"
            from="0 200 210" to="-360 200 210" dur="18s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="200" cy="270" rx="170" ry="46"
          fill="none" stroke={A} strokeOpacity="0.1" strokeWidth="0.5">
          <animateTransform attributeName="transform" type="rotate"
            from="0 200 270" to="360 200 270" dur="24s" repeatCount="indefinite" />
        </ellipse>

        {/* ── Background laser diagonals ── */}
        <line x1="-60" y1="80"  x2="500" y2="380" stroke={A} strokeOpacity="0.055" strokeWidth="0.7" />
        <line x1="-30" y1="180" x2="460" y2="440" stroke={A} strokeOpacity="0.04"  strokeWidth="0.5" />

        {/* ── Athletic wireframe figure ── */}
        <g filter="url(#hc-glow)"
           style={{ animation: 'athlete-breathe 4s ease-in-out infinite' }}>

          {/* Structural lines */}
          <g stroke={G} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">

            {/* HEAD */}
            <circle cx="200" cy="58" r="31" stroke={A} strokeOpacity="0.92" strokeWidth="1.4" />
            {/* Head cross detail */}
            <line x1="200" y1="27" x2="200" y2="89" stroke={A} strokeOpacity="0.18" strokeWidth="0.5" />
            <line x1="169" y1="58" x2="231" y2="58" stroke={A} strokeOpacity="0.18" strokeWidth="0.5" />

            {/* NECK */}
            <line x1="200" y1="89" x2="200" y2="110" strokeOpacity="0.8" />

            {/* SHOULDER BAR */}
            <line x1="148" y1="120" x2="252" y2="120" strokeOpacity="0.92" />

            {/* TORSO — V-taper */}
            <line x1="148" y1="120" x2="144" y2="178" strokeOpacity="0.85" />
            <line x1="144" y1="178" x2="158" y2="240" strokeOpacity="0.78" />
            <line x1="252" y1="120" x2="256" y2="178" strokeOpacity="0.85" />
            <line x1="256" y1="178" x2="242" y2="240" strokeOpacity="0.78" />
            <line x1="158" y1="240" x2="242" y2="240" strokeOpacity="0.82" />

            {/* Torso center + pec + abs */}
            <line x1="200" y1="110" x2="200" y2="240" strokeOpacity="0.28" strokeWidth="0.7" />
            <line x1="150" y1="150" x2="250" y2="150" strokeOpacity="0.22" strokeWidth="0.6" />
            <line x1="155" y1="182" x2="245" y2="182" strokeOpacity="0.18" strokeWidth="0.6" />
            <line x1="157" y1="212" x2="243" y2="212" strokeOpacity="0.14" strokeWidth="0.6" />

            {/* LEFT ARM — power pose (slightly raised) */}
            <line x1="148" y1="120" x2="105" y2="200" strokeOpacity="0.9" />
            <line x1="105" y1="200" x2="88"  y2="280" strokeOpacity="0.84" />
            {/* left hand */}
            <line x1="88" y1="280" x2="80" y2="298" strokeOpacity="0.6" />
            <line x1="88" y1="280" x2="94" y2="298" strokeOpacity="0.6" />

            {/* RIGHT ARM — power pose */}
            <line x1="252" y1="120" x2="295" y2="200" strokeOpacity="0.9" />
            <line x1="295" y1="200" x2="312" y2="280" strokeOpacity="0.84" />
            {/* right hand */}
            <line x1="312" y1="280" x2="306" y2="298" strokeOpacity="0.6" />
            <line x1="312" y1="280" x2="320" y2="298" strokeOpacity="0.6" />

            {/* Shoulder deltoid detail */}
            <path d="M148,120 Q128,138 132,158" strokeOpacity="0.22" strokeWidth="0.7" />
            <path d="M252,120 Q272,138 268,158" strokeOpacity="0.22" strokeWidth="0.7" />

            {/* LEFT LEG — stance-width */}
            <line x1="166" y1="240" x2="160" y2="362" strokeOpacity="0.86" />
            <line x1="160" y1="362" x2="156" y2="480" strokeOpacity="0.8" />
            {/* left foot */}
            <line x1="156" y1="480" x2="136" y2="492" strokeOpacity="0.62" />
            <line x1="156" y1="480" x2="168" y2="492" strokeOpacity="0.62" />
            {/* quad detail */}
            <path d="M163,250 Q155,310 160,362" strokeOpacity="0.14" strokeWidth="0.6" />

            {/* RIGHT LEG */}
            <line x1="234" y1="240" x2="240" y2="362" strokeOpacity="0.86" />
            <line x1="240" y1="362" x2="244" y2="480" strokeOpacity="0.8" />
            {/* right foot */}
            <line x1="244" y1="480" x2="232" y2="492" strokeOpacity="0.62" />
            <line x1="244" y1="480" x2="256" y2="492" strokeOpacity="0.62" />
            {/* quad detail */}
            <path d="M237,250 Q245,310 240,362" strokeOpacity="0.14" strokeWidth="0.6" />

            {/* Knee caps */}
            <line x1="155" y1="355" x2="165" y2="370" strokeOpacity="0.22" strokeWidth="0.6" />
            <line x1="235" y1="355" x2="245" y2="370" strokeOpacity="0.22" strokeWidth="0.6" />
          </g>

          {/* Joint nodes */}
          {JOINTS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.8" fill={A}
              style={{
                animation: `athlete-node ${1.8 + (i % 4) * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }} />
          ))}
        </g>

        {/* ── Vertical scan line ── */}
        <rect x="100" y="0" width="200" height="2.5"
          fill="url(#hc-scan)"
          style={{ animation: 'athlete-scan 3.8s ease-in-out infinite' }} />

        {/* ── Metric badges ── */}
        {BADGES.map(({ x, y, label, value, color, delay }) => (
          <g key={label} style={{ animation: `athlete-badge ${3 + parseFloat(delay) * 0.4 + 2.5}s ease-in-out infinite`, animationDelay: delay }}>
            <rect x={x} y={y} width="76" height="30" rx="7"
              fill={`${color}18`} stroke={color} strokeOpacity="0.45" strokeWidth="0.8" />
            <text x={x + 38} y={y + 11} textAnchor="middle"
              fill={color} fontSize="6.5" fontWeight="700"
              letterSpacing="1.4" opacity="0.65" fontFamily="system-ui,sans-serif">
              {label}
            </text>
            <text x={x + 38} y={y + 23} textAnchor="middle"
              fill="rgba(245,240,232,0.92)" fontSize="12" fontWeight="900"
              fontFamily="system-ui,sans-serif">
              {value}
            </text>
          </g>
        ))}

        {/* Corner accent dots */}
        {[[8,8],[392,8],[8,552],[392,552]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill={A} opacity="0.3" />
        ))}
      </svg>
    </div>
  )
}
