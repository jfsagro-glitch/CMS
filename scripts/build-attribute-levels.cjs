/* eslint-disable no-console */
/**
 * Build attribute levels dictionary from ATRIBUTI/All out/all-attributes-by-top.xls
 * Output: public/attribute-levels.json
 * Expected columns in XLS:
 * - Код атрибута
 * - Наименование атрибута (опц.)
 * - Вид обеспечения
 * - Тип обеспечения
 * - Подтип обеспечения
 * - Функциональная группа обеспечения
 * - Функциональная подгруппа обеспечения
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function readLevelsFile() {
  const root = process.cwd();
  const xlsPath = path.join(root, 'ATRIBUTI', 'All out', 'all-attributes-by-top.xls');
  if (!fs.existsSync(xlsPath)) {
    throw new Error(`Не найден файл уровней: ${xlsPath}`);
  }
  const wb = xlsx.readFile(xlsPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
  return rows;
}

function main() {
  const rows = readLevelsFile();
  const items = [];
  let sortOrder = 1;
  for (const r of rows) {
    const code = String(r['Код атрибута'] || r['code'] || '').trim();
    if (!code) continue;
    // Наименование убираем из модели (используем код как обязательное поле)
    const name = code;
    const level1 = String(r['Вид обеспечения'] || r['level1'] || '').trim();
    const level2 = String(r['Тип обеспечения'] || r['level2'] || '').trim();
    const level3 = String(r['Подтип обеспечения'] || r['level3'] || '').trim();
    const level4 = String(r['Функциональная группа обеспечения'] || r['level4'] || '').trim();
    const level5 = String(r['Функциональная подгруппа обеспечения'] || r['level5'] || '').trim();

    items.push({
      id: `attrlvl-${code}`,
      code,
      name,
      isActive: true,
      sortOrder: sortOrder++,
      metadata: {
        level1,
        level2,
        level3,
        level4,
        level5,
      },
    });
  }

  const out = {
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
  };

  const outPath = path.join(process.cwd(), 'public', 'attribute-levels.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('✅ attribute-levels.json written:', outPath, 'items:', items.length);
}

if (require.main === module) {
  main();
}

module.exports = { main };

