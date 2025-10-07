// Сервис для работы с геолокацией

import daDataService from './DaDataService';
import type { DaDataAddress } from './DaDataService';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeolocationResult {
  coordinates: Coordinates;
  accuracy: number;
  timestamp: number;
}

class GeolocationService {
  // Получение текущего местоположения пользователя
  async getCurrentPosition(): Promise<GeolocationResult | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        console.warn('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coordinates: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            },
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.error('Error getting current position:', error);
          let errorMessage = 'Не удалось определить местоположение';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Информация о местоположении недоступна.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Время ожидания определения местоположения истекло.';
              break;
          }
          
          console.warn(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Кэш на 1 минуту
        }
      );
    });
  }

  // Получение адреса по координатам
  async getAddressFromCoordinates(coords: Coordinates): Promise<DaDataAddress[]> {
    try {
      return await daDataService.geolocateAddress(coords.lat, coords.lon);
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return [];
    }
  }

  // Получение координат и адреса одновременно
  async getCurrentLocationWithAddress(): Promise<{
    coordinates: Coordinates;
    addresses: DaDataAddress[];
  } | null> {
    const position = await this.getCurrentPosition();
    
    if (!position) {
      return null;
    }

    const addresses = await this.getAddressFromCoordinates(position.coordinates);
    
    return {
      coordinates: position.coordinates,
      addresses,
    };
  }

  // Расчет расстояния между двумя точками (формула Haversine)
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Радиус Земли в км
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lon - coord1.lon);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.lat)) *
        Math.cos(this.deg2rad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Расстояние в км
    
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Форматирование расстояния для отображения
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} м`;
    }
    return `${distance.toFixed(1)} км`;
  }

  // Проверка поддержки геолокации
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Проверка разрешения на геолокацию
  async checkPermission(): Promise<PermissionState | null> {
    if (!('permissions' in navigator)) {
      return null;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state;
    } catch (error) {
      console.error('Error checking geolocation permission:', error);
      return null;
    }
  }
}

// Экспортируем синглтон
export const geolocationService = new GeolocationService();
export default geolocationService;

