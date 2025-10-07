import { theme } from 'antd';

export const darkGrayTheme = {
  token: {
    colorBgBase: '#1a1a1a',
    colorBgContainer: '#2d2d2d',
    colorTextBase: '#e6e6e6',
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    borderRadius: 6,
    boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.48), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.2)',
  },
  components: {
    Layout: {
      bodyBg: '#1a1a1a',
      headerBg: '#2d2d2d',
      siderBg: '#262626',
    },
    Table: {
      headerBg: '#3a3a3a',
      rowHoverBg: 'rgba(255, 255, 255, 0.06)',
    },
    Menu: {
      itemSelectedBg: 'rgba(24, 144, 255, 0.15)',
    },
    Card: {
      colorBgContainer: '#2d2d2d',
    },
    Button: {
      colorPrimary: '#1890ff',
    },
  },
};

export const windowsXPTheme = {
  token: {
    colorBgBase: '#ece9d8',
    colorBgContainer: '#ffffff',
    colorTextBase: '#000000',
    colorPrimary: '#0054e3',
    colorSuccess: '#00a651',
    colorWarning: '#ff8c00',
    colorError: '#d13438',
    colorInfo: '#0078d4',
    borderRadius: 3,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
  },
  components: {
    Button: {
      colorPrimary: '#0054e3',
    },
    Layout: {
      bodyBg: '#ece9d8',
      headerBg: '#0054e3',
    },
    Card: {
      colorBgContainer: '#ffffff',
    },
  },
};
