/**
 * Утилита для обновления стоимости договоров портфеля на основе привязанных объектов
 */

import type { CollateralPortfolioEntry } from '@/types/portfolio';
import type { ExtendedCollateralCard } from '@/types';
import extendedStorageService from '@/services/ExtendedStorageService';

/**
 * Обновить стоимость договоров на основе привязанных объектов
 */
export const updatePortfolioFromObjects = async (
  contracts: CollateralPortfolioEntry[]
): Promise<CollateralPortfolioEntry[]> => {
  try {
    const allCards = await extendedStorageService.getExtendedCards();
    
    // Группируем объекты по договорам
    const objectsByContract = new Map<string | number, ExtendedCollateralCard[]>();
    
    allCards.forEach(card => {
      const contractRef = card.reference || card.contractNumber;
      if (contractRef) {
        const key = String(contractRef);
        if (!objectsByContract.has(key)) {
          objectsByContract.set(key, []);
        }
        objectsByContract.get(key)!.push(card);
      }
    });
    
    // Обновляем договоры
    const updatedContracts = contracts.map(contract => {
      const contractRef = String(contract.reference || contract.contractNumber || '');
      const attachedObjects = objectsByContract.get(contractRef) || [];
      
      if (attachedObjects.length === 0) {
        return contract; // Если нет привязанных объектов, оставляем как есть
      }
      
      // Рассчитываем совокупную стоимость
      const totalMarketValue = attachedObjects.reduce((sum, obj) => sum + (obj.marketValue || 0), 0);
      const totalPledgeValue = attachedObjects.reduce((sum, obj) => sum + (obj.pledgeValue || 0), 0);
      
      // Обновляем стоимость договора
      return {
        ...contract,
        marketValue: totalMarketValue,
        collateralValue: totalPledgeValue,
        currentMarketValue: totalMarketValue,
      };
    });
    
    return updatedContracts;
  } catch (error) {
    console.error('Ошибка обновления портфеля:', error);
    return contracts;
  }
};

/**
 * Рассчитать LTV для договора
 */
export const calculateLTV = (contract: CollateralPortfolioEntry): number | null => {
  const debt = typeof contract.debtRub === 'number' 
    ? contract.debtRub 
    : parseFloat(String(contract.debtRub || 0));
  const marketValue = typeof contract.marketValue === 'number' 
    ? contract.marketValue 
    : parseFloat(String(contract.marketValue || 0));
  
  if (marketValue > 0) {
    return Math.min(debt / marketValue, 5); // Ограничиваем выбросы
  }
  return null;
};

