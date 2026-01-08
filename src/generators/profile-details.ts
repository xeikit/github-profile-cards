import type { GitHubUserStats } from '../types.js';
import { createSVG } from './utils.js';

export const generateProfileDetailsSVG = (stats: GitHubUserStats, theme: 'light' | 'dark' = 'light'): string => {
  const width = 840;
  const height = 195;

  // 直近365日のコントリビューションを取得
  const recentContributions = stats.contributions.slice(-365);

  // 週ごとにグループ化（7日ずつ）
  const weeks: (typeof recentContributions)[] = [];
  for (let i = 0; i < recentContributions.length; i += 7) {
    weeks.push(recentContributions.slice(i, i + 7));
  }

  const cellSize = 10;
  const cellGap = 3;
  const startX = 25;
  const startY = 60;

  const maxContributions = Math.max(...recentContributions.map(c => c.count));

  const getColor = (count: number): string => {
    if (count === 0) return theme === 'dark' ? '#161b22' : '#ebedf0';
    const intensity = Math.min(count / maxContributions, 1);

    if (theme === 'dark') {
      if (intensity > 0.75) return '#39d353';
      if (intensity > 0.5) return '#26a641';
      if (intensity > 0.25) return '#006d32';
      return '#0e4429';
    } else {
      if (intensity > 0.75) return '#216e39';
      if (intensity > 0.5) return '#30a14e';
      if (intensity > 0.25) return '#40c463';
      return '#9be9a8';
    }
  };

  const contributionCells = weeks
    .flatMap((week, weekIndex) =>
      week.map((day, dayIndex) => {
        const x = startX + weekIndex * (cellSize + cellGap);
        const y = startY + dayIndex * (cellSize + cellGap);
        const color = getColor(day.count);

        return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" rx="2"/>`;
      })
    )
    .join('');

  const totalContributions = recentContributions.reduce((sum, c) => sum + c.count, 0);

  const content = `
    <text x="25" y="35" class="text text-title text-bold">${stats.username}'s Contribution Graph</text>
    
    ${contributionCells}
    
    <text x="25" y="${startY + 100}" class="text text-small">
      ${totalContributions} contributions in the last year
    </text>
  `;

  return createSVG(width, height, content, theme);
};
