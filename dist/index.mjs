import * as core from '@actions/core';
import * as github from '@actions/github';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { graphql } from '@octokit/graphql';

const createGitHubAPI = (token) => {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`
    }
  });
  return {
    fetchUserStats: async (username) => {
      const query = `
        query($username: String!) {
          user(login: $username) {
            name
            login
            avatarUrl
            bio
            createdAt
            contributionsCollection {
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
            repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
              totalCount
              nodes {
                stargazers {
                  totalCount
                }
                languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                  edges {
                    size
                    node {
                      name
                      color
                    }
                  }
                }
              }
            }
            repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
              totalCount
            }
          }
        }
      `;
      const data = await graphqlWithAuth(query, { username });
      return transformData(data);
    }
  };
};
const transformData = (data) => {
  const user = data.user;
  const contributions = user.contributionsCollection;
  const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1e3 * 60 * 60 * 24 * 365));
  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazers.totalCount, 0);
  const totalContributions = contributions.contributionCalendar.totalContributions;
  const monthlyCommits = calculateMonthlyCommits(contributions.contributionCalendar.weeks);
  const streaks = calculateWeeklyStreaks(contributions.contributionCalendar.weeks);
  const languageStats = calculateLanguageStats(user.repositories.nodes);
  const topLanguages = getTopLanguages(languageStats, 3);
  return {
    username: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    totalCommits: contributions.totalCommitContributions,
    totalPRs: contributions.totalPullRequestContributions,
    totalIssues: contributions.totalIssueContributions,
    totalStars,
    totalContributions,
    publicRepos: user.repositories.totalCount,
    contributedTo: user.repositoriesContributedTo.totalCount,
    accountAge,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    monthlyCommits,
    topLanguages
  };
};
const calculateWeeklyStreaks = (weeks) => {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const weeklyContributions = weeks.map((week) => {
    const total = week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0);
    return total > 0 ? 1 : 0;
  });
  for (let i = weeklyContributions.length - 1; i >= 0; i--) {
    if (weeklyContributions[i] === 1) {
      currentStreak++;
    } else {
      break;
    }
  }
  for (const hasContribution of weeklyContributions) {
    if (hasContribution === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  return {
    current: currentStreak,
    longest: longestStreak
  };
};
const calculateMonthlyCommits = (weeks) => {
  const monthlyMap = /* @__PURE__ */ new Map();
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      const month = day.date.substring(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + day.contributionCount);
    }
  }
  const now = /* @__PURE__ */ new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      month,
      count: monthlyMap.get(month) ?? 0
    });
  }
  return months;
};
const calculateLanguageStats = (repos) => {
  const languageStats = /* @__PURE__ */ new Map();
  for (const repo of repos) {
    if (!repo.languages.edges.length) continue;
    for (const edge of repo.languages.edges) {
      const { name, color } = edge.node;
      const existing = languageStats.get(name);
      languageStats.set(name, {
        color: color ?? "#000000",
        size: (existing?.size ?? 0) + edge.size
      });
    }
  }
  return languageStats;
};
const getTopLanguages = (languageStats, limit) => {
  const totalSize = Array.from(languageStats.values()).reduce((sum, lang) => sum + lang.size, 0);
  return Array.from(languageStats.entries()).map(([name, { color, size }]) => ({
    name,
    color,
    percentage: size / totalSize * 100
  })).sort((a, b) => b.percentage - a.percentage).slice(0, limit);
};

const createModernSVG = (width, height, content, theme = "light") => {
  const isDark = theme === "dark";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${isDark ? "#0d1117" : "#ffffff"};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${isDark ? "#0d1117" : "#ffffff"};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <style>
    * { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif;
    }
    .card-bg { fill: url(#cardGradient); }
    .text { fill: ${isDark ? "#e6edf3" : "#24292f"}; }
    .text-secondary { fill: ${isDark ? "#7d8590" : "#57606a"}; }
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
      stroke: ${isDark ? "#21262d" : "#d0d7de"}; 
      stroke-width: 1.5; 
      opacity: 0.4; 
    }
  </style>
  
  <rect class="card-bg" width="100%" height="100%" rx="20"/>
  
  ${content}
</svg>`;
};
const formatNumber = (num) => {
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}k`;
  }
  return num.toString();
};

const generateProfileCard = (data, theme = "light") => {
  const width = 900;
  const height = 600;
  const content = `
    <!-- \u30D8\u30C3\u30C0\u30FC\u30BB\u30AF\u30B7\u30E7\u30F3 -->
    ${generateHeader(data, theme)}
    
    <!-- \u7D71\u8A08\u30AB\u30FC\u30C9\u30BB\u30AF\u30B7\u30E7\u30F3 -->
    ${generateStatsCards(data, theme)}
    
    <!-- \u533A\u5207\u308A\u7DDA -->
    <line x1="80" y1="340" x2="${width - 80}" y2="340" class="divider"/>
    
    <!-- \u6280\u8853\u30B9\u30BF\u30C3\u30AF\u30BB\u30AF\u30B7\u30E7\u30F3 -->
    ${generateTechStack(data, theme)}
  `;
  return createModernSVG(width, height, content, theme);
};
const generateHeader = (data, theme) => {
  const isDark = theme === "dark";
  return `
    <g id="header">
      <!-- \u30A2\u30D0\u30BF\u30FC -->
      <defs>
        <clipPath id="avatarClip">
          <circle cx="100" cy="100" r="50"/>
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="52" fill="${isDark ? "#21262d" : "#e1e4e8"}"/>
      <image href="${data.avatarUrl}" x="50" y="50" width="100" height="100" clip-path="url(#avatarClip)"/>
      
      <!-- \u30E6\u30FC\u30B6\u30FC\u60C5\u5831 -->
      <text x="180" y="90" class="text text-2xl text-bold">${data.name ?? data.username}</text>
      <text x="180" y="120" class="text-secondary text-base">@${data.username}</text>
      ${data.bio ? `<text x="180" y="150" class="text-secondary text-sm" style="font-style: italic;">${truncate(
    data.bio,
    65
  )}</text>` : ""}
    </g>
  `;
};
const generateStatsCards = (data, theme) => {
  const isDark = theme === "dark";
  const cardBg = isDark ? "#161b22" : "#f6f8fa";
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
        <text x="20" y="65" class="text text-xl text-bold">\u{1F525}</text>
        <text x="20" y="90" class="text text-base text-semibold">${data.currentStreak}w</text>
      </g>
      
      <!-- Longest Streak Card -->
      <g transform="translate(750, 200)">
        <rect width="70" height="100" rx="12" fill="${cardBg}"/>
        <text x="15" y="35" class="text-secondary text-xs">BEST</text>
        <text x="15" y="65" class="text text-xl text-bold">\u{1F3C6}</text>
        <text x="15" y="90" class="text text-base text-semibold">${data.longestStreak}w</text>
      </g>
    </g>
  `;
};
const generateTechStack = (data, theme) => {
  const barWidth = 740;
  const barHeight = 24;
  const startY = 420;
  const languageBars = data.topLanguages.map((lang, index) => {
    const y = startY + index * 65;
    const width = lang.percentage / 100 * barWidth;
    return `
      <g>
        <!-- \u8A00\u8A9E\u540D\u3068\u30D1\u30FC\u30BB\u30F3\u30C6\u30FC\u30B8 -->
        <text x="80" y="${y - 15}" class="text text-base text-semibold">${lang.name}</text>
        <text x="820" y="${y - 15}" class="text-secondary text-sm" text-anchor="end">${lang.percentage.toFixed(
      1
    )}%</text>
        
        <!-- \u80CC\u666F\u30D0\u30FC -->
        <rect x="80" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${theme === "dark" ? "#21262d" : "#f6f8fa"}"/>
        
        <!-- \u8A00\u8A9E\u30D0\u30FC -->
        <rect x="80" y="${y}" width="${width}" height="${barHeight}" rx="6" fill="${lang.color}" opacity="0.95">
          <animate attributeName="width" from="0" to="${width}" dur="1.5s" fill="freeze"/>
        </rect>
      </g>
    `;
  }).join("");
  return `
    <g id="tech-stack">
      <text x="80" y="385" class="text text-lg text-bold">Most Used Languages</text>
      ${languageBars}
    </g>
  `;
};
const truncate = (text, maxLength) => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const execAsync = promisify(exec);
const getInputs = () => {
  if (process.env.GITHUB_ACTIONS) {
    const username2 = core.getInput("username") || github.context.repo.owner;
    const githubToken2 = core.getInput("github_token", { required: true });
    const theme2 = core.getInput("theme") || "light";
    const outputDir2 = core.getInput("output_dir") || "profile-summary-card-output";
    return { username: username2, githubToken: githubToken2, theme: theme2, outputDir: outputDir2 };
  }
  const username = process.env.GITHUB_USERNAME || "XeicuLy";
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }
  const theme = process.env.THEME || "light";
  const outputDir = process.env.OUTPUT_DIR || "profile-summary-card-output";
  return { username, githubToken, theme, outputDir };
};
const setupGitConfig = async (username) => {
  await execAsync('git config --local user.email "github-actions[bot]@users.noreply.github.com"');
  await execAsync('git config --local user.name "github-actions[bot]"');
  core.info(`Git config set for ${username}`);
};
const commitAndPush = async (outputDir) => {
  if (!process.env.GITHUB_ACTIONS) {
    core.info("\u23ED\uFE0F  Skipping git commit/push in local environment");
    return;
  }
  try {
    await execAsync(`git add ${outputDir}`);
    const { stdout: status } = await execAsync("git status --porcelain");
    if (!status.trim()) {
      core.info("No changes to commit");
      return;
    }
    await execAsync('git commit -m "\u{1F4CA} chore: update GitHub profile card"');
    await execAsync("git push");
    core.info("Successfully committed and pushed changes");
  } catch (error) {
    if (error instanceof Error) {
      core.warning(`Failed to commit changes: ${error.message}`);
    }
  }
};
const generateCards = async () => {
  try {
    core.info("\u{1F680} Starting GitHub Profile Card generation...");
    const inputs = getInputs();
    core.info(`Generating card for user: ${inputs.username}`);
    const api = createGitHubAPI(inputs.githubToken);
    const data = await api.fetchUserStats(inputs.username);
    core.info(`Fetched data: ${data.totalCommits} commits, ${data.totalStars} stars`);
    const cardSVG = generateProfileCard(data, inputs.theme);
    await mkdir(inputs.outputDir, { recursive: true });
    const cardPath = join(inputs.outputDir, "github-profile-card.svg");
    await writeFile(cardPath, cardSVG, "utf-8");
    core.info(`\u2705 Generated card in ${inputs.outputDir}`);
    if (process.env.GITHUB_ACTIONS) {
      await setupGitConfig(inputs.username);
      await commitAndPush(inputs.outputDir);
    }
    core.info("\u{1F389} GitHub Profile Card generation completed!");
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`);
      throw error;
    }
    throw new Error("Unknown error occurred");
  }
};
generateCards();
