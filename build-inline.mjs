/*


Auto generated with Claude


*/

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

console.log('Building project...');
execSync('npx tsc && npx vite build', { stdio: 'inherit' });

console.log('Inlining CSS and JS into HTML...');

const resolveDistAssetPath = (assetRef) => {
  // Handle both "assets/foo.css" and "/assets/foo.css"
  const normalized = assetRef.replace(/^\/+/, '');
  return path.join(distDir, normalized);
};

const inlineSideEffectJsImports = (js, parentJsPath, seen = new Set()) => {
  // Vite often emits this as one minified line: import"./style-xxx.js";var ...
  // so this cannot rely on line anchors.
  const importRegex = /import\s*["']([^"']+\.js)["'];?/g;

  return js.replace(importRegex, (statement, specifier) => {
    const depPath = specifier.startsWith('/')
      ? resolveDistAssetPath(specifier)
      : path.resolve(path.dirname(parentJsPath), specifier);

    if (!fs.existsSync(depPath)) {
      return statement;
    }

    if (seen.has(depPath)) {
      return '';
    }

    seen.add(depPath);
    const depJs = fs.readFileSync(depPath, 'utf-8');
    return `\n/* inlined: ${path.basename(depPath)} */\n${inlineSideEffectJsImports(depJs, depPath, seen)}\n`;
  });
};

const htmlFiles = fs
  .readdirSync(distDir)
  .filter((file) => file.endsWith('.html'));

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(distDir, htmlFile);
  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Find and inline CSS files
  const cssRegex = /<link[^>]*href=["']([^"']*\.css)["'][^>]*>/g;
  html = html.replace(cssRegex, (match, href) => {
    const cssPath = resolveDistAssetPath(href);
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf-8');
      return `<style>${css}</style>`;
    }
    return match;
  });

  // Find and inline JS files
  const jsRegex = /<script[^>]*src=["']([^"']*\.js)["'][^>]*><\/script>/g;
  html = html.replace(jsRegex, (match, src) => {
    const jsPath = resolveDistAssetPath(src);
    if (fs.existsSync(jsPath)) {
      const isModuleScript = /type=["']module["']/.test(match);
      const js = fs.readFileSync(jsPath, 'utf-8');
      const inlinedJs = inlineSideEffectJsImports(js, jsPath);
      return isModuleScript
        ? `<script type="module">${inlinedJs}</script>`
        : `<script>${inlinedJs}</script>`;
    }
    return match;
  });

  // Remove modulepreload tags once referenced scripts are inlined.
  const modulePreloadRegex = /<link\b[^>]*\brel=["']modulepreload["'][^>]*>\s*/gi;
  html = html.replace(modulePreloadRegex, '');

  // Write the inlined HTML back
  fs.writeFileSync(htmlPath, html);
  console.log(`✓ Inlined assets in ${htmlFile}`);
}

const indexHtmlPath = path.join(distDir, 'index.html');
const html = fs.readFileSync(indexHtmlPath, 'utf-8');

// Delete the separate asset files
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true, force: true });
  console.log('✓ Removed separate asset files');
}

console.log('✓ Single HTML file built successfully!');
console.log(`Output: ${indexHtmlPath}`);

// Deploy to main branch using gh-pages
console.log('\nDeploying to main branch with gh-pages...');
try {
  execSync('npx gh-pages -d dist -b main', { stdio: 'inherit' });
  console.log('✓ Deployment to main branch completed successfully!');
  
  // Wait 3 seconds for changes to propagate
  console.log('\nWaiting for changes to propagate...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Get the auth token from environment variable
  const authToken = process.env.morp_auth;
  if (!authToken) {
    console.warn('⚠ MORP_AUTH_TOKEN environment variable not set. Skipping profile update.');
    process.exit(0);
  }
  
  const apiHost = 'api.morp.hackclub.com';
  
  // Fetch latest profile updates
  console.log('\nFetching latest profile data...');
  const fetchResponse = await fetch(`https://${apiHost}/profile/github/pull`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Accept': '*/*'
    }
  });
  
  if (!fetchResponse.ok) {
    console.warn(`⚠ Failed to fetch latest profile: ${fetchResponse.status}`);
  } else {
    console.log('✓ Fetched latest profile data');
  }
  
  // Update webpage with new HTML
  console.log('\nUpdating profile webpage...');
  const updatePayload = {
    mode: 'editor',
    html: html
  };
  
  const updateResponse = await fetch(`https://${apiHost}/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });
  
  if (!updateResponse.ok) {
    console.error(`✗ Failed to update profile: ${updateResponse.status}`);
    process.exit(1);
  }
  
  console.log('✓ Profile webpage updated successfully!');
  
} catch (error) {
  console.error('✗ Failed during deployment or update process');
  console.error(error.message);
  process.exit(1);
}
