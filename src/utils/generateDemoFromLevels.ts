import storageService from '@/services/StorageService';
import { generateId } from '@/utils/helpers';
import type { CollateralCard } from '@/types';

function pickMainCategory(level1: string): 'real_estate' | 'movable' | 'property_rights' {
  const s = (level1 || '').toLowerCase();
  if (s.includes('недвиж')) return 'real_estate';
  if (s.includes('транспорт') || s.includes('движим') || s.includes('оборуд')) return 'movable';
  return 'property_rights';
}

function cbCodeForCategory(cat: 'real_estate' | 'movable' | 'property_rights'): number {
  if (cat === 'real_estate') return 2010;
  if (cat === 'movable') return 3010;
  return 4010;
}

const DEMO_VERSION_KEY = 'cms_registry_demo_version';

async function seedFromRegistryDemo(): Promise<number> {
  try {
    const base = (import.meta as any)?.env?.BASE_URL ?? '/';
    const resolved = new URL(base, window.location.origin);
    const normalizedPath = resolved.pathname.endsWith('/') ? resolved.pathname : `${resolved.pathname}/`;
    const url = `${resolved.origin}${normalizedPath}registry-demo.json?v=${Date.now()}`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      return 0;
    }
    const json = await resp.json();
    const cards: CollateralCard[] = Array.isArray(json.cards) ? json.cards : [];
    if (cards.length === 0) return 0;

    const remoteVersion = json.version || json.generatedAt || `registry-demo-${cards.length}`;
    const storedVersion = localStorage.getItem(DEMO_VERSION_KEY);
    // Всегда очищаем и перезагружаем, если версия изменилась или данных нет
    const needsSeed = !storedVersion || storedVersion !== remoteVersion;
    if (!needsSeed) {
      console.log('Версия демо-данных не изменилась, пропускаем перезагрузку');
      return 0;
    }

    console.log(`Версия изменилась: ${storedVersion} -> ${remoteVersion}, очищаем и перезагружаем...`);
    await storageService.clearCollateralCards();
    for (const card of cards) {
      const cardToSave: CollateralCard = {
        ...card,
        createdAt: new Date(card.createdAt || new Date()),
        updatedAt: new Date(card.updatedAt || new Date()),
      };
      await storageService.saveCollateralCard(cardToSave);
    }
    localStorage.setItem(DEMO_VERSION_KEY, remoteVersion);
    return cards.length;
  } catch (error) {
    console.warn('Не удалось загрузить registry-demo.json', error);
    return 0;
  }
}

async function seedFromAttributeLevels(): Promise<number> {
  try {
    // Сначала пробуем загрузить registry-demo.json (если есть)
    const base = (import.meta as any)?.env?.BASE_URL ?? '/';
    const resolved = new URL(base, window.location.origin);
    const normalizedPath = resolved.pathname.endsWith('/') ? resolved.pathname : `${resolved.pathname}/`;
    const demoUrl = `${resolved.origin}${normalizedPath}registry-demo.json?v=${Date.now()}`;
    const demoResp = await fetch(demoUrl, { cache: 'no-store' });
    if (demoResp.ok) {
      const demoJson = await demoResp.json();
      const demoCards: CollateralCard[] = Array.isArray(demoJson.cards) ? demoJson.cards : [];
      if (demoCards.length > 0) {
        const remoteVersion = demoJson.version || demoJson.generatedAt || `registry-demo-${demoCards.length}`;
        const storedVersion = localStorage.getItem(DEMO_VERSION_KEY);
        const needsSeed = !storedVersion || storedVersion !== remoteVersion;
        if (needsSeed) {
          await storageService.clearCollateralCards();
          for (const card of demoCards) {
            const cardToSave: CollateralCard = {
              ...card,
              createdAt: new Date(card.createdAt || new Date()),
              updatedAt: new Date(card.updatedAt || new Date()),
            };
            await storageService.saveCollateralCard(cardToSave);
          }
          localStorage.setItem(DEMO_VERSION_KEY, remoteVersion);
          return demoCards.length;
        }
        return 0;
      }
    }

    // Fallback: генерируем из attribute-levels.json
    const url = `${resolved.origin}${normalizedPath}attribute-levels.json?v=${Date.now()}`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      console.warn('generateCardsFromAttributeLevels: attribute-levels.json not found');
      return 0;
    }
    const json = await resp.json();
    const items: any[] = Array.isArray(json.items) ? json.items : [];
    if (items.length === 0) return 0;
    
    // Очищаем старые карточки перед генерацией новых
    await storageService.clearCollateralCards();

    const subgroupToLevels = new Map<
      string,
      { level1: string; level2: string; level3: string; level4: string; level5: string }
    >();
    items.forEach(it => {
      const m = it.metadata || {};
      const key = String(m.level5 || '').trim();
      if (!key) return;
      if (!subgroupToLevels.has(key)) {
        subgroupToLevels.set(key, {
          level1: m.level1 || '',
          level2: m.level2 || '',
          level3: m.level3 || '',
          level4: m.level4 || '',
          level5: m.level5 || '',
        });
      }
    });

    let created = 0;
    let seq = 1;

    for (const [, lv] of subgroupToLevels) {
      for (let i = 0; i < 3; i++) {
        const mainCategory = pickMainCategory(lv.level1);
        const card: CollateralCard = {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await storageService.saveCollateralCard(card);
        created++;
        seq++;
      }
    }

    localStorage.setItem(DEMO_VERSION_KEY, `fallback-${Date.now()}`);
    return created;
  } catch (error) {
    console.error('Ошибка генерации демо из уровней:', error);
    return 0;
  }
}

export async function generateCardsFromAttributeLevels(forceReload: boolean = false): Promise<number> {
  // Если принудительная перезагрузка, очищаем версию
  if (forceReload) {
    localStorage.removeItem(DEMO_VERSION_KEY);
  }
  
  const seededFromDemo = await seedFromRegistryDemo();
  if (seededFromDemo > 0) return seededFromDemo;
  return seedFromAttributeLevels();
}


