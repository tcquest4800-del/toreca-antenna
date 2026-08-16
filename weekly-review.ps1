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

書き直す前に data/vocab.md を読んでください。古い記事はプレイヤーが実際に使う語彙から外れていることが多く、
そこが改善の余地になります。「デッキが安定して動く」ではなく「回る」のように、用語集にある語はそのまま使ってください。
必要なら調査して事実を確認し、新しい用語や論点を得たら data/vocab.md と data/insights.md の末尾に追記してください。

書き直したら qualityScore を再採点して更新し、scoreHistory に追記してください(古い履歴は消さない)。
他サイトの文章や記事構成を真似せず、参照した個人の記事・投稿を名指ししないでください。
特定のショップ名・会社名・店舗URLは一切書かないでください。
node tools/build-feed.js を実行して整合性チェックを通してから、変更をコミットしてpushしてください
(コミットメッセージ例: weekly-review: quality improvements ($today))。
"@

Write-Output "[$today] Running Claude Code..."
claude -p $prompt `
  --permission-mode acceptEdits `
  --allowedTools "Read,Write,Edit,Glob,Grep,WebSearch,WebFetch,Bash(git config *),Bash(git add *),Bash(git commit *),Bash(git push *),Bash(git pull *),Bash(git status *),Bash(git diff *),Bash(git log *),Bash(node *)" `
  --output-format json | Tee-Object -FilePath $logFile

Write-Output "[$today] Done. Log: $logFile"
