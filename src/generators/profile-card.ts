import type { ProfileCardData } from '../types.js';
import { createModernSVG, formatNumber, generateAreaPath, icons } from './utils.js';

export const generateProfileCard = (data: ProfileCardData, theme: 'light' | 'dark' = 'light'): string => {
  const width = 900;
  const height = 580; // 高さも少し増やす

  const content = `
    <!-- ヘッダーセクション -->
    ${generateHeader(data, theme)}
    
    <!-- 区切り線 -->
    <line x1="40" y1="160" x2="${width - 40}" y2="160" class="divider"/>
    
    <!-- トレンドグラフセクション -->
    ${generateTrendGraph(data, theme)}
    
    <!-- 区切り線 -->
    <line x1="40" y1="415" x2="${width - 40}" y2="415" class="divider"/>
    
    <!-- 技術スタックセクション -->
    ${generateTechStack(data, theme)}
  `;

  return createModernSVG(width, height, content, theme);
};

const generateHeader = (data: ProfileCardData, theme: 'light' | 'dark'): string => {
  const isDark = theme === 'dark';

  return `
    <g id="header">
      <!-- アバター -->
      <defs>
        <clipPath id="avatarClip">
          <circle cx="80" cy="80" r="35"/>
        </clipPath>
      </defs>
      <circle cx="80" cy="80" r="38" fill="${isDark ? '#27272a' : '#e4e4e7'}"/>
      <image href="${data.avatarUrl}" x="45" y="45" width="70" height="70" clip-path="url(#avatarClip)"/>
      
      <!-- ユーザー情報 -->
      <text x="140" y="70" class="text text-xl text-bold">${data.name ?? data.username}</text>
      <text x="140" y="95" class="text-secondary text-sm">@${data.username}</text>
      ${data.bio ? `<text x="140" y="115" class="text-secondary text-xs">${truncate(data.bio, 70)}</text>` : ''}
      
      <!-- 統計サマリー（右側・2行配置） -->
      <!-- 1行目 -->
      <g transform="translate(580, 55)">
        ${icons.star(0, 0)}
        <text x="25" y="12" class="text text-base text-semibold">${formatNumber(data.totalStars)} Stars</text>
      </g>
      
      <g transform="translate(720, 55)">
        ${icons.repo(0, 0)}
        <text x="25" y="12" class="text text-base text-semibold">${data.publicRepos} Repos</text>
      </g>
      
      <!-- 2行目 -->
      <g transform="translate(580, 95)">
        ${icons.calendar(0, 0)}
        <text x="25" y="12" class="text text-base text-semibold">${data.accountAge} years on GitHub</text>
      </g>
      
      <g transform="translate(580, 125)">
        ${icons.code(0, 0)}
        <text x="25" y="12" class="text text-secondary text-sm">${data.contributedTo} contributed projects</text>
      </g>
    </g>
  `;
};

const generateTrendGraph = (data: ProfileCardData, theme: 'light' | 'dark'): string => {
  const graphWidth = 820;
  const graphHeight = 140;
  const graphX = 40;
  const graphY = 200;

  const commits = data.monthlyCommits.map(m => m.count);
  const { area, line } = generateAreaPath(commits, graphWidth, graphHeight, 20);

  // データポイント（transform内の相対座標で計算）
  const maxValue = Math.max(...commits, 1);
  const stepX = (graphWidth - 40) / Math.max(commits.length - 1, 1);
  const scaleY = (graphHeight - 40) / maxValue;

  const dataPoints = commits
    .map((count, i) => {
      const x = 20 + i * stepX;
      const y = graphHeight - 20 - count * scaleY;
      return `<circle cx="${x}" cy="${y}" r="3" class="accent"/>`;
    })
    .join('');

  // 月ラベル（2ヶ月ごと）
  const monthLabels = data.monthlyCommits
    .map((m, i) => {
      if (i % 2 !== 0) return ''; // 2ヶ月ごと
      const date = new Date(m.month + '-01');
      const label = date.toLocaleDateString('en', { month: 'short' });
      const x = graphX + 20 + (i / Math.max(commits.length - 1, 1)) * (graphWidth - 40);
      return `<text x="${x}" y="${
        graphY + graphHeight + 28
      }" class="text-secondary text-xs" text-anchor="middle">${label}</text>`;
    })
    .join('');

  return `
    <g id="trend-graph">
      <text x="40" y="182" class="text text-lg text-bold">📊 Contribution Trend</text>
      <text x="40" y="202" class="text-secondary text-sm">Last 12 months activity</text>
      
      <!-- グラフエリア -->
      <g transform="translate(${graphX},${graphY})">
        <!-- エリアチャート -->
        <path d="${area}" fill="url(#graphGradient)"/>
        
        <!-- 上部の線 -->
        <path d="${line}" class="accent-stroke"/>
        
        <!-- データポイント -->
        ${dataPoints}
      </g>
      
      <!-- X軸ラベル -->
      ${monthLabels}
      
      <!-- 統計サマリー -->
      <g transform="translate(40, 385)">
        <text x="0" y="0" class="text text-base text-semibold">
          ${formatNumber(data.totalCommits)} commits
        </text>
        <text x="180" y="0" class="text-secondary text-base">•</text>
        <text x="200" y="0" class="text text-base text-semibold">
          ${formatNumber(data.totalPRs)} PRs
        </text>
        <text x="340" y="0" class="text-secondary text-base">•</text>
        <text x="360" y="0" class="text text-base text-semibold">
          ${formatNumber(data.totalIssues)} Issues
        </text>
      </g>
    </g>
  `;
};

const generateTechStack = (data: ProfileCardData, theme: 'light' | 'dark'): string => {
  const barWidth = 820;
  const barHeight = 28;
  const startY = 455; // 410 → 455 (45px下に移動)

  const languageBars = data.topLanguages
    .map((lang, index) => {
      const y = startY + index * 45;
      const width = (lang.percentage / 100) * barWidth;

      return `
      <g>
        <!-- 背景バー -->
        <rect x="40" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${
        theme === 'dark' ? '#27272a' : '#f4f4f5'
      }"/>
        
        <!-- 言語バー -->
        <rect x="40" y="${y}" width="${width}" height="${barHeight}" rx="6" fill="${lang.color}" opacity="0.85">
          <animate attributeName="width" from="0" to="${width}" dur="1s" fill="freeze"/>
        </rect>
        
        <!-- 言語名 -->
        <text x="52" y="${y + 18}" class="text text-sm text-semibold">${lang.name}</text>
        
        <!-- パーセンテージ -->
        <text x="${barWidth + 30}" y="${
        y + 18
      }" class="text-secondary text-sm" text-anchor="end">${lang.percentage.toFixed(1)}%</text>
      </g>
    `;
    })
    .join('');

  return `
    <g id="tech-stack">
      <text x="40" y="437" class="text text-lg text-bold">🎨 Tech Stack</text>
      ${languageBars}
    </g>
  `;
};

const truncate = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
