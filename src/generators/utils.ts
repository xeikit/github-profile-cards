export interface SVGOptions {
  width: number;
  height: number;
  theme?: 'light' | 'dark';
}

export const createModernSVG = (
  width: number,
  height: number,
  content: string,
  theme: 'light' | 'dark' = 'light'
): string => {
  const isDark = theme === 'dark';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${isDark ? '#1a1a2e' : '#fafafa'};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${isDark ? '#16213e' : '#ffffff'};stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.4" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.05" />
    </linearGradient>
    
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="8" flood-opacity="0.15"/>
    </filter>
    
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    * { font-family: 'Inter', 'Segoe UI', Ubuntu, sans-serif; }
    .card-bg { fill: url(#cardGradient); filter: url(#shadow); }
    .text { fill: ${isDark ? '#e4e4e7' : '#18181b'}; }
    .text-secondary { fill: ${isDark ? '#a1a1aa' : '#71717a'}; }
    .text-bold { font-weight: 700; }
    .text-semibold { font-weight: 600; }
    .text-xs { font-size: 11px; }
    .text-sm { font-size: 13px; }
    .text-base { font-size: 15px; }
    .text-lg { font-size: 18px; }
    .text-xl { font-size: 22px; }
    .accent { fill: #3b82f6; }
    .accent-stroke { stroke: #3b82f6; stroke-width: 2; fill: none; }
    .divider { stroke: ${isDark ? '#27272a' : '#e4e4e7'}; stroke-width: 1; }
  </style>
  
  <rect class="card-bg" width="100%" height="100%" rx="12"/>
  
  ${content}
</svg>`;
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

// エリアチャート用のSVGパス生成
export const generateAreaPath = (data: number[], width: number, height: number, padding = 20): string => {
  if (data.length === 0) return '';

  const maxValue = Math.max(...data, 1);
  const stepX = (width - padding * 2) / (data.length - 1);
  const scaleY = (height - padding * 2) / maxValue;

  // 上部の線
  const topPath = data
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - value * scaleY;
      return index === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    })
    .join(' ');

  // 閉じるパス（右下 → 左下）
  const closePathX = padding + (data.length - 1) * stepX;
  const closePath = `L ${closePathX},${height - padding} L ${padding},${height - padding} Z`;

  return topPath + closePath;
};

// アイコンSVG
export const icons = {
  star: (x: number, y: number, size = 16) => `
    <g transform="translate(${x},${y})">
      <path d="M ${size / 2} 0 L ${size * 0.61} ${size * 0.35} L ${size} ${size * 0.38} L ${size * 0.68} ${
    size * 0.62
  } L ${size * 0.78} ${size} L ${size / 2} ${size * 0.76} L ${size * 0.22} ${size} L ${size * 0.32} ${
    size * 0.62
  } L 0 ${size * 0.38} L ${size * 0.39} ${size * 0.35} Z" class="accent"/>
    </g>
  `,
  repo: (x: number, y: number, size = 16) => `
    <g transform="translate(${x},${y})">
      <rect x="0" y="0" width="${size}" height="${size}" rx="2" class="accent"/>
      <rect x="${size * 0.25}" y="${size * 0.25}" width="${size * 0.5}" height="${size * 0.5}" rx="1" fill="white"/>
    </g>
  `,
  calendar: (x: number, y: number, size = 16) => `
    <g transform="translate(${x},${y})">
      <rect x="0" y="${size * 0.2}" width="${size}" height="${size * 0.8}" rx="2" class="accent"/>
      <line x1="${size * 0.3}" y1="0" x2="${size * 0.3}" y2="${
    size * 0.3
  }" stroke="currentColor" stroke-width="2" class="accent-stroke"/>
      <line x1="${size * 0.7}" y1="0" x2="${size * 0.7}" y2="${
    size * 0.3
  }" stroke="currentColor" stroke-width="2" class="accent-stroke"/>
    </g>
  `,
  code: (x: number, y: number, size = 16) => `
    <g transform="translate(${x},${y})">
      <path d="M ${size * 0.3} ${size * 0.2} L 0 ${size / 2} L ${size * 0.3} ${
    size * 0.8
  }" stroke-width="2" class="accent-stroke"/>
      <path d="M ${size * 0.7} ${size * 0.2} L ${size} ${size / 2} L ${size * 0.7} ${
    size * 0.8
  }" stroke-width="2" class="accent-stroke"/>
    </g>
  `,
};
