'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { BarChart3, Download, TrendingUp, Users, BookOpen, DollarSign, Award, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch('/api/reports');
        const d = await res.json();
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const exportSummaryCSV = () => {
    if (!data) return;
    const lines = [
      'KPI,Value',
      `Total_Students,${data.kpis?.total_students || 0}`,
      `Total_Teachers,${data.kpis?.total_teachers || 0}`,
      `Active_Courses,${data.kpis?.active_courses || 0}`,
      `Confirmed_Enrollments,${data.kpis?.confirmed_enrollments || 0}`,
      `Total_Revenue_DZD,${data.kpis?.total_revenue || 0}`,
      `Outstanding_Balance_DZD,${data.kpis?.total_balance_due || 0}`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fassi7_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 0' }}>{locale === 'ar' ? 'جاري الحساب...' : 'Chargement des rapports...'}</div>;
  }

  const kpis = data?.kpis || {};
  const langStats = data?.enrollments_by_language || [];
  const coursePopularity = data?.course_popularity || [];
  const teacherWorkload = data?.teacher_workload || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_reports')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'مؤشرات الأداء الأكاديمية والمالية وإحصائيات التسجيل الحية'
              : 'Analytique de performance, popularité des langues et recettes'}
          </p>
        </div>

        <button onClick={exportSummaryCSV} className="btn-outline btn-sm">
          <FileSpreadsheet size={15} color="#10B981" />
          <span>{locale === 'ar' ? 'تصدير ملخص التحليلات CSV' : 'Exporter Bilan CSV'}</span>
        </button>
      </div>

      {/* Financial Health Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="card" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%)', border: '1.5px solid var(--secondary)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9E6500' }}>
            {locale === 'ar' ? 'التحصيل المالي الفعلي' : 'Recettes Effectives Encaissées'}
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.4rem' }}>
            {kpis.total_revenue?.toLocaleString()} {t('price_dzd')}
          </div>
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {locale === 'ar' ? 'مبالغ مدفوعة ومؤكدة عبر وصولات معتمدة' : 'Montants confirmés sur compte'}
          </p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF0EB 100%)', border: '1.5px solid rgba(250, 70, 29, 0.3)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
            {locale === 'ar' ? 'الأرصدة المتبقية قيد التحصيل' : 'Restes à Recouvrer'}
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--dark-brown)', marginTop: '0.4rem' }}>
            {kpis.total_balance_due?.toLocaleString()} {t('price_dzd')}
          </div>
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {locale === 'ar' ? 'أقساط مجدولة للطلاب المسجلين' : 'Tranches restantes à échéance'}
          </p>
        </div>
      </div>

      {/* 2 Grids: Enrollments by Language & Course Popularity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Enrollments by Language */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--dark-brown)' }}>
            {locale === 'ar' ? 'التسجيلات حسب لغة التدريس' : 'Répartition des Inscriptions par Langue'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {langStats.map((l: any, idx: number) => {
              const maxCount = Math.max(...langStats.map((x: any) => x.count), 1);
              const percent = Math.round((l.count / maxCount) * 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 800 }}>
                      {l.flag_emoji} {l.name}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {l.count} {locale === 'ar' ? 'طلاب' : 'élèves'} ({l.revenue?.toLocaleString()} DZD)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-warm)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(percent, 5)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)',
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Popularity */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--dark-brown)' }}>
            {locale === 'ar' ? 'أكثر الدورات إقبالاً' : 'Formations les Plus Demandées'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {coursePopularity.map((c: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-warm)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem', marginBottom: '0.2rem' }}>
                    {c.lang}
                  </span>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--dark-brown)' }}>
                    {c.title}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    {c.enrollments_count}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    {locale === 'ar' ? 'مسجلين' : 'inscrits'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher Workload Table */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--dark-brown)' }}>
          {locale === 'ar' ? 'توزيع عبء التدريس والحصص المجدولة' : 'Charge Pédagogique des Formateurs'}
        </h3>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الأستاذ' : 'Formateur'}</th>
                <th>{locale === 'ar' ? 'الدورات المسندة' : 'Cours Assignés'}</th>
                <th>{locale === 'ar' ? 'الحصص المجدولة' : 'Séances Prévues'}</th>
                <th>{locale === 'ar' ? 'المؤشر' : 'Statut Charge'}</th>
              </tr>
            </thead>
            <tbody>
              {teacherWorkload.map((t: any, idx: number) => (
                <tr key={idx}>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{t.teacher_name}</span>
                  </td>
                  <td>
                    <span className="badge badge-secondary">{t.courses_count} cours</span>
                  </td>
                  <td>
                    <span className="badge badge-primary">{t.sessions_count} séances</span>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {locale === 'ar' ? 'نشط ومتفرغ' : 'Actif & Disponible'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
