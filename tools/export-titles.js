/**
 * 外部LLM（GPTなど）に渡すための既存記事一覧を出力する。
 * WRITING_RULES.md と一緒に貼り付けて使う。
 * 使い方: node tools/export-titles.js  (リポジトリのルートで実行)
 */
const fs = require('fs');
const path = require('path');

const posts = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/posts.json'), 'utf8'));

const THEME_LABELS = {
  souba: '相場・高騰',
  shinpan: '新弾・収録カード',
  kaitori: '買取・売却の考え方',
  guide: '初心者ガイド・デッキ構築',
  kanbetsu: '真贋・保管',
  column: 'コラム・イベント'
};

// 主力タイトルの判定（CONTENT_GUIDE.md「扱うタイトルの優先順位」に対応）
const TITLES = {
  'ワンピース': /ワンピース|ONE PIECE|ドン!!/,
  'デジモン': /デジモン/,
  'DBF': /ドラゴンボール|フュージョンワールド|DBF/,
  'ヴァイス': /ヴァイスシュヴァルツ(?!ロゼ)|ヴァイス(?!ロゼ)/,
  'ヴァイスロゼ': /ヴァイスシュヴァルツロゼ|ヴァイスロゼ|ロゼ/,
  'ポケカ(サブ)': /ポケカ|ポケモン/,
  '遊戯王(サブ)': /遊戯王/
};

const byTheme = {};
const byTitle = {};
Object.keys(TITLES).forEach(k => { byTitle[k] = 0; });
let generic = 0;

for (const p of posts) {
  byTheme[p.theme] = (byTheme[p.theme] || 0) + 1;
  const hay = p.title + ' ' + (p.keywords || []).join(' ');
  let hit = false;
  for (const k in TITLES) {
    if (TITLES[k].test(hay)) { byTitle[k]++; hit = true; }
  }
  if (!hit) generic++;
}

const out = [];
out.push('## 既存記事の状況（' + new Date().toISOString().slice(0, 10) + ' 時点・全' + posts.length + '本）');
out.push('');
out.push('### テーマ別の本数');
out.push('');
for (const t in THEME_LABELS) {
  out.push('- ' + THEME_LABELS[t] + ' (`' + t + '`): ' + (byTheme[t] || 0) + '本');
}
out.push('');
out.push('### タイトル別の本数');
out.push('');
for (const k in byTitle) {
  out.push('- ' + k + ': ' + byTitle[k] + '本');
}
out.push('- タイトル名を含まない一般論: ' + generic + '本');
out.push('');
out.push('### 既存記事の一覧（重複回避・関連リンク先の確認用）');
out.push('');
out.push('関連リンクを張る場合は、この slug のみを使うこと。ここに無い記事にリンクしない。');
out.push('');
for (const t in THEME_LABELS) {
  const list = posts.filter(p => p.theme === t);
  if (!list.length) continue;
  out.push('**' + THEME_LABELS[t] + '**');
  out.push('');
  for (const p of list) {
    out.push('- `' + p.slug + '` ― ' + p.title);
  }
  out.push('');
}

console.log(out.join('\n'));
