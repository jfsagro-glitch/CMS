// Сервис для работы с DaData API
// API Documentation: https://dadata.ru/api/suggest/address/

export interface DaDataAddress {
  value: string;
  unrestricted_value: string;
  data: {
    postal_code: string | null;
    country: string;
    country_iso_code: string;
    federal_district: string | null;
    region_fias_id: string;
    region_kladr_id: string;
    region_iso_code: string;
    region_with_type: string;
    region_type: string;
    region_type_full: string;
    region: string;
    area_fias_id: string | null;
    area_kladr_id: string | null;
    area_with_type: string | null;
    area_type: string | null;
    area_type_full: string | null;
    area: string | null;
    city_fias_id: string | null;
    city_kladr_id: string | null;
    city_with_type: string | null;
    city_type: string | null;
    city_type_full: string | null;
    city: string | null;
    city_area: string | null;
    city_district_fias_id: string | null;
    city_district_with_type: string | null;
    city_district: string | null;
    settlement_fias_id: string | null;
    settlement_with_type: string | null;
    settlement: string | null;
    street_fias_id: string | null;
    street_kladr_id: string | null;
    street_with_type: string | null;
    street_type: string | null;
    street_type_full: string | null;
    street: string | null;
    house_fias_id: string | null;
    house_type: string | null;
    house: string | null;
    block_type: string | null;
    block: string | null;
    flat_fias_id: string | null;
    flat_type: string | null;
    flat: string | null;
    flat_area: string | null;
    square_meter_price: string | null;
    flat_price: string | null;
    fias_id: string;
    fias_code: string | null;
    fias_level: string;
    fias_actuality_state: string;
    kladr_id: string;
    capital_marker: string;
    okato: string;
    oktmo: string;
    tax_office: string;
    tax_office_legal: string;
    timezone: string | null;
    geo_lat: string | null;
    geo_lon: string | null;
    qc_geo: string | null;
    qc_complete: string | null;
    qc_house: string | null;
    qc: string | null;
    metro: Array<{
      distance: number;
      line: string;
      name: string;
    }> | null;
  };
}

interface DaDataSuggestRequest {
  query: string;
  count?: number;
  locations?: Array<{ kladr_id?: string; fias_id?: string }>;
  from_bound?: { value: string };
  to_bound?: { value: string };
}

interface DaDataGeolocateRequest {
  lat: number;
  lon: number;
  radius_meters?: number;
  count?: number;
}

class DaDataService {
  private readonly API_KEY = '8369d552d89563916982831fbb6ddb90b7d38fe2';
  private readonly SECRET_KEY = '5ca630d6dca5759332bd20223bb808e60969cab4';
  private readonly BASE_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs';
  
  private requestCount = 0;
  private readonly DAILY_LIMIT = 10000; // Бесплатный лимит DaData
  private lastResetDate = new Date().toDateString();

  private checkAndResetLimit(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.requestCount = 0;
      this.lastResetDate = today;
    }
  }

  private incrementRequestCount(): boolean {
    this.checkAndResetLimit();
    if (this.requestCount >= this.DAILY_LIMIT) {
      console.warn('DaData API daily limit reached');
      return false;
    }
    this.requestCount++;
    return true;
  }

  getRemainingRequests(): number {
    this.checkAndResetLimit();
    return this.DAILY_LIMIT - this.requestCount;
  }

  // Подсказки адресов по введенной строке
  async suggestAddress(query: string, count: number = 10): Promise<DaDataAddress[]> {
    if (!this.incrementRequestCount()) {
      throw new Error('Превышен дневной лимит запросов к DaData API');
    }

    if (!query || query.length < 3) {
      return [];
    }

    try {
      const requestBody: DaDataSuggestRequest = {
        query,
        count,
        from_bound: { value: 'region' },
        to_bound: { value: 'flat' }
      };

      const response = await fetch(`${this.BASE_URL}/suggest/address`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${this.API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`DaData API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error fetching address suggestions from DaData:', error);
      throw error;
    }
  }

  // Геолокация - получение адреса по координатам
  async geolocateAddress(lat: number, lon: number, radiusMeters: number = 100): Promise<DaDataAddress[]> {
    if (!this.incrementRequestCount()) {
      throw new Error('Превышен дневной лимит запросов к DaData API');
    }

    try {
      const requestBody: DaDataGeolocateRequest = {
        lat,
        lon,
        radius_meters: radiusMeters,
        count: 5
      };

      const response = await fetch(`${this.BASE_URL}/geolocate/address`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${this.API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`DaData geolocate error: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error geolocating address:', error);
      throw error;
    }
  }

  // Поиск адреса по ФИАС ID
  async findByFiasId(fiasId: string): Promise<DaDataAddress | null> {
    if (!this.incrementRequestCount()) {
      throw new Error('Превышен дневной лимит запросов к DaData API');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/findById/address`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${this.API_KEY}`,
        },
        body: JSON.stringify({
          query: fiasId,
          count: 1
        }),
      });

      if (!response.ok) {
        throw new Error(`DaData findById error: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions?.[0] || null;
    } catch (error) {
      console.error('Error finding address by FIAS ID:', error);
      throw error;
    }
  }

  // Стандартизация адреса (проверка и очистка)
  async standardizeAddress(address: string): Promise<DaDataAddress | null> {
    const suggestions = await this.suggestAddress(address, 1);
    return suggestions[0] || null;
  }

  // Валидация адреса
  async validateAddress(address: string): Promise<{
    isValid: boolean;
    qc: number; // 0-хороший, 1-сомнительный, 2-плохой, 3-не распознан
    suggestion: DaDataAddress | null;
  }> {
    try {
      const suggestion = await this.standardizeAddress(address);
      
      if (!suggestion) {
        return { isValid: false, qc: 3, suggestion: null };
      }

      const qc = parseInt(suggestion.data.qc || '3', 10);
      
      return {
        isValid: qc <= 1, // Хороший или сомнительный
        qc,
        suggestion
      };
    } catch (error) {
      return { isValid: false, qc: 3, suggestion: null };
    }
  }
}

// Экспортируем синглтон
export const daDataService = new DaDataService();
export default daDataService;

