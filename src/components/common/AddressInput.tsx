import React, { useState, useEffect } from 'react';
import { Input, Form, Row, Col, Space, Divider } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import type { Address } from '@/types';
import DaDataAddressInput from './DaDataAddressInput';
import AddressGeoPicker from './AddressGeoPicker';
import type { EnhancedAddress } from '@/types/dadataTypes';

interface AddressInputProps {
  value?: Address;
  onChange?: (value: Address) => void;
  disabled?: boolean;
  useDaData?: boolean; // Включить интеграцию с DaData
  showGeoPicker?: boolean; // Показать компонент геолокации
}

const AddressInput: React.FC<AddressInputProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  useDaData = false,
  showGeoPicker = false,
}) => {
  const [address, setAddress] = useState<Address>({
    id: value?.id || '',
    region: value?.region || '',
    district: value?.district || '',
    city: value?.city || '',
    settlement: value?.settlement || '',
    street: value?.street || '',
    house: value?.house || '',
    building: value?.building || '',
    apartment: value?.apartment || '',
    postalCode: value?.postalCode || '',
    fullAddress: value?.fullAddress || '',
    cadastralNumber: value?.cadastralNumber || '',
    fias: value?.fias || '',
  });

  useEffect(() => {
    if (value) {
      setAddress(value);
    }
  }, [value]);

  // Автоматическое формирование полного адреса
  useEffect(() => {
    const parts = [
      address.region,
      address.district,
      address.city,
      address.settlement,
      address.street,
      address.house && `д. ${address.house}`,
      address.building && `к. ${address.building}`,
      address.apartment && `кв. ${address.apartment}`,
    ].filter(Boolean);

    const fullAddress = parts.join(', ');
    
    if (fullAddress !== address.fullAddress) {
      const updatedAddress = { ...address, fullAddress };
      setAddress(updatedAddress);
      onChange?.(updatedAddress);
    }
  }, [
    address.region,
    address.district,
    address.city,
    address.settlement,
    address.street,
    address.house,
    address.building,
    address.apartment,
  ]);

  const handleFieldChange = (field: keyof Address, val: string) => {
    const updatedAddress = { ...address, [field]: val };
    setAddress(updatedAddress);
    onChange?.(updatedAddress);
  };

  // Обработчик выбора адреса из DaData
  const handleDaDataAddressSelect = (enhancedAddress: EnhancedAddress) => {
    const basicAddress: Address = {
      id: enhancedAddress.id || address.id || '',
      region: enhancedAddress.region,
      district: enhancedAddress.district,
      city: enhancedAddress.city,
      settlement: enhancedAddress.settlement,
      street: enhancedAddress.street,
      house: enhancedAddress.house,
      building: enhancedAddress.building,
      apartment: enhancedAddress.apartment,
      postalCode: enhancedAddress.postalCode,
      fullAddress: enhancedAddress.fullAddress,
      cadastralNumber: enhancedAddress.cadastralNumber,
      fias: enhancedAddress.fias,
    };
    
    setAddress(basicAddress);
    onChange?.(basicAddress);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {useDaData && (
        <>
          <DaDataAddressInput
            value={value as EnhancedAddress}
            onChange={handleDaDataAddressSelect}
            disabled={disabled}
            showDetails={true}
          />
          <Divider style={{ margin: '12px 0' }}>или введите вручную</Divider>
        </>
      )}
      
      {showGeoPicker && (
        <>
          <AddressGeoPicker
            onAddressSelect={handleDaDataAddressSelect}
            initialCoordinates={
              value?.fias ? undefined : undefined
            }
          />
          <Divider style={{ margin: '12px 0' }}>Детали адреса</Divider>
        </>
      )}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Регион" style={{ marginBottom: 8 }}>
            <Input
              placeholder="Московская область"
              value={address.region}
              onChange={e => handleFieldChange('region', e.target.value)}
              disabled={disabled}
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Район" style={{ marginBottom: 8 }}>
            <Input
              placeholder="Одинцовский район"
              value={address.district}
              onChange={e => handleFieldChange('district', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Город" style={{ marginBottom: 8 }}>
            <Input
              placeholder="Москва"
              value={address.city}
              onChange={e => handleFieldChange('city', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Населенный пункт" style={{ marginBottom: 8 }}>
            <Input
              placeholder="пос. Лесной"
              value={address.settlement}
              onChange={e => handleFieldChange('settlement', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Улица" style={{ marginBottom: 8 }}>
            <Input
              placeholder="ул. Ленина"
              value={address.street}
              onChange={e => handleFieldChange('street', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Дом" style={{ marginBottom: 8 }}>
            <Input
              placeholder="15"
              value={address.house}
              onChange={e => handleFieldChange('house', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Корпус/Строение" style={{ marginBottom: 8 }}>
            <Input
              placeholder="1"
              value={address.building}
              onChange={e => handleFieldChange('building', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Квартира/Офис" style={{ marginBottom: 8 }}>
            <Input
              placeholder="10"
              value={address.apartment}
              onChange={e => handleFieldChange('apartment', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Почтовый индекс" style={{ marginBottom: 8 }}>
            <Input
              placeholder="123456"
              value={address.postalCode}
              onChange={e => handleFieldChange('postalCode', e.target.value)}
              disabled={disabled}
              maxLength={6}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Кадастровый номер" style={{ marginBottom: 8 }}>
            <Input
              placeholder="77:01:0001001:1234"
              value={address.cadastralNumber}
              onChange={e => handleFieldChange('cadastralNumber', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Полный адрес (автозаполнение)" style={{ marginBottom: 8 }}>
            <Input.TextArea
              value={address.fullAddress}
              onChange={e => handleFieldChange('fullAddress', e.target.value)}
              disabled={disabled}
              rows={2}
              placeholder="Будет сформирован автоматически"
            />
          </Form.Item>
        </Col>
      </Row>
    </Space>
  );
};

export default AddressInput;

