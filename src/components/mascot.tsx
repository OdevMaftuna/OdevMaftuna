/**
 * ZUMI — NSP maskoti (eski 🦉 Sova o'rniga): kichkina kosmik mavjudot.
 * Bitta katta ko'z (miltillaydi), nurli antennalar, qo'l silkitadi va reaktiv "jetpack" bilan suzadi.
 * Faqat SVG + CSS — rasm yuklanmaydi, har qanday o'lchamda tiniq.
 */
export function Zumi({ size = 140, wave = true, className = "" }: { size?: number; wave?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 120 140" width={size} height={(size * 140) / 120} className={`zumi ${className}`} aria-label="Zumi" role="img">
      <defs>
        <radialGradient id="zb" cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#8ff7d4" />
          <stop offset=".45" stopColor="#25c9a0" />
          <stop offset="1" stopColor="#5b2bd6" />
        </radialGradient>
        <radialGradient id="ze" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe9ff" />
        </radialGradient>
        <linearGradient id="zf" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset=".5" stopColor="#ffb347" />
          <stop offset="1" stopColor="#ff3d6e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Reaktiv olov */}
      <g className="zumi-flame">
        <path d="M46 112 Q50 136 54 112 Z" fill="url(#zf)" />
        <path d="M66 112 Q70 136 74 112 Z" fill="url(#zf)" />
      </g>
      {/* Antennalar */}
      <g className="zumi-ant" stroke="#5b2bd6" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M44 30 Q36 14 28 10" />
        <path d="M76 30 Q84 14 92 10" />
      </g>
      <circle className="zumi-tip" cx="27" cy="9" r="6" fill="#F5C76A" />
      <circle className="zumi-tip zumi-tip-2" cx="93" cy="9" r="6" fill="#ff7ab6" />
      {/* Chap qo'l */}
      <path d="M22 70 Q8 74 10 86" stroke="#2bb894" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* O'ng qo'l (silkitadi) */}
      <g className={wave ? "zumi-wave" : ""} style={{ transformOrigin: "98px 66px" }}>
        <path d="M98 66 Q112 56 110 42" stroke="#2bb894" strokeWidth="9" strokeLinecap="round" fill="none" />
        <circle cx="110" cy="40" r="6.5" fill="#8ff7d4" />
      </g>
      {/* Tana */}
      <path d="M60 24 C92 24 104 50 102 76 C100 102 84 114 60 114 C36 114 20 102 18 76 C16 50 28 24 60 24 Z" fill="url(#zb)" />
      {/* Qorindagi yulduz */}
      <path d="M60 88 l3 6 6.5 1 -4.7 4.6 1.1 6.5 -5.9-3.1 -5.9 3.1 1.1-6.5 -4.7-4.6 6.5-1 z" fill="#F5C76A" opacity=".95" />
      {/* Yonoqlar */}
      <ellipse cx="34" cy="74" rx="6" ry="3.5" fill="#ff7ab6" opacity=".55" />
      <ellipse cx="86" cy="74" rx="6" ry="3.5" fill="#ff7ab6" opacity=".55" />
      {/* Ko'z */}
      <g className="zumi-eye" style={{ transformOrigin: "60px 56px" }}>
        <circle cx="60" cy="56" r="19" fill="url(#ze)" />
        <g className="zumi-pupil">
          <circle cx="62" cy="57" r="9.5" fill="#1a1036" />
          <circle cx="65.5" cy="53" r="3.4" fill="#fff" />
          <circle cx="58.5" cy="61" r="1.6" fill="#fff" opacity=".8" />
        </g>
      </g>
      {/* Tabassum */}
      <path d="M48 82 Q60 92 72 82" stroke="#1a1036" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
