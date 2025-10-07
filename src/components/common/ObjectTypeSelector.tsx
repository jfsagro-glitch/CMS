import React, { useState, useEffect } from 'react';
import { Select, Space, Alert, Form } from 'antd';
import type { RealEstateHierarchy } from '@/types';
import {
  extendedRealEstateClassification,
  getExtendedLevel1Options,
  getExtendedLevel2Options,
  getExtendedCBCode,
  validateExtendedClassification,
} from '@/utils/extendedClassification';

interface ObjectTypeSelectorProps {
  value?: RealEstateHierarchy;
  onChange?: (value: RealEstateHierarchy, cbCode: number) => void;
  disabled?: boolean;
}

const ObjectTypeSelector: React.FC<ObjectTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [level0, setLevel0] = useState<string>(value?.level0 || '');
  const [level1, setLevel1] = useState<string>(value?.level1 || '');
  const [level2, setLevel2] = useState<string>(value?.level2 || '');
  const [cbCode, setCbCode] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(true);

  // Обновляем значения при изменении prop
  useEffect(() => {
    if (value) {
      setLevel0(value.level0 || '');
      setLevel1(value.level1 || '');
      setLevel2(value.level2 || '');
    }
  }, [value]);

  // Обновляем код ЦБ при изменении любого уровня
  useEffect(() => {
    if (level0 && level1 && level2) {
      const code = getExtendedCBCode(level0, level1, level2);
      const valid = validateExtendedClassification(level0, level1, level2);
      setCbCode(code);
      setIsValid(valid);

      if (valid && onChange) {
        onChange(
          {
            level0,
            level1,
            level2,
          },
          code
        );
      }
    } else {
      setCbCode(0);
      setIsValid(true);
    }
  }, [level0, level1, level2, onChange]);

  const handleLevel0Change = (val: string) => {
    setLevel0(val);
    setLevel1('');
    setLevel2('');
    setCbCode(0);
  };

  const handleLevel1Change = (val: string) => {
    setLevel1(val);
    setLevel2('');
    setCbCode(0);
  };

  const handleLevel2Change = (val: string) => {
    setLevel2(val);
  };

  const level1Options = level0 ? getExtendedLevel1Options(level0) : [];
  const level2Options = level0 && level1 ? getExtendedLevel2Options(level0, level1) : [];

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 500 }}>
            Категория (Уровень 0)
          </div>
          <Select
            placeholder="Выберите категорию"
            value={level0 || undefined}
            onChange={handleLevel0Change}
            disabled={disabled}
            style={{ width: '100%' }}
            options={extendedRealEstateClassification.map(item => ({
              value: item.value,
              label: item.label,
            }))}
          />
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 500 }}>
            Вид объекта (Уровень 1)
          </div>
          <Select
            placeholder="Выберите вид объекта"
            value={level1 || undefined}
            onChange={handleLevel1Change}
            disabled={disabled || !level0}
            style={{ width: '100%' }}
            options={level1Options.map(item => ({
              value: item.value,
              label: item.label,
            }))}
          />
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 500 }}>
            Тип (Уровень 2)
          </div>
          <Select
            placeholder="Выберите тип"
            value={level2 || undefined}
            onChange={handleLevel2Change}
            disabled={disabled || !level1}
            style={{ width: '100%' }}
            options={level2Options.map(item => ({
              value: item.value,
              label: item.label,
            }))}
          />
        </div>
      </Space>

      {level0 && level1 && level2 && (
        <>
          {isValid ? (
            <Alert
              message={`Код ЦБ: ${cbCode}`}
              type="success"
              showIcon
            />
          ) : (
            <Alert
              message="Некорректная комбинация классификации"
              type="error"
              showIcon
            />
          )}
        </>
      )}
    </Space>
  );
};

export default ObjectTypeSelector;

