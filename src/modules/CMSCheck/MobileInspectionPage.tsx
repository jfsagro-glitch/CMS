/**
 * Мобильная версия для клиента - пошаговый процесс осмотра
 */

import React, { useEffect, useState } from 'react';
import {
  Steps,
  Button,
  Card,
  Space,
  Typography,
  Upload,
  message,
  Spin,
  Alert,
  Checkbox,
  Row,
  Col,
  Image,
} from 'antd';
import {
  CameraOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { Inspection, InspectionPhoto } from '@/types/inspection';
import inspectionService from '@/services/InspectionService';
import { useParams, useNavigate } from 'react-router-dom';
import './MobileInspectionPage.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Шаги осмотра в зависимости от типа имущества
const getInspectionSteps = (inspectionType: string, mainCategory?: string) => {
  if (mainCategory === 'real_estate' || inspectionType.includes('real_estate')) {
    return [
      { title: 'Фасад', description: 'Сфотографируйте фасад здания' },
      { title: 'Вход', description: 'Сфотографируйте вход в здание' },
      { title: 'Внутри', description: 'Сфотографируйте внутренние помещения' },
      { title: 'Документы', description: 'Сфотографируйте документы на объект' },
    ];
  } else if (mainCategory === 'movable' || inspectionType.includes('movable')) {
    return [
      { title: 'Общий вид', description: 'Сфотографируйте объект с разных сторон' },
      { title: 'Серийный номер', description: 'Сфотографируйте серийный номер или VIN' },
      { title: 'Состояние', description: 'Сфотографируйте повреждения или особенности' },
      { title: 'Документы', description: 'Сфотографируйте документы на объект' },
    ];
  }
  return [
    { title: 'Общий вид', description: 'Сфотографируйте объект' },
    { title: 'Детали', description: 'Сфотографируйте детали объекта' },
    { title: 'Документы', description: 'Сфотографируйте документы' },
  ];
};

const MobileInspectionPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [geolocationConsent, setGeolocationConsent] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [photos, setPhotos] = useState<{ [step: number]: InspectionPhoto[] }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadInspection();
    }
  }, [token]);

  const loadInspection = async () => {
    setLoading(true);
    try {
      const data = await inspectionService.getInspectionByToken(token!);
      if (!data) {
        message.error('Осмотр не найден или ссылка истекла');
        navigate('/');
        return;
      }
      setInspection(data);
      
      // Группируем фотографии по шагам
      const steps = getInspectionSteps(data.inspectionType);
      const groupedPhotos: { [step: number]: InspectionPhoto[] } = {};
      data.photos?.forEach((photo) => {
        const stepIndex = steps.findIndex(step => 
          step.title === photo.step || step.title === photo.location
        );
        if (stepIndex >= 0) {
          if (!groupedPhotos[stepIndex]) {
            groupedPhotos[stepIndex] = [];
          }
          groupedPhotos[stepIndex].push(photo);
        } else {
          // Если шаг не найден, добавляем в первый шаг
          if (!groupedPhotos[0]) {
            groupedPhotos[0] = [];
          }
          groupedPhotos[0].push(photo);
        }
      });
      setPhotos(groupedPhotos);
    } catch (error) {
      console.error('Ошибка загрузки осмотра:', error);
      message.error('Не удалось загрузить осмотр');
    } finally {
      setLoading(false);
    }
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      message.error('Геолокация не поддерживается вашим браузером');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
        });
        setGeolocationConsent(true);
        message.success('Геолокация получена');
      },
      (error) => {
        console.error('Ошибка геолокации:', error);
        message.error('Не удалось получить геолокацию');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handlePhotoUpload = (stepIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const steps = getInspectionSteps(inspection?.inspectionType || '');
      const step = steps[stepIndex];

      const photo: InspectionPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: base64,
        description: step.description,
        location: step.title,
        step: step.title,
        takenAt: new Date(),
        latitude: location?.lat,
        longitude: location?.lon,
        accuracy: location?.accuracy,
      };

      // Добавляем фото локально
      setPhotos((prev) => ({
        ...prev,
        [stepIndex]: [...(prev[stepIndex] || []), photo],
      }));

      // Сохраняем в базу
      if (inspection) {
        try {
          await inspectionService.addPhoto(inspection.id, photo);
        } catch (error) {
          console.error('Ошибка сохранения фото:', error);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!inspection) return;

    setSubmitting(true);
    try {
      // Обновляем статус осмотра
      await inspectionService.submitForReview(inspection.id, inspection.inspectorName);
      
      // Обновляем геолокацию осмотра
      if (location) {
        await inspectionService.updateInspection(inspection.id, {
          latitude: location.lat,
          longitude: location.lon,
          geolocationConsent: true,
        });
      }

      message.success('Осмотр отправлен на проверку');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Ошибка отправки осмотра:', error);
      message.error('Не удалось отправить осмотр');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Загрузка осмотра...</Text>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div style={{ padding: '40px' }}>
        <Alert
          message="Осмотр не найден"
          description="Ссылка недействительна или истекла"
          type="error"
        />
      </div>
    );
  }

  const steps = getInspectionSteps(inspection.inspectionType);
  const currentStepPhotos = photos[currentStep] || [];

  return (
    <div className="mobile-inspection-page">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Осмотр объекта</Title>
            <Text type="secondary">{inspection.collateralName}</Text>
          </div>

          <Alert
            message="Согласие на геолокацию"
            description="Для проведения осмотра необходимо предоставить доступ к геолокации"
            type="info"
            action={
              <Checkbox
                checked={geolocationConsent}
                onChange={(e) => {
                  setGeolocationConsent(e.target.checked);
                  if (e.target.checked) {
                    requestGeolocation();
                  }
                }}
              >
                Разрешить
              </Checkbox>
            }
          />

          {location && (
            <Alert
              message="Геолокация получена"
              description={`Координаты: ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`}
              type="success"
              icon={<EnvironmentOutlined />}
            />
          )}

          <Steps current={currentStep} direction="vertical" size="small">
            {steps.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                description={step.description}
                status={
                  currentStep === index ? 'process' :
                  photos[index] && photos[index].length > 0 ? 'finish' : 'wait'
                }
                icon={
                  photos[index] && photos[index].length > 0 ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : undefined
                }
              />
            ))}
          </Steps>

          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Title level={5}>{steps[currentStep].title}</Title>
              <Paragraph>{steps[currentStep].description}</Paragraph>

              <Upload
                accept="image/*"
                capture="environment"
                showUploadList={false}
                beforeUpload={(file) => {
                  handlePhotoUpload(currentStep, file);
                  return false;
                }}
              >
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  size="large"
                  block
                >
                  Сфотографировать
                </Button>
              </Upload>

              {currentStepPhotos.length > 0 && (
                <Row gutter={[8, 8]}>
                  {currentStepPhotos.map((photo) => (
                    <Col key={photo.id} xs={12} sm={8} md={6}>
                      <Image
                        src={photo.url}
                        alt={photo.description}
                        style={{ width: '100%', borderRadius: 4 }}
                        preview
                      />
                    </Col>
                  ))}
                </Row>
              )}
            </Space>
          </Card>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Назад
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                type="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Далее
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={submitting}
                disabled={!geolocationConsent}
              >
                Отправить на проверку
              </Button>
            )}
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default MobileInspectionPage;

