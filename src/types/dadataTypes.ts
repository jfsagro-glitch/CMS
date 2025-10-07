// Расширенные типы адресов с поддержкой DaData

import type { Address } from './index';
import type { DaDataAddress } from '../services/DaDataService';

// Расширенный адрес с данными DaData
export interface EnhancedAddress extends Address {
  // Дополнительные данные от DaData
  countryIsoCode?: string;
  regionFiasId?: string;
  regionKladrId?: string;
  regionIsoCode?: string;
  regionType?: string;
  
  cityFiasId?: string;
  cityType?: string;
  cityDistrict?: string;
  
  streetFiasId?: string;
  streetType?: string;
  
  houseFiasId?: string;
  houseType?: string;
  
  flatArea?: number;
  squareMeterPrice?: number;
  flatPrice?: number;
  
  // Геоданные
  geoLat?: number;
  geoLon?: number;
  timezone?: string;
  
  // Административно-территориальное деление
  okato?: string;
  oktmo?: string;
  taxOffice?: string;
  taxOfficeLegal?: string;
  
  // Метро (для крупных городов)
  metro?: Array<{
    distance: number;
    line: string;
    name: string;
  }>;
  
  // Качество данных
  qc?: string; // 0-хороший, 1-сомнительный, 2-плохой, 3-не распознан
  qcGeo?: string; // Качество геокодирования
  qcComplete?: string; // Полнота адреса
  qcHouse?: string; // Проверка дома
  
  // Источник данных
  source: 'manual' | 'dadata' | 'import';
  
  // История значений
  historyValues?: string[];
  unparsedParts?: string;
}

// Конвертер из DaData в EnhancedAddress
export const convertDaDataToEnhancedAddress = (
  daDataAddr: DaDataAddress,
  existingId?: string
): EnhancedAddress => {
  return {
    id: existingId || `addr-${Date.now()}`,
    region: daDataAddr.data.region_with_type || undefined,
    district: daDataAddr.data.area || undefined,
    city: daDataAddr.data.city || undefined,
    settlement: daDataAddr.data.settlement || undefined,
    street: daDataAddr.data.street || undefined,
    house: daDataAddr.data.house || undefined,
    building: daDataAddr.data.block || undefined,
    apartment: daDataAddr.data.flat || undefined,
    postalCode: daDataAddr.data.postal_code || undefined,
    fullAddress: daDataAddr.value,
    cadastralNumber: undefined, // Кадастровый номер отдельно
    fias: daDataAddr.data.fias_id,
    
    // Расширенные данные
    countryIsoCode: daDataAddr.data.country_iso_code,
    regionFiasId: daDataAddr.data.region_fias_id,
    regionKladrId: daDataAddr.data.region_kladr_id,
    regionIsoCode: daDataAddr.data.region_iso_code,
    regionType: daDataAddr.data.region_type,
    
    cityFiasId: daDataAddr.data.city_fias_id || undefined,
    cityType: daDataAddr.data.city_type || undefined,
    cityDistrict: daDataAddr.data.city_district || undefined,
    
    streetFiasId: daDataAddr.data.street_fias_id || undefined,
    streetType: daDataAddr.data.street_type || undefined,
    
    houseFiasId: daDataAddr.data.house_fias_id || undefined,
    houseType: daDataAddr.data.house_type || undefined,
    
    flatArea: daDataAddr.data.flat_area ? parseFloat(daDataAddr.data.flat_area) : undefined,
    squareMeterPrice: daDataAddr.data.square_meter_price ? parseFloat(daDataAddr.data.square_meter_price) : undefined,
    flatPrice: daDataAddr.data.flat_price ? parseFloat(daDataAddr.data.flat_price) : undefined,
    
    geoLat: daDataAddr.data.geo_lat ? parseFloat(daDataAddr.data.geo_lat) : undefined,
    geoLon: daDataAddr.data.geo_lon ? parseFloat(daDataAddr.data.geo_lon) : undefined,
    timezone: daDataAddr.data.timezone || undefined,
    
    okato: daDataAddr.data.okato,
    oktmo: daDataAddr.data.oktmo,
    taxOffice: daDataAddr.data.tax_office,
    taxOfficeLegal: daDataAddr.data.tax_office_legal,
    
    metro: daDataAddr.data.metro || undefined,
    
    qc: daDataAddr.data.qc || undefined,
    qcGeo: daDataAddr.data.qc_geo || undefined,
    qcComplete: daDataAddr.data.qc_complete || undefined,
    qcHouse: daDataAddr.data.qc_house || undefined,
    
    source: 'dadata',
  };
};

