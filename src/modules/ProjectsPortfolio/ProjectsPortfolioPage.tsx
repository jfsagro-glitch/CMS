import React from 'react';
import { Card, Row, Col, Typography, Space, Divider, Button } from 'antd';
import {
  GlobalOutlined,
  DatabaseOutlined,
  ShoppingOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import './ProjectsPortfolioPage.css';

const { Title, Paragraph, Text } = Typography;

const ProjectsPortfolioPage: React.FC = () => {
  return (
    <div className="projects-portfolio-page">
      {/* Заголовок с логотипом и брендом */}
      <div className="portfolio-header">
        <div className="brand-section">
          <img src="/logo.png" alt="CMS AUTO Logo" className="brand-logo" />
          <div className="brand-info">
            <Title level={1} className="brand-title">
              CMS AUTO
            </Title>
            <Text type="secondary" className="brand-subtitle">
              Профессиональные решения для бизнеса
            </Text>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 32, marginTop: 24 }}>
        <Title level={2}>Портфолио проектов</Title>
        <Paragraph style={{ fontSize: 16, color: '#666' }}>
          Ознакомьтесь с реализованными проектами и решениями
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* Проект 1: Реестр объектов */}
        <Col xs={24} lg={12}>
          <Card
            hoverable
            style={{ height: '100%' }}
            cover={
              <div
                style={{
                  height: 200,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DatabaseOutlined style={{ fontSize: 64, color: '#fff' }} />
              </div>
            }
            actions={[
              <Button
                type="link"
                icon={<LinkOutlined />}
                href="https://cmsauto.ru/#/registry"
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть проект
              </Button>,
            ]}
          >
            <Card.Meta
              title={
                <Title level={3} style={{ margin: 0 }}>
                  Банковская CRM
                </Title>
              }
              description={
                <div>
                  <Paragraph>
                    Комплексная банковская CRM-система для управления залоговым имуществом. 
                    Платформа предоставляет полный функционал для ведения учета, классификации 
                    и управления объектами залога в банковской сфере.
                  </Paragraph>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Основные возможности:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Управление карточками залогового имущества (CRUD)</li>
                      <li>Расширенная классификация объектов (60+ типов)</li>
                      <li>Динамические формы с 150+ полями характеристик</li>
                      <li>Многостраничная форма карточки (5 вкладок)</li>
                      <li>Фильтрация, поиск и сортировка</li>
                      <li>Экспорт/импорт в Excel</li>
                      <li>Резервное копирование базы данных</li>
                      <li>Интеграция с DaData API для автозаполнения адресов</li>
                    </ul>
                  </Space>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space>
                    <Text type="secondary">URL:</Text>
                    <Text code>
                      <a
                        href="https://cmsauto.ru/#/registry"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1890ff' }}
                      >
                        https://cmsauto.ru/#/registry
                      </a>
                    </Text>
                  </Space>
                </div>
              }
            />
          </Card>
        </Col>

        {/* Проект 2: Онлайн Автосалон */}
        <Col xs={24} lg={12}>
          <Card
            hoverable
            style={{ height: '100%' }}
            cover={
              <div
                style={{
                  height: 200,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingOutlined style={{ fontSize: 64, color: '#fff' }} />
              </div>
            }
            actions={[
              <Button
                type="link"
                icon={<LinkOutlined />}
                href="https://cmsauto.store/index.html#catalog"
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть проект
              </Button>,
            ]}
          >
            <Card.Meta
              title={
                <Title level={3} style={{ margin: 0 }}>
                  Онлайн Автосалон
                </Title>
              }
              description={
                <div>
                  <Paragraph>
                    Интернет-магазин автомобилей с расширенным каталогом и удобной системой 
                    поиска. Платформа для продажи автомобилей из различных регионов с полным 
                    циклом оформления документов.
                  </Paragraph>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Основные возможности:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Каталог автомобилей с детальной информацией</li>
                      <li>Расширенный поиск и фильтрация по параметрам</li>
                      <li>Каталоги из разных регионов (Грузия, США, Корея, Китай, Европа)</li>
                      <li>Таможенный калькулятор</li>
                      <li>Заявка на подбор автомобиля</li>
                      <li>Самостоятельный просчет стоимости</li>
                      <li>Система оформления заказов</li>
                      <li>Контактная форма и обратная связь</li>
                    </ul>
                  </Space>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space>
                    <Text type="secondary">URL:</Text>
                    <Text code>
                      <a
                        href="https://cmsauto.store/index.html#catalog"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1890ff' }}
                      >
                        https://cmsauto.store/index.html#catalog
                      </a>
                    </Text>
                  </Space>
                </div>
              }
            />
          </Card>
        </Col>

        {/* Проект 3: Задачник */}
        <Col xs={24} lg={12}>
          <Card
            hoverable
            style={{ height: '100%' }}
            cover={
              <div
                style={{
                  height: 200,
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 64, color: '#fff' }} />
              </div>
            }
            actions={[
              <Button
                type="link"
                icon={<LinkOutlined />}
                href="https://jfsagro-glitch.github.io/zadachnik/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть проект
              </Button>,
            ]}
          >
            <Card.Meta
              title={
                <Title level={3} style={{ margin: 0 }}>
                  Задачник
                </Title>
              }
              description={
                <div>
                  <Paragraph>
                    Система управления задачами для сотрудников с поддержкой ролевой модели, 
                    распределения по регионам и автоматизации процессов. Платформа для 
                    эффективного управления рабочими задачами и контроля их выполнения.
                  </Paragraph>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Основные возможности:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Управление задачами с различными типами (Оценка, Экспертиза, Рецензия, ПРКК и др.)</li>
                      <li>Ролевая модель (Бизнес, Руководитель, Сотрудник, Суперпользователь)</li>
                      <li>Распределение по регионам (Москва, Санкт-Петербург, Новосибирск, Екатеринбург)</li>
                      <li>Система приоритетов и статусов задач</li>
                      <li>Аналитика и KPI по задачам</li>
                      <li>Автопилот для автоматического распределения задач</li>
                      <li>Экспорт данных в CSV</li>
                      <li>Комментарии и история изменений</li>
                      <li>Прикрепление документов к задачам</li>
                    </ul>
                  </Space>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space>
                    <Text type="secondary">URL:</Text>
                    <Text code>
                      <a
                        href="https://jfsagro-glitch.github.io/zadachnik/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1890ff' }}
                      >
                        https://jfsagro-glitch.github.io/zadachnik/
                      </a>
                    </Text>
                  </Space>
                </div>
              }
            />
          </Card>
        </Col>

        {/* Проект 4: Система дистанционных осмотров */}
        <Col xs={24} lg={12}>
          <Card
            hoverable
            style={{ height: '100%' }}
            cover={
              <div
                style={{
                  height: 200,
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CameraOutlined style={{ fontSize: 64, color: '#fff' }} />
              </div>
            }
            actions={[
              <Button
                type="link"
                icon={<LinkOutlined />}
                href="https://jfsagro-glitch.github.io/CMS_chek/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть проект
              </Button>,
            ]}
          >
            <Card.Meta
              title={
                <Title level={3} style={{ margin: 0 }}>
                  Система дистанционных осмотров
                </Title>
              }
              description={
                <div>
                  <Paragraph>
                    Платформа для проведения дистанционных осмотров объектов залогового имущества. 
                    Система позволяет проводить осмотры через мобильные устройства с фотофиксацией, 
                    геолокацией и формированием отчетов.
                  </Paragraph>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Основные возможности:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Мобильный интерфейс для проведения осмотров</li>
                      <li>Фотофиксация объектов с привязкой к координатам</li>
                      <li>Структурированные чек-листы осмотра</li>
                      <li>Геолокация и привязка к адресу</li>
                      <li>Электронная подпись результатов осмотра</li>
                      <li>Автоматическое формирование отчетов об осмотре</li>
                      <li>История осмотров и отслеживание изменений</li>
                      <li>Интеграция с основной системой CMS</li>
                    </ul>
                  </Space>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space>
                    <Text type="secondary">URL:</Text>
                    <Text code>
                      <a
                        href="https://jfsagro-glitch.github.io/CMS_chek/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1890ff' }}
                      >
                        https://jfsagro-glitch.github.io/CMS_chek/
                      </a>
                    </Text>
                  </Space>
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Контактная информация */}
      <Card
        style={{ marginTop: 32 }}
        title={
          <Space>
            <GlobalOutlined />
            <span>Контактная информация</span>
          </Space>
        }
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Text strong>
                <MailOutlined style={{ marginRight: 8 }} />
                Email
              </Text>
              <div>
                <a href="mailto:cmsauto@bk.ru" style={{ color: '#1890ff' }}>
                  cmsauto@bk.ru
                </a>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Text strong>
                <PhoneOutlined style={{ marginRight: 8 }} />
                Телефон
              </Text>
              <div>
                <a href="tel:+79154441208" style={{ color: '#1890ff' }}>
                  +7 (915) 444-12-08
                </a>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Text strong>
                <PhoneOutlined style={{ marginRight: 8 }} />
                WhatsApp
              </Text>
              <div>
                <a href="https://wa.me/79184140636" target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                  +7 (918) 414-06-36
                </a>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Text strong>
                <LinkOutlined style={{ marginRight: 8 }} />
                Сайт
              </Text>
              <div>
                <a href="https://cmsauto.ru" target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                  https://cmsauto.ru
                </a>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ProjectsPortfolioPage;

