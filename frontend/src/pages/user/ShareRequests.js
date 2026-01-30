import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { equipmentBookingAPI, notificationAPI } from '../../services/api';

const ShareRequests = () => {
  const navigate = useNavigate();
  const { account } = useParams();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'notifications'
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    fetchShareRequests();
    fetchNotifications();
  }, [account]);

  const fetchShareRequests = async () => {
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
  };

  const fetchNotifications = async () => {
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
  };

  const handleRequest = async (requestId, action) => {
    try {
      await equipmentBookingAPI.handleShareRequest(requestId, parseInt(account), action);
      fetchShareRequests(); // 刷新列表
      // 触发父组件更新未读数量（通过刷新页面或事件）
      window.dispatchEvent(new Event('shareRequestUpdated'));
    } catch (error) {
      alert(error.response?.data?.message || '操作失败');
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

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">消息</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">消息</li>
        </ol>

        {/* 标签页导航 */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <i className="bi bi-envelope me-1"></i>
              分享请求
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <i className="bi bi-bell me-1"></i>
              系统通知
            </button>
          </li>
        </ul>

        {/* 分享请求标签页 */}
        {activeTab === 'requests' && (
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-envelope me-1"></i>
              收到的分享请求
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
                              {request.requester_name} ({request.requester_account}) 请求分享您的预约
                            </h5>
                            <p className="mb-1">
                              <strong>器材：</strong>{request.equipment_name} ({request.equipment_location})
                            </p>
                            <p className="mb-1">
                              <strong>预约时间：</strong>
                              {formatDateTime(request.start_time)} - {formatDateTime(request.end_time)}
                            </p>
                            {request.location_note && (
                              <p className="mb-1">
                                <strong>训练地址备注：</strong>{request.location_note}
                              </p>
                            )}
                            <p className="mb-0">
                              <small className="text-muted">
                                请求时间：{formatDateTime(request.created_at)}
                              </small>
                            </p>
                          </div>
                          <span className={`badge ms-2 ${
                            request.status === 'pending' ? 'bg-warning' :
                            request.status === 'accepted' ? 'bg-success' : 'bg-danger'
                          }`}>
                            {request.status === 'pending' ? '待处理' :
                             request.status === 'accepted' ? '已接受' : '已拒绝'}
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
                            查看预约详情
                          </Link>
                          {request.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleRequest(request.request_id, 'accept')}
                              >
                                接受
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRequest(request.request_id, 'reject')}
                              >
                                拒绝
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
                <p className="text-muted">加载中...</p>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <p className="text-muted mt-3">暂无分享请求消息</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* 通知标签页 */}
        {activeTab === 'notifications' && (
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-bell me-1"></i>
              系统通知
            </div>
            <div className="card-body">
              {notificationsLoading ? (
                <div className="text-center py-5">
                  <p className="text-muted">加载中...</p>
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
        )}
      </div>
    </UserLayout>
  );
};

export default ShareRequests;
