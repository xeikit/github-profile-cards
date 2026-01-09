import type { ProfileCardData } from '../types.js';
import { createModernSVG, formatNumber } from './utils.js';

export const generateProfileCard = (data: ProfileCardData, theme: 'light' | 'dark' = 'light'): string => {
  const width = 900;
  const height = 600; // 520 → 600 (余白のため)

  const content = `
    <!-- ヘッダーセクション -->
    ${generateHeader(data, theme)}
    
    <!-- 統計カードセクション -->
    ${generateStatsCards(data, theme)}
    
    <!-- 区切り線 -->
    <line x1="80" y1="340" x2="${width - 80}" y2="340" class="divider"/>
    
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
          <circle cx="100" cy="100" r="50"/>
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="52" fill="${isDark ? '#21262d' : '#e1e4e8'}"/>
      <image href="${data.avatarUrl}" x="50" y="50" width="100" height="100" clip-path="url(#avatarClip)"/>
      
      <!-- ユーザー情報 -->
      <text x="180" y="90" class="text text-2xl text-bold">${data.name ?? data.username}</text>
      <text x="180" y="120" class="text-secondary text-base">@${data.username}</text>
      ${
        data.bio
          ? `<text x="180" y="150" class="text-secondary text-sm" style="font-style: italic;">${truncate(
              data.bio,
              65
            )}</text>`
          : ''
      }
    </g>
  `;
};

const generateStatsCards = (data: ProfileCardData, theme: 'light' | 'dark'): string => {
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#161b22' : '#f6f8fa';

  return `
    <g id="stats-cards">
      <!-- Total Contributions Card -->
      <g transform="translate(80, 200)">
        <rect width="260" height="100" rx="12" fill="${cardBg}"/>
        <text x="25" y="35" class="text-secondary text-xs">TOTAL CONTRIBUTIONS</text>
        <text x="25" y="70" class="text text-3xl text-bold accent">${formatNumber(data.totalContributions)}</text>
        <text x="25" y="90" class="text-secondary text-sm">in the last year</text>
      </g>
      
      <!-- Repos Card -->
      <g transform="translate(360, 200)">
        <rect width="125" height="100" rx="12" fill="${cardBg}"/>
        <text x="25" y="35" class="text-secondary text-xs">REPOS</text>
        <text x="25" y="70" class="text text-2xl text-bold">${data.publicRepos}</text>
      </g>
      
      <!-- Stars Card -->
      <g transform="translate(505, 200)">
        <rect width="125" height="100" rx="12" fill="${cardBg}"/>
        <text x="25" y="35" class="text-secondary text-xs">STARS</text>
        <text x="25" y="70" class="text text-2xl text-bold">${formatNumber(data.totalStars)}</text>
      </g>
      
      <!-- Current Streak Card -->
      <g transform="translate(650, 200)">
        <rect width="80" height="100" rx="12" fill="${cardBg}"/>
        <text x="20" y="35" class="text-secondary text-xs">STREAK</text>
        <text x="20" y="65" class="text text-xl text-bold">🔥</text>
        <text x="20" y="90" class="text text-base text-semibold">${data.currentStreak}w</text>
      </g>
      
      <!-- Longest Streak Card -->
      <g transform="translate(750, 200)">
        <rect width="70" height="100" rx="12" fill="${cardBg}"/>
        <text x="15" y="35" class="text-secondary text-xs">BEST</text>
        <text x="15" y="65" class="text text-xl text-bold">🏆</text>
        <text x="15" y="90" class="text text-base text-semibold">${data.longestStreak}w</text>
      </g>
    </g>
  `;
};

const generateTechStack = (data: ProfileCardData, theme: 'light' | 'dark'): string => {
  const barWidth = 740;
  const barHeight = 24; // 28 → 24 (さらに薄く)
  const startY = 420; // 380 → 420 (タイトルから大きく離す)

  const languageBars = data.topLanguages
    .map((lang, index) => {
      const y = startY + index * 65; // 50 → 65 (バー間を広く)
      const width = (lang.percentage / 100) * barWidth;

      return `
      <g>
        <!-- 言語名とパーセンテージ -->
        <text x="80" y="${y - 15}" class="text text-base text-semibold">${lang.name}</text>
        <text x="820" y="${y - 15}" class="text-secondary text-sm" text-anchor="end">${lang.percentage.toFixed(
        1
      )}%</text>
        
        <!-- 背景バー -->
        <rect x="80" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${
        theme === 'dark' ? '#21262d' : '#f6f8fa'
      }"/>
        
        <!-- 言語バー -->
        <rect x="80" y="${y}" width="${width}" height="${barHeight}" rx="6" fill="${lang.color}" opacity="0.95">
          <animate attributeName="width" from="0" to="${width}" dur="1.5s" fill="freeze"/>
        </rect>
      </g>
    `;
    })
    .join('');

  return `
    <g id="tech-stack">
      <text x="80" y="385" class="text text-lg text-bold">Most Used Languages</text>
      ${languageBars}
    </g>
  `;
};

const truncate = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
