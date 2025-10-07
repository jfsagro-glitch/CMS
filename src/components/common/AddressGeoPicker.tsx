import React, { useState } from 'react';
import { Card, Button, Alert, Spin, Space, Tag, Divider } from 'antd';
import { EnvironmentOutlined, AimOutlined, CheckCircleOutlined } from '@ant-design/icons';
import geolocationService, { Coordinates } from '@/services/GeolocationService';
import type { DaDataAddress } from '@/services/DaDataService';
import { convertDaDataToEnhancedAddress, EnhancedAddress } from '@/types/dadataTypes';

interface AddressGeoPickerProps {
  onAddressSelect?: (address: EnhancedAddress) => void;
  initialCoordinates?: Coordinates;
}

const AddressGeoPicker: React.FC<AddressGeoPickerProps> = ({
  onAddressSelect,
  initialCoordinates,
}) => {
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(initialCoordinates || null);
  const [addresses, setAddresses] = useState<DaDataAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    setAddresses([]);

    try {
      const result = await geolocationService.getCurrentLocationWithAddress();

      if (result) {
        setCurrentPosition(result.coordinates);
        setAddresses(result.addresses);
        setAccuracy(result.coordinates ? 50 : null); // Примерная точность

        if (result.addresses.length > 0) {
          // Автоматически выбираем первый адрес
          const enhancedAddress = convertDaDataToEnhancedAddress(result.addresses[0]);
          onAddressSelect?.(enhancedAddress);
        }
      } else {
        setError('Не удалось определить местоположение. Проверьте разрешения браузера.');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при определении местоположения');
      console.error('Geolocation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: DaDataAddress) => {
    const enhancedAddress = convertDaDataToEnhancedAddress(address);
    onAddressSelect?.(enhancedAddress);
  };

  const isSupported = geolocationService.isGeolocationSupported();

  if (!isSupported) {
    return (
      <Alert
        message="Геолокация не поддерживается"
        description="Ваш браузер не поддерживает определение местоположения. Используйте ввод адреса вручную."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <Card
      title={
        <Space>
          <EnvironmentOutlined />
          <span>Определение местоположения</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<AimOutlined />}
          onClick={handleGetCurrentLocation}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Определение...' : 'Определить местоположение'}
        </Button>
      }
    >
      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="Определение вашего местоположения..." />
        </div>
      )}

      {!loading && currentPosition && (
        <div>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card size="small" type="inner" title="Ваши координаты">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Tag color="blue">Широта: {currentPosition.lat.toFixed(6)}</Tag>
                  <Tag color="green">Долгота: {currentPosition.lon.toFixed(6)}</Tag>
                  {accuracy && <Tag color="orange">Точность: ~{accuracy}м</Tag>}
                </div>
                <a
                  href={`https://yandex.ru/maps/?ll=${currentPosition.lon},${currentPosition.lat}&z=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть на Я.Картах
                </a>
              </div>
            </Card>

            {addresses.length > 0 && (
              <>
                <Divider style={{ margin: '8px 0' }}>Найденные адреса</Divider>
                <div>
                  {addresses.map((address, index) => (
                    <Card
                      key={index}
                      size="small"
                      hoverable
                      style={{ marginBottom: 8, cursor: 'pointer' }}
                      onClick={() => handleSelectAddress(address)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{address.value}</div>
                          {address.data.postal_code && (
                            <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>
                              {address.data.postal_code}
                            </Tag>
                          )}
                        </div>
                        <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {addresses.length === 0 && currentPosition && !loading && (
              <Alert
                message="Адреса не найдены"
                description="Не удалось найти адреса рядом с вашим местоположением. Попробуйте ввести адрес вручную."
                type="info"
                showIcon
              />
            )}
          </Space>
        </div>
      )}

      {!loading && !currentPosition && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <EnvironmentOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <div style={{ marginTop: 16 }}>
            Нажмите кнопку "Определить местоположение" для автоматического поиска адреса
          </div>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            Браузер запросит разрешение на доступ к вашему местоположению
          </div>
        </div>
      )}

      <Alert
        message="Примечание"
        description="Для работы геолокации необходимо разрешение браузера на доступ к местоположению. Функция работает лучше всего на мобильных устройствах."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
};

export default AddressGeoPicker;

