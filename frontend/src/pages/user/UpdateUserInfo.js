import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { userAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const UpdateUserInfo = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('user');
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
    memberPhoto: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMember = useCallback(async () => {
    try {
      const response = await userAPI.getInfo(account);
      if (response.data.success) {
        const member = response.data.data;
        setFormData({
          memberAccount: member.member_account,
          memberName: member.member_name || '',
          memberGender: member.member_gender || '',
          memberAge: member.member_age || '',
          memberHeight: member.member_height || '',
          memberWeight: member.member_weight || '',
          memberPhone: member.member_phone || '',
          memberPhoto: member.member_photo || '',
        });
      }
    } catch (error) {
      setError(t('user.booking.loadFailed'));
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
      // Helper function to safely parse integer
      const safeParseInt = (value) => {
        if (!value || value === '') return null;
        const parsed = parseInt(value);
        return isNaN(parsed) ? null : parsed;
      };

      const updateData = {
        memberAccount: parseInt(formData.memberAccount),
        memberName: formData.memberName,
        memberGender: formData.memberGender,
        memberAge: safeParseInt(formData.memberAge),
        memberHeight: safeParseInt(formData.memberHeight),
        memberWeight: safeParseInt(formData.memberWeight),
        memberPhone: safeParseInt(formData.memberPhone),
        memberPhoto: formData.memberPhoto || null,
      };

      const response = await userAPI.updateInfo(updateData);

      if (response.data.success) {
        // Update session storage
        const memberData = sessionStorage.getItem('member');
        if (memberData) {
          const member = JSON.parse(memberData);
          const safeParseInt = (value) => {
            if (!value || value === '') return null;
            const parsed = parseInt(value);
            return isNaN(parsed) ? null : parsed;
          };
          member.memberName = formData.memberName;
          member.memberGender = formData.memberGender;
          member.memberAge = safeParseInt(formData.memberAge);
          member.memberHeight = safeParseInt(formData.memberHeight);
          member.memberWeight = safeParseInt(formData.memberWeight);
          member.memberPhone = safeParseInt(formData.memberPhone);
          member.memberPhoto = formData.memberPhoto || null;
          sessionStorage.setItem('member', JSON.stringify(member));
        }
        navigate(`/user/info/${account}`);
      } else {
        setError(response.data.message || t('member.update.failed'));
      }
    } catch (error) {
      setError(error.response?.data?.message || t('member.update.failed'));
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('user.edit.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/user/info/${account}`}>{t('user.info.title')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('user.edit.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person-check me-1"></i>
            {t('user.edit.title')}
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
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">{t('member.field.photo')}</label>
                  <div className="mb-2">
                    {formData.memberPhoto ? (
                      <img 
                        src={formData.memberPhoto} 
                        alt={t('member.field.photo')}
                        className="img-thumbnail"
                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="bg-light d-inline-block p-3 rounded">
                        <i className="bi bi-image text-muted"></i>
                        <p className="text-muted mb-0 small">{t('user.main.noPhoto')}</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            memberPhoto: reader.result
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <small className="form-text text-muted">{t('member.field.photo')}</small>
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder={t('member.field.photo')}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({
                          ...formData,
                          memberPhoto: e.target.value
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 mb-0">
                <button type="submit" className="btn btn-primary">
                  {t('common.save')}
                </button>
                <Link to={`/user/info/${account}`} className="btn btn-secondary ms-2">
                  {t('common.cancel')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UpdateUserInfo;
