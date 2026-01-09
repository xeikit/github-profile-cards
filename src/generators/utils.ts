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
      <stop offset="0%" style="stop-color:${isDark ? '#0d1117' : '#ffffff'};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${isDark ? '#0d1117' : '#ffffff'};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <style>
    * { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif;
    }
    .card-bg { fill: url(#cardGradient); }
    .text { fill: ${isDark ? '#e6edf3' : '#24292f'}; }
    .text-secondary { fill: ${isDark ? '#7d8590' : '#57606a'}; }
    .text-bold { font-weight: 700; }
    .text-semibold { font-weight: 600; }
    .text-xs { 
      font-size: 11px; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      font-weight: 600;
    }
    .text-sm { font-size: 13px; }
    .text-base { font-size: 15px; }
    .text-lg { font-size: 18px; }
    .text-xl { font-size: 20px; }
    .text-2xl { font-size: 26px; }
    .text-3xl { font-size: 42px; }
    .accent { fill: #3b82f6; }
    .divider { 
      stroke: ${isDark ? '#21262d' : '#d0d7de'}; 
      stroke-width: 1.5; 
      opacity: 0.4; 
    }
  </style>
  
  <rect class="card-bg" width="100%" height="100%" rx="20"/>
  
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
