import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { memberAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const AddMember = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    memberName: '',
    memberGender: '',
    memberAge: '',
    memberHeight: '',
    memberWeight: '',
    memberPhone: '',
    cardClass: '',
    membershipDuration: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.memberName || !formData.memberGender || !formData.cardClass) {
      setError(t('member.required'));
      return;
    }

    try {
      const response = await memberAPI.add({
        memberName: formData.memberName,
        memberGender: formData.memberGender,
        memberAge: parseInt(formData.memberAge) || null,
        memberHeight: parseInt(formData.memberHeight) || null,
        memberWeight: parseInt(formData.memberWeight) || null,
        memberPhone: formData.memberPhone ? parseInt(formData.memberPhone) : null,
        cardClass: parseInt(formData.cardClass),
        membershipDuration: formData.membershipDuration ? parseInt(formData.membershipDuration) : null,
      });

      if (response.data.success) {
        navigate('/admin/members');
      } else {
        setError(response.data.message || t('member.add.failed'));
      }
    } catch (error) {
      setError(error.response?.data?.message || t('member.add.failed'));
    }
  };

  if (!ready) {
    return <div className="text-center mt-5">{t('common.loading')}</div>;
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('member.add.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/members">{t('admin.nav.members')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('member.add.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person-plus me-1"></i>
            {t('member.add.cardTitle')}
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('member.field.name')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="memberName"
                    value={formData.memberName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('member.field.gender')}</label>
                  <select
                    className="form-control"
                    name="memberGender"
                    value={formData.memberGender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('common.selectPlaceholder')}</option>
                    <option value={t('common.male')}>{t('common.male')}</option>
                    <option value={t('common.female')}>{t('common.female')}</option>
                  </select>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('member.field.age')}</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberAge"
                    value={formData.memberAge}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('member.field.phone')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="memberPhone"
                    value={formData.memberPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('member.field.height')}</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberHeight"
                    value={formData.memberHeight}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('member.field.weight')}</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberWeight"
                    value={formData.memberWeight}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('member.field.cardClass')}</label>
                  <input
                    type="number"
                    className="form-control"
                    name="cardClass"
                    value={formData.cardClass}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('member.field.membershipDuration')}</label>
                  <input
                    type="number"
                    className="form-control"
                    name="membershipDuration"
                    value={formData.membershipDuration}
                    onChange={handleChange}
                    min="0"
                    placeholder={t('member.field.membershipDuration')}
                  />
                </div>
              </div>
              <div className="mt-4 mb-0">
                <button type="submit" className="btn btn-primary">
                  {t('common.add')}
                </button>
                <Link to="/admin/members" className="btn btn-secondary ms-2">
                  {t('common.cancel')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddMember;
