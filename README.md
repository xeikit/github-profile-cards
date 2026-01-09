# GitHub Profile Cards

[![GitHub Release](https://img.shields.io/github/v/release/xeikit/github-profile-cards)](https://github.com/xeikit/github-profile-cards/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Modern, minimal GitHub profile cards powered by GraphQL. Showcase your contributions, streaks, and tech stack with beautiful, auto-updating SVG cards.

![Example Card](./examples/light-theme.svg)

## ✨ Features

- 🎨 **Beautiful & Minimal** - Clean design inspired by GitHub Readme Streak Stats
- 📊 **Rich Statistics** - Total contributions, repos, stars, and weekly streaks
- 🏆 **Streak Tracking** - Current and longest weekly contribution streaks
- 💻 **Tech Stack** - Top 3 most-used programming languages
- 🌓 **Theme Support** - Light and dark modes
- 🔄 **Auto-updating** - Refreshes daily via GitHub Actions

## 🚀 Quick Start

### 1. Add GitHub Action

Create `.github/workflows/profile-card.yml` in your profile repository (e.g., `XeicuLy/XeicuLy`):

```yaml
name: Generate Profile Card

on:
  schedule:
    - cron: '0 0 * * *' # Runs daily at midnight UTC
  workflow_dispatch: # Allows manual trigger
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate Profile Card
        uses: xeikit/github-profile-cards@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          theme: light # or 'dark'
```

### 2. Add to README

Insert this in your profile `README.md`:

```markdown
![GitHub Profile Card](./profile-summary-card-output/github-profile-card.svg)
```

### 3. Trigger Workflow

- **Automatic**: Runs daily at midnight UTC
- **Manual**: Go to Actions tab → "Generate Profile Card" → Run workflow

## 📖 Configuration

### Inputs

| Input          | Description                    | Required | Default                       |
| -------------- | ------------------------------ | -------- | ----------------------------- |
| `github_token` | GitHub token for API access    | ✅       | -                             |
| `username`     | GitHub username                | ❌       | Repository owner              |
| `theme`        | Card theme (`light` or `dark`) | ❌       | `light`                       |
| `output_dir`   | Output directory for SVG       | ❌       | `profile-summary-card-output` |

### Example: Dark Theme

```yaml
- name: Generate Profile Card
  uses: xeikit/github-profile-cards@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    theme: dark
```

## 🎨 Themes

### Light Theme

![Light Theme](./examples/light-theme.svg)

### Dark Theme

![Dark Theme](./examples/dark-theme.svg)

## 📊 What's Included

- **Total Contributions** - All contributions in the last year
- **Repositories** - Total public repos
- **Stars** - Total stars earned across all repos
- **Current Streak** - Consecutive weeks with contributions
- **Longest Streak** - Best weekly contribution streak
- **Top Languages** - 3 most-used languages by repository size

## 🛠️ Local Development

### Prerequisites

- Node.js v22+
- pnpm v10+

### Setup

```bash
# Clone repository
git clone https://github.com/xeikit/github-profile-cards.git
cd github-profile-cards

# Install dependencies
pnpm install

# Build
pnpm build

# Test locally
export GITHUB_TOKEN=your_github_token
pnpm dev
```

### Generated Output

```
profile-summary-card-output/
└── github-profile-card.svg
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT © [xeikit](https://github.com/xeikit)

## 🙏 Acknowledgments

- Design inspired by [GitHub Readme Streak Stats](https://github.com/DenverCoder1/github-readme-streak-stats)
- Replaces the unmaintained [github-profile-summary-cards](https://github.com/vn7n24fzkq/github-profile-summary-cards)

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/xeikit">xeikit</a>
</div>
