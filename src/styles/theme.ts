import type { ThemeConfig } from 'antd';

export const darkGrayTheme: ThemeConfig = {
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
    boxShadow:
      '0 3px 6px -4px rgba(0, 0, 0, 0.48), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.2)',
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

export const windowsXPTheme: ThemeConfig = {
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

export const blackWhiteTheme: ThemeConfig = {
  token: {
    colorBgBase: '#000000',
    colorBgContainer: '#0a0a0a',
    colorTextBase: '#ffffff',
    colorPrimary: '#ffffff',
    colorSuccess: '#ffffff',
    colorWarning: '#ffffff',
    colorError: '#ffffff',
    colorInfo: '#ffffff',
    borderRadius: 4,
    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)',
  },
  components: {
    Layout: {
      bodyBg: '#000000',
      headerBg: '#0a0a0a',
      siderBg: '#050505',
    },
    Menu: {
      darkItemBg: '#050505',
      darkSubMenuItemBg: '#0a0a0a',
      darkItemSelectedBg: '#1a1a1a',
      darkItemColor: '#ffffff',
      darkItemHoverBg: '#151515',
    },
    Button: {
      colorPrimary: '#ffffff',
      colorPrimaryHover: '#e0e0e0',
    },
    Card: {
      colorBgContainer: '#0a0a0a',
    },
    Table: {
      headerBg: '#0a0a0a',
    },
    Modal: {
      contentBg: '#0a0a0a',
    },
    Drawer: {
      colorBgElevated: '#0a0a0a',
    },
    Input: {
      colorBgContainer: '#050505',
      colorBorder: '#ffffff',
      colorText: '#ffffff',
    },
    Select: {
      colorBgContainer: '#050505',
      colorBorder: '#ffffff',
      colorText: '#ffffff',
    },
    Switch: {
      colorPrimary: '#ffffff',
    },
    Tag: {
      colorBgContainer: '#1a1a1a',
      colorText: '#ffffff',
    },
  },
};

export const matrixTheme: ThemeConfig = {
  token: {
    colorBgBase: '#000000',
    colorBgContainer: '#001100',
    colorTextBase: '#00ff00',
    colorPrimary: '#00ff00',
    colorSuccess: '#00ff00',
    colorWarning: '#ffff00',
    colorError: '#ff0000',
    colorInfo: '#00ffff',
    borderRadius: 0,
    boxShadow: '0 0 10px rgba(0, 255, 0, 0.3), inset 0 0 10px rgba(0, 255, 0, 0.1)',
  },
  components: {
    Layout: {
      bodyBg: '#000000',
      headerBg: '#001100',
      siderBg: '#000800',
    },
    Menu: {
      darkItemBg: '#000800',
      darkSubMenuItemBg: '#001100',
      darkItemSelectedBg: '#002200',
      darkItemColor: '#00ff00',
      darkItemHoverBg: '#001a00',
    },
    Button: {
      colorPrimary: '#00ff00',
      colorPrimaryHover: '#00cc00',
    },
    Card: {
      colorBgContainer: '#001100',
    },
    Table: {
      headerBg: '#001100',
    },
    Modal: {
      contentBg: '#001100',
    },
    Drawer: {
      colorBgElevated: '#001100',
    },
    Input: {
      colorBgContainer: '#000800',
      colorBorder: '#00ff00',
      colorText: '#00ff00',
    },
    Select: {
      colorBgContainer: '#000800',
      colorBorder: '#00ff00',
      colorText: '#00ff00',
    },
    Switch: {
      colorPrimary: '#00ff00',
    },
  },
};

export const iosTheme: ThemeConfig = {
  token: {
    colorBgBase: '#f2f2f7',
    colorBgContainer: '#ffffff',
    colorTextBase: '#000000',
    colorPrimary: '#007aff',
    colorSuccess: '#34c759',
    colorWarning: '#ff9500',
    colorError: '#ff3b30',
    colorInfo: '#5ac8fa',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
  },
  components: {
    Layout: {
      bodyBg: '#f2f2f7',
      headerBg: 'rgba(255, 255, 255, 0.8)',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBg: '#ffffff',
      itemSelectedBg: '#007aff',
      itemHoverBg: 'rgba(0, 122, 255, 0.1)',
      itemColor: '#000000',
      itemSelectedColor: '#ffffff',
    },
    Button: {
      colorPrimary: '#007aff',
      colorPrimaryHover: '#0051d5',
      borderRadius: 12,
      controlHeight: 44,
    },
    Card: {
      colorBgContainer: '#ffffff',
      borderRadiusLG: 16,
    },
    Table: {
      headerBg: '#f9f9f9',
      borderRadiusLG: 12,
    },
    Modal: {
      contentBg: '#ffffff',
      borderRadiusLG: 16,
    },
    Drawer: {
      colorBgElevated: '#f2f2f7',
    },
    Input: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d1d1d6',
      colorText: '#000000',
      borderRadius: 10,
      controlHeight: 44,
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d1d1d6',
      colorText: '#000000',
      borderRadius: 10,
      controlHeight: 44,
    },
    Switch: {
      colorPrimary: '#34c759',
    },
    Tag: {
      colorBgContainer: '#e5e5ea',
      colorText: '#000000',
      borderRadiusLG: 8,
    },
  },
};

export const windows97Theme: ThemeConfig = {
  token: {
    colorBgBase: '#c0c0c0',
    colorBgContainer: '#c0c0c0',
    colorTextBase: '#000000',
    colorPrimary: '#000080',
    colorSuccess: '#008000',
    colorWarning: '#808000',
    colorError: '#800000',
    colorInfo: '#000080',
    borderRadius: 0,
    boxShadow:
      'inset -1px -1px 0px #000000, inset 1px 1px 0px #ffffff, inset -2px -2px 0px #808080, inset 2px 2px 0px #dfdfdf',
  },
  components: {
    Layout: {
      bodyBg: '#008080',
      headerBg: '#000080',
      siderBg: '#c0c0c0',
    },
    Menu: {
      darkItemBg: '#c0c0c0',
      darkSubMenuItemBg: '#c0c0c0',
      darkItemSelectedBg: '#000080',
      darkItemColor: '#000000',
      darkItemHoverBg: '#0000a0',
    },
    Button: {
      colorPrimary: '#000080',
      colorPrimaryHover: '#0000a0',
      borderRadius: 0,
    },
    Card: {
      colorBgContainer: '#c0c0c0',
      borderRadiusLG: 0,
    },
    Table: {
      headerBg: '#000080',
      borderRadiusLG: 0,
    },
    Modal: {
      contentBg: '#c0c0c0',
      borderRadiusLG: 0,
    },
    Drawer: {
      colorBgElevated: '#c0c0c0',
    },
    Input: {
      colorBgContainer: '#ffffff',
      colorBorder: '#808080',
      colorText: '#000000',
      borderRadius: 0,
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBorder: '#808080',
      colorText: '#000000',
      borderRadius: 0,
    },
    Switch: {
      colorPrimary: '#000080',
    },
    Tag: {
      colorBgContainer: '#c0c0c0',
      colorText: '#000000',
      borderRadiusLG: 0,
    },
  },
};
