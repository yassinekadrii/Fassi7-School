'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Users,
  Plus,
  Search,
  FileSpreadsheet,
  Edit2,
  X,
  Phone,
  Mail,
  MapPin,
  Eye,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

export default function StudentsManagePage() {
  const { t, locale, dir } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Add / Edit Basic Profile
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

  // Student Full Dossier Modal
  const [selectedStudentDossier, setSelectedStudentDossier] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<number | null>(null);
  const [dossierSuccessMsg, setDossierSuccessMsg] = useState('');

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      const list = data.students || [];
      setStudents(list);

      // If a student dossier is currently open, refresh their data
      if (selectedStudentDossier) {
        const updated = list.find((s: any) => s.id === selectedStudentDossier.id);
        if (updated) {
          setSelectedStudentDossier(updated);
        }
      }
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

  const openEditModal = (s: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const openStudentDossier = (student: any) => {
    setSelectedStudentDossier(student);
    setSelectedCourseId(student.enrollments?.[0]?.id || null);
    setDossierSuccessMsg('');
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
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

  const handleUpdateEnrollmentStatus = async (enrollmentId: number, newStatus: string) => {
    setUpdatingEnrollmentId(enrollmentId);
    setDossierSuccessMsg('');

    try {
      const res = await fetch('/api/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: enrollmentId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        await loadStudents();
        if (newStatus === 'confirmed') {
          setDossierSuccessMsg(
            locale === 'ar'
              ? '✓ تم تأكيد تسجيل الطالب بنجاح! يظهر الآن تلقائياً في قائمة حضور الأستاذ لهذا الفوج.'
              : '✓ Inscription validée et confirmée ! Cet étudiant apparaît désormais automatiquement dans la feuille de présence de l\'enseignant pour ce cours.'
          );
        } else {
          setDossierSuccessMsg(
            locale === 'ar'
              ? `تم تحديث حالة التسجيل إلى (${newStatus}) بنجاح.`
              : `Statut mis à jour vers "${newStatus}" avec succès.`
          );
        }
      } else {
        alert(locale === 'ar' ? 'فشل تحديث الحالة' : 'Erreur lors de la mise à jour du statut.');
      }
    } catch (err) {
      console.error('Error updating enrollment status:', err);
    } finally {
      setUpdatingEnrollmentId(null);
    }
  };

  const handleSettleBalance = async (student: any, enrollment?: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const amountToSettle = enrollment ? (enrollment.amount_due - enrollment.amount_paid) : student.balance;
    if (amountToSettle <= 0) return;

    const confirmMsg =
      locale === 'ar'
        ? `هل تريد تأكيد تسوية رصيد الطالب (${student.name}) بقيمة (${amountToSettle?.toLocaleString()} د.ج)؟`
        : locale === 'en'
        ? `Are you sure you want to mark the remaining balance of ${amountToSettle?.toLocaleString()} DZD for ${student.name} as Settled?`
        : `Confirmer le règlement intégral du solde (${amountToSettle?.toLocaleString()} DZD) pour ${student.name} ?`;

    if (!confirm(confirmMsg)) return;

    try {
      const targetEnr = enrollment || student.enrollments?.[0];
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          enrollment_id: targetEnr?.id || null,
          course_id: targetEnr?.course_id || null,
          amount: amountToSettle,
          payment_method: 'baridimob',
          reference_number: `REGLE-${Date.now().toString().slice(-6)}`,
          status: 'paid',
          notes: 'Solde entièrement réglé par l\'administration / Settled by Admin',
        }),
      });

      if (res.ok) {
        await loadStudents();
        setDossierSuccessMsg(
          locale === 'ar' ? '✓ تم تسوية الرصيد بنجاح!' : '✓ Solde réglé avec succès !'
        );
      } else {
        alert(locale === 'ar' ? 'حدث خطأ أثناء تسوية الرصيد' : 'Erreur lors de la mise à jour du solde.');
      }
    } catch (err) {
      console.error('Error settling balance:', err);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Total_Due_DZD', 'Total_Paid_DZD', 'Balance_DZD', 'Enrolled_Courses'];
    const rows = students.map((s) => [
      s.id,
      `"${s.name}"`,
      s.email,
      `"${s.phone || ''}"`,
      `"${s.city || ''}"`,
      s.total_due || 0,
      s.total_paid || 0,
      s.balance || 0,
      `"${(s.enrollments || []).map((e: any) => `${e.title_fr} (${e.status})`).join('; ')}"`,
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

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'confirmed':
        return { label: locale === 'ar' ? 'مؤكد (نشط)' : 'Confirmé', bg: '#DEF7EC', color: '#03543F', border: '#BCF0DA' };
      case 'accepted':
        return { label: locale === 'ar' ? 'مقبول' : 'Accepté', bg: '#E1EFFE', color: '#1E429F', border: '#B4C6FC' };
      case 'awaiting_payment':
        return { label: locale === 'ar' ? 'في انتظار الدفع' : 'Attente paiement', bg: '#FEF08A', color: '#854D0E', border: '#FDE047' };
      case 'under_review':
        return { label: locale === 'ar' ? 'قيد المراجعة' : 'En examen', bg: '#FFF0EB', color: '#C2410C', border: '#FED7AA' };
      case 'completed':
        return { label: locale === 'ar' ? 'أكمل الدورة' : 'Terminé', bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
      case 'cancelled':
        return { label: locale === 'ar' ? 'ملغى' : 'Annulé', bg: '#FDE8E8', color: '#9B1C1C', border: '#F8B4B4' };
      default:
        return { label: st, bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
    }
  };

  const getPaymentStatusBadge = (pst: string) => {
    switch (pst) {
      case 'paid':
        return { label: locale === 'ar' ? 'مدفوع بالكامل' : 'Payé intégralement', bg: '#DEF7EC', color: '#03543F' };
      case 'partially_paid':
        return { label: locale === 'ar' ? 'دفع جزئي' : 'Partiellement payé', bg: '#FEF08A', color: '#854D0E' };
      case 'pending':
        return { label: locale === 'ar' ? 'في انتظار السداد' : 'Paiement en attente', bg: '#FDE8E8', color: '#9B1C1C' };
      default:
        return { label: pst, bg: '#F3F4F6', color: '#374151' };
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone?.includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_students')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'دليل الطلاب المسجلين، فحص الدورات المسندة، وتأكيد الحضور التلقائي للأساتذة'
              : 'Dossiers des étudiants, suivi des cours, validation et activation automatique pour l\'appel'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={exportToCSV} className="btn-outline btn-sm" style={{ gap: '0.4rem' }}>
            <FileSpreadsheet size={16} />
            <span>{locale === 'ar' ? 'تصدير كشف Excel' : 'Exporter CSV'}</span>
          </button>
          <button onClick={openAddModal} className="btn-primary btn-sm" style={{ gap: '0.4rem' }}>
            <Plus size={16} />
            <span>{locale === 'ar' ? 'تسجيل طالب جديد' : 'Ajouter un étudiant'}</span>
          </button>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={22} />
        </div>
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
          {locale === 'ar'
            ? '💡 انقر على أي طالب لعرض ملفه والدورات المسجل فيها. بمجرد تغيير حالة الدورة إلى (مؤكد - confirmed)، يُدرج الطالب تلقائياً في قائمة حضور الأستاذ المشرف على ذلك الفوج.'
            : '💡 Cliquez sur un étudiant pour ouvrir son dossier et voir ses cours. Dès que vous confirmez son inscription (statut "Confirmé"), l\'étudiant apparaît automatiquement dans la feuille de présence du formateur.'}
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '420px' }}>
        <input
          type="text"
          placeholder={locale === 'ar' ? 'بحث بالاسم، البريد أو الهاتف...' : 'Rechercher un apprenant...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ paddingInlineStart: '2.4rem' }}
        />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem' }} />
      </div>

      {/* Students Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الطالب' : 'Étudiant'}</th>
                <th>{locale === 'ar' ? 'المدينة' : 'Ville'}</th>
                <th>{locale === 'ar' ? 'الدورات المسجلة وحالتها' : 'Formations & Statuts'}</th>
                <th>{locale === 'ar' ? 'المدفوع / المستحق' : 'Règlement'}</th>
                <th>{locale === 'ar' ? 'الرصيد المتبقي' : 'Solde Dû'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'لم يتم العثور على أي طلاب.' : 'Aucun étudiant trouvé.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => openStudentDossier(s)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    className="table-row-hover"
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.88rem',
                            flexShrink: 0,
                          }}
                        >
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.94rem', color: 'var(--dark-brown)' }}>
                            {s.name}
                          </p>
                          <div style={{ display: 'flex', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            <span dir="ltr">{s.phone || '-'}</span>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '300px' }}>
                          {s.enrollments.map((enr: any) => {
                            const badge = getStatusBadge(enr.status);
                            return (
                              <div
                                key={enr.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  background: 'var(--bg-warm)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.76rem',
                                  lineHeight: 1.25,
                                }}
                              >
                                <span style={{ fontWeight: 700, color: 'var(--dark-brown)' }}>{enr.title_fr}</span>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '999px',
                                    background: badge.bg,
                                    color: badge.color,
                                    border: `1px solid ${badge.border}`,
                                  }}
                                >
                                  {badge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {locale === 'ar' ? 'غير مسجل في أي دورة' : 'Aucune inscription'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>
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
                            onClick={(e) => handleSettleBalance(s, undefined, e)}
                            className="btn-outline btn-sm"
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.55rem',
                              borderColor: '#10B981',
                              color: '#10B981',
                              fontWeight: 700,
                              borderRadius: 'var(--radius-full)',
                            }}
                            title={locale === 'ar' ? 'تسوية الرصيد المستحق' : 'Régler le solde'}
                          >
                            ✓ {locale === 'ar' ? 'تسوية' : 'Régler'}
                          </button>
                        </div>
                      ) : (
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          ✓ {locale === 'ar' ? 'سدد بالكامل' : 'Réglé'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openStudentDossier(s);
                          }}
                          className="btn-primary btn-sm"
                          style={{ padding: '0.32rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem' }}
                          title={locale === 'ar' ? 'عرض الملف والدورات' : 'Voir le dossier complet'}
                        >
                          <Eye size={13} />
                          <span>{locale === 'ar' ? 'الدورات' : 'Dossier'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openEditModal(s, e)}
                          className="btn-outline btn-sm"
                          style={{ padding: '0.32rem 0.55rem', fontSize: '0.78rem' }}
                          title={t('action_edit')}
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT FULL DOSSIER MODAL WITH INTERACTIVE COURSE INSPECTION */}
      {selectedStudentDossier && (
        <div className="modal-overlay" onClick={() => setSelectedStudentDossier(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  {selectedStudentDossier.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900, color: 'var(--dark-brown)' }}>
                    {selectedStudentDossier.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>{selectedStudentDossier.email}</span>
                    <span>•</span>
                    <span dir="ltr">{selectedStudentDossier.phone || '-'}</span>
                    <span>•</span>
                    <span>{selectedStudentDossier.city || 'Alger'}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedStudentDossier(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            <div className="modal-body" style={{ paddingTop: '1.25rem' }}>
              {/* Success Notification Alert */}
              {dossierSuccessMsg && (
                <div
                  style={{
                    backgroundColor: '#DEF7EC',
                    color: '#03543F',
                    border: '1px solid #BCF0DA',
                    padding: '0.85rem 1.1rem',
                    borderRadius: '10px',
                    marginBottom: '1.25rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={18} color="#0E9F6E" style={{ flexShrink: 0 }} />
                  <span>{dossierSuccessMsg}</span>
                </div>
              )}

              {/* Quick Contact & Financial Summary Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                    {locale === 'ar' ? 'الرصيد المالي الإجمالي' : 'Solde Global Dû'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: selectedStudentDossier.balance > 0 ? 'var(--danger)' : '#059669' }}>
                      {selectedStudentDossier.balance?.toLocaleString()} {t('price_dzd')}
                    </span>
                    {selectedStudentDossier.balance > 0 && (
                      <button
                        onClick={() => handleSettleBalance(selectedStudentDossier)}
                        className="btn-outline btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderColor: '#10B981', color: '#10B981' }}
                      >
                        {locale === 'ar' ? 'تسوية' : 'Régler'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                      {locale === 'ar' ? 'التواصل عبر واتساب' : 'Contact WhatsApp'}
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--dark-brown)' }} dir="ltr">
                      {selectedStudentDossier.phone || 'Non renseigné'}
                    </span>
                  </div>
                  {selectedStudentDossier.phone && (
                    <a
                      href={`https://wa.me/${selectedStudentDossier.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline btn-sm"
                      style={{ background: '#25D366', color: '#fff', borderColor: '#25D366', padding: '0.35rem 0.65rem' }}
                    >
                      <MessageCircle size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* COURSES ENROLLED SECTION */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <BookOpen size={18} color="var(--primary)" />
                    <span>{locale === 'ar' ? 'الدورات المسجل فيها (انقر على الدورة لمعاينة حالتها):' : 'Formations souscrites (cliquez pour afficher le détail) :'}</span>
                  </h4>
                  <span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>
                    {selectedStudentDossier.enrollments?.length || 0} {locale === 'ar' ? 'دورات' : 'cours'}
                  </span>
                </div>

                {!selectedStudentDossier.enrollments || selectedStudentDossier.enrollments.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', border: '1.5px dashed var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                      {locale === 'ar' ? 'هذا الطالب غير مسجل في أي دورة بعد.' : 'Cet étudiant n\'est inscrit à aucun cours pour le moment.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {selectedStudentDossier.enrollments.map((enr: any) => {
                      const isExpanded = selectedCourseId === enr.id;
                      const badge = getStatusBadge(enr.status);
                      const paymentBadge = getPaymentStatusBadge(enr.payment_status);
                      const enrBalance = (enr.amount_due || 0) - (enr.amount_paid || 0);

                      return (
                        <div
                          key={enr.id}
                          style={{
                            border: isExpanded ? '2px solid var(--primary)' : '1px solid var(--border)',
                            borderRadius: '12px',
                            backgroundColor: isExpanded ? '#FFF9F6' : '#FFFFFF',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {/* Course Row Header (Clickable) */}
                          <div
                            onClick={() => setSelectedCourseId(isExpanded ? null : enr.id)}
                            style={{
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '1.4rem' }}>{enr.flag_emoji || '🌐'}</span>
                              <div>
                                <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--dark-brown)' }}>
                                  {locale === 'ar' ? enr.title_ar : enr.title_fr}
                                </h5>
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                  {enr.language_name || 'Langue'} • {enr.course_level || 'Tous niveaux'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  backgroundColor: badge.bg,
                                  color: badge.color,
                                  border: `1px solid ${badge.border}`,
                                }}
                              >
                                {badge.label}
                              </span>

                              <span
                                style={{
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '999px',
                                  backgroundColor: paymentBadge.bg,
                                  color: paymentBadge.color,
                                }}
                              >
                                {paymentBadge.label}
                              </span>

                              {isExpanded ? <ChevronDown size={18} color="var(--primary)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                            </div>
                          </div>

                          {/* Expanded Inspection & Status Action Box */}
                          {isExpanded && (
                            <div
                              style={{
                                padding: '1.25rem',
                                borderTop: '1px solid #FFE4DB',
                                backgroundColor: '#FFFFFF',
                              }}
                            >
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                {/* Financial breakdown for this course */}
                                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                                    {locale === 'ar' ? 'التفاصيل المالية للدورة' : 'Situation Financière du Cours'}
                                  </span>
                                  <div style={{ marginTop: '0.35rem', fontSize: '0.84rem' }}>
                                    <div><strong>{locale === 'ar' ? 'المبلغ المستحق:' : 'Total dû :'}</strong> {enr.amount_due?.toLocaleString()} {t('price_dzd')}</div>
                                    <div><strong>{locale === 'ar' ? 'المبلغ المدفوع:' : 'Payé :'}</strong> <span style={{ color: '#059669' }}>{enr.amount_paid?.toLocaleString()} {t('price_dzd')}</span></div>
                                    <div>
                                      <strong>{locale === 'ar' ? 'المتبقي:' : 'Reste dû :'}</strong>{' '}
                                      <span style={{ color: enrBalance > 0 ? 'var(--danger)' : '#059669', fontWeight: 800 }}>
                                        {enrBalance?.toLocaleString()} {t('price_dzd')}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Enrollment Timestamps & Sync Info */}
                                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                                    {locale === 'ar' ? 'سجل التسجيل والتحاق الأستاذ' : 'Validation & Intégration Enseignant'}
                                  </span>
                                  <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', lineHeight: 1.45 }}>
                                    <div>{locale === 'ar' ? 'تاريخ التسجيل:' : 'Inscrit le :'} {enr.enrolled_at ? enr.enrolled_at.slice(0, 10) : '-'}</div>
                                    {enr.confirmed_at && (
                                      <div style={{ color: '#059669', fontWeight: 700 }}>
                                        {locale === 'ar' ? 'تأكيد التسجيل:' : 'Confirmé le :'} {enr.confirmed_at.slice(0, 10)}
                                      </div>
                                    )}
                                    <div style={{ marginTop: '0.3rem', color: enr.status === 'confirmed' ? '#059669' : '#D97706', fontWeight: 700 }}>
                                      {enr.status === 'confirmed'
                                        ? (locale === 'ar' ? '✓ مفعل في ورقة حضور الأستاذ' : '✓ Actif dans la liste de présence de l\'enseignant')
                                        : (locale === 'ar' ? '⏳ في انتظار التأكيد لتضمينه في ورقة الحضور' : '⏳ En attente de confirmation pour l\'appel')}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Interactive Status Switcher & Confirmation Bar */}
                              <div
                                style={{
                                  background: '#FFF0EB',
                                  padding: '1rem 1.25rem',
                                  borderRadius: '10px',
                                  border: '1px solid rgba(250, 70, 29, 0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '0.85rem',
                                }}
                              >
                                <div>
                                  <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--dark-brown)', display: 'block', marginBottom: '0.35rem' }}>
                                    {locale === 'ar' ? 'تغيير حالة هذا التسجيل:' : 'Changer le statut d\'inscription pour ce cours :'}
                                  </label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <select
                                      defaultValue={enr.status}
                                      onChange={(e) => handleUpdateEnrollmentStatus(enr.id, e.target.value)}
                                      disabled={updatingEnrollmentId === enr.id}
                                      className="form-select"
                                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.84rem', width: 'auto', minWidth: '180px' }}
                                    >
                                      <option value="confirmed">✓ {locale === 'ar' ? 'مؤكد (تفعيل الحضور)' : 'Confirmé (Activer l\'appel)'}</option>
                                      <option value="accepted">{locale === 'ar' ? 'مقبول (Accepted)' : 'Accepté'}</option>
                                      <option value="awaiting_payment">{locale === 'ar' ? 'في انتظار الدفع' : 'En attente de paiement'}</option>
                                      <option value="under_review">{locale === 'ar' ? 'قيد المراجعة' : 'En examen'}</option>
                                      <option value="completed">{locale === 'ar' ? 'أكمل الدورة' : 'Formation terminée'}</option>
                                      <option value="cancelled">{locale === 'ar' ? 'إلغاء التسجيل' : 'Annulé'}</option>
                                    </select>

                                    {/* 1-Click Instant Confirm Button if not confirmed */}
                                    {enr.status !== 'confirmed' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateEnrollmentStatus(enr.id, 'confirmed')}
                                        disabled={updatingEnrollmentId === enr.id}
                                        className="btn-primary btn-sm"
                                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', gap: '0.35rem' }}
                                      >
                                        <CheckCircle2 size={14} />
                                        <span>{locale === 'ar' ? 'تأكيد التسجيل الآن' : 'Valider & Confirmer l\'inscription'}</span>
                                      </button>
                                    )}

                                    {/* Settle Course Balance */}
                                    {enrBalance > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleSettleBalance(selectedStudentDossier, enr)}
                                        className="btn-outline btn-sm"
                                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', borderColor: '#10B981', color: '#10B981' }}
                                      >
                                        {locale === 'ar' ? 'تسوية هذا الرصيد' : 'Régler le solde'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button onClick={() => setSelectedStudentDossier(null)} className="btn-primary btn-sm">
                {locale === 'ar' ? 'إغلاق الملف' : 'Fermer le dossier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Student Profile Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                {editingStudent
                  ? locale === 'ar' ? 'تعديل بيانات الطالب' : 'Modifier le profil étudiant'
                  : locale === 'ar' ? 'إضافة حساب طالب جديد' : 'Créer un étudiant'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProfile}>
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
                    <label className="form-label">{t('form_phone')}</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('form_city')}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الأهداف التعليمية' : 'Objectifs pédagogiques'}</label>
                  <input
                    type="text"
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    placeholder="Ex: IELTS 7.5, Voyage, Études au Canada"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'ملاحظات الإدارة' : 'Notes internes'}</label>
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
