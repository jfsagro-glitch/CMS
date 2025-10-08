import React from 'react';
import { Tag, Space, Typography, Card, Row, Col } from 'antd';
import { UserOutlined, CrownOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { UserRole } from '../../types';
import employeeService from '../../services/EmployeeService';

const { Text, Title } = Typography;

interface RoleInfoProps {
  role?: UserRole;
}

const RoleInfo: React.FC<RoleInfoProps> = ({ role }) => {
  const getRoleInfo = (roleType: UserRole) => {
    switch (roleType) {
      case 'business':
        return {
          color: 'blue',
          icon: <UserOutlined />,
          title: 'Бизнес',
          description: 'Бизнес-пользователь',
        };
      case 'employee':
        return {
          color: 'green',
          icon: <TeamOutlined />,
          title: 'Сотрудник',
          description: 'Обычный сотрудник',
        };
      case 'manager':
        return {
          color: 'orange',
          icon: <CrownOutlined />,
          title: 'Руководитель',
          description: 'Руководитель отдела',
        };
      case 'superuser':
        return {
          color: 'red',
          icon: <SettingOutlined />,
          title: 'Суперпользователь',
          description: 'Системный администратор',
        };
      default:
        return {
          color: 'default',
          icon: <UserOutlined />,
          title: 'Неизвестно',
          description: 'Роль не определена',
        };
    }
  };

  const roleStats = employeeService.getRoleStatistics();
  const departments = employeeService.getDepartments();

  if (!role) {
    return (
      <Card title="Информация о ролях" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>Статистика по ролям:</Title>
          {Object.entries(roleStats).map(([roleType, count]) => {
            const info = getRoleInfo(roleType as UserRole);
            return (
              <Row key={roleType} justify="space-between" align="middle">
                <Col>
                  <Tag color={info.color} icon={info.icon}>
                    {info.title}
                  </Tag>
                </Col>
                <Col>
                  <Text strong>{count}</Text>
                </Col>
              </Row>
            );
          })}
          
          <Title level={5}>Отделы:</Title>
          <Space wrap>
            {departments.map(dept => (
              <Tag key={dept} color="cyan">{dept}</Tag>
            ))}
          </Space>
        </Space>
      </Card>
    );
  }

  const info = getRoleInfo(role);
  const roleCount = roleStats[role];

  return (
    <Card title="Информация о роли" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Tag color={info.color} icon={info.icon} style={{ fontSize: '14px' }}>
              {info.title}
            </Tag>
          </Col>
          <Col>
            <Text strong>{roleCount} сотрудников</Text>
          </Col>
        </Row>
        
        <Text type="secondary">{info.description}</Text>
        
        {role === 'manager' && (
          <Text type="secondary">
            Руководители имеют доступ к управлению отделом и просмотру отчетов.
          </Text>
        )}
        
        {role === 'superuser' && (
          <Text type="secondary">
            Суперпользователи имеют полный доступ ко всем функциям системы.
          </Text>
        )}
        
        {role === 'business' && (
          <Text type="secondary">
            Бизнес-пользователи работают с бизнес-процессами и аналитикой.
          </Text>
        )}
        
        {role === 'employee' && (
          <Text type="secondary">
            Сотрудники выполняют основные рабочие задачи в системе.
          </Text>
        )}
      </Space>
    </Card>
  );
};

export default RoleInfo;
