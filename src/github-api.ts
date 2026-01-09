import { graphql } from '@octokit/graphql';
import type { ProfileCardData, GraphQLResponse, LanguageStats } from './types.js';

export const createGitHubAPI = (token: string) => {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

  return {
    fetchUserStats: async (username: string): Promise<ProfileCardData> => {
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

      const data = await graphqlWithAuth<GraphQLResponse>(query, { username });

      return transformData(data);
    },
  };
};

const transformData = (data: GraphQLResponse): ProfileCardData => {
  const user = data.user;
  const contributions = user.contributionsCollection;

  // アカウント年齢計算
  const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365));

  // 総スター数計算
  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazers.totalCount, 0);

  // 月別コミット集計
  const monthlyCommits = calculateMonthlyCommits(contributions.contributionCalendar.weeks);

  // 言語統計計算
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
    publicRepos: user.repositories.totalCount,
    contributedTo: user.repositoriesContributedTo.totalCount,
    accountAge,
    monthlyCommits,
    topLanguages,
  };
};

const calculateMonthlyCommits = (
  weeks: GraphQLResponse['user']['contributionsCollection']['contributionCalendar']['weeks']
) => {
  const monthlyMap = new Map<string, number>();

  for (const week of weeks) {
    for (const day of week.contributionDays) {
      const month = day.date.substring(0, 7); // "2025-01"
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + day.contributionCount);
    }
  }

  // 直近12ヶ月のデータを取得
  const now = new Date();
  const months: { month: string; count: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      month,
      count: monthlyMap.get(month) ?? 0,
    });
  }

  return months;
};

const calculateLanguageStats = (repos: GraphQLResponse['user']['repositories']['nodes']) => {
  const languageStats = new Map<string, LanguageStats>();

  for (const repo of repos) {
    if (!repo.languages.edges.length) continue;

    for (const edge of repo.languages.edges) {
      const { name, color } = edge.node;
      const existing = languageStats.get(name);

      languageStats.set(name, {
        color: color ?? '#000000',
        size: (existing?.size ?? 0) + edge.size,
      });
    }
  }

  return languageStats;
};

const getTopLanguages = (languageStats: Map<string, LanguageStats>, limit: number) => {
  const totalSize = Array.from(languageStats.values()).reduce((sum, lang) => sum + lang.size, 0);

  return Array.from(languageStats.entries())
    .map(([name, { color, size }]) => ({
      name,
      color,
      percentage: (size / totalSize) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit);
};
