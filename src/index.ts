import * as core from '@actions/core';
import * as github from '@actions/github';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createGitHubAPI } from './github-api.js';
import { generateProfileCard } from './generators/index.js';

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
    const outputDir = core.getInput('output_dir') || 'profile-summary-card-output';

    return { username, githubToken, theme, outputDir };
  }

  // ローカル開発環境の場合
  const username = process.env.GITHUB_USERNAME || 'XeicuLy';
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const theme = (process.env.THEME || 'light') as 'light' | 'dark';
  const outputDir = process.env.OUTPUT_DIR || 'profile-summary-card-output';

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
    // 変更があるかチェック
    const { stdout: diff } = await execAsync(`git diff --exit-code ${outputDir} || echo "changed"`);

    if (!diff.includes('changed')) {
      core.info('No changes detected in SVG output');
      return;
    }

    await execAsync(`git add ${outputDir}`);
    await execAsync('git commit -m "📊 chore: update GitHub profile card"');

    // リモートの変更を取得してrebase
    await execAsync('git fetch origin');
    await execAsync('git rebase origin/${GITHUB_REF##*/} || git rebase --abort');

    await execAsync('git push');

    core.info('Successfully committed and pushed changes');
  } catch (error) {
    if (error instanceof Error) {
      // pushに失敗しても警告だけ出して続行
      core.warning(`Failed to push changes: ${error.message}`);
      core.info('SVG file was generated successfully locally');
    }
  }
};

const generateCards = async (): Promise<void> => {
  try {
    core.info('🚀 Starting GitHub Profile Card generation...');

    const inputs = getInputs();
    core.info(`Generating card for user: ${inputs.username}`);

    // GitHub APIでデータ取得
    const api = createGitHubAPI(inputs.githubToken);
    const data = await api.fetchUserStats(inputs.username);

    core.info(`Fetched data: ${data.totalCommits} commits, ${data.totalStars} stars`);

    // SVG生成
    const cardSVG = generateProfileCard(data, inputs.theme);

    // 出力ディレクトリ作成
    await mkdir(inputs.outputDir, { recursive: true });

    // SVGファイル書き込み
    const cardPath = join(inputs.outputDir, 'github-profile-card.svg');
    await writeFile(cardPath, cardSVG, 'utf-8');

    core.info(`✅ Generated card in ${inputs.outputDir}`);

    // Git設定とコミット（GitHub Actions環境のみ）
    if (process.env.GITHUB_ACTIONS) {
      await setupGitConfig(inputs.username);
      await commitAndPush(inputs.outputDir);
    }

    core.info('🎉 GitHub Profile Card generation completed!');
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
