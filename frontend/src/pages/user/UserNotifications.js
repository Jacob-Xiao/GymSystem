import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { notificationAPI } from '../../services/api';

const UserNotifications = () => {
  const navigate = useNavigate();
  const { account } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [account]);

  const fetchNotifications = async () => {
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
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="text-center">加载中...</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">系统通知</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">通知</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-bell me-1"></i>
            通知列表
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
                          {formatDateTime(notification.created_at)}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-bell-slash fs-1 text-muted"></i>
                <p className="text-muted mt-3">暂无通知</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserNotifications;
