import type { ThemeConfig } from 'antd';

/**
 * Ant Design 主题配置
 * 完全复刻 MiniMAXI 平台的主题样式
 */
export const theme: ThemeConfig = {
  token: {
    // 主色调 - 绿色（从 MiniMAXI 提取）
    colorPrimary: '#24be58',
    colorPrimaryHover: '#21AF51',
    colorPrimaryActive: '#1e9e48',
    colorPrimaryBg: '#f0fff2',
    colorPrimaryBgHover: '#c9f2d1',
    colorPrimaryBorder: '#9ae6ab',
    colorPrimaryBorderHover: '#6fd98b',

    // 功能色
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorLink: '#24be58',
    colorLinkHover: '#21AF51',
    colorLinkActive: '#1e9e48',

    // 文本颜色
    colorText: '#262626',
    colorTextSecondary: 'rgba(0,0,0,0.65)',
    colorTextTertiary: 'rgba(0,0,0,0.45)',
    colorTextQuaternary: 'rgba(0,0,0,0.25)',

    // 背景颜色
    colorBgBase: '#fff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',

    // 边框颜色
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // 字体
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // 行高
    lineHeight: 1.5714285714285714,
    lineHeightLG: 1.5,
    lineHeightSM: 1.6666666666666667,

    // 圆角
    borderRadius: 4,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 1,

    // 控件高度
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,

    // 阴影（从 MiniMAXI 提取）
    boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  },
  components: {
    // Button 组件
    Button: {
      controlHeight: 32,
      fontSize: 14,
      borderRadius: 4,
      paddingContentHorizontal: 15,
    },
    // Layout 组件
    Layout: {
      headerBg: '#001529',
      headerHeight: 64,
      headerPadding: '0 50px',
      siderBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
    // Menu 组件
    Menu: {
      itemBg: 'transparent',
      itemColor: 'rgba(0,0,0,0.65)',
      itemHoverBg: 'rgba(0,0,0,0.04)',
      itemHoverColor: '#24be58',
      itemSelectedBg: '#f0fff2',
      itemSelectedColor: '#24be58',
      iconSize: 16,
      itemHeight: 40,
      itemPaddingInline: 16,
    },
    // Card 组件
    Card: {
      borderRadiusLG: 8,
      boxShadowTertiary: '0 1px 2px -2px rgba(0,0,0,0.16), 0 3px 6px 0 rgba(0,0,0,0.12), 0 5px 12px 4px rgba(0,0,0,0.09)',
      headerFontSize: 16,
      headerFontSizeSM: 14,
    },
    // Table 组件
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0,0,0,0.88)',
      headerSortActiveBg: '#f0f0f0',
      headerSortHoverBg: '#f5f5f5',
      rowHoverBg: '#fafafa',
      borderColor: '#f0f0f0',
    },
    // Input 组件
    Input: {
      controlHeight: 32,
      fontSize: 14,
      borderRadius: 4,
      paddingBlock: 4,
      paddingInline: 11,
    },
    // Modal 组件
    Modal: {
      headerBg: '#ffffff',
      contentBg: '#ffffff',
      titleFontSize: 16,
      titleLineHeight: 1.5,
      borderRadiusLG: 8,
    },
    // Message 组件
    Message: {
      contentBg: '#ffffff',
      contentPadding: '10px 16px',
    },
    // Tabs 组件
    Tabs: {
      itemColor: 'rgba(0,0,0,0.65)',
      itemHoverColor: '#24be58',
      itemSelectedColor: '#24be58',
      inkBarColor: '#24be58',
      cardBg: '#fafafa',
    },
  },
};
