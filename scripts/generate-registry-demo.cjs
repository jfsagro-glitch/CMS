/* eslint-disable no-console */
/**
 * Generate registry demo cards from attribute levels and reference dictionaries
 * Input:
 * - ATRIBUTI/All out/all-attributes-by-top.xls (hierarchy)
 * - ATRIBUTI/All out/all-els/*.xlsx (reference dictionaries)
 * Output: public/registry-demo.json
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
      return row;
    }
  }
  return 0;
}

function readAttributeLevels() {
  const root = process.cwd();
  const xlsPath = path.join(root, 'ATRIBUTI', 'All out', 'all-attributes-by-top.xls');
  if (!fs.existsSync(xlsPath)) {
    throw new Error(`Не найден файл уровней: ${xlsPath}`);
  }

  const wb = xlsx.readFile(xlsPath);
  console.log(`Листы в файле: ${wb.SheetNames.join(', ')}`);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const headerRow = findHeaderRow(ws);
  console.log(`Строка заголовка: ${headerRow}`);
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '', range: headerRow });
  console.log(`Прочитано строк из Excel: ${rows.length}`);
  if (rows.length > 0) {
    console.log(`Пример первой строки (ключи):`, Object.keys(rows[0]).slice(0, 10));
    const firstRow = rows[0];
    console.log(`Пример значений:`, {
      code: firstRow['Код атрибута'] || firstRow['code'],
      level1: firstRow['Вид обеспечения'] || firstRow['level1'],
      level2: firstRow['Тип обеспечения'] || firstRow['level2'],
    });
  }

  const items = [];
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

    items.push({
      code: finalCode,
      level1,
      level2,
      level3,
      level4,
      level5,
    });
  }

  return items;
}

function readReferenceDictionary(filePath) {
  try {
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
    const items = [];
    for (const r of rows) {
      const code = String(r['Код'] || r['code'] || r['Код значения'] || '').trim();
      const name = String(r['Наименование'] || r['name'] || r['Значение'] || '').trim();
      if (code || name) {
        items.push({ code, name });
      }
    }
    return items;
  } catch (error) {
    console.warn(`Ошибка чтения справочника ${filePath}:`, error.message);
    return [];
  }
}

function loadAllReferenceDictionaries() {
  const root = process.cwd();
  const elsDir = path.join(root, 'ATRIBUTI', 'All out', 'all-els');
  if (!fs.existsSync(elsDir)) {
    console.warn(`Папка справочников не найдена: ${elsDir}`);
    return {};
  }

  const dicts = {};
  const files = fs.readdirSync(elsDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

  for (const file of files) {
    const filePath = path.join(elsDir, file);
    const baseName = path.basename(file, path.extname(file));
    dicts[baseName] = readReferenceDictionary(filePath);
  }

  return dicts;
}

function pickMainCategory(level1) {
  const s = (level1 || '').toLowerCase();
  if (s.includes('недвиж')) return 'real_estate';
  if (s.includes('транспорт') || s.includes('движим') || s.includes('оборуд')) return 'movable';
  return 'property_rights';
}

function cbCodeForCategory(cat) {
  if (cat === 'real_estate') return 2010;
  if (cat === 'movable') return 3010;
  return 4010;
}

function generateId() {
  return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function pickRandomValue(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCharacteristics(level5, dicts) {
  const chars = {};

  // Базовые характеристики из справочников
  if (dicts.collateral_type && dicts.collateral_type.length > 0) {
    const ct = pickRandomValue(dicts.collateral_type);
    if (ct) chars.collateralType = ct.code || ct.name;
  }

  if (dicts.collateral_status && dicts.collateral_status.length > 0) {
    const cs = pickRandomValue(dicts.collateral_status);
    if (cs) chars.status = cs.code || cs.name;
  }

  if (dicts.ownership_type && dicts.ownership_type.length > 0) {
    const ot = pickRandomValue(dicts.ownership_type);
    if (ot) chars.ownershipType = ot.code || ot.name;
  }

  if (dicts.liquidity_levels && dicts.liquidity_levels.length > 0) {
    const ll = pickRandomValue(dicts.liquidity_levels);
    if (ll) chars.liquidityLevel = ll.code || ll.name;
  }

  // Для недвижимости
  if (level5.toLowerCase().includes('недвиж') || level5.toLowerCase().includes('квартир')) {
    if (dicts.real_estate_type && dicts.real_estate_type.length > 0) {
      const ret = pickRandomValue(dicts.real_estate_type);
      if (ret) chars.realEstateType = ret.code || ret.name;
    }
    if (dicts.house_type && dicts.house_type.length > 0) {
      const ht = pickRandomValue(dicts.house_type);
      if (ht) chars.houseType = ht.code || ht.name;
    }
    if (dicts.realestate_condition && dicts.realestate_condition.length > 0) {
      const rec = pickRandomValue(dicts.realestate_condition);
      if (rec) chars.condition = rec.code || rec.name;
    }
    chars.area = Math.floor(Math.random() * 200 + 30);
    chars.rooms = Math.floor(Math.random() * 5 + 1);
  }

  // Для транспорта
  if (level5.toLowerCase().includes('транспорт') || level5.toLowerCase().includes('автомобил')) {
    chars.year = Math.floor(Math.random() * 15 + 2010);
    chars.mileage = Math.floor(Math.random() * 200000 + 10000);
    chars.engineVolume = (Math.random() * 3 + 1).toFixed(1);
  }

  // Рыночная стоимость
  chars.marketValue = Math.floor(Math.random() * 50000000 + 1000000);
  chars.pledgeValue = Math.floor(chars.marketValue * (0.5 + Math.random() * 0.3));

  return chars;
}

function main() {
  console.log('📖 Чтение уровней атрибутов...');
  const levels = readAttributeLevels();
  console.log(`✅ Прочитано ${levels.length} записей уровней`);

  console.log('📚 Загрузка справочников...');
  const dicts = loadAllReferenceDictionaries();
  console.log(`✅ Загружено ${Object.keys(dicts).length} справочников`);

  // Группируем по функциональным подгруппам (level5)
  const subgroupMap = new Map();
  for (const item of levels) {
    const key = item.level5;
    if (!key) continue;
    if (!subgroupMap.has(key)) {
      subgroupMap.set(key, {
        level1: item.level1,
        level2: item.level2,
        level3: item.level3,
        level4: item.level4,
        level5: item.level5,
      });
    }
  }

  console.log(`📦 Найдено ${subgroupMap.size} функциональных подгрупп`);

  // Генерируем по 3 карточки на каждую подгруппу
  const cards = [];
  let seq = 1;

  for (const [, lv] of subgroupMap) {
    for (let i = 0; i < 3; i++) {
      const mainCategory = pickMainCategory(lv.level1);
      const characteristics = generateCharacteristics(lv.level5, dicts);

      const card = {
        id: generateId(),
        mainCategory,
        classification: {
          level0: lv.level1 || '—',
          level1: lv.level2 || '—',
          level2: lv.level3 || lv.level4 || lv.level5 || '—',
        },
        attributeLevels: {
          level1: lv.level1,
          level2: lv.level2,
          level3: lv.level3,
          level4: lv.level4,
          level5: lv.level5,
        },
        cbCode: cbCodeForCategory(mainCategory),
        status: Math.random() > 0.3 ? 'approved' : 'editing',
        number: `ДЕМО-${String(seq).padStart(5, '0')}`,
        name: `${lv.level5 || lv.level4 || 'Обеспечение'} (${lv.level2 || lv.level1}) #${i + 1}`,
        characteristics,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      cards.push(card);
      seq++;
    }
  }

  const output = {
    version: `registry-demo-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    count: cards.length,
    cards,
  };

  const outPath = path.join(process.cwd(), 'public', 'registry-demo.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ registry-demo.json written: ${outPath}`);
  console.log(`📊 Создано ${cards.length} карточек из ${subgroupMap.size} подгрупп`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
