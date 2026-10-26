'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'symbol';
  asLink?: boolean;
}

export function Fassi7Logo({
  size = 'md',
  showSubtitle = false,
  className = '',
  variant = 'full',
  asLink = true,
}: LogoProps) {
  let symbolSize = 40;
  let fontSize = 1.6;

  if (size === 'sm') {
    symbolSize = 30;
    fontSize = 1.25;
  } else if (size === 'lg') {
    symbolSize = 54;
    fontSize = 2.1;
  }

  const content = (
    <>
      {/* Official Fassi7 High-Resolution Symbol */}
      <img
        src="/images/Fassi7 - Symbol PNG-01.png"
        alt="Fassi7 فصيح Symbol"
        style={{
          height: `${symbolSize}px`,
          width: `${symbolSize}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
        }}
      />

      {variant === 'full' && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', lineHeight: 1 }}>
            <span
              style={{
                fontFamily: 'var(--font-latin)',
                fontWeight: 900,
                fontSize: `${fontSize}rem`,
                color: '#3A1404',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              Fassi<span style={{ color: '#FA491F' }}>7</span>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-arabic)',
                fontWeight: 800,
                fontSize: `${fontSize * 0.72}rem`,
                color: '#FA491F',
                lineHeight: 1,
              }}
            >
              فصيح
            </span>
          </div>

          {showSubtitle && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#FA491F',
                letterSpacing: '0.04em',
                marginTop: '3px',
                textTransform: 'uppercase',
              }}
            >
              Learning That Fits Your Life
            </span>
          )}
        </div>
      )}
    </>
  );

  const containerStyle: React.CSSProperties = {
    textDecoration: 'none',
    gap: '0.65rem',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: asLink ? 'pointer' : 'default',
  };

  if (asLink) {
    return (
      <Link
        href="/"
        className={`inline-flex items-center select-none ${className}`}
        style={containerStyle}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={containerStyle}
    >
      {content}
    </div>
  );
}

