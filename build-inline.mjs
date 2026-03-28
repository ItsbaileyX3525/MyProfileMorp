/* 

AUTO GENERATED USING CHATGPT

*/




import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

// Switch to main branch first
console.log('Switching to main branch...');
try {
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('✗ Failed to switch to main branch');
  process.exit(1);
}

console.log('Building project...');
execSync('npx tsc && npx vite build', { stdio: 'inherit' });

console.log('Inlining CSS and JS into HTML...');

// Read the generated HTML
const htmlPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

// Find and inline CSS files
const cssRegex = /<link[^>]*href=["']([^"']*\.css)["'][^>]*>/g;
html = html.replace(cssRegex, (match, href) => {
  const cssPath = path.join(distDir, href);
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf-8');
    return `<style>${css}</style>`;
  }
  return match;
});

// Find and inline JS files
const jsRegex = /<script[^>]*src=["']([^"']*\.js)["'][^>]*><\/script>/g;
html = html.replace(jsRegex, (match, src) => {
  const jsPath = path.join(distDir, src);
  if (fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, 'utf-8');
    return `<script>${js}</script>`;
  }
  return match;
});
