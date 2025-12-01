// Интерфейс AppraisalSkills должен совпадать с определением в ReferencePage.tsx
export interface AppraisalSkills {
  incomeApproach: number;
  incomeMethods: {
    dcf: number;
    directCapitalization: number;
    grossRentMultiplier: number;
  };
  comparativeApproach: number;
  comparativeMethods: {
    salesComparison: number;
    marketExtraction: number;
  };
  costApproach: number;
  costMethods: {
    replacementCost: number;
    reproductionCost: number;
    depreciation: number;
  };
}

/**
 * Конфигурация предпочтительных подходов оценки для разных типов активов
 */
export interface AssetTypeSkillsConfig {
  incomeApproach: number;
  incomeMethods: {
    dcf: number;
    directCapitalization: number;
    grossRentMultiplier: number;
  };
  comparativeApproach: number;
  comparativeMethods: {
    salesComparison: number;
    marketExtraction: number;
  };
  costApproach: number;
  costMethods: {
    replacementCost: number;
    reproductionCost: number;
    depreciation: number;
  };
}

/**
 * Получить предпочтительные настройки эквалайзера для типа актива
 */
export function getPreferredSkillsForAssetType(assetType: string): Partial<AppraisalSkills> | null {
  const typeLower = assetType.toLowerCase().trim();
  
  // Недвижимое имущество - доходоприносящее (торговые центры, офисные здания, склады)
  const incomeGeneratingRealEstate = [
    'торговый центр',
    'торгово-развлекательный центр',
    'офисное здание',
    'офисный центр',
    'бизнес-центр',
    'склад',
    'складской комплекс',
    'логистический центр',
    'гостиница',
    'отель',
    'гостиничный комплекс',
    'ресторан',
    'кафе',
    'производственное здание',
    'производственный комплекс',
    'арендная недвижимость',
    'доходная недвижимость',
  ];
  
  if (incomeGeneratingRealEstate.some(keyword => typeLower.includes(keyword))) {
    return {
      incomeApproach: 75,
      incomeMethods: {
        dcf: 60,
        directCapitalization: 80,
        grossRentMultiplier: 70,
      },
      comparativeApproach: 60,
      comparativeMethods: {
        salesComparison: 70,
        marketExtraction: 50,
      },
      costApproach: 30,
      costMethods: {
        replacementCost: 40,
        reproductionCost: 30,
        depreciation: 20,
      },
    };
  }
  
  // Недвижимое имущество - жилое (квартиры, дома)
  const residentialRealEstate = [
    'квартира',
    'жилое помещение',
    'жилой дом',
    'дом',
    'коттедж',
    'таунхаус',
    'апартаменты',
  ];
  
  if (residentialRealEstate.some(keyword => typeLower.includes(keyword))) {
    return {
      incomeApproach: 40,
      incomeMethods: {
        dcf: 30,
        directCapitalization: 50,
        grossRentMultiplier: 40,
      },
      comparativeApproach: 85,
      comparativeMethods: {
        salesComparison: 90,
        marketExtraction: 80,
      },
      costApproach: 25,
      costMethods: {
        replacementCost: 30,
        reproductionCost: 25,
        depreciation: 20,
      },
    };
  }
  
  // Недвижимое имущество - общее (здания, помещения, сооружения)
  const generalRealEstate = [
    'здание',
    'помещение',
    'сооружение',
    'недвижимое имущество',
    'имущественный комплекс',
    'единый недвижимый комплекс',
    'объект незавершенного строительства',
    'машино-место',
  ];
  
  if (generalRealEstate.some(keyword => typeLower.includes(keyword))) {
    return {
      incomeApproach: 50,
      incomeMethods: {
        dcf: 45,
        directCapitalization: 55,
        grossRentMultiplier: 50,
      },
      comparativeApproach: 75,
      comparativeMethods: {
        salesComparison: 80,
        marketExtraction: 70,
      },
      costApproach: 40,
      costMethods: {
        replacementCost: 45,
        reproductionCost: 40,
        depreciation: 35,
      },
    };
  }
  
  // Земельные участки
  if (typeLower.includes('земельный участок') || typeLower.includes('земля')) {
    return {
      incomeApproach: 30,
      incomeMethods: {
        dcf: 25,
        directCapitalization: 35,
        grossRentMultiplier: 30,
      },
      comparativeApproach: 80,
      comparativeMethods: {
        salesComparison: 85,
        marketExtraction: 75,
      },
      costApproach: 20,
      costMethods: {
        replacementCost: 25,
        reproductionCost: 20,
        depreciation: 15,
      },
    };
  }
  
  // Движимое имущество - транспортные средства
  const vehicles = [
    'наземные безрельсовые механические транспортные средства',
    'автомобиль',
    'транспортное средство',
    'железнодорожный подвижной состав',
    'плавучие сооружения',
    'судно',
    'воздушные суда',
  ];
  
  if (vehicles.some(keyword => typeLower.includes(keyword))) {
    return {
      incomeApproach: 20,
      incomeMethods: {
        dcf: 15,
        directCapitalization: 25,
        grossRentMultiplier: 20,
      },
      comparativeApproach: 85,
      comparativeMethods: {
        salesComparison: 90,
        marketExtraction: 80,
      },
      costApproach: 60,
      costMethods: {
        replacementCost: 70,
        reproductionCost: 65,
        depreciation: 55,
      },
    };
  }
  
  // Движимое имущество - оборудование и техника
  const equipment = [
    'машины и оборудование',
    'оборудование',
    'техника',
    'прочие движимые вещи',
  ];
  
  if (equipment.some(keyword => typeLower.includes(keyword))) {
    return {
      incomeApproach: 25,
      incomeMethods: {
        dcf: 20,
        directCapitalization: 30,
        grossRentMultiplier: 25,
      },
      comparativeApproach: 60,
      comparativeMethods: {
        salesComparison: 65,
        marketExtraction: 55,
      },
      costApproach: 80,
      costMethods: {
        replacementCost: 85,
        reproductionCost: 80,
        depreciation: 75,
      },
    };
  }
  
  // Товары в обороте
  if (typeLower.includes('товары в обороте') || typeLower.includes('товар')) {
    return {
      incomeApproach: 15,
      incomeMethods: {
        dcf: 10,
        directCapitalization: 20,
        grossRentMultiplier: 15,
      },
      comparativeApproach: 70,
      comparativeMethods: {
        salesComparison: 75,
        marketExtraction: 65,
      },
      costApproach: 50,
      costMethods: {
        replacementCost: 55,
        reproductionCost: 50,
        depreciation: 45,
      },
    };
  }
  
  // Ценные бумаги и доли
  const securities = [
    'доли в уставных капиталах',
    'доли',
    'акции',
    'ценные бумаги',
    'прочие ценные бумаги',
    'эмиссионные ценные бумаги',
  ];
  
  if (securities.some(keyword => typeLower.includes(keyword))) {
    return {
      incomeApproach: 70,
      incomeMethods: {
        dcf: 75,
        directCapitalization: 65,
        grossRentMultiplier: 60,
      },
      comparativeApproach: 60,
      comparativeMethods: {
        salesComparison: 65,
        marketExtraction: 55,
      },
      costApproach: 20,
      costMethods: {
        replacementCost: 25,
        reproductionCost: 20,
        depreciation: 15,
      },
    };
  }
  
  // Права требования
  if (typeLower.includes('права требования') || typeLower.includes('права')) {
    return {
      incomeApproach: 60,
      incomeMethods: {
        dcf: 65,
        directCapitalization: 55,
        grossRentMultiplier: 50,
      },
      comparativeApproach: 40,
      comparativeMethods: {
        salesComparison: 45,
        marketExtraction: 35,
      },
      costApproach: 10,
      costMethods: {
        replacementCost: 15,
        reproductionCost: 10,
        depreciation: 5,
      },
    };
  }
  
  // Космические объекты, специальные объекты
  if (typeLower.includes('космические объекты')) {
    return {
      incomeApproach: 30,
      incomeMethods: {
        dcf: 25,
        directCapitalization: 35,
        grossRentMultiplier: 30,
      },
      comparativeApproach: 40,
      comparativeMethods: {
        salesComparison: 45,
        marketExtraction: 35,
      },
      costApproach: 85,
      costMethods: {
        replacementCost: 90,
        reproductionCost: 85,
        depreciation: 80,
      },
    };
  }
  
  // Если тип не найден, возвращаем null (используются настройки по умолчанию)
  return null;
}

/**
 * Применить предпочтительные настройки для типа актива с возможностью частичного обновления
 */
export function applyPreferredSkills(
  currentSkills: AppraisalSkills,
  assetType: string,
  merge: boolean = true
): AppraisalSkills {
  const preferred = getPreferredSkillsForAssetType(assetType);
  
  if (!preferred) {
    return currentSkills;
  }
  
  if (merge) {
    // Объединяем с текущими настройками (предпочтительные имеют приоритет)
    return {
      ...currentSkills,
      ...preferred,
      incomeMethods: {
        ...currentSkills.incomeMethods,
        ...preferred.incomeMethods,
      },
      comparativeMethods: {
        ...currentSkills.comparativeMethods,
        ...preferred.comparativeMethods,
      },
      costMethods: {
        ...currentSkills.costMethods,
        ...preferred.costMethods,
      },
    };
  } else {
    // Полная замена
    return preferred as AppraisalSkills;
  }
}

