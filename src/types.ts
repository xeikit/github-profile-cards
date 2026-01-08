export interface GitHubUserStats {
  username: string;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalStars: number;
  contributedTo: number;

  contributions: {
    date: string;
    count: number;
  }[];

  topLanguages: {
    name: string;
    color: string;
    percentage: number;
  }[];
}

// GraphQL Response Types
export interface GraphQLResponse {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalRepositoryContributions: number;
      contributionCalendar: {
        weeks: {
          contributionDays: {
            date: string;
            contributionCount: number;
          }[];
        }[];
      };
    };
    repositories: {
      totalCount: number;
      nodes: {
        stargazers: {
          totalCount: number;
        };
        languages: {
          edges: {
            size: number;
            node: {
              name: string;
              color: string | null;
            };
          }[];
        };
      }[];
    };
    repositoriesContributedTo: {
      totalCount: number;
    };
  };
}

export interface LanguageStats {
  color: string;
  size: number;
}
