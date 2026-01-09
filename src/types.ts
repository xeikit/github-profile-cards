export interface ProfileCardData {
  // 基本情報
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;

  // 実績サマリー
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalStars: number;
  publicRepos: number;
  contributedTo: number;
  accountAge: number; // years

  // トレンドデータ
  monthlyCommits: {
    month: string; // "2025-01"
    count: number;
  }[];

  // 技術スタック
  topLanguages: {
    name: string;
    color: string;
    percentage: number;
  }[];
}

// GraphQL Response Types
export interface GraphQLResponse {
  user: {
    name: string | null;
    login: string;
    avatarUrl: string;
    bio: string | null;
    createdAt: string;
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      contributionCalendar: {
        totalContributions: number;
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
