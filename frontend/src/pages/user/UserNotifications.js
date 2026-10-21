import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';
import UserLayout from '../../components/UserLayout';
import { notificationAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const UserNotifications = () => {
  const ready = useAuthGuard('user');
  const { t, language } = useI18n();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const { account } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationAPI.getByMemberAccount(account);
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (ready) fetchNotifications();
  }, [ready, fetchNotifications]);

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
        <h1 className="mt-4">{t('user.notifications.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('user.messages.tabNotifications')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-bell me-1"></i>
            {t('user.notifications.cardTitle')}
          </div>
          <div className="card-body">
            {notifications.length > 0 ? (
              <div className="list-group">
                {notifications.map((notification) => (
                  <div key={notification.notification_id} className="list-group-item">
                    <div className="d-flex w-100 justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h5 className="mb-2">{notification.title}</h5>
                        <div className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                          {notification.content}
                        </div>
                        <small className="text-muted">
                          {formatDateTime(notification.created_at, locale)}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-bell-slash fs-1 text-muted"></i>
                <p className="text-muted mt-3">{t('user.messages.emptyNotifications')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserNotifications;
