'use client';

import { FASSI7_LOGO_BASE64 } from './logoBase64';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  docReference?: string;
  locale?: string;
  orientation?: 'portrait' | 'landscape';
  summaryPills?: Array<{ label: string; value: string | number; color?: string }>;
  headers: string[];
  rows: Array<Array<{ content: string; badge?: 'success' | 'warning' | 'info' | 'default' | 'danger'; align?: 'left' | 'center' | 'right' } | string>>;
  notes?: string;
}

/**
 * Downloads a structured array of rows as an Excel-compatible UTF-8 CSV file
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const formatCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(formatCell).join(','),
    ...rows.map((row) => row.map(formatCell).join(',')),
  ];

  // UTF-8 BOM (\uFEFF) ensures Excel displays Arabic and accented French characters correctly
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens a dedicated, pixel-perfect printable window with Fassi7 Academy letterhead & official logo
 * and immediately triggers window.print() (allowing the user to Save as PDF).
 */
export function exportTableToPDF(options: PDFExportOptions) {
  const {
    title,
    subtitle,
    docReference,
    locale = 'fr',
    orientation = 'landscape',
    summaryPills = [],
    headers,
    rows,
    notes,
  } = options;

  const isRtl = locale === 'ar';
  const currentDate = new Date().toLocaleDateString(
    locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );
  const currentTime = new Date().toLocaleTimeString(
    locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const printWindow = window.open('', '_blank', 'width=1150,height=850');
  if (!printWindow) {
    alert(
      locale === 'ar'
        ? 'يرجى السماح بالنوافذ المنبثقة لتصدير ملف PDF'
        : locale === 'en'
        ? 'Please allow popups to export the PDF file'
        : 'Veuillez autoriser les fenêtres pop-up pour exporter le document PDF'
    );
    return;
  }

  // Construct summary pills HTML
  const pillsHtml = summaryPills.length
    ? `
      <div class="kpi-strip">
        ${summaryPills
          .map(
            (p) => `
          <div class="kpi-card">
            <div class="kpi-label">${p.label}</div>
            <div class="kpi-value" style="color: ${p.color || '#FA461D'};">${p.value}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `
    : '';

  // Construct Table Rows HTML
  const tableRowsHtml = rows
    .map(
      (row, idx) => `
      <tr class="${idx % 2 === 1 ? 'row-even' : 'row-odd'}">
        ${row
          .map((cell) => {
            const isObj = typeof cell === 'object' && cell !== null;
            const content = isObj ? cell.content : cell;
            const align = isObj && cell.align ? cell.align : (isRtl ? 'right' : 'left');
            let badgeHtml = content;

            if (isObj && cell.badge) {
              const bgColors: Record<string, string> = {
                success: '#ECFDF5',
                warning: '#FFFBEB',
                danger: '#FEF2F2',
                info: '#F0F9FF',
                default: '#F3F4F6',
              };
              const textColors: Record<string, string> = {
                success: '#065F46',
                warning: '#92400E',
                danger: '#991B1B',
                info: '#075985',
                default: '#374151',
              };
              const borderColors: Record<string, string> = {
                success: '#A7F3D0',
                warning: '#FDE68A',
                danger: '#FECACA',
                info: '#BAE6FD',
                default: '#E5E7EB',
              };
              badgeHtml = `<span class="status-badge" style="background: ${bgColors[cell.badge] || '#F3F4F6'}; color: ${textColors[cell.badge] || '#374151'}; border: 1px solid ${borderColors[cell.badge] || '#E5E7EB'};">${content}</span>`;
            }

            return `<td style="text-align: ${align};">${badgeHtml}</td>`;
          })
          .join('')}
      </tr>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="${locale}" dir="${isRtl ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="utf-8">
      <title>${title} — Fassi7 Academy</title>
      <style>
        @page {
          size: A4 ${orientation};
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 16px 20px;
          color: #2D1810;
          background: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 9.5pt;
          line-height: 1.4;
          direction: ${isRtl ? 'rtl' : 'ltr'};
        }

        /* HEADER AREA */
        .top-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 2.5px solid #FA461D;
          margin-bottom: 14px;
        }
        .brand-section {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .logo-img {
          height: 48px;
          max-width: 175px;
          object-fit: contain;
          display: block;
        }
        .brand-divider {
          width: 1.5px;
          height: 44px;
          background-color: #EADBCE;
        }
        .brand-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .academy-name {
          font-size: 11pt;
          font-weight: 900;
          color: #3D1B0D;
          letter-spacing: -0.2px;
          line-height: 1.2;
        }
        .academy-slogan {
          font-size: 8pt;
          color: #FA461D;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 1px;
        }
        .academy-contact {
          font-size: 7.5pt;
          color: #7A6258;
          margin-top: 2px;
        }

        /* META CARD RIGHT */
        .meta-section {
          text-align: ${isRtl ? 'left' : 'right'};
        }
        .official-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #FFF2EE;
          border: 1.2px solid #FFD5C8;
          color: #FA461D;
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 7.5pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .meta-list {
          font-size: 8pt;
          color: #55443D;
          line-height: 1.45;
        }
        .meta-list strong {
          color: #2D1810;
        }

        /* DOCUMENT TITLE BANNER */
        .title-container {
          background: #FDFBF9;
          border: 1px solid #F0E4D8;
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-${isRtl ? 'right' : 'left'}: 4.5px solid #FA461D;
        }
        .doc-title {
          font-size: 13.5pt;
          font-weight: 900;
          color: #2D1810;
          margin: 0;
          line-height: 1.2;
        }
        .doc-subtitle {
          font-size: 8.5pt;
          color: #7A6258;
          margin: 3px 0 0 0;
          font-weight: 500;
        }
        .doc-stamp-label {
          background: #FFFFFF;
          border: 1px solid #EADBCE;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 7.5pt;
          color: #7A6258;
          text-align: center;
        }

        /* SUMMARY KPI STRIP */
        .kpi-strip {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .kpi-card {
          flex: 1;
          min-width: 120px;
          background: #FFFFFF;
          border: 1px solid #EADBCE;
          border-radius: 8px;
          padding: 6px 12px;
          box-shadow: 0 1px 3px rgba(61, 27, 13, 0.03);
        }
        .kpi-label {
          font-size: 7.5pt;
          color: #8C6F5A;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .kpi-value {
          font-size: 12.5pt;
          font-weight: 900;
          line-height: 1.2;
          margin-top: 1px;
        }

        /* DATA TABLE */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
          page-break-inside: auto;
          font-size: 8.5pt;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        thead {
          display: table-header-group;
        }
        th {
          background-color: #F8F4EF;
          color: #3D1B0D;
          font-weight: 800;
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding: 8px 10px;
          text-align: ${isRtl ? 'right' : 'left'};
          border-top: 1.5px solid #EADBCE;
          border-bottom: 2px solid #FA461D;
        }
        td {
          padding: 6.5px 10px;
          border-bottom: 1px solid #EEE5DC;
          color: #2D1810;
        }
        .row-even td {
          background-color: #FCFAF8;
        }
        .row-odd td {
          background-color: #FFFFFF;
        }

        /* STATUS BADGE */
        .status-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 7.5pt;
          font-weight: 800;
          letter-spacing: 0.2px;
          white-space: nowrap;
        }

        /* SIGNATURE SECTION */
        .signature-section {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 0 15px;
          page-break-inside: avoid;
        }
        .sign-box {
          border-top: 1.5px dashed #C2A796;
          width: 220px;
          padding-top: 6px;
          text-align: center;
          font-size: 8pt;
          font-weight: 700;
          color: #6B554B;
        }
        .seal-box {
          width: 100px;
          height: 100px;
          border: 2px dashed #FA461D;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #FA461D;
          font-size: 7pt;
          font-weight: 900;
          text-transform: uppercase;
          text-align: center;
          opacity: 0.75;
          transform: rotate(-10deg);
          margin-bottom: 5px;
        }

        /* FOOTER */
        .footer {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #EADBCE;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7.5pt;
          color: #8C6F5A;
        }

        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- TOP BANNER WITH OFFICIAL LOGO -->
      <div class="top-banner">
        <div class="brand-section">
          <!-- Official Fassi7 Logo Base64 (zero network latency) -->
          <img src="${FASSI7_LOGO_BASE64}" alt="Fassi7 School Logo" class="logo-img" />
          <div class="brand-divider"></div>
          <div class="brand-info">
            <div class="academy-name">Fassi7 School • أكاديمية فصيح الدولية</div>
            <div class="academy-slogan">Learning That Fits Your Life • تعليم يناسب حياتك</div>
            <div class="academy-contact">contact@fassi7.com • +213 550 12 34 56 • Algiers, Algeria</div>
          </div>
        </div>

        <div class="meta-section">
          <div class="official-tag">★ ${isRtl ? 'وثيقة رسمية معتمدة' : locale === 'en' ? 'Official Certified Document' : 'Document Officiel Certifié'}</div>
          <div class="meta-list">
            <div>${isRtl ? 'الرقم المرجعي:' : 'Réf:'} <strong>${docReference || 'FS-ERP-' + new Date().getFullYear()}</strong></div>
            <div>${isRtl ? 'تاريخ التوليد:' : 'Date:'} <strong>${currentDate} (${currentTime})</strong></div>
            <div>${isRtl ? 'النظام المصدر:' : 'ERP:'} Fassi7 Academic Core v2.4</div>
          </div>
        </div>
      </div>

      <!-- TITLE CONTAINER -->
      <div class="title-container">
        <div>
          <h1 class="doc-title">${title}</h1>
          ${subtitle ? `<p class="doc-subtitle">${subtitle}</p>` : ''}
        </div>
        <div class="doc-stamp-label">
          <strong>${isRtl ? 'حالة الوثيقة' : 'Statut'}</strong><br/>
          <span style="color: #16A34A; font-weight: 800;">✓ ${isRtl ? 'معتمدة وصالحة' : 'Authentique'}</span>
        </div>
      </div>

      <!-- SUMMARY KPI PILLS -->
      ${pillsHtml}

      <!-- DATA TABLE -->
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      ${
        notes
          ? `<div style="margin-top: 12px; font-size: 8pt; color: #7A6258; background: #FFFBF7; border: 1px solid #F3E7DC; border-radius: 6px; padding: 7px 11px;">
              <strong>${isRtl ? 'ملاحظة وتوجيهات:' : locale === 'en' ? 'Administrative Note:' : 'Remarque & Consignes :'}</strong> ${notes}
            </div>`
          : ''
      }

      <!-- SIGNATURE SECTION WITH OFFICIAL STAMP -->
      <div class="signature-section">
        <div class="sign-box">
          ${isRtl ? 'أمانة شؤون الطلاب والتسجيل' : locale === 'en' ? 'Registrar & Student Affairs' : 'Secrétariat Pédagogique & Registraire'}<br/>
          <span style="font-size: 7pt; color: #9CA3AF; font-weight: normal;">(Visa & Date)</span>
        </div>

        <!-- Simulated circular academy seal -->
        <div class="seal-box">
          <div>★ FASSI7 ★</div>
          <div style="font-size: 6pt; margin: 1px 0;">ACADEMY</div>
          <div>CERTIFIED</div>
        </div>

        <div class="sign-box">
          ${isRtl ? 'ختم الإدارة العامة والاعتماد' : locale === 'en' ? 'General Administration & Seal' : 'Direction Générale de l\'Académie'}<br/>
          <span style="font-size: 7pt; color: #9CA3AF; font-weight: normal;">(Cachet et Signature)</span>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div>Fassi7 School ERP • Système de Gestion Académique & Financière Certifié Conforme</div>
        <div>fassi7-school.com • contact@fassi7.com</div>
        <div>Page 1 / 1</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
