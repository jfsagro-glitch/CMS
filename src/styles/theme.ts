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
      primaryColor: '#000000',
      primaryBg: '#ffffff',
      primaryHoverBg: '#e0e0e0',
      defaultBg: '#0a0a0a',
      defaultBorderColor: '#ffffff',
      defaultColor: '#ffffff',
    },
    Card: {
      headerBg: '#0a0a0a',
      actionsBg: '#0a0a0a',
      extraColor: '#ffffff',
      colorBgContainer: '#0a0a0a',
      boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)',
    },
    Table: {
      headerBg: '#0a0a0a',
      rowHoverBg: 'rgba(255, 255, 255, 0.05)',
      filterBg: '#0a0a0a',
      bodySortBg: 'rgba(255, 255, 255, 0.03)',
    },
    Modal: {
      headerBg: '#0a0a0a',
      contentBg: '#0a0a0a',
      footerBg: '#0a0a0a',
      boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)',
    },
    Drawer: {
      headerBg: '#0a0a0a',
      bodyBg: '#0a0a0a',
      footerBg: '#0a0a0a',
    },
    Input: {
      colorBgContainer: '#050505',
      colorBorder: '#ffffff',
      colorText: '#ffffff',
      activeBorderColor: '#ffffff',
      hoverBorderColor: '#e0e0e0',
    },
    Select: {
      colorBgContainer: '#050505',
      colorBorder: '#ffffff',
      colorText: '#ffffff',
      activeBorderColor: '#ffffff',
      hoverBorderColor: '#e0e0e0',
    },
    Switch: {
      handleBg: '#000000',
      trackBg: '#0a0a0a',
      trackCheckedBg: '#ffffff',
    },
    Tag: {
      defaultBg: '#1a1a1a',
      defaultColor: '#ffffff',
    },
    Tooltip: {
      colorBgSpotlight: '#0a0a0a',
      colorTextLightSolid: '#ffffff',
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
      primaryColor: '#000000',
      primaryBg: '#00ff00',
      primaryHoverBg: '#00cc00',
      defaultBg: '#001100',
      defaultBorderColor: '#00ff00',
      defaultColor: '#00ff00',
    },
    Card: {
      headerBg: '#001100',
      actionsBg: '#001100',
      extraColor: '#00ff00',
      colorBgContainer: '#001100',
      boxShadow: '0 0 10px rgba(0, 255, 0, 0.3), inset 0 0 10px rgba(0, 255, 0, 0.1)',
    },
    Table: {
      headerBg: '#001100',
      rowHoverBg: 'rgba(0, 255, 0, 0.1)',
      filterBg: '#001100',
      bodySortBg: 'rgba(0, 255, 0, 0.05)',
    },
    Modal: {
      headerBg: '#001100',
      contentBg: '#001100',
      footerBg: '#001100',
      boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
    },
    Drawer: {
      headerBg: '#001100',
      bodyBg: '#001100',
      footerBg: '#001100',
    },
    Input: {
      colorBgContainer: '#000800',
      colorBorder: '#00ff00',
      colorText: '#00ff00',
      activeBorderColor: '#00ff00',
      hoverBorderColor: '#00cc00',
    },
    Select: {
      colorBgContainer: '#000800',
      colorBorder: '#00ff00',
      colorText: '#00ff00',
      activeBorderColor: '#00ff00',
      hoverBorderColor: '#00cc00',
    },
    Switch: {
      handleBg: '#000000',
      trackBg: '#001100',
      trackCheckedBg: '#00ff00',
    },
    Tooltip: {
      colorBgSpotlight: '#000800',
      colorTextLightSolid: '#00ff00',
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
    boxShadow: 'inset -1px -1px 0px #000000, inset 1px 1px 0px #ffffff, inset -2px -2px 0px #808080, inset 2px 2px 0px #dfdfdf',
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
      primaryColor: '#ffffff',
      primaryBg: '#000080',
      primaryHoverBg: '#0000a0',
      defaultBg: '#c0c0c0',
      defaultBorderColor: '#000000',
      defaultColor: '#000000',
      borderRadius: 0,
      boxShadow: 'inset -1px -1px 0px #000000, inset 1px 1px 0px #ffffff, inset -2px -2px 0px #808080, inset 2px 2px 0px #dfdfdf',
    },
    Card: {
      headerBg: '#000080',
      actionsBg: '#c0c0c0',
      extraColor: '#ffffff',
      colorBgContainer: '#c0c0c0',
      borderRadius: 0,
      boxShadow: 'inset -1px -1px 0px #000000, inset 1px 1px 0px #ffffff',
    },
    Table: {
      headerBg: '#000080',
      headerColor: '#ffffff',
      rowHoverBg: '#0000a0',
      filterBg: '#c0c0c0',
      bodySortBg: '#d0d0d0',
      borderRadius: 0,
    },
    Modal: {
      headerBg: '#000080',
      contentBg: '#c0c0c0',
      footerBg: '#c0c0c0',
      borderRadius: 0,
      boxShadow: 'inset -2px -2px 0px #000000, inset 2px 2px 0px #ffffff',
    },
    Drawer: {
      headerBg: '#000080',
      bodyBg: '#c0c0c0',
      footerBg: '#c0c0c0',
      borderRadius: 0,
    },
    Input: {
      colorBgContainer: '#ffffff',
      colorBorder: '#808080',
      colorText: '#000000',
      activeBorderColor: '#000080',
      hoverBorderColor: '#000080',
      borderRadius: 0,
      boxShadow: 'inset -1px -1px 0px #ffffff, inset 1px 1px 0px #808080',
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBorder: '#808080',
      colorText: '#000000',
      activeBorderColor: '#000080',
      hoverBorderColor: '#000080',
      borderRadius: 0,
    },
    Switch: {
      handleBg: '#c0c0c0',
      trackBg: '#808080',
      trackCheckedBg: '#000080',
    },
    Tag: {
      defaultBg: '#c0c0c0',
      defaultColor: '#000000',
      borderRadius: 0,
    },
    Tooltip: {
      colorBgSpotlight: '#ffffe1',
      colorTextLightSolid: '#000000',
    },
  },
};
