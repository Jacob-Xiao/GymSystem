import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { userAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';
import { formatDate } from '../../utils/date';

const UserInfo = () => {
  const ready = useAuthGuard('user');
  const { t } = useI18n();
  const { account } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMember = useCallback(async () => {
    try {
      const response = await userAPI.getInfo(account);
      if (response.data.success) {
        setMember(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching member info:', error);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (ready) fetchMember();
  }, [ready, fetchMember]);

  if (loading) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </UserLayout>
    );
  }

  if (!member) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="alert alert-danger">{t('member.notFound')}</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('user.info.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('user.info.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person me-1"></i>
            {t('user.info.cardTitle')}
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-12 text-center">
                {member.member_photo ? (
                  <img 
                    src={member.member_photo} 
                    alt={member.member_name}
                    className="img-thumbnail"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3C/svg%3E';
                      e.target.alt = t('user.main.noPhoto');
                    }}
                  />
                ) : (
                  <div className="bg-light d-inline-block p-5 rounded">
                    <i className="bi bi-person fs-1 text-muted"></i>
                    <p className="text-muted mt-2 mb-0">{t('user.main.noPhoto')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>{t('member.field.account')}</strong>{member.member_account}
              </div>
              <div className="col-md-6">
                <strong>{t('member.field.name')}</strong>{member.member_name}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>{t('member.field.gender')}</strong>{member.member_gender}
              </div>
              <div className="col-md-6">
                <strong>{t('member.field.age')}</strong>{member.member_age}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>{t('member.field.height')}</strong>{member.member_height} cm
              </div>
              <div className="col-md-6">
                <strong>{t('member.field.weight')}</strong>{member.member_weight} kg
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>{t('member.field.phone')}</strong>{member.member_phone}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>{t('member.field.cardTime')}</strong>{formatDate(member.card_time)}
              </div>
              <div className="col-md-6">
                <strong>{t('member.field.cardClass')}</strong>{member.card_class}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>{t('member.field.cardNextClass')}</strong>{member.card_next_class}
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={`/user/info/update/${account}`}
                className="btn btn-primary"
              >
                {t('user.info.edit')}
              </Link>
              <Link to="/user/main" className="btn btn-secondary ms-2">
                {t('common.back')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserInfo;
