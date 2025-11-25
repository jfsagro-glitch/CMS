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
const instructionSourceDir = path.join(__dirname, '../INSTRUCTION');
const instructionDestDir = path.join(distDir, 'INSTRUCTION');

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

// 3. Копируем папку INSTRUCTION в dist
if (fs.existsSync(instructionSourceDir)) {
  // Создаем папку назначения, если её нет
  if (!fs.existsSync(instructionDestDir)) {
    fs.mkdirSync(instructionDestDir, { recursive: true });
  }
  
  // Копируем все файлы из INSTRUCTION
  const files = fs.readdirSync(instructionSourceDir);
  files.forEach(file => {
    const sourcePath = path.join(instructionSourceDir, file);
    const destPath = path.join(instructionDestDir, file);
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
  console.log('✅ Copied INSTRUCTION folder to dist');
} else {
  console.warn('⚠️  INSTRUCTION folder not found, skipping copy');
}

// 4. Копируем папку public/VND в dist/VND (или из корня VND, если public/VND пустая)
const vndSourceDir = path.join(__dirname, '../public/VND');
const vndRootDir = path.join(__dirname, '../VND');
const vndDestDir = path.join(distDir, 'VND');

// Создаем папку назначения, если её нет
if (!fs.existsSync(vndDestDir)) {
  fs.mkdirSync(vndDestDir, { recursive: true });
}

let copiedCount = 0;
const supportedExtensions = ['.pdf', '.docx', '.xlsx', '.xls'];

// Функция для фильтрации файлов
function filterDocumentFiles(files, sourceDir) {
  return files.filter(file => {
    // Игнорируем временные файлы
    if (file.startsWith('~$')) return false;
    const ext = path.extname(file).toLowerCase();
    const filePath = path.join(sourceDir, file);
    return supportedExtensions.includes(ext) && fs.statSync(filePath).isFile();
  });
}

// Сначала пробуем скопировать из public/VND
if (fs.existsSync(vndSourceDir)) {
  const files = fs.readdirSync(vndSourceDir);
  const documentFiles = filterDocumentFiles(files, vndSourceDir);
  
  if (documentFiles.length > 0) {
    documentFiles.forEach(file => {
      const sourcePath = path.join(vndSourceDir, file);
      const destPath = path.join(vndDestDir, file);
      fs.copyFileSync(sourcePath, destPath);
      copiedCount++;
    });
    console.log(`✅ Copied ${copiedCount} document(s) from public/VND to dist (PDF/DOCX/XLSX)`);
  }
}

// Если public/VND пустая или не все файлы скопированы, пробуем скопировать из корня VND
if (fs.existsSync(vndRootDir)) {
  const files = fs.readdirSync(vndRootDir);
  const documentFiles = filterDocumentFiles(files, vndRootDir);
  
  if (documentFiles.length > 0) {
    let rootCopiedCount = 0;
    documentFiles.forEach(file => {
      const sourcePath = path.join(vndRootDir, file);
      const destPath = path.join(vndDestDir, file);
      // Копируем только если файл еще не скопирован
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        rootCopiedCount++;
        copiedCount++;
      }
    });
    if (rootCopiedCount > 0) {
      console.log(`✅ Copied ${rootCopiedCount} additional document(s) from root VND to dist (PDF/DOCX/XLSX)`);
    }
  }
}

if (copiedCount === 0) {
  console.warn('⚠️  VND folder not found or empty, skipping copy');
} else {
  console.log(`📚 Total: ${copiedCount} document(s) copied to dist/VND`);
}

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

