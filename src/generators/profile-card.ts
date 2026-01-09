import type { ProfileCardData } from '../types.js';
import { createModernSVG, formatNumber, generateAreaPath, icons } from './utils.js';

export const generateProfileCard = (data: ProfileCardData, theme: 'light' | 'dark' = 'light'): string => {
  const width = 840;
  const height = 500;

  const content = `
    <!-- ヘッダーセクション -->
    ${generateHeader(data, theme)}
    
    <!-- 区切り線 -->
    <line x1="30" y1="140" x2="${width - 30}" y2="140" class="divider"/>
    
    <!-- トレンドグラフセクション -->
    ${generateTrendGraph(data, theme)}
    
    <!-- 区切り線 -->
    <line x1="30" y1="340" x2="${width - 30}" y2="340" class="divider"/>
    
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
          <circle cx="70" cy="70" r="35"/>
        </clipPath>
      </defs>
      <circle cx="70" cy="70" r="37" fill="${isDark ? '#27272a' : '#e4e4e7'}"/>
      <image href="${data.avatarUrl}" x="35" y="35" width="70" height="70" clip-path="url(#avatarClip)"/>
      
      <!-- ユーザー情報 -->
      <text x="125" y="60" class="text text-xl text-bold">${data.name ?? data.username}</text>
      <text x="125" y="82" class="text-secondary text-sm">@${data.username}</text>
      ${data.bio ? `<text x="125" y="102" class="text-secondary text-xs">${truncate(data.bio, 60)}</text>` : ''}
      
      <!-- 統計サマリー（右側） -->
      <g transform="translate(550, 45)">
        ${icons.star(0, 0)}
        <text x="25" y="12" class="text text-base text-semibold">${formatNumber(data.totalStars)} Stars</text>
      </g>
      
      <g transform="translate(550, 75)">
        ${icons.repo(0, 0)}
        <text x="25" y="12" class="text text-base text-semibold">${data.publicRepos} Repos</text>
      </g>
      
      <g transform="translate(680, 45)">
        ${icons.calendar(0, 0)}
        <text x="25" y="12" class="text text-base text-semibold">${data.accountAge} years</text>
      </g>
      
      <g transform="translate(680, 75)">
        ${icons.code(0, 0)}
        <text x="25" y="12" class="text text-base text-semibold">${data.contributedTo} projects</text>
      </g>
    </g>
  `;
};

const generateTrendGraph = (data: ProfileCardData, theme: 'light' | 'dark'): string => {
  const graphWidth = 780;
  const graphHeight = 140;
  const graphX = 30;
  const graphY = 160;

  const commits = data.monthlyCommits.map(m => m.count);
  const maxCommits = Math.max(...commits, 1);

  const areaPath = generateAreaPath(commits, graphWidth, graphHeight);

  // 月ラベル（3ヶ月ごと）
  const monthLabels = data.monthlyCommits
    .map((m, i) => {
      if (i % 3 !== 0) return '';
      const date = new Date(m.month + '-01');
      const label = date.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      const x = graphX + 20 + (i / (commits.length - 1)) * (graphWidth - 40);
      return `<text x="${x}" y="${
        graphY + graphHeight + 20
      }" class="text-secondary text-xs" text-anchor="middle">${label}</text>`;
    })
    .join('');

  return `
    <g id="trend-graph">
      <text x="30" y="155" class="text text-lg text-bold">📊 Contribution Trend</text>
      <text x="30" y="175" class="text-secondary text-sm">Last 12 months activity</text>
      
      <!-- グラフエリア -->
      <g transform="translate(${graphX}, ${graphY})">
        <!-- エリアチャート -->
        <path d="${areaPath}" fill="url(#graphGradient)"/>
        
        <!-- 上部の線 -->
        <path d="${generateAreaPath(commits, graphWidth, graphHeight)
          .split('L')
          .slice(0, commits.length)
          .join('L')}" class="accent-stroke"/>
        
        <!-- データポイント -->
        ${commits
          .map((count, i) => {
            const x = 20 + (i / (commits.length - 1)) * (graphWidth - 40);
            const y = graphHeight - 20 - (count / maxCommits) * (graphHeight - 40);
            return `<circle cx="${x}" cy="${y}" r="3" class="accent"/>`;
          })
          .join('')}
      </g>
      
      <!-- X軸ラベル -->
      ${monthLabels}
      
      <!-- 統計サマリー -->
      <g transform="translate(30, 320)">
        <text x="0" y="0" class="text text-base text-semibold">
          ${formatNumber(data.totalCommits)} commits
        </text>
        <text x="150" y="0" class="text-secondary text-base">|</text>
        <text x="170" y="0" class="text text-base text-semibold">
          ${formatNumber(data.totalPRs)} PRs
        </text>
        <text x="280" y="0" class="text-secondary text-base">|</text>
        <text x="300" y="0" class="text text-base text-semibold">
          ${formatNumber(data.totalIssues)} Issues
        </text>
      </g>
    </g>
  `;
};

const generateTechStack = (data: ProfileCardData, theme: 'light' | 'dark'): string => {
  const barWidth = 780;
  const barHeight = 24;
  const startY = 380;

  const languageBars = data.topLanguages
    .map((lang, index) => {
      const y = startY + index * 40;
      const width = (lang.percentage / 100) * barWidth;

      return `
      <g>
        <!-- 背景バー -->
        <rect x="30" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${
        theme === 'dark' ? '#27272a' : '#f4f4f5'
      }"/>
        
        <!-- 言語バー -->
        <rect x="30" y="${y}" width="${width}" height="${barHeight}" rx="4" fill="${lang.color}" opacity="0.8">
          <animate attributeName="width" from="0" to="${width}" dur="1s" fill="freeze"/>
        </rect>
        
        <!-- 言語名 -->
        <text x="40" y="${y + 16}" class="text text-sm text-semibold">${lang.name}</text>
        
        <!-- パーセンテージ -->
        <text x="${barWidth + 20}" y="${y + 16}" class="text-secondary text-sm">${lang.percentage.toFixed(1)}%</text>
      </g>
    `;
    })
    .join('');

  return `
    <g id="tech-stack">
      <text x="30" y="365" class="text text-lg text-bold">🎨 Tech Stack</text>
      ${languageBars}
    </g>
  `;
};

const truncate = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
