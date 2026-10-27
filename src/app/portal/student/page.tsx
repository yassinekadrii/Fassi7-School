'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ReceiptModal } from '@/components/ReceiptModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  User,
  BookOpen,
  Calendar,
  Video,
  DollarSign,
  Printer,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function StudentPortalPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const [schedRes, coursesRes] = await Promise.all([
          fetch('/api/schedule'),
          fetch('/api/courses'),
        ]);
        if (schedRes.ok) {
          const d = await schedRes.json();
          setSessions(d.sessions || []);
        }
        if (coursesRes.ok) {
          const d = await coursesRes.json();
          setEnrollments(d.courses ? d.courses.slice(0, 3) : []);
        }
      } catch (e) {
        console.error('Failed loading student portal data', e);
      } finally {
        setLoadingData(false);
      }
    }

    if (!loading) {
      if (!user) {
        router.push('/admin-portal');
      } else {
        loadStudentData();
      }
    }
  }, [user, loading, router]);

  const handleViewReceipt = (p: any) => {
    setSelectedReceipt(p);
    setIsReceiptModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--secondary)',
                color: 'var(--dark-brown)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 900,
              }}
            >
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="badge badge-secondary" style={{ marginBottom: '0.3rem' }}>
                <User size={13} />
                {locale === 'ar' ? 'فضاء الطالب' : locale === 'en' ? 'Student Learning Portal' : 'Espace Étudiant'}
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? `مرحباً، ${user?.name}` : locale === 'en' ? `Welcome, ${user?.name}` : `Bienvenue, ${user?.name}`}
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {user?.email} • {locale === 'ar' ? 'أكاديمية فصيح للغات' : locale === 'en' ? 'Fassi7 Language Academy' : 'Académie Fassi7'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-warm)', padding: '3.5rem 0', flex: 1 }}>
        <div className="container">
          {/* 3 Columns: Upcoming Sessions, Enrolled Courses, Payment Receipts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>
            {/* 1. Upcoming Live Sessions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <Calendar size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900 }}>
                  {locale === 'ar' ? 'حصصي المباشرة القادمة' : locale === 'en' ? 'My Upcoming Live Sessions' : 'Mes Prochaines Séances'}
                </h2>
              </div>

              {sessions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'لا توجد حصص مجدولة هذا الأسبوع.' : locale === 'en' ? 'No live sessions scheduled this week.' : 'Aucune séance programmée.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sessions.map((s) => (
                    <div key={s.id} className="card" style={{ padding: '1.5rem' }}>
                      <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
                        {s.language_name_fr}
                      </span>
                      <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>
                        {locale === 'ar' ? s.title_ar : s.title_fr}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                        <Clock size={16} />
                        <span>{s.start_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. My Enrolled Courses */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <BookOpen size={22} color="var(--secondary)" />
                <h2 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900 }}>
                  {locale === 'ar' ? 'دوراتي المسجل بها' : locale === 'en' ? 'My Enrolled Courses' : 'Mes Formations'}
                </h2>
              </div>

              {enrollments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    {locale === 'ar' ? 'لم تسجل في أي دورة بعد.' : locale === 'en' ? 'You are not enrolled in any course yet.' : 'Vous n\'êtes inscrit à aucune formation.'}
                  </p>
                  <Link href="/courses" className="btn-primary btn-sm">
                    {t('cta_explore_courses')}
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {enrollments.map((e) => (
                    <div key={e.id} className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className="badge badge-primary">{e.language_name_fr}</span>
                        <span className={e.status === 'confirmed' ? 'badge badge-success' : 'badge badge-secondary'}>
                          {t(`status_${e.status}`)}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: 'var(--dark-brown)' }}>
                        {locale === 'ar' ? e.course_title_ar : e.course_title_fr}
                      </h3>

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', marginTop: '0.85rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{locale === 'ar' ? 'الرسوم المسددة:' : locale === 'en' ? 'Tuition Paid:' : 'Payé :'}</span>
                          <span style={{ fontWeight: 800 }}>
                            {e.amount_paid?.toLocaleString()} / {e.amount_due?.toLocaleString()} {t('price_dzd')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. My Payments & Receipts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <DollarSign size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900 }}>
                  {locale === 'ar' ? 'سجل الوصولات والمدفوعات' : locale === 'en' ? 'Official Receipts & Invoices' : 'Mes Reçus Officiels'}
                </h2>
              </div>

              {payments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'لا توجد وصولات مسجلة بعد.' : locale === 'en' ? 'No payment receipts found.' : 'Aucun reçu disponible.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {payments.map((p) => (
                    <div key={p.id} className="card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.9rem' }}>
                            {p.receipt_number}
                          </span>
                          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', fontWeight: 700 }}>
                            {p.amount?.toLocaleString()} {t('price_dzd')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewReceipt(p)}
                          className="btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem' }}
                        >
                          <Printer size={13} color="var(--primary)" />
                          <span>{locale === 'ar' ? 'عرض الوصل' : locale === 'en' ? 'Print Receipt' : 'Voir Reçu'}</span>
                        </button>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <span>
                          {new Date(p.payment_date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR')} • {p.payment_method}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />

      <Footer />
    </div>
  );
}
