// Скрипт для постобработки сборки для GitHub Pages
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const notFoundHtmlPath = path.join(distDir, '404.html');
const noJekyllPath = path.join(distDir, '.nojekyll');

console.log('🔧 Post-build processing for GitHub Pages...\n');

// 1. Создаем 404.html для поддержки SPA роутинга
if (fs.existsSync(indexHtmlPath)) {
  fs.copyFileSync(indexHtmlPath, notFoundHtmlPath);
  console.log('✅ Created 404.html for SPA routing support');
} else {
  console.error('❌ index.html not found in dist/');
  process.exit(1);
}

// 2. Создаем .nojekyll для отключения Jekyll processing на GitHub Pages
fs.writeFileSync(noJekyllPath, '');
console.log('✅ Created .nojekyll file');

// 3. Создаем CNAME файл (если нужен custom domain)
// const cnameContent = 'your-custom-domain.com';
// fs.writeFileSync(path.join(distDir, 'CNAME'), cnameContent);
// console.log('✅ Created CNAME file');

// 4. Проверяем что все необходимые файлы на месте
const requiredFiles = ['index.html', '404.html', '.nojekyll'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(distDir, file)));

if (missingFiles.length > 0) {
  console.error('❌ Missing files:', missingFiles.join(', '));
  process.exit(1);
}

console.log('\n🎉 Post-build completed successfully!');
console.log('📦 Build is ready for deployment to GitHub Pages\n');

