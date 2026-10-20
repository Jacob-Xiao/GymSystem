import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';
import UserLayout from '../../components/UserLayout';
import { equipmentBookingAPI, notificationAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const ShareRequests = () => {
  const ready = useAuthGuard('user');
  const { t, language } = useI18n();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const { account } = useParams();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'notifications'
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const fetchShareRequests = useCallback(async () => {
    try {
      const response = await equipmentBookingAPI.getReceivedShareRequests(account);
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching share requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  }, [account]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationAPI.getByMemberAccount(account);
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (!ready) return;
    fetchShareRequests();
    fetchNotifications();
  }, [ready, fetchShareRequests, fetchNotifications]);

  const handleRequest = async (requestId, action) => {
    try {
      await equipmentBookingAPI.handleShareRequest(requestId, parseInt(account), action);
      fetchShareRequests(); // refresh the list
      // 触发父组件更新未读数量（通过刷新页面或事件）
      window.dispatchEvent(new Event('shareRequestUpdated'));
    } catch (error) {
      alert(error.response?.data?.message || t('user.booking.actionFailed'));
    }
  };

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('user.messages.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('user.messages.title')}</li>
        </ol>

        {/* tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <i className="bi bi-envelope me-1"></i>
              {t('user.messages.tabRequests')}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <i className="bi bi-bell me-1"></i>
              {t('user.messages.tabNotifications')}
            </button>
          </li>
        </ul>

        {/* share requests */}
        {activeTab === 'requests' && (
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-envelope me-1"></i>
              {t('user.messages.received')}
            </div>
            <div className="card-body">
            {requests.length > 0 ? (
              <div className="list-group">
                {requests.map((request) => (
                  <div key={request.request_id} className="list-group-item">
                    <div className="d-flex w-100 justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="mb-1">
                              {request.requester_name} ({request.requester_account}) {t('user.messages.requestShare')}
                            </h5>
                            <p className="mb-1">
                              <strong>{t('user.messages.equipment')}</strong>{request.equipment_name} ({request.equipment_location})
                            </p>
                            <p className="mb-1">
                              <strong>{t('user.messages.bookingTime')}</strong>
                              {formatDateTime(request.start_time, locale)} - {formatDateTime(request.end_time, locale)}
                            </p>
                            {request.location_note && (
                              <p className="mb-1">
                                <strong>{t('user.booking.locationNote')}</strong>{request.location_note}
                              </p>
                            )}
                            <p className="mb-0">
                              <small className="text-muted">
                                {t('user.booking.requestTime')}: {formatDateTime(request.created_at, locale)}
                              </small>
                            </p>
                          </div>
                          <span className={`badge ms-2 ${
                            request.status === 'pending' ? 'bg-warning' :
                            request.status === 'accepted' ? 'bg-success' : 'bg-danger'
                          }`}>
                            {request.status === 'pending' ? t('user.messages.pending') :
                             request.status === 'accepted' ? t('user.messages.accepted') : t('user.messages.rejected')}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Link
                            to={`/user/equipment-booking/detail/${request.booking_id}/${account}`}
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => {
                              // 触发更新事件，当用户查看详情后返回时更新未读数量
                              setTimeout(() => {
                                window.dispatchEvent(new Event('shareRequestUpdated'));
                              }, 1000);
                            }}
                          >
                            {t('user.booking.detailTitle')}
                          </Link>
                          {request.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleRequest(request.request_id, 'accept')}
                              >
                                {t('user.booking.accept')}
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRequest(request.request_id, 'reject')}
                              >
                                {t('user.booking.reject')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : requestsLoading ? (
              <div className="text-center py-5">
                <p className="text-muted">{t('common.loading')}</p>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <p className="text-muted mt-3">{t('user.messages.emptyRequests')}</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* notifications */}
        {activeTab === 'notifications' && (
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-bell me-1"></i>
              {t('user.messages.tabNotifications')}
            </div>
            <div className="card-body">
              {notificationsLoading ? (
                <div className="text-center py-5">
                  <p className="text-muted">{t('common.loading')}</p>
                </div>
              ) : notifications.length > 0 ? (
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
        )}
      </div>
    </UserLayout>
  );
};

export default ShareRequests;
