import * as core from '@actions/core';
import * as github from '@actions/github';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createGitHubAPI } from './github-api.js';
import { generateStatsSVG, generateProfileDetailsSVG } from './generators';

const execAsync = promisify(exec);

interface ActionInputs {
  username: string;
  githubToken: string;
  theme: 'light' | 'dark';
  outputDir: string;
}

const getInputs = (): ActionInputs => {
  // GitHub Actions環境の場合
  if (process.env.GITHUB_ACTIONS) {
    const username = core.getInput('username') || github.context.repo.owner;
    const githubToken = core.getInput('github_token', { required: true });
    const theme = (core.getInput('theme') || 'light') as 'light' | 'dark';
    const outputDir = core.getInput('output_dir') || 'profile-summary-card-output/github';

    return { username, githubToken, theme, outputDir };
  }

  // ローカル開発環境の場合
  const username = process.env.GITHUB_USERNAME || 'XeicuLy';
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const theme = (process.env.THEME || 'light') as 'light' | 'dark';
  const outputDir = process.env.OUTPUT_DIR || 'profile-summary-card-output/github';

  return { username, githubToken, theme, outputDir };
};

const setupGitConfig = async (username: string): Promise<void> => {
  await execAsync('git config --local user.email "github-actions[bot]@users.noreply.github.com"');
  await execAsync('git config --local user.name "github-actions[bot]"');

  core.info(`Git config set for ${username}`);
};

const commitAndPush = async (outputDir: string): Promise<void> => {
  // ローカル環境ではスキップ
  if (!process.env.GITHUB_ACTIONS) {
    core.info('⏭️  Skipping git commit/push in local environment');
    return;
  }

  try {
    await execAsync(`git add ${outputDir}`);

    const { stdout: status } = await execAsync('git status --porcelain');

    if (!status.trim()) {
      core.info('No changes to commit');
      return;
    }

    await execAsync('git commit -m "📊 chore: update GitHub profile cards"');
    await execAsync('git push');

    core.info('Successfully committed and pushed changes');
  } catch (error) {
    if (error instanceof Error) {
      core.warning(`Failed to commit changes: ${error.message}`);
    }
  }
};

const generateCards = async (): Promise<void> => {
  try {
    core.info('🚀 Starting GitHub Profile Cards generation...');

    const inputs = getInputs();
    core.info(`Generating cards for user: ${inputs.username}`);

    // GitHub APIでデータ取得
    const api = createGitHubAPI(inputs.githubToken);
    const stats = await api.fetchUserStats(inputs.username);

    core.info(`Fetched stats: ${stats.totalCommits} commits, ${stats.totalStars} stars`);

    // SVG生成
    const statsSVG = generateStatsSVG(stats, inputs.theme);
    const profileDetailsSVG = generateProfileDetailsSVG(stats, inputs.theme);

    // 出力ディレクトリ作成
    await mkdir(inputs.outputDir, { recursive: true });

    // SVGファイル書き込み
    const statsPath = join(inputs.outputDir, '3-stats.svg');
    const profileDetailsPath = join(inputs.outputDir, '0-profile-details.svg');

    await writeFile(statsPath, statsSVG, 'utf-8');
    await writeFile(profileDetailsPath, profileDetailsSVG, 'utf-8');

    core.info(`✅ Generated cards in ${inputs.outputDir}`);

    // Git設定とコミット（GitHub Actions環境のみ）
    if (process.env.GITHUB_ACTIONS) {
      await setupGitConfig(inputs.username);
      await commitAndPush(inputs.outputDir);
    }

    core.info('🎉 GitHub Profile Cards generation completed!');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`);
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
};

// メイン実行
generateCards();
