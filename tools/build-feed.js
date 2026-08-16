/**
 * data/posts.json から feed.xml / sitemap.xml を生成し、
 * 記事ファイルと内部リンクの整合性をチェックする。
 * 使い方: node tools/build-feed.js  (リポジトリのルートで実行)
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE = 'https://tcquest4800-del.github.io/toreca-antenna/';
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/posts.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- 整合性チェック ----
const errs = [];
const postsDir = path.join(ROOT, 'posts');
for (const p of posts) {
  if (!fs.existsSync(path.join(postsDir, p.slug + '.html'))) errs.push('記事ファイルなし: ' + p.slug);
}
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.html') && f !== '_template.html');
const slugs = new Set(posts.map(p => p.slug));
for (const f of files) {
  if (!slugs.has(f.replace(/\.html$/, ''))) errs.push('posts.json に未登録: ' + f);
}
for (const f of files) {
  const html = fs.readFileSync(path.join(postsDir, f), 'utf8');
  for (const m of html.matchAll(/href="\.\.\/posts\/([^"]+)"/g)) {
    if (!fs.existsSync(path.join(postsDir, m[1]))) errs.push('リンク切れ: ' + f + ' -> ' + m[1]);
  }
}
const byTheme = {};
posts.forEach(p => { byTheme[p.theme] = (byTheme[p.theme] || 0) + 1; });
console.log('posts.json:', posts.length, '件 / html:', files.length, '件');
console.log('テーマ内訳:', JSON.stringify(byTheme));
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('整合性チェック: OK');

// ---- feed.xml ----
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function rfc822(dateStr) {
  const utc = new Date(dateStr + 'T00:00:00Z');
  const j = new Date(utc.getTime() + 9 * 3600 * 1000); // 09:00 JST 相当
  const p2 = n => String(n).padStart(2, '0');
  return DAY[utc.getUTCDay()] + ', ' + p2(utc.getUTCDate()) + ' ' + MON[utc.getUTCMonth()] + ' ' +
    utc.getUTCFullYear() + ' ' + p2(j.getUTCHours()) + ':00:00 +0900';
}

const sorted = [...posts].sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.slug.localeCompare(b.slug));
const latest = sorted.length ? sorted[0].date : '';

const items = sorted.map(p => [
  '  <item>',
  '    <title>' + esc(p.title) + '</title>',
  '    <link>' + BASE + 'posts/' + p.slug + '.html</link>',
  '    <guid isPermaLink="true">' + BASE + 'posts/' + p.slug + '.html</guid>',
  '    <description>' + esc(p.excerpt || '') + '</description>',
  '    <category>' + esc(p.theme) + '</category>',
  '    <pubDate>' + rfc822(p.date) + '</pubDate>',
  '  </item>'
].join('\n')).join('\n');

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  '<channel>',
  '  <title>トレカアンテナ</title>',
  '  <link>' + BASE + '</link>',
  '  <atom:link href="' + BASE + 'feed.xml" rel="self" type="application/rss+xml" />',
  '  <description>トレーディングカードの相場動向、新弾情報、買取の考え方、初心者向けガイドなどをまとめる情報ブログ。</description>',
  '  <language>ja</language>',
  '  <lastBuildDate>' + rfc822(latest) + '</lastBuildDate>',
  items,
  '</channel>',
  '</rss>',
  ''
].join('\n');
fs.writeFileSync(path.join(ROOT, 'feed.xml'), feed, 'utf8');

// ---- sitemap.xml ----
const urls = [
  { loc: BASE, lastmod: latest, pri: '1.0' },
  { loc: BASE + 'about.html', lastmod: latest, pri: '0.3' }
].concat(sorted.map(p => ({ loc: BASE + 'posts/' + p.slug + '.html', lastmod: p.date, pri: '0.8' })));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urls.map(u => [
    '  <url>',
    '    <loc>' + u.loc + '</loc>',
    '    <lastmod>' + u.lastmod + '</lastmod>',
    '    <priority>' + u.pri + '</priority>',
    '  </url>'
  ].join('\n')).join('\n'),
  '</urlset>',
  ''
].join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

console.log('feed.xml:', sorted.length, 'items / sitemap.xml:', urls.length, 'urls');
