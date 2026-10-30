import React from "react";

// Картинка для пазла: ночная дорога через лес, фонарик, двое у
// развилки. Налево указатель на деревню Рай, до которой мы так и не
// дошли, направо — темнота; в небе НЛО (или спутник).
// viewBox задаёт видимую часть — так каждый фрагмент пазла рисует
// свой кусок той же картинки
const Tree = ({ x, base, h, shade }) => {
  const w = h * 0.42;
  return (
    <g fill={shade}>
      <polygon points={`${x},${base - h} ${x - w},${base} ${x + w},${base}`} />
      <polygon
        points={`${x},${base - h * 0.75} ${x - w * 1.15},${base + h * 0.2} ${
          x + w * 1.15
        },${base + h * 0.2}`}
      />
      <rect
        x={x - h * 0.05}
        y={base + h * 0.15}
        width={h * 0.1}
        height={h * 0.15}
        fill="#0a1510"
      />
    </g>
  );
};

// [x, основание, высота]: дальние у горизонта, лес между ветками
// развилки и ближние по краям дороги
const FAR = [
  [8, 176, 22],
  [22, 178, 28],
  [80, 180, 20],
  [262, 177, 24],
  [280, 179, 30],
  [296, 176, 22],
];
const MIDDLE = [
  [98, 192, 22],
  [118, 196, 18],
  [182, 196, 18],
  [204, 192, 24],
  [226, 186, 20],
];
const NEAR = [
  [16, 236, 70],
  [46, 262, 78],
  [8, 296, 96],
  [286, 238, 72],
  [258, 266, 80],
  [296, 298, 96],
];

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

    <rect x="0" y="172" width="300" height="128" fill="#08130e" />
    {FAR.map(([x, base, h]) => (
      <Tree key={x} x={x} base={base} h={h} shade="#123326" />
    ))}

    {/* деревня Рай вдали, в конце левой дороги */}
    <g fill="#0c1a14">
      <rect x="36" y="164" width="9" height="9" />
      <polygon points="35,165 40.5,159 46,165" />
      <rect x="48" y="166" width="8" height="7" />
      <polygon points="47,167 52,162 57,167" />
      <rect x="59" y="163" width="10" height="10" />
      <polygon points="58,164 64,158 70,164" />
    </g>
    <g fill="#ffcf6b">
      <rect x="39" y="167" width="2.5" height="2.5" />
      <rect x="51" y="168.5" width="2" height="2" />
      <rect x="62" y="166" width="2.5" height="2.5" />
      <rect x="65.5" y="169" width="2" height="2" />
    </g>

    {/* дорога и развилка: налево — к Раю, направо — в темноту */}
    <g fill="#262b35">
      <polygon points="128,214 172,214 236,300 64,300" />
      <polygon points="128,216 150,216 74,174 66,174" />
      <polygon points="150,216 172,216 244,174 236,174" />
    </g>
    {[0, 1, 2].map((i) => (
      <rect
        key={i}
        x={149.2 - i * 0.8}
        y={226 + i * 26}
        width={1.6 + i * 1.6}
        height={8 + i * 4}
        fill="#4a5161"
      />
    ))}

    {MIDDLE.map(([x, base, h]) => (
      <Tree key={x} x={x} base={base} h={h} shade="#0e2a1f" />
    ))}

    {/* свет фонарика на развилку */}
    <polygon points="146,246 156,246 186,194 114,194" fill="url(#pzBeam)" />

    {/* указатель «Рай» стрелкой налево */}
    <rect x="149" y="190" width="3" height="26" fill="#5b4632" />
    <polygon points="122,190 130,182 166,182 166,198 130,198" fill="#7a5c3e" />
    <text
      x="146"
      y="194"
      fontSize="11"
      fontWeight="600"
      fill="#fff6e0"
      textAnchor="middle"
      fontFamily="Segoe UI, sans-serif"
    >
      Рай
    </text>

    {NEAR.map(([x, base, h]) => (
      <Tree key={x} x={x} base={base} h={h} shade="#0a2018" />
    ))}

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
