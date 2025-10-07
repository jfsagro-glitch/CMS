// Скрипт проверки готовности к деплою
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist');
const packageJsonPath = path.join(__dirname, '../package.json');

console.log('🔍 Running pre-deployment checks...\n');

let allChecksPassed = true;

// Проверка 1: Существует ли папка dist
if (!fs.existsSync(distDir)) {
  console.error('❌ dist/ folder not found. Run "npm run build" first.');
  allChecksPassed = false;
} else {
  console.log('✅ dist/ folder exists');
}

// Проверка 2: Существует ли index.html
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  console.log('✅ index.html exists');
} else {
  console.error('❌ index.html not found in dist/');
  allChecksPassed = false;
}

// Проверка 3: Существует ли 404.html для SPA
if (fs.existsSync(path.join(distDir, '404.html'))) {
  console.log('✅ 404.html exists (SPA support)');
} else {
  console.error('❌ 404.html not found. Run "npm run postbuild"');
  allChecksPassed = false;
}

// Проверка 4: Существует ли .nojekyll
if (fs.existsSync(path.join(distDir, '.nojekyll'))) {
  console.log('✅ .nojekyll exists');
} else {
  console.error('❌ .nojekyll not found');
  allChecksPassed = false;
}

// Проверка 5: Правильный ли homepage в package.json
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const expectedHomepage = 'https://jfsagro-glitch.github.io/cms/';
  
  if (packageJson.homepage === expectedHomepage) {
    console.log('✅ homepage в package.json настроен правильно');
  } else {
    console.error(`❌ homepage должен быть: ${expectedHomepage}`);
    console.error(`   Текущее значение: ${packageJson.homepage || 'не установлено'}`);
    allChecksPassed = false;
  }
} else {
  console.error('❌ package.json not found');
  allChecksPassed = false;
}

// Проверка 6: Проверяем размер сборки
if (fs.existsSync(distDir)) {
  const getDirectorySize = (dirPath) => {
    let size = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
    
    return size;
  };
  
  const sizeInBytes = getDirectorySize(distDir);
  const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
  
  console.log(`📦 Build size: ${sizeInMB} MB`);
  
  if (sizeInBytes > 100 * 1024 * 1024) { // > 100 MB
    console.warn('⚠️  Build size is quite large (>100MB). Consider optimization.');
  }
}

// Проверка 7: Проверяем наличие assets
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const assetsCount = fs.readdirSync(assetsDir).length;
  console.log(`✅ Assets folder exists (${assetsCount} files)`);
} else {
  console.warn('⚠️  No assets folder found');
}

// Итоговый результат
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('🎉 All checks passed! Ready for deployment.');
  console.log('\n📦 To deploy, run: npm run deploy');
  console.log('🌐 Will be deployed to: https://jfsagro-glitch.github.io/cms/');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}

