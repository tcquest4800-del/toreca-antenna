# CLAUDE.md

トレカアンテナ（毎日20本の記事を自動生成して公開する静的ブログ）の作業メモ。

**記事の書き方・テーマ配分・品質スコア・posts.json のスキーマは [`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md) が正。** このファイルは環境と運用まわりだけを扱う。

## 環境

| 項目 | 値 |
|---|---|
| ローカル | `C:\Users\UFO1号機\toreca-antenna`（Desktop配下ではない）|
| リモート | `github.com/toreca-ai/toreca-antenna`（public）|
| 公開URL | https://toreca-ai.github.io/toreca-antenna/ |
| git identity | リポジトリローカルで `toreca-antenna-bot`（グローバルは未設定）|
| 日次ジョブ | タスクスケジューラ `TorecaAntennaDaily` 毎日07:00 |
| 週次ジョブ | タスクスケジューラ `TorecaAntennaWeekly` 日曜08:00 |

日次・週次ジョブは `daily-publish.ps1` / `weekly-review.ps1` が `claude -p` を起動する形。どちらも引数を取らず、本数（20本）とプロンプトはスクリプト内に固定。

## 変更したら必ず実行する

```bash
node tools/build-feed.js
```

`data/posts.json` から `feed.xml` と `sitemap.xml` を生成し、同時に整合性チェックをする。以下のいずれかがあると `process.exit(1)` で落ちる。

- `posts.json` にあるのに `posts/<slug>.html` が無い
- `posts/` にあるのに `posts.json` に未登録
- 記事内の `../posts/xxx.html` リンク切れ

**このチェックは日次ジョブの中でも走る。** `posts/` に posts.json 未登録のHTMLを残すと、翌朝の自動実行がここで止まる。

## 注意点

- **実行中のジョブがあるときにファイルを動かさない。** 生成途中の記事を奪うことになる。作業前に `Get-Process claude,powershell` でジョブの有無を確認する。手動実行は15〜20分ほどかかる。
- **公開URLは `tools/build-feed.js` の `BASE` 定数がすべての出典。** リポジトリのオーナーやリポジトリ名を変えたらここも直す。ズレると feed.xml と sitemap.xml の全リンクが404になる（2026-08-16に一度発生。旧 `tcquest4800-del.github.io` のまま残っていた）。
- **記事HTMLに絶対URLは埋めない。** 内部リンクは `../posts/xxx.html` の相対で書く。絶対URLを持つのは feed.xml / sitemap.xml だけ、という状態を保つ。
- `Desktop\toreca-antenna-local-automation` は構築時のセットアップ資材の置き場。**スクリプトの正本はこのリポジトリ側**で、あちらのコピーは古くなりうる。
- `logs/` と `private/` は `.gitignore` 済み。実行ログは `logs/daily-YYYY-MM-DD.json` にジョブ完了時に書き出される。

## スケジュール外で記事を作るとき

ユーザーから依頼があれば、生成 → `node tools/build-feed.js` → コミット → push まで通す。本数やテーマの指定があればそれに従う（スクリプト経由だと20本固定になるので、指定があるときはスクリプトを使わず直接作業する）。

同じ日付の記事がすでにある場合は、日付の扱いをユーザーに確認する。
