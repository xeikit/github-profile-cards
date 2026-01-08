export interface SVGOptions {
  width: number;
  height: number;
  theme?: 'light' | 'dark';
}

export const createSVG = (
  width: number,
  height: number,
  content: string,
  theme: 'light' | 'dark' = 'light'
): string => {
  const backgroundColor = theme === 'dark' ? '#0d1117' : '#ffffff';
  const textColor = theme === 'dark' ? '#c9d1d9' : '#24292f';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .background { fill: ${backgroundColor}; }
    .text { fill: ${textColor}; font-family: 'Segoe UI', Ubuntu, sans-serif; }
    .text-bold { font-weight: 600; }
    .text-small { font-size: 12px; }
    .text-medium { font-size: 14px; }
    .text-large { font-size: 16px; }
    .text-title { font-size: 18px; }
  </style>
  
  <rect class="background" width="100%" height="100%" rx="4.5"/>
  
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

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
