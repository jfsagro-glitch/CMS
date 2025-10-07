import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ collapsed = false, style }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 12,
        padding: '16px 0',
        justifyContent: collapsed ? 'center' : 'flex-start',
        ...style,
      }}
    >
      {/* Логотип - щит с монетой */}
      <svg
        width={collapsed ? 32 : 40}
        height={collapsed ? 32 : 40}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Щит (защита залогового имущества) */}
        <path
          d="M20 2L4 8V18C4 28 12 36 20 38C28 36 36 28 36 18V8L20 2Z"
          fill="url(#gradient1)"
          stroke="#1890ff"
          strokeWidth="1.5"
        />
        
        {/* Монета в центре */}
        <circle
          cx="20"
          cy="20"
          r="8"
          fill="#FFD700"
          stroke="#FFA500"
          strokeWidth="1.5"
        />
        
        {/* Символ рубля на монете */}
        <text
          x="20"
          y="24"
          fontSize="10"
          fontWeight="bold"
          fill="#FF8C00"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
        >
          ₽
        </text>
        
        {/* Градиент для щита */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1890ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0050b3" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Название системы */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1890ff',
              letterSpacing: '-0.5px',
            }}
          >
            Залоговый Реестр
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: '#8c8c8c',
              marginTop: -2,
            }}
          >
            Управление обеспечением
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;

