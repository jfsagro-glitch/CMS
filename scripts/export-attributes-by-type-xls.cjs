/* eslint-disable no-console */
/**
 * Export attributes applied per property type to XLS.
 * Output: ATRIBUTI/ALL in/all-attributes-by-type.xls
 * This mirrors the fallback attributes used in the UI when dictionary is not populated.
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdir(new URL('file://' + dirPath));
  }
}

function ensureDirNode(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getPropertyTypes() {
  // Comprehensive set of property types used in UI and mappings
  return [
    // High-level categories
    'Недвижимость',
    'Движимое имущество',
    'Имущественные права',

    // Недвижимость
    'Квартира',
    'Дом',
    'Здание',
    'Помещение',
    'Земельный участок',

    // Транспорт / спецтехника
    'Легковой автомобиль',
    'Грузовой автомобиль',
    'Автобус',
    'Мотоцикл',
    'Трактор',
    'Спецтехника',
    'Транспортные средства',

    // Оборудование
    'Оборудование',
    'Станки',
    'Производственное оборудование',

    // Товары
    'Товары',
    'Товары в обороте',

    // ЦБ
    'Ценные бумаги',
    'Акции',
    'Облигации',

    // Права
    'Права требования',

    // Прочее
    'Будущий урожай',
    'Денежные средства',
    'Драгоценные металлы',
  ];
}

function getDefaultAttributes(group) {
  return [
    { code: 'NAME_OF_PROPERTY', name: 'Наименование объекта', type: 'string', required: true, section: 'Основные', group },
    { code: 'OWNER_TIN',        name: 'ИНН собственника/залогодателя', type: 'string', required: true, section: 'Основные', group },
    { code: 'ADDRESS_BASE',     name: 'Адрес объекта', type: 'string', required: true, section: 'Основные', group },
    { code: 'TYPE_COLLATERAL',  name: 'Тип залога', type: 'string', required: true, section: 'Оценка', group },
    { code: 'HAVEL_MARKET',     name: 'Рыночная стоимость', type: 'number', required: true, section: 'Оценка', group },
  ];
}

function main() {
  const root = process.cwd();
  const outDir = path.join(root, 'ATRIBUTI', 'ALL in');
  ensureDirNode(outDir);
  const outFile = path.join(outDir, 'all-attributes-by-type.xls');

  const propertyTypes = getPropertyTypes();

  // Build rows
  const rows = [];
  for (const pt of propertyTypes) {
    const attrs = getDefaultAttributes(pt);
    for (const a of attrs) {
      rows.push({
        'Тип имущества': pt,
        'Код атрибута': a.code,
        'Наименование атрибута': a.name,
        'Тип данных': a.type,
        'Обязательный': a.required ? 'Да' : 'Нет',
        'Раздел': a.section,
      });
    }
  }

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows, { skipHeader: false });
  xlsx.utils.book_append_sheet(wb, ws, 'AttributesByType');

  // Write as BIFF8 .xls for maximum compatibility with Windows Excel
  xlsx.writeFile(wb, outFile, { bookType: 'biff8' });
  console.log('✅ XLS written:', outFile);
  console.log(`Типов имущества: ${propertyTypes.length}, строк: ${rows.length}`);
}

if (require.main === module) {
  main();
}

module.exports = { main };

