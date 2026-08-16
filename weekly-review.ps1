# トレカアンテナ 週次棚卸し(品質改善)スクリプト
# Windowsタスクスケジューラから実行される想定。

$ErrorActionPreference = "Stop"
$RepoPath = $PSScriptRoot
Set-Location $RepoPath

New-Item -ItemType Directory -Force -Path "$RepoPath\logs" | Out-Null
$today = Get-Date -Format "yyyy-MM-dd"
$logFile = "$RepoPath\logs\weekly-$today.json"

if (-not (git config user.email)) { git config user.email "toreca-antenna-bot@users.noreply.github.com" }
if (-not (git config user.name)) { git config user.name "toreca-antenna-bot" }

Write-Output "[$today] Pulling latest..."
git pull --ff-only

$prompt = @"
CONTENT_GUIDE.md の「週次の棚卸し(品質改善)タスクの手順」に厳密に従ってください。
data/posts.json を確認し、qualityScore が低い記事(目安: 下位20%、または70点未満)を6本ほど選び、
具体性・構成・独自性・読みやすさの観点で書き直してください。
書き直したら qualityScore を再採点して更新し、scoreHistory に追記してください(古い履歴は消さない)。
feed.xml、sitemap.xml も必要なら更新してください。
特定のショップ名・会社名・店舗URLは一切書かないでください。
最後に、変更をコミットしてpushしてください(コミットメッセージ例: weekly-review: quality improvements ($today))。
"@

Write-Output "[$today] Running Claude Code..."
claude -p $prompt `
  --permission-mode acceptEdits `
  --allowedTools "Read,Write,Edit,Glob,Grep,Bash(git config *),Bash(git add *),Bash(git commit *),Bash(git push *),Bash(git pull *),Bash(git status *),Bash(git diff *),Bash(git log *),Bash(node *)" `
  --output-format json | Tee-Object -FilePath $logFile

Write-Output "[$today] Done. Log: $logFile"
