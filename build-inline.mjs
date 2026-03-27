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
execSync('tsc && vite build', { stdio: 'inherit' });

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

// Copy the built index.html to root
const rootHtmlPath = path.join(__dirname, 'index.html');
fs.copyFileSync(htmlPath, rootHtmlPath);
console.log('✓ Copied index.html to root');

// Upload to main branch
console.log('\nCommitting to main branch...');
try {
  // Add only the root index.html
  execSync('git add index.html', { stdio: 'inherit' });
  
  // Check if there are changes to commit
  const status = execSync('git status --porcelain').toString().trim();
  if (status.length === 0) {
    console.log('✓ No changes to commit (already up to date)');
  } else {
    execSync('git commit -m "Build: inline HTML update"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✓ Uploaded to main branch successfully!');
  }
  
  // Switch back to node branch
  console.log('\nSwitching back to node branch...');
  execSync('git checkout node', { stdio: 'inherit' });
  console.log('✓ Switched back to node branch');
} catch (error) {
  console.error('✗ Failed to upload to main branch');
  console.error(error.message);
  process.exit(1);
}
