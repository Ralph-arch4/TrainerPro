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
      <line x1={x} y1={y + fy * s} x2={x} y2={y} stroke={R} strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1={x} y1={y} x2={x + fx * s} y2={y} stroke={R} strokeWidth="1.4" strokeOpacity="0.75" />
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
      <rect x={x} y={y + 2} width={88 * pct / 100} height="2.8" rx="1.4" fill={c} opacity="0.72" />
    </g>
  )
}

/* ─────────────────────────────────────────────
   BODY COMPOSITION TECHNIQUE

   Each body segment = filled ellipse (dark fill, glowing stroke).
   A feGaussianBlur filter blends adjacent segments organically —
   the same technique CGI uses for subsurface scattering.
   Result: smooth, natural muscle transitions, not robot edges.

   Proportions (bodybuilder front, relaxed):
   • Shoulder outer: x=164 / x=356  → 192 wide
   • Lat max:        x=158 / x=362  → 204 wide  (lats are widest)
   • Waist:          x=226 / x=294  → 68 wide
   • Shoulder/waist ratio: 2.8 : 1  (elite bodybuilder)
───────────────────────────────────────────── */

export default function HeroCanvas() {
  const radarVals = [92, 71, 78, 65, 84]
  const radarLabels = ['FORZA', 'VELOC', 'RESIST', 'FLEX', 'RECUP']
  const radarPts = radarVals.map((v, i) => {
    const rad = (i * 72 - 90) * Math.PI / 180
    const r = v * 44 / 100
    return `${457 + Math.cos(rad) * r},${128 + Math.sin(rad) * r}`
  }).join(' ')

  return (
    <div className="w-full h-full" style={{ minHeight: 400 }}>
      <svg viewBox="0 0 520 580" width="100%" height="100%" style={{ overflow: 'visible' }} aria-hidden>
        <defs>
          {/* Main body blend — makes segments merge organically */}
          <filter id="blend" x="-40%" y="-20%" width="180%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Glow rim — bright edge around the body */}
          <filter id="rim" x="-40%" y="-20%" width="180%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Soft glow for details */}
          <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Chest orb */}
          <filter id="orb" x="-80%" y="-80%" width="360%" height="360%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="aura" cx="50%" cy="38%" r="44%">
            <stop offset="0%" stopColor={R} stopOpacity="0.25" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bodyFill" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor={O} stopOpacity="0.14" />
            <stop offset="60%" stopColor={R} stopOpacity="0.07" />
            <stop offset="100%" stopColor={R} stopOpacity="0.02" />
          </radialGradient>
          <radialGradient id="chestOrb">
            <stop offset="0%" stopColor={L} stopOpacity="1" />
            <stop offset="40%" stopColor={R} stopOpacity="0.8" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="scanG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={R} stopOpacity="0" />
            <stop offset="42%"  stopColor={R} stopOpacity="0.08" />
            <stop offset="50%"  stopColor={L} stopOpacity="0.95" />
            <stop offset="58%"  stopColor={R} stopOpacity="0.08" />
            <stop offset="100%" stopColor={R} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient aura */}
        <ellipse cx="260" cy="280" rx="140" ry="230" fill="url(#aura)" />

        {/* ── TOP BAR ─────────────────────────────────── */}
        <rect x="5" y="5" width="510" height="20" rx="2"
          fill="rgba(229,50,50,0.06)" stroke={R} strokeOpacity="0.22" strokeWidth="0.6" />
        <text x="12" y="18" fill={D} fontSize="6.5" fontFamily="monospace" letterSpacing="1">ID#M7-TR4-992</text>
        <circle cx="122" cy="14" r="3" fill="#22c55e">
          <animate attributeName="opacity" values="1;0.25;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="128" y="18" fill="#22c55e" fontSize="6.5" fontWeight="700" fontFamily="monospace">OPERATIVO</text>
        <text x="260" y="18" fill={D} fontSize="6.5" fontFamily="monospace" textAnchor="middle">SCANSIONE BIOMECCANICA</text>
        <text x="508" y="18" fill={O} fontSize="6.5" fontWeight="700" fontFamily="monospace" textAnchor="end">00:48</text>

        {/* ── LEFT PANEL ─────────────────────────────── */}
        <rect x="5" y="30" width="114" height="340" rx="2"
          fill="rgba(8,4,12,0.75)" stroke={R} strokeOpacity="0.2" strokeWidth="0.6" />
        <Bracket x={5}   y={30}  /><Bracket x={119} y={30}  fx={-1} />
        <Bracket x={5}   y={370} fy={-1} /><Bracket x={119} y={370} fx={-1} fy={-1} />
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
        <text x="62" y="181" fill={D} fontSize="5.5" textAnchor="middle" fontFamily="monospace" letterSpacing="0.8">FC · 68 BPM</text>
        <polyline
          points="12,202 20,202 24,188 28,216 32,196 37,202 46,202 50,190 54,214 58,198 62,202 72,202 76,190 80,215 84,200 88,202 112,202"
          fill="none" stroke={R} strokeWidth="0.9" strokeOpacity="0.75">
          <animate attributeName="stroke-opacity" values="0.75;1;0.75" dur="1.8s" repeatCount="indefinite" />
        </polyline>
        <line x1="12" y1="218" x2="112" y2="218" stroke={R} strokeOpacity="0.12" strokeWidth="0.5" />
        {[['H','62%'],['F','58%'],['P','91%']].map(([l,v],i)=>(
          <g key={l}>
            <text x={12+i*34} y={233} fill={D} fontSize="7.5" fontWeight="900" fontFamily="monospace">{l}</text>
            <text x={12+i*34} y={244} fill={O} fontSize="6" fontFamily="monospace">{v}</text>
          </g>
        ))}
        <line x1="119" y1="178" x2="168" y2="178" stroke={R} strokeOpacity="0.28" strokeWidth="0.5" strokeDasharray="3 2" />
        <circle cx="168" cy="178" r="2" fill={R} opacity="0.55" />

        {/* ── RIGHT PANEL ────────────────────────────── */}
        <rect x="401" y="30" width="114" height="340" rx="2"
          fill="rgba(8,4,12,0.75)" stroke={R} strokeOpacity="0.2" strokeWidth="0.6" />
        <Bracket x={401} y={30}  /><Bracket x={515} y={30}  fx={-1} />
        <Bracket x={401} y={370} fy={-1} /><Bracket x={515} y={370} fx={-1} fy={-1} />
        <text x="458" y="45" fill={R} fontSize="6.5" fontWeight="700" letterSpacing="2.5"
          textAnchor="middle" fontFamily="monospace">PERFORMANCE</text>
        <line x1="408" y1="49" x2="508" y2="49" stroke={R} strokeOpacity="0.18" strokeWidth="0.5" />
        {[44,30,16].map(r=>(
          <circle key={r} cx="457" cy="128" r={r} fill="none"
            stroke={R} strokeOpacity={0.07+(44-r)*0.004} strokeWidth="0.5" strokeDasharray="3 2" />
        ))}
        {radarLabels.map((lbl,i)=>{
          const rad=(i*72-90)*Math.PI/180
          return (
            <g key={lbl}>
              <line x1={457} y1={128} x2={457+Math.cos(rad)*44} y2={128+Math.sin(rad)*44}
                stroke={R} strokeOpacity="0.18" strokeWidth="0.4" />
              <text x={457+Math.cos(rad)*54} y={128+Math.sin(rad)*54+2}
                textAnchor="middle" fill={D} fontSize="5" fontFamily="monospace">{lbl}</text>
            </g>
          )
        })}
        <polygon points={radarPts} fill={R} fillOpacity="0.14" stroke={R} strokeWidth="1.1" strokeOpacity="0.7" filter="url(#soft)" />
        {radarVals.map((v,i)=>{
          const rad=(i*72-90)*Math.PI/180; const r=v*44/100
          return <circle key={i} cx={457+Math.cos(rad)*r} cy={128+Math.sin(rad)*r} r="2.5" fill={O}>
            <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1.4+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        })}
        <line x1="408" y1="183" x2="508" y2="183" stroke={R} strokeOpacity="0.12" strokeWidth="0.5" />
        {[['FC','68 BPM','#22c55e'],['TEMP','36.8 °C',O],['SESS','48:22',R],['HRV','62 ms',L]].map(([k,v,c],i)=>(
          <g key={k}>
            <text x="410" y={198+i*17} fill={D} fontSize="6" fontFamily="monospace">{k}</text>
            <text x="507" y={198+i*17} fill={c} fontSize="6.5" fontWeight="900" textAnchor="end" fontFamily="monospace">{v}</text>
            <line x1="410" y1={201+i*17} x2="507" y2={201+i*17} stroke={R} strokeOpacity="0.06" strokeWidth="0.4" />
          </g>
        ))}
        <line x1="352" y1="178" x2="401" y2="178" stroke={R} strokeOpacity="0.28" strokeWidth="0.5" strokeDasharray="3 2" />
        <circle cx="352" cy="178" r="2" fill={R} opacity="0.55" />

        {/* ══════════════════════════════════════════════
            BODY — BLOB COMPOSITION WITH BLUR BLENDING

            Layer 1: filled segments (blurred) → volume
            Layer 2: glowing strokes (rim light) → edge
            Layer 3: muscle highlights (crisp) → definition
        ══════════════════════════════════════════════ */}

        {/* Layer 1: Body volume — blurred filled shapes */}
        <g filter="url(#blend)" style={{ animation: 'athlete-breathe 4s ease-in-out infinite' }}>
          {/* HEAD */}
          <ellipse cx="260" cy="62" rx="30" ry="37"
            fill="url(#bodyFill)" stroke={O} strokeWidth="3.5" strokeOpacity="0.6" />
          {/* NECK */}
          <ellipse cx="260" cy="104" rx="17" ry="19"
            fill="url(#bodyFill)" stroke={O} strokeWidth="3" strokeOpacity="0.55" />
          {/* TRAPEZIUS — rises from neck to shoulders */}
          <ellipse cx="228" cy="116" rx="30" ry="14"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.5" />
          <ellipse cx="292" cy="116" rx="30" ry="14"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.5" />
          {/* DELTOIDS — wide shoulder caps */}
          <ellipse cx="184" cy="134" rx="28" ry="22"
            fill="url(#bodyFill)" stroke={O} strokeWidth="3" strokeOpacity="0.65" />
          <ellipse cx="336" cy="134" rx="28" ry="22"
            fill="url(#bodyFill)" stroke={O} strokeWidth="3" strokeOpacity="0.65" />
          {/* CHEST — two large pec lobes */}
          <ellipse cx="237" cy="178" rx="36" ry="38"
            fill="url(#bodyFill)" stroke={O} strokeWidth="3" strokeOpacity="0.6" />
          <ellipse cx="283" cy="178" rx="36" ry="38"
            fill="url(#bodyFill)" stroke={O} strokeWidth="3" strokeOpacity="0.6" />
          {/* LATS — wide flare below armpits (the V-taper key) */}
          <ellipse cx="188" cy="198" rx="26" ry="44"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.55" />
          <ellipse cx="332" cy="198" rx="26" ry="44"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.55" />
          {/* ABS / WAIST — narrow core */}
          <ellipse cx="260" cy="252" rx="34" ry="40"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.5" />
          {/* OBLIQUES */}
          <ellipse cx="232" cy="258" rx="14" ry="36"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2" strokeOpacity="0.4" />
          <ellipse cx="288" cy="258" rx="14" ry="36"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2" strokeOpacity="0.4" />
          {/* PELVIS / HIP */}
          <ellipse cx="260" cy="304" rx="44" ry="22"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.5" />

          {/* ── LEFT ARM (20° outward from shoulder) ── */}
          {/* Bicep — large upper arm */}
          <ellipse cx="154" cy="196" rx="22" ry="52"
            fill="url(#bodyFill)" stroke={O} strokeWidth="3" strokeOpacity="0.6"
            transform="rotate(-14 154 196)" />
          {/* Forearm */}
          <ellipse cx="138" cy="298" rx="15" ry="44"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.55"
            transform="rotate(-10 138 298)" />
          {/* Fist */}
          <ellipse cx="128" cy="350" rx="14" ry="11"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2" strokeOpacity="0.5" />

          {/* ── RIGHT ARM (mirror) ── */}
          <ellipse cx="366" cy="196" rx="22" ry="52"
            fill="url(#bodyFill)" stroke={O} strokeWidth="3" strokeOpacity="0.6"
            transform="rotate(14 366 196)" />
          <ellipse cx="382" cy="298" rx="15" ry="44"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.55"
            transform="rotate(10 382 298)" />
          <ellipse cx="392" cy="350" rx="14" ry="11"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2" strokeOpacity="0.5" />

          {/* ── LEGS ── */}
          {/* Left quad — thick, powerful */}
          <ellipse cx="234" cy="392" rx="30" ry="65"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.55"
            transform="rotate(4 234 392)" />
          {/* Right quad */}
          <ellipse cx="286" cy="392" rx="30" ry="65"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2.5" strokeOpacity="0.55"
            transform="rotate(-4 286 392)" />
          {/* Left shin/calf */}
          <ellipse cx="226" cy="496" rx="17" ry="46"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2" strokeOpacity="0.5"
            transform="rotate(2 226 496)" />
          {/* Right shin */}
          <ellipse cx="294" cy="496" rx="17" ry="46"
            fill="url(#bodyFill)" stroke={O} strokeWidth="2" strokeOpacity="0.5"
            transform="rotate(-2 294 496)" />
          {/* Feet */}
          <ellipse cx="218" cy="545" rx="22" ry="9"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.8" strokeOpacity="0.45" />
          <ellipse cx="302" cy="545" rx="22" ry="9"
            fill="url(#bodyFill)" stroke={O} strokeWidth="1.8" strokeOpacity="0.45" />
        </g>

        {/* Layer 2: Glowing rim — crisp bright outlines on muscle peaks */}
        <g filter="url(#rim)" opacity="0.85">
          {/* Head outline */}
          <ellipse cx="260" cy="62" rx="30" ry="37" fill="none" stroke={L} strokeWidth="1" strokeOpacity="0.7" />
          {/* Deltoid caps — the muscle peak line */}
          <path d="M 164,128 C 160,138 158,155 162,175" fill="none" stroke={L} strokeWidth="1.2" strokeOpacity="0.6" />
          <path d="M 356,128 C 360,138 362,155 358,175" fill="none" stroke={L} strokeWidth="1.2" strokeOpacity="0.6" />
          {/* Lat outer edge */}
          <path d="M 163,172 C 162,198 170,230 188,265" fill="none" stroke={O} strokeWidth="1" strokeOpacity="0.5" />
          <path d="M 357,172 C 358,198 350,230 332,265" fill="none" stroke={O} strokeWidth="1" strokeOpacity="0.5" />
          {/* Bicep peak */}
          <path d="M 138,165 C 128,185 122,210 128,232" fill="none" stroke={L} strokeWidth="1.1" strokeOpacity="0.55" />
          <path d="M 382,165 C 392,185 398,210 392,232" fill="none" stroke={L} strokeWidth="1.1" strokeOpacity="0.55" />
          {/* Quad outer sweep */}
          <path d="M 214,322 C 208,360 206,400 210,440" fill="none" stroke={O} strokeWidth="1" strokeOpacity="0.45" />
          <path d="M 306,322 C 312,360 314,400 310,440" fill="none" stroke={O} strokeWidth="1" strokeOpacity="0.45" />
        </g>

        {/* Layer 3: Crisp muscle definition lines (no blur) */}
        <g stroke={O} strokeWidth="0.7" fill="none" strokeOpacity="0.35">
          {/* Pec separation line (sternal groove) */}
          <line x1="260" y1="128" x2="260" y2="206" />
          {/* Left pec lower border */}
          <path d="M 175,170 C 200,200 230,208 258,204" strokeOpacity="0.28" />
          {/* Right pec lower border */}
          <path d="M 345,170 C 320,200 290,208 262,204" strokeOpacity="0.28" />
          {/* Ab vertical */}
          <line x1="260" y1="210" x2="260" y2="295" strokeOpacity="0.22" />
          {/* Ab horizontal lines */}
          {[224, 244, 264, 282].map(y => (
            <line key={y} x1={247-(y-224)*0.3} y1={y} x2={273+(y-224)*0.3} y2={y} strokeOpacity="0.22" />
          ))}
          {/* Clavicle lines */}
          <path d="M 248,108 Q 225,118 200,125" strokeOpacity="0.32" />
          <path d="M 272,108 Q 295,118 320,125" strokeOpacity="0.32" />
          {/* Bicep line (muscle separation) */}
          <path d="M 148,168 Q 142,196 144,224" strokeOpacity="0.25" />
          <path d="M 372,168 Q 378,196 376,224" strokeOpacity="0.25" />
          {/* Quad separation lines */}
          <path d="M 238,330 Q 232,380 230,430" strokeOpacity="0.22" />
          <path d="M 282,330 Q 288,380 290,430" strokeOpacity="0.22" />
          {/* Knee definition */}
          <ellipse cx="228" cy="454" rx="14" ry="7" strokeOpacity="0.3" />
          <ellipse cx="292" cy="454" rx="14" ry="7" strokeOpacity="0.3" />
          {/* Serratus (side ribs showing) */}
          {[190,208,225].map((y,i) => (
            <g key={y}>
              <path d={`M ${172+i*3},${y} L ${184+i*2},${y+9}`} strokeOpacity="0.18" />
              <path d={`M ${348-i*3},${y} L ${336-i*2},${y+9}`} strokeOpacity="0.18" />
            </g>
          ))}
        </g>

        {/* CHEST CORE — arc reactor pulse */}
        <circle cx="260" cy="178" r="20" fill="rgba(229,50,50,0.06)" stroke={R} strokeWidth="1" strokeOpacity="0.35" />
        <circle cx="260" cy="178" r="11" fill="rgba(255,107,43,0.1)" stroke={O} strokeWidth="0.9" strokeOpacity="0.5" />
        <circle cx="260" cy="178" r="5.5" fill="url(#chestOrb)" filter="url(#orb)">
          <animate attributeName="r" values="5.5;7.5;5.5" dur="2.2s" repeatCount="indefinite" />
        </circle>
        {[0,45,90,135,180,225,270,315].map(a => {
          const rad = a * Math.PI / 180
          return (
            <line key={a}
              x1={260 + Math.cos(rad) * 7} y1={178 + Math.sin(rad) * 7}
              x2={260 + Math.cos(rad) * 16} y2={178 + Math.sin(rad) * 16}
              stroke={O} strokeWidth="0.6" strokeOpacity="0.4" />
          )
        })}

        {/* Measurement rings */}
        <ellipse cx="260" cy="138" rx="62" ry="10" fill="none"
          stroke={R} strokeOpacity="0.22" strokeWidth="0.6" strokeDasharray="5 3">
          <animateTransform attributeName="transform" type="rotate"
            from="0 260 138" to="360 260 138" dur="15s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="260" cy="260" rx="38" ry="7" fill="none"
          stroke={O} strokeOpacity="0.16" strokeWidth="0.5" strokeDasharray="4 4">
          <animateTransform attributeName="transform" type="rotate"
            from="0 260 260" to="-360 260 260" dur="22s" repeatCount="indefinite" />
        </ellipse>

        {/* Joint nodes */}
        {[[260,98],[185,134],[335,134],[154,248],[366,248],[260,304],[228,455],[292,455]].map(([cx,cy],i)=>(
          <circle key={i} cx={cx} cy={cy} r="3.2" fill={R} filter="url(#soft)"
            style={{ animation:`athlete-node ${1.8+(i%4)*0.5}s ease-in-out infinite`, animationDelay:`${i*0.14}s` }} />
        ))}

        {/* SCAN LINE */}
        <rect x="135" y="0" width="250" height="16" fill="url(#scanG)"
          style={{ animation: 'athlete-scan 3.6s ease-in-out infinite' }} />

        {/* Grid floor */}
        {[0,1,2,3].map(i=>(
          <line key={i} x1={148+i*8} y1={555+i*4} x2={372-i*8} y2={555+i*4}
            stroke={R} strokeOpacity={0.06-i*0.012} strokeWidth="0.5" />
        ))}
        {[-4,-3,-2,-1,0,1,2,3,4].map(i=>(
          <line key={i} x1={260+i*12} y1="554" x2={260+i*56} y2="568"
            stroke={R} strokeOpacity="0.04" strokeWidth="0.4" />
        ))}

        {/* Bottom bar */}
        <rect x="5" y="560" width="510" height="18" rx="2"
          fill="rgba(229,50,50,0.06)" stroke={R} strokeOpacity="0.2" strokeWidth="0.6" />
        <text x="12" y="572" fill={D} fontSize="6" fontFamily="monospace">SETT. 4 · GIORNO 2</text>
        <text x="260" y="572" fill={O} fontSize="6" fontWeight="700" textAnchor="middle" fontFamily="monospace">M7-R4-99 ● ONLINE</text>
        <text x="508" y="572" fill={D} fontSize="6" fontFamily="monospace" textAnchor="end">ANALISI 94% ▓▓▓▓▓▓░░░</text>

        {/* Canvas brackets */}
        <Bracket x={5}   y={5}   s={8} /><Bracket x={515} y={5}   s={8} fx={-1} />
        <Bracket x={5}   y={577} s={8} fy={-1} /><Bracket x={515} y={577} s={8} fx={-1} fy={-1} />
      </svg>
    </div>
  )
}
