import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

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

// Write the inlined HTML back
fs.writeFileSync(htmlPath, html);

// Delete the separate asset files
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true, force: true });
  console.log('✓ Removed separate asset files');
}

console.log('✓ Single HTML file built successfully!');
console.log(`Output: ${htmlPath}`);

// Deploy to main branch using gh-pages
console.log('\nDeploying to main branch with gh-pages...');
try {
  execSync('npx gh-pages -d dist -b main', { stdio: 'inherit' });
  console.log('✓ Deployment to main branch completed successfully!');
} catch (error) {
  console.error('✗ Failed to deploy with gh-pages');
  console.error(error.message);
  process.exit(1);
}
