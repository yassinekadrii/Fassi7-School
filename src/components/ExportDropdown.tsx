'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  label?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export function ExportDropdown({
  onExportCSV,
  onExportPDF,
  label,
  size = 'sm',
  align,
  className = '',
  style = {},
}: ExportDropdownProps) {
  const { locale, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultAlign = align || (dir === 'rtl' ? 'left' : 'right');

  const buttonText =
    label ||
    (locale === 'ar' ? 'تصدير' : locale === 'en' ? 'Export' : 'Exporter');

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative', display: 'inline-block', ...style }}
      className={className}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={size === 'sm' ? 'btn-outline btn-sm' : 'btn-outline'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          backgroundColor: '#FFFFFF',
          borderColor: '#EADBCE',
          color: '#3D1B0D',
          fontWeight: 700,
          boxShadow: '0 1px 3px rgba(61, 27, 13, 0.05)',
        }}
      >
        <Download size={size === 'sm' ? 15 : 17} color="#FA461D" />
        <span>{buttonText}</span>
        <ChevronDown
          size={14}
          color="#8C6F5A"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [defaultAlign]: 0,
            zIndex: 100,
            minWidth: '240px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #EADBCE',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(61, 27, 13, 0.12), 0 8px 10px -6px rgba(61, 27, 13, 0.08)',
            padding: '0.45rem',
            animation: 'fadeIn 0.12s ease-out',
          }}
        >
          {/* Header prompt */}
          <div
            style={{
              padding: '0.4rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#8C6F5A',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #F3EAE1',
              marginBottom: '0.3rem',
            }}
          >
            {locale === 'ar' ? 'اختر صيغة التصدير' : locale === 'en' ? 'Select Export Format' : 'Format d\'exportation'}
          </div>

          {/* Option 1: CSV */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportCSV();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: dir === 'rtl' ? 'right' : 'left',
              transition: 'background-color 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0FDF4')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={18} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#14532D' }}>
                {locale === 'ar' ? 'تصدير كملف CSV (إكسل)' : locale === 'en' ? 'Export as CSV' : 'Exporter en CSV'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#166534' }}>
                {locale === 'ar' ? 'جداول بيانات متوافقة مع Excel' : locale === 'en' ? 'Excel-compatible spreadsheet' : 'Tableur compatible Excel'}
              </div>
            </div>
          </button>

          {/* Option 2: PDF */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportPDF();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: dir === 'rtl' ? 'right' : 'left',
              transition: 'background-color 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF2EE')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#FFE4DE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={18} color="#FA461D" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9A2C14' }}>
                {locale === 'ar' ? 'تصدير كملف PDF' : locale === 'en' ? 'Export as PDF' : 'Exporter en PDF'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#B9381A' }}>
                {locale === 'ar' ? 'وثيقة رسمية جاهزة للطباعة والحفظ' : locale === 'en' ? 'Printable official document' : 'Document officiel imprimable'}
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
