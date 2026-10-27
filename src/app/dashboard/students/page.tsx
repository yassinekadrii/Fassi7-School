'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Users, Plus, Search, FileSpreadsheet, Edit2, X, Phone, Mail, MapPin } from 'lucide-react';

export default function StudentsManagePage() {
  const { t, locale } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Alger');
  const [adminNotes, setAdminNotes] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setEmail('');
    setPhone('');
    setCity('Alger');
    setAdminNotes('');
    setLearningGoals('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingStudent(s);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone || '');
    setCity(s.city || 'Alger');
    setAdminNotes(s.admin_notes || '');
    setLearningGoals(s.learning_goals || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      id: editingStudent ? editingStudent.id : undefined,
      name,
      email,
      phone,
      city,
      admin_notes: adminNotes,
      learning_goals: learningGoals,
    };

    try {
      const res = await fetch('/api/students', {
        method: editingStudent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        loadStudents();
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Total_Due_DZD', 'Total_Paid_DZD', 'Balance_DZD'];
    const rows = students.map((s) => [
      s.id,
      `"${s.name}"`,
      s.email,
      `"${s.phone || ''}"`,
      `"${s.city || ''}"`,
      s.total_due || 0,
      s.total_paid || 0,
      s.balance || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fassi7_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSettleBalance = async (student: any) => {
    const confirmMsg =
      locale === 'ar'
        ? `هل تريد تأكيد تسوية رصيد الطالب (${student.name}) بقيمة (${student.balance?.toLocaleString()} د.ج)؟`
        : locale === 'en'
        ? `Are you sure you want to mark the remaining balance of ${student.balance?.toLocaleString()} DZD for ${student.name} as Settled?`
        : `Confirmer le règlement intégral du solde (${student.balance?.toLocaleString()} DZD) pour ${student.name} ?`;

    if (!confirm(confirmMsg)) return;

    try {
      const activeEnrollment = student.enrollments?.[0];
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          enrollment_id: activeEnrollment?.id || null,
          course_id: activeEnrollment?.course_id || null,
          amount: student.balance,
          payment_method: 'baridimob',
          reference_number: `REGLE-${Date.now().toString().slice(-6)}`,
          status: 'paid',
          notes: 'Solde entièrement réglé par l\'administration / Settled by Admin',
        }),
      });

      if (res.ok) {
        loadStudents();
      } else {
        alert(locale === 'ar' ? 'حدث خطأ أثناء تسوية الرصيد' : 'Erreur lors de la mise à jour du solde.');
      }
    } catch (err) {
      console.error('Error settling balance:', err);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone?.includes(q);
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_students')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'دليل الطلاب المسجلين، متابعة الأرصدة المالية، وملاحظات الإدارة'
              : 'Répertoire des apprenants, suivi des soldes et historique'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportToCSV} className="btn-outline btn-sm">
            <FileSpreadsheet size={15} color="#10B981" />
            <span>{t('action_export_csv')}</span>
          </button>
          <button onClick={openAddModal} className="btn-primary btn-sm">
            <Plus size={16} />
            <span>{locale === 'ar' ? 'إضافة طالب جديد' : 'Ajouter un étudiant'}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '400px', position: 'relative' }}>
        <input
          type="text"
          placeholder={locale === 'ar' ? 'بحث بالاسم، البريد أو الهاتف...' : 'Rechercher par nom, email ou tél...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ paddingInlineStart: '2.4rem' }}
        />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الطالب' : 'Étudiant'}</th>
                <th>{locale === 'ar' ? 'المدينة' : 'Ville'}</th>
                <th>{locale === 'ar' ? 'الدورات المسجلة' : 'Formations'}</th>
                <th>{locale === 'ar' ? 'المدفوع / المستحق' : 'Règlement'}</th>
                <th>{locale === 'ar' ? 'الرصيد المتبقي' : 'Solde Dû'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'تعديل' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                        }}
                      >
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                          {s.name}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span dir="ltr">{s.phone}</span>
                          <span>•</span>
                          <span>{s.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.city || 'Alger'}</span>
                  </td>
                  <td>
                    {s.enrollments && s.enrollments.length > 0 ? (
                      s.enrollments.map((enr: any) => (
                        <span key={enr.id} className="badge badge-secondary" style={{ display: 'inline-block', margin: '2px' }}>
                          {enr.title_fr}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      {s.total_paid?.toLocaleString()} / {s.total_due?.toLocaleString()} {t('price_dzd')}
                    </span>
                  </td>
                  <td>
                    {s.balance > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-danger">
                          {s.balance?.toLocaleString()} {t('price_dzd')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSettleBalance(s)}
                          className="btn-outline btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.55rem',
                            borderColor: '#10B981',
                            color: '#10B981',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-full)',
                          }}
                          title={locale === 'ar' ? 'تسوية الرصيد المستحق' : locale === 'en' ? 'Mark balance as Settled' : 'Régler le solde'}
                        >
                          ✓ {locale === 'ar' ? 'تسوية' : locale === 'en' ? 'Settle' : 'Régler'}
                        </button>
                      </div>
                    ) : (
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        ✓ {locale === 'ar' ? 'سدد بالكامل' : locale === 'en' ? 'Settled' : 'Réglé'}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => openEditModal(s)}
                      className="btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                    >
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Student */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                {editingStudent
                  ? locale === 'ar' ? 'تعديل بيانات الطالب' : 'Modifier le dossier étudiant'
                  : locale === 'ar' ? 'إضافة حساب طالب جديد' : 'Créer un étudiant'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('form_full_name')} *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('form_email')} *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('form_phone')} *</label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'المدينة / الولاية' : 'Ville'}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الهدف التعليمي' : 'Objectif d\'apprentissage'}</label>
                  <input
                    type="text"
                    placeholder="Ex: IELTS 7.5 pour master au Royaume-Uni"
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'ملاحظات الإدارة الداخلية' : 'Notes administratives'}</label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline btn-sm">
                  {t('action_cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? '...' : t('action_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
