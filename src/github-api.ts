import { graphql } from '@octokit/graphql';
import type { GitHubUserStats, GraphQLResponse, LanguageStats } from './types.js';

export const createGitHubAPI = (token: string) => {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

  return {
    fetchUserStats: async (username: string): Promise<GitHubUserStats> => {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              totalRepositoryContributions
              contributionCalendar {
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

      return transformData(username, data);
    },
  };
};

const transformData = (username: string, data: GraphQLResponse): GitHubUserStats => {
  const user = data.user;
  const contributions = user.contributionsCollection;

  // 総スター数計算
  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazers.totalCount, 0);

  // コントリビューションデータ変換
  const contributionDays = contributions.contributionCalendar.weeks
    .flatMap(week => week.contributionDays)
    .map(day => ({
      date: day.date,
      count: day.contributionCount,
    }));

  // 言語統計計算
  const languageStats = calculateLanguageStats(user.repositories.nodes);
  const topLanguages = getTopLanguages(languageStats, 5);

  return {
    username,
    totalCommits: contributions.totalCommitContributions,
    totalPRs: contributions.totalPullRequestContributions,
    totalIssues: contributions.totalIssueContributions,
    totalStars,
    contributedTo: user.repositoriesContributedTo.totalCount,
    contributions: contributionDays,
    topLanguages,
  };
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
