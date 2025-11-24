/**
 * Утилита для обновления существующих данных:
 * - Рыночная стоимость должна быть обязательно заполнена
 * - Залоговая стоимость = рыночная * 0.75
 * - LTV >= 70% (отношение суммы задолженности к рыночной стоимости предметов залога)
 */

import type { ExtendedCollateralCard } from '@/types';
import type { CollateralPortfolioEntry } from '@/types/portfolio';
import extendedStorageService from '@/services/ExtendedStorageService';

const COLLATERAL_DISCOUNT = 0.75; // 75% от рыночной стоимости
const MIN_LTV = 0.7; // Минимальный LTV 70%

/**
 * Обновить рыночную и залоговую стоимость для карточки обеспечения
 */
export const updateCollateralCardValues = (card: ExtendedCollateralCard): ExtendedCollateralCard => {
  // Рыночная стоимость должна быть обязательно заполнена
  let marketValue = card.marketValue || 0;
  
  // Если рыночная стоимость отсутствует или равна 0, устанавливаем минимальное значение
  if (!marketValue || marketValue <= 0) {
    marketValue = 1000000; // Минимальная рыночная стоимость 1 млн руб.
  }
  
  // Залоговая стоимость рассчитывается от рыночной с дисконтом 75%
  const pledgeValue = Math.floor(marketValue * COLLATERAL_DISCOUNT);
  
  return {
    ...card,
    marketValue,
    pledgeValue,
  };
};

/**
 * Обновить рыночную и залоговую стоимость для договора портфеля
 * с учетом требования LTV >= 70%
 */
export const updatePortfolioContractValues = (contract: CollateralPortfolioEntry): CollateralPortfolioEntry => {
  const debtRub = typeof contract.debtRub === 'number' 
    ? contract.debtRub 
    : parseFloat(String(contract.debtRub || 0));
  
  let marketValue = typeof contract.marketValue === 'number' 
    ? contract.marketValue 
    : parseFloat(String(contract.marketValue || 0));
  
  // Если рыночная стоимость отсутствует или равна 0, устанавливаем минимальное значение
  if (!marketValue || marketValue <= 0) {
    marketValue = 1000000; // Минимальная рыночная стоимость 1 млн руб.
  }
  
  // Проверяем LTV: debt / marketValue >= 0.7
  // Если LTV < 0.7, увеличиваем рыночную стоимость
  if (debtRub > 0 && marketValue > 0) {
    const currentLTV = debtRub / marketValue;
    
    if (currentLTV < MIN_LTV) {
      // Увеличиваем рыночную стоимость так, чтобы LTV был в диапазоне 70-80%
      // debt / marketValue >= 0.7 => marketValue <= debt / 0.7
      // debt / marketValue <= 0.8 => marketValue >= debt / 0.8
      const minMarketValueForLTV = Math.ceil(debtRub / 0.8); // Для LTV = 80% (максимум)
      const maxMarketValueForLTV = Math.ceil(debtRub / 0.7); // Для LTV = 70% (минимум)
      
      // Устанавливаем рыночную стоимость в диапазоне 70-80% LTV
      if (marketValue < minMarketValueForLTV) {
        marketValue = minMarketValueForLTV;
      }
      if (marketValue > maxMarketValueForLTV) {
        marketValue = maxMarketValueForLTV;
      }
    }
  }
  
  // Рассчитываем залоговую стоимость
  const collateralValue = Math.floor(marketValue * COLLATERAL_DISCOUNT);
  
  return {
    ...contract,
    marketValue,
    collateralValue,
    currentMarketValue: marketValue, // Обновляем текущую рыночную стоимость
  };
};

/**
 * Обновить все карточки обеспечения в IndexedDB
 */
export const updateAllCollateralCards = async (): Promise<number> => {
  try {
    const cards = await extendedStorageService.getExtendedCards();
    let updatedCount = 0;
    
    for (const card of cards) {
      const updatedCard = updateCollateralCardValues(card);
      
      // Проверяем, изменились ли значения
      if (updatedCard.marketValue !== card.marketValue || updatedCard.pledgeValue !== card.pledgeValue) {
        await extendedStorageService.saveExtendedCard(updatedCard);
        updatedCount++;
      }
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Ошибка обновления карточек обеспечения:', error);
    throw error;
  }
};

/**
 * Обновить все договоры портфеля в массиве
 */
export const updateAllPortfolioContracts = (contracts: CollateralPortfolioEntry[]): CollateralPortfolioEntry[] => {
  return contracts.map(contract => updatePortfolioContractValues(contract));
};

