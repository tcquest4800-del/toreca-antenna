# トレカアンテナ 毎日自動投稿スクリプト
# Windowsタスクスケジューラから実行される想定。
# 前提: このスクリプトは toreca-antenna リポジトリのクローン直下に置くこと。
#       Claude Code (claude コマンド) がインストール済み・ `claude login` 済みであること。

$ErrorActionPreference = "Stop"
$RepoPath = $PSScriptRoot
Set-Location $RepoPath

New-Item -ItemType Directory -Force -Path "$RepoPath\logs" | Out-Null
$today = Get-Date -Format "yyyy-MM-dd"
$logFile = "$RepoPath\logs\daily-$today.json"

if (-not (git config user.email)) { git config user.email "toreca-antenna-bot@users.noreply.github.com" }
if (-not (git config user.name)) { git config user.name "toreca-antenna-bot" }

Write-Output "[$today] Pulling latest..."
git pull --ff-only

$prompt = @"
CONTENT_GUIDE.md の「毎日の自動生成タスクの手順」に厳密に従って、本日($today)分の記事を20本、6テーマにバランスよく生成してください。
data/posts.json、feed.xml、sitemap.xml も更新してください(feed.xml/sitemap.xmlが無ければ新規作成して構いません)。
特定のショップ名・会社名・店舗URLは一切書かないでください。
最後に、変更をコミットしてpushしてください(コミットメッセージ例: daily: automated post generation ($today))。
pushまで完了したら作業完了です。
"@

Write-Output "[$today] Running Claude Code..."
claude -p $prompt `
  --permission-mode acceptEdits `
  --allowedTools "Read,Write,Edit,Glob,Grep,Bash(git config *),Bash(git add *),Bash(git commit *),Bash(git push *),Bash(git pull *),Bash(git status *),Bash(git diff *),Bash(git log *),Bash(node *)" `
  --output-format json | Tee-Object -FilePath $logFile

Write-Output "[$today] Done. Log: $logFile"
