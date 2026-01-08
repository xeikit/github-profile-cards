import type { GitHubUserStats } from '../types.js';
import { createSVG, formatNumber } from './utils.js';

export const generateStatsSVG = (stats: GitHubUserStats, theme: 'light' | 'dark' = 'light'): string => {
  const width = 495;
  const height = 195;

  const statItems = [
    { label: 'Total Stars Earned', value: formatNumber(stats.totalStars) },
    { label: 'Total Commits', value: formatNumber(stats.totalCommits) },
    { label: 'Total PRs', value: formatNumber(stats.totalPRs) },
    { label: 'Total Issues', value: formatNumber(stats.totalIssues) },
    { label: 'Contributed to', value: formatNumber(stats.contributedTo) },
  ];

  const content = `
    <text x="25" y="35" class="text text-title text-bold">Stats</text>
    
    ${statItems
      .map((item, index) => {
        const y = 70 + index * 25;
        return `
        <text x="25" y="${y}" class="text text-small">${item.label}:</text>
        <text x="470" y="${y}" class="text text-medium text-bold" text-anchor="end">${item.value}</text>
      `;
      })
      .join('')}
  `;

  return createSVG(width, height, content, theme);
};
