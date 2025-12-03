/* eslint-disable no-console */
/**
 * Spravochniki Indexer (CommonJS)
 * - Reads all XLSX files in Spravochniki/
 * - Extracts dictionary items and infers main label column
 * - Reads existing attributes from src/services/ReferenceDataService.ts
 * - Produces unified JSON with attributes, dictionaries, dependencies and levels
 * - Writes to Spravochniki/str/unified-attributes.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const xlsx = require('xlsx');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яё\-_.]+/gi, '')
    .replace(/-+/g, '-')
    .substring(0, 64);
}

function stableId(prefix, value) {
  const hash = crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 10);
  return `${prefix}-${hash}`;
}

function readReferenceAttributes(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const attrRegex = /\{\s*id:\s*'([^']+)'\s*,\s*code:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'/g;
    const result = [];
    let match;
    while ((match = attrRegex.exec(text)) !== null) {
      const [, id, code, name] = match;
      result.push({
        id,
        code,
        name,
      });
    }
    return result;
  } catch (e) {
    console.warn('Cannot read ReferenceDataService.ts, proceeding without cross-map:', e.message);
    return [];
  }
}

function inferMainLabelKey(keys) {
  const lowerKeys = keys.map(k => k.toLowerCase());
  const candidates = [
    'наименование',
    'название',
    'наименование вида',
    'наименование категории',
    'вид',
    'тип',
    'значение',
    'value',
    'name',
    'label',
    'описание',
  ];
  for (const cand of candidates) {
    const idx = lowerKeys.findIndex(k => k.includes(cand));
    if (idx >= 0) return keys[idx];
  }
  return keys.find(k => k && k.trim().length > 0) || keys[0];
}

function buildDictionaryFromSheet(fileKey, sheet) {
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  const items = [];
  if (rows.length === 0) {
    return { items, meta: { rows: 0, columns: [] } };
  }
  const columns = Object.keys(rows[0]);
  const labelKey = inferMainLabelKey(columns);
  for (const row of rows) {
    const hasAny = Object.values(row).some(v => String(v).trim().length > 0);
    if (!hasAny) continue;
    const label = String(row[labelKey] ?? '').trim() || JSON.stringify(row);
    const id = stableId(`dict-${fileKey}`, `${label}`);
    items.push({
      id,
      label,
      raw: row,
    });
  }
  return {
    items,
    meta: {
      rows: rows.length,
      columns,
      labelKey,
    },
  };
}

function guessDependency(dictKey, referenceAttrs) {
  const key = dictKey.toLowerCase();
  const candidates = referenceAttrs.filter(a => {
    const code = (a.code || '').toLowerCase();
    const name = (a.name || '').toLowerCase();
    return (
      code.includes(key) ||
      key.includes(code) ||
      name.includes(key) ||
      key.includes(name)
    );
  });
  return candidates.slice(0, 5);
}

function main() {
  const rootDir = process.cwd();
  const spravDir = path.resolve(rootDir, 'Spravochniki');
  const outDir = path.join(spravDir, 'str');
  ensureDir(outDir);

  const referencePath = path.resolve(rootDir, 'src', 'services', 'ReferenceDataService.ts');
  const referenceAttributes = readReferenceAttributes(referencePath);

  const files = fs
    .readdirSync(spravDir, { withFileTypes: true })
    .filter(d => d.isFile() && d.name.toLowerCase().endsWith('.xlsx'))
    .map(d => d.name)
    .sort();

  const dictionaries = [];
  for (const file of files) {
    try {
      const fullPath = path.join(spravDir, file);
      const workbook = xlsx.readFile(fullPath);
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const fileKey = slugify(path.basename(file, path.extname(file)));

      const dict = buildDictionaryFromSheet(fileKey, sheet);
      const dependencyHints = guessDependency(fileKey, referenceAttributes);

      dictionaries.push({
        key: fileKey,
        sourceFile: file,
        sheet: firstSheetName,
        level: 1,
        dependencyHints: dependencyHints.map(h => ({ id: h.id, code: h.code, name: h.name })),
        ...dict,
      });
    } catch (e) {
      console.warn(`Failed to parse ${file}:`, e.message);
    }
  }

  const unifiedAttributes = dictionaries.map(d => ({
    id: stableId('attr', d.key),
    code: d.key,
    name: d.key.replace(/_/g, ' '),
    type: 'enum',
    level: d.level,
    sourceFile: d.sourceFile,
    valuesCount: d.items.length,
    dependencyHints: d.dependencyHints || [],
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    sourcePath: 'Spravochniki/*.xlsx',
    files,
    referenceAttributesCount: referenceAttributes.length,
    referenceAttributes,
    dictionaries,
    attributes: unifiedAttributes,
  };

  const outFile = path.join(outDir, 'unified-attributes.json');
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
  console.log('✅ Unified attributes written to:', outFile);
  console.log('📦 Dictionaries:', dictionaries.length, 'Attributes:', unifiedAttributes.length);
}

module.exports = { main };

if (require.main === module) {
  main();
}

