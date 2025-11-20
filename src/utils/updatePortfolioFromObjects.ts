/**
 * Утилита для обновления стоимости договоров портфеля на основе привязанных объектов
 */

import type { CollateralPortfolioEntry } from '@/types/portfolio';
import type { ExtendedCollateralCard } from '@/types';
import extendedStorageService from '@/services/ExtendedStorageService';

/**
 * Дисконт для расчета залоговой стоимости (70-80% от рыночной)
 */
const COLLATERAL_DISCOUNT = 0.75; // 75% от рыночной стоимости

/**
 * Рассчитать залоговую стоимость от рыночной с применением дисконта
 */
const calculatePledgeValue = (marketValue: number): number => {
  return Math.floor(marketValue * COLLATERAL_DISCOUNT);
};

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
      
      // Рассчитываем совокупную рыночную стоимость
      const totalMarketValue = attachedObjects.reduce((sum, obj) => sum + (obj.marketValue || 0), 0);
      
      // Рассчитываем залоговую стоимость с применением дисконта
      const totalPledgeValue = calculatePledgeValue(totalMarketValue);
      
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
 * LTV = отношение задолженности к залоговой стоимости (норматив 70-80%)
 */
export const calculateLTV = (contract: CollateralPortfolioEntry): number | null => {
  const debt = typeof contract.debtRub === 'number' 
    ? contract.debtRub 
    : parseFloat(String(contract.debtRub || 0));
  const collateralValue = typeof contract.collateralValue === 'number' 
    ? contract.collateralValue 
    : parseFloat(String(contract.collateralValue || 0));
  
  if (collateralValue > 0) {
    return Math.min(debt / collateralValue, 2); // Ограничиваем выбросы (максимум 200%)
  }
  return null;
};

