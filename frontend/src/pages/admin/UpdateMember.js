import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { memberAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const UpdateMember = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const { account } = useParams();
  const [formData, setFormData] = useState({
    memberAccount: account,
    memberName: '',
    memberGender: '',
    memberAge: '',
    memberHeight: '',
    memberWeight: '',
    memberPhone: '',
    membershipDuration: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMember = useCallback(async () => {
    try {
      const response = await memberAPI.getByAccount(account);
      if (response.data.success && response.data.data.length > 0) {
        const member = response.data.data[0];
        setFormData({
          memberAccount: member.member_account,
          memberName: member.member_name || '',
          memberGender: member.member_gender || '',
          memberAge: member.member_age || '',
          memberHeight: member.member_height || '',
          memberWeight: member.member_weight || '',
          memberPhone: member.member_phone || '',
          membershipDuration: member.membership_duration || '',
        });
      }
    } catch (error) {
      setError(t('member.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [account, t]);

  useEffect(() => {
    if (ready) fetchMember();
  }, [ready, fetchMember]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await memberAPI.update({
        memberAccount: parseInt(formData.memberAccount),
        memberName: formData.memberName,
        memberGender: formData.memberGender,
        memberAge: formData.memberAge ? parseInt(formData.memberAge) : null,
        memberHeight: formData.memberHeight ? parseInt(formData.memberHeight) : null,
        memberWeight: formData.memberWeight ? parseInt(formData.memberWeight) : null,
        memberPhone: formData.memberPhone ? parseInt(formData.memberPhone) : null,
        membershipDuration: formData.membershipDuration ? parseInt(formData.membershipDuration) : null,
      });

      if (response.data.success) {
        navigate('/admin/members');
      } else {
        setError(response.data.message || t('member.update.failed'));
      }
    } catch (error) {
      setError(error.response?.data?.message || t('member.update.failed'));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('member.edit.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/members">{t('admin.nav.members')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('member.edit.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person-check me-1"></i>
            {t('member.edit.title')}
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
                  <label className="form-label">{t('member.field.account')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.memberAccount}
                    disabled
                  />
                </div>
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
              </div>
              <div className="row mb-3">
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
                  <label className="form-label">{t('member.field.phone')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="memberPhone"
                    value={formData.memberPhone}
                    onChange={handleChange}
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
                  {t('common.save')}
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

export default UpdateMember;
