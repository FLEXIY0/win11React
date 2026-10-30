import React from "react";

// Картинка для пазла: ночная дорога через лес, фонарик, двое,
// НЛО (или спутник) в небе и указатель на деревню Рай.
// viewBox задаёт видимую часть — так каждый фрагмент пазла рисует
// свой кусок той же картинки
const trees = (side) => {
  const out = [];
  for (let i = 0; i < 9; i++) {
    const base = 178 + i * 15;
    const h = 30 + i * 9;
    const w = 14 + i * 4;
    const x = side < 0 ? 12 + ((i * 37) % 95) : 300 - 12 - ((i * 37) % 95);
    const shade = i < 3 ? "#123326" : i < 6 ? "#0e2a1f" : "#0a2018";
    out.push(
      <g key={side + "-" + i} fill={shade}>
        <polygon
          points={`${x},${base - h} ${x - w},${base} ${x + w},${base}`}
        />
        <polygon
          points={`${x},${base - h * 0.75} ${x - w * 1.15},${base + 8} ${
            x + w * 1.15
          },${base + 8}`}
        />
        <rect x={x - 2} y={base + 6} width="4" height="8" fill="#0a1510" />
      </g>,
    );
  }
  return out;
};

const STARS = [
  [20, 18],
  [48, 40],
  [75, 12],
  [102, 30],
  [130, 15],
  [158, 42],
  [180, 22],
  [262, 18],
  [285, 46],
  [245, 98],
  [12, 70],
  [60, 88],
  [118, 66],
  [280, 120],
  [30, 130],
  [92, 108],
  [172, 92],
];

export const PuzzlePicture = ({ viewBox = "0 0 300 300", ...props }) => (
  <svg viewBox={viewBox} preserveAspectRatio="none" {...props}>
    <defs>
      <linearGradient id="pzSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#060d24" />
        <stop offset="0.6" stopColor="#1a2d5c" />
        <stop offset="1" stopColor="#2b3f6e" />
      </linearGradient>
      <linearGradient id="pzBeam" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.75" />
        <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="pzUfoBeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9ff5d4" stopOpacity="0.45" />
        <stop offset="1" stopColor="#9ff5d4" stopOpacity="0" />
      </linearGradient>
    </defs>

    <rect width="300" height="300" fill="url(#pzSky)" />
    {STARS.map(([x, y], i) => (
      <circle
        key={i}
        cx={x}
        cy={y}
        r={i % 3 ? 0.9 : 1.4}
        fill="#fff"
        opacity={i % 2 ? 0.6 : 0.9}
      />
    ))}

    {/* НЛО */}
    <polygon points="206,66 226,66 246,140 186,140" fill="url(#pzUfoBeam)" />
    <ellipse cx="216" cy="56" rx="11" ry="9" fill="#9ff5d4" opacity="0.85" />
    <ellipse cx="216" cy="63" rx="27" ry="7" fill="#aab8cc" />
    <ellipse cx="216" cy="61" rx="27" ry="3" fill="#cfd8e6" />
    {[198, 207, 216, 225, 234].map((x) => (
      <circle key={x} cx={x} cy="65" r="1.6" fill="#ffe27a" />
    ))}

    {/* деревня на горизонте */}
    <rect x="0" y="172" width="300" height="128" fill="#08130e" />
    <g fill="#0c1a14">
      <rect x="132" y="162" width="10" height="10" />
      <polygon points="131,163 137,157 143,163" />
      <rect x="146" y="164" width="8" height="8" />
      <polygon points="145,165 150,160 155,165" />
      <rect x="158" y="161" width="11" height="11" />
      <polygon points="157,162 163.5,156 170,162" />
    </g>
    <g fill="#ffcf6b">
      <rect x="135" y="165" width="2.5" height="2.5" />
      <rect x="149" y="167" width="2" height="2" />
      <rect x="161" y="164" width="2.5" height="2.5" />
      <rect x="165" y="167" width="2" height="2" />
    </g>

    {/* дорога */}
    <polygon points="143,172 157,172 236,300 64,300" fill="#262b35" />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect
        key={i}
        x={149.4 - i * 0.6}
        y={180 + i * 24}
        width={1.2 + i * 1.2}
        height={6 + i * 3}
        fill="#4a5161"
      />
    ))}

    {trees(-1)}
    {trees(1)}

    {/* свет фонарика */}
    <polygon points="146,246 156,246 182,176 118,176" fill="url(#pzBeam)" />

    {/* указатель */}
    <rect x="206" y="214" width="3" height="40" fill="#5b4632" />
    <polygon points="196,206 236,206 244,214 236,222 196,222" fill="#7a5c3e" />
    <text
      x="216"
      y="218.5"
      fontSize="11"
      fontWeight="600"
      fill="#fff6e0"
      textAnchor="middle"
      fontFamily="Segoe UI, sans-serif"
    >
      Рай
    </text>

    {/* двое, держатся за руки */}
    <g>
      <circle cx="140" cy="244" r="6" fill="#1b1e26" />
      <path d="M131 276 Q131 252 140 252 Q149 252 149 276 Z" fill="#1b1e26" />
      <circle cx="161" cy="246" r="5.5" fill="#22252e" />
      <path d="M153 276 Q153 254 161 254 Q169 254 169 276 Z" fill="#22252e" />
      <path
        d="M147 262 Q150.5 266 154 262"
        stroke="#1b1e26"
        strokeWidth="2.5"
        fill="none"
      />
      <path d="M161 241 Q166 236 168 242" stroke="#2b2f3a" fill="none" />
      <circle cx="149" cy="252" r="1.6" fill="#fff3c4" />
    </g>
  </svg>
);
