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

function findHeaderRow(worksheet) {
  const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1');
  const headerKeywords = [
    'код атрибута',
    'вид обеспечения',
    'тип обеспечения',
    'подтип обеспечения',
    'функциональная группа',
    'функциональная подгруппа',
  ];

  for (let row = 0; row < Math.min(10, range.e.r + 1); row++) {
    const rowData = [];
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        rowData.push(String(cell.v).toLowerCase());
      }
    }
    const matches = headerKeywords.filter(keyword => rowData.some(val => val.includes(keyword)));
    if (matches.length >= 3) {
      console.log(`Найдена строка заголовка: ${row + 1}, совпадений: ${matches.length}`);
      return row;
    }
  }
  return 0;
}

function readLevelsFile() {
  const root = process.cwd();
  const xlsPath = path.join(root, 'ATRIBUTI', 'All out', 'all-attributes-by-top.xls');
  if (!fs.existsSync(xlsPath)) {
    throw new Error(`Не найден файл уровней: ${xlsPath}`);
  }
  const wb = xlsx.readFile(xlsPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const headerRow = findHeaderRow(ws);
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '', range: headerRow });
  console.log(`Прочитано строк из Excel: ${rows.length}`);
  return rows;
}

function main() {
  const rows = readLevelsFile();
  const items = [];
  let sortOrder = 1;
  for (const r of rows) {
    // Используем код функциональной подгруппы как код атрибута
    const code = String(
      r['Код функциональной подгруппы обеспечения'] || r['Код атрибута'] || r['code'] || ''
    ).trim();

    const level1 = String(r['Вид обеспечения'] || r['level1'] || '').trim();
    const level2 = String(r['Тип обеспечения'] || r['level2'] || '').trim();
    const level3 = String(r['Подтип обеспечения'] || r['level3'] || '').trim();
    const level4 = String(r['Функциональная группа обеспечения'] || r['level4'] || '').trim();
    const level5 = String(r['Функциональная подгруппа обеспечения'] || r['level5'] || '').trim();

    // Если нет функциональной подгруппы, пропускаем
    if (!level5) continue;

    // Если нет кода, генерируем из level5
    const finalCode = code || `attr-${level5.substring(0, 20).replace(/\s+/g, '-')}`;
    // Наименование убираем из модели (используем код как обязательное поле)
    const name = finalCode;

    items.push({
      id: `attrlvl-${finalCode}`,
      code: finalCode,
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
