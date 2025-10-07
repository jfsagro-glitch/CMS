import React, { useState, useCallback } from 'react';
import { AutoComplete, Input, Spin, Alert, Tag, Space, Card, Row, Col } from 'antd';
import { SearchOutlined, EnvironmentOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import daDataService, { DaDataAddress } from '@/services/DaDataService';
import { convertDaDataToEnhancedAddress, EnhancedAddress } from '@/types/dadataTypes';
import { debounce } from '@/utils/performance';

interface DaDataAddressInputProps {
  value?: EnhancedAddress;
  onChange?: (address: EnhancedAddress) => void;
  disabled?: boolean;
  placeholder?: string;
  showDetails?: boolean;
}

const DaDataAddressInput: React.FC<DaDataAddressInputProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Начните вводить адрес (мин. 3 символа)...',
  showDetails = true,
}) => {
  const [searchText, setSearchText] = useState<string>(value?.fullAddress || '');
  const [suggestions, setSuggestions] = useState<DaDataAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<EnhancedAddress | undefined>(value);
  const [remainingRequests, setRemainingRequests] = useState<number>(0);

  // Функция для получения подсказок
  const fetchSuggestionsBase = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const addressSuggestions = await daDataService.suggestAddress(query, 10);
      setSuggestions(addressSuggestions);
      setRemainingRequests(daDataService.getRemainingRequests());
    } catch (err) {
      setError('Ошибка при получении подсказок адреса. Проверьте подключение к интернету.');
      console.error('DaData suggestion error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Функция с debounce
  const fetchSuggestions = useCallback(
    debounce(fetchSuggestionsBase, 500),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.length >= 3) {
      fetchSuggestions(text);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (selectedValue: string) => {
    const selectedSuggestion = suggestions.find(s => s.value === selectedValue);
    
    if (selectedSuggestion) {
      const enhancedAddress = convertDaDataToEnhancedAddress(selectedSuggestion, value?.id);
      setSelectedAddress(enhancedAddress);
      setSearchText(selectedValue);
      setSuggestions([]);
      
      if (onChange) {
        onChange(enhancedAddress);
      }
    }
  };

  const getQualityColor = (qc?: string): string => {
    switch (qc) {
      case '0': return 'green'; // Хороший
      case '1': return 'orange'; // Сомнительный
      case '2': return 'red'; // Плохой
      case '3': return 'red'; // Не распознан
      default: return 'default';
    }
  };

  const getQualityText = (qc?: string): string => {
    switch (qc) {
      case '0': return 'Адрес проверен';
      case '1': return 'Требует уточнения';
      case '2': return 'Плохое качество';
      case '3': return 'Не распознан';
      default: return 'Неизвестно';
    }
  };

  const options = suggestions.map(suggestion => ({
    value: suggestion.value,
    label: (
      <div style={{ padding: '4px 0' }}>
        <div>{suggestion.value}</div>
        <Space size="small" style={{ marginTop: 4 }}>
          {suggestion.data.postal_code && (
            <Tag color="blue" style={{ fontSize: 11 }}>
              {suggestion.data.postal_code}
            </Tag>
          )}
          {suggestion.data.qc && (
            <Tag color={getQualityColor(suggestion.data.qc)} style={{ fontSize: 11 }}>
              {getQualityText(suggestion.data.qc)}
            </Tag>
          )}
        </Space>
      </div>
    ),
  }));

  return (
    <div className="dadata-address-input">
      <AutoComplete
        value={searchText}
        options={options}
        onSelect={handleSelect}
        onSearch={handleSearch}
        disabled={disabled}
        notFoundContent={loading ? <Spin size="small" tip="Поиск адресов..." /> : 'Введите минимум 3 символа'}
        style={{ width: '100%' }}
        dropdownStyle={{ minWidth: 400 }}
      >
        <Input
          prefix={<SearchOutlined />}
          suffix={loading && <Spin size="small" />}
          placeholder={placeholder}
          allowClear
        />
      </AutoComplete>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginTop: 8 }}
        />
      )}

      {selectedAddress && showDetails && (
        <Card size="small" style={{ marginTop: 12 }} title="Детали адреса">
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <Space size="small" wrap>
                {selectedAddress.qc && (
                  <Tag
                    color={getQualityColor(selectedAddress.qc)}
                    icon={selectedAddress.qc === '0' ? <CheckCircleOutlined /> : <WarningOutlined />}
                  >
                    {getQualityText(selectedAddress.qc)}
                  </Tag>
                )}
                {selectedAddress.postalCode && (
                  <Tag color="blue">
                    Индекс: {selectedAddress.postalCode}
                  </Tag>
                )}
                {selectedAddress.fias && (
                  <Tag color="green">
                    ФИАС: {selectedAddress.fias.substring(0, 8)}...
                  </Tag>
                )}
                {selectedAddress.geoLat && selectedAddress.geoLon && (
                  <Tag color="orange" icon={<EnvironmentOutlined />}>
                    {selectedAddress.geoLat.toFixed(4)}, {selectedAddress.geoLon.toFixed(4)}
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>

          <Row gutter={[12, 8]} style={{ marginTop: 12 }}>
            <Col span={12}>
              <div style={{ fontSize: 12, color: '#666' }}>Регион:</div>
              <div style={{ fontWeight: 500 }}>{selectedAddress.region || '-'}</div>
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 12, color: '#666' }}>Город:</div>
              <div style={{ fontWeight: 500 }}>{selectedAddress.city || selectedAddress.settlement || '-'}</div>
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 12, color: '#666' }}>Улица:</div>
              <div style={{ fontWeight: 500 }}>{selectedAddress.street || '-'}</div>
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 12, color: '#666' }}>Дом/Квартира:</div>
              <div style={{ fontWeight: 500 }}>
                {[selectedAddress.house, selectedAddress.building, selectedAddress.apartment]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </div>
            </Col>
          </Row>

          {selectedAddress.metro && selectedAddress.metro.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Ближайшее метро:</div>
              <Space size="small" wrap>
                {selectedAddress.metro.map((m, idx) => (
                  <Tag key={idx} color="purple">
                    {m.name} ({m.distance}м)
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 11, color: '#999' }}>
            Осталось запросов сегодня: {remainingRequests} / 10000
          </div>
        </Card>
      )}
    </div>
  );
};

export default DaDataAddressInput;

