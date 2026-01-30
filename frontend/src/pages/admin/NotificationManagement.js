import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { notificationAPI, memberAPI } from '../../services/api';

const NotificationManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notification'); // 'notification' or 'update'
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 通知表单数据
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    content: '',
    targetType: 'all',
    selectedAccounts: []
  });

  // 更新会员表单数据
  const [updateForm, setUpdateForm] = useState({
    targetType: 'all',
    selectedAccounts: [],
    cardNextClass: '',
    membershipDuration: ''
  });

  useEffect(() => {
    const adminAccount = sessionStorage.getItem('adminAccount');
    if (!adminAccount) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, notificationsRes] = await Promise.allSettled([
        memberAPI.getAll(),
        notificationAPI.getAll()
      ]);
      
      if (membersRes.status === 'fulfilled' && membersRes.value.data.success) {
        setMembers(membersRes.value.data.data);
      } else {
        console.error('Error fetching members:', membersRes.reason);
        setMembers([]);
      }
      
      if (notificationsRes.status === 'fulfilled' && notificationsRes.value.data.success) {
        setNotifications(notificationsRes.value.data.data);
      } else {
        console.error('Error fetching notifications:', notificationsRes.reason);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title || !notificationForm.content) {
      alert('请输入通知标题和内容');
      return;
    }

    if (notificationForm.targetType === 'specific' && notificationForm.selectedAccounts.length === 0) {
      alert('请选择至少一个会员');
      return;
    }

    try {
      const response = await notificationAPI.create({
        title: notificationForm.title,
        content: notificationForm.content,
        targetType: notificationForm.targetType,
        targetAccounts: notificationForm.targetType === 'specific' 
          ? notificationForm.selectedAccounts 
          : []
      });

      if (response.data.success) {
        alert('通知发送成功');
        setNotificationForm({
          title: '',
          content: '',
          targetType: 'all',
          selectedAccounts: []
        });
        fetchData();
      } else {
        alert('发送失败：' + (response.data.message || '未知错误'));
      }
    } catch (error) {
      alert('发送失败：' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (updateForm.targetType === 'specific' && updateForm.selectedAccounts.length === 0) {
      alert('请选择至少一个会员');
      return;
    }

    if (!updateForm.cardNextClass && !updateForm.membershipDuration) {
      alert('请至少输入课时数或会籍时长中的一个');
      return;
    }

    try {
      const response = await notificationAPI.batchUpdate({
        targetType: updateForm.targetType,
        targetAccounts: updateForm.targetType === 'specific' ? updateForm.selectedAccounts : [],
        cardNextClass: updateForm.cardNextClass ? parseInt(updateForm.cardNextClass) : undefined,
        membershipDuration: updateForm.membershipDuration ? parseInt(updateForm.membershipDuration) : undefined
      });

      if (response.data.success) {
        alert('会员信息更新成功');
        setUpdateForm({
          targetType: 'all',
          selectedAccounts: [],
          cardNextClass: '',
          membershipDuration: ''
        });
        fetchData();
      } else {
        alert('更新失败：' + (response.data.message || '未知错误'));
      }
    } catch (error) {
      alert('更新失败：' + (error.response?.data?.message || error.message));
    }
  };

  const handleAccountToggle = (account, formType) => {
    if (formType === 'notification') {
      const selected = notificationForm.selectedAccounts;
      if (selected.includes(account)) {
        setNotificationForm({
          ...notificationForm,
          selectedAccounts: selected.filter(a => a !== account)
        });
      } else {
        setNotificationForm({
          ...notificationForm,
          selectedAccounts: [...selected, account]
        });
      }
    } else {
      const selected = updateForm.selectedAccounts;
      if (selected.includes(account)) {
        setUpdateForm({
          ...updateForm,
          selectedAccounts: selected.filter(a => a !== account)
        });
      } else {
        setUpdateForm({
          ...updateForm,
          selectedAccounts: [...selected, account]
        });
      }
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('确定要删除这条通知吗？')) {
      return;
    }

    try {
      await notificationAPI.delete(id);
      fetchData();
      alert('通知删除成功');
    } catch (error) {
      alert('删除失败：' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4">
          <div className="text-center">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">通知管理</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">通知管理</li>
        </ol>

        {/* 标签页导航 */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'notification' ? 'active' : ''}`}
              onClick={() => setActiveTab('notification')}
            >
              发送通知
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'update' ? 'active' : ''}`}
              onClick={() => setActiveTab('update')}
            >
              批量更新会员信息
            </button>
          </li>
        </ul>

        {/* 发送通知标签页 */}
        {activeTab === 'notification' && (
          <div className="row">
            <div className="col-lg-8">
              <div className="card mb-4">
                <div className="card-header">
                  <i className="bi bi-bell me-1"></i>
                  发送通知
                </div>
                <div className="card-body">
                  <form onSubmit={handleNotificationSubmit}>
                    <div className="mb-3">
                      <label className="form-label">通知标题 *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">通知内容 *</label>
                      <textarea
                        className="form-control"
                        rows="5"
                        value={notificationForm.content}
                        onChange={(e) => setNotificationForm({ ...notificationForm, content: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">发送对象 *</label>
                      <div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="notificationTargetType"
                            id="notificationAll"
                            value="all"
                            checked={notificationForm.targetType === 'all'}
                            onChange={(e) => setNotificationForm({ ...notificationForm, targetType: e.target.value, selectedAccounts: [] })}
                          />
                          <label className="form-check-label" htmlFor="notificationAll">
                            全体会员
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="notificationTargetType"
                            id="notificationSpecific"
                            value="specific"
                            checked={notificationForm.targetType === 'specific'}
                            onChange={(e) => setNotificationForm({ ...notificationForm, targetType: e.target.value })}
                          />
                          <label className="form-check-label" htmlFor="notificationSpecific">
                            个别会员
                          </label>
                        </div>
                      </div>
                    </div>
                    {notificationForm.targetType === 'specific' && (
                      <div className="mb-3">
                        <label className="form-label">选择会员</label>
                        {members.length === 0 ? (
                          <div className="alert alert-warning">
                            暂无会员数据，请先添加会员
                          </div>
                        ) : (
                          <>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', padding: '10px', borderRadius: '4px' }}>
                              {members.map((member) => (
                                <div key={member.member_account} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`notification-member-${member.member_account}`}
                                    checked={notificationForm.selectedAccounts.includes(member.member_account)}
                                    onChange={() => handleAccountToggle(member.member_account, 'notification')}
                                  />
                                  <label className="form-check-label" htmlFor={`notification-member-${member.member_account}`}>
                                    {member.member_name} ({member.member_account})
                                  </label>
                                </div>
                              ))}
                            </div>
                            <small className="text-muted">
                              已选择 {notificationForm.selectedAccounts.length} 位会员
                            </small>
                          </>
                        )}
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary">
                      发送通知
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <i className="bi bi-list-ul me-1"></i>
                  通知记录
                </div>
                <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p className="text-muted">暂无通知记录</p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.notification_id} className="border-bottom pb-3 mb-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6>{notification.title}</h6>
                            <p className="small text-muted mb-1">{notification.content}</p>
                            <small className="text-muted">
                              发送给: {notification.target_type === 'all' ? '全体会员' : `${notification.target_accounts?.length || 0}位会员`}
                            </small>
                            <br />
                            <small className="text-muted">
                              {new Date(notification.created_at).toLocaleString('zh-CN')}
                            </small>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={() => handleDeleteNotification(notification.notification_id)}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 批量更新会员信息标签页 */}
        {activeTab === 'update' && (
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-pencil-square me-1"></i>
              批量更新会员信息
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdateSubmit}>
                <div className="mb-3">
                  <label className="form-label">更新对象 *</label>
                  <div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="updateTargetType"
                        id="updateAll"
                        value="all"
                        checked={updateForm.targetType === 'all'}
                        onChange={(e) => setUpdateForm({ ...updateForm, targetType: e.target.value, selectedAccounts: [] })}
                      />
                      <label className="form-check-label" htmlFor="updateAll">
                        全体会员
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="updateTargetType"
                        id="updateSpecific"
                        value="specific"
                        checked={updateForm.targetType === 'specific'}
                        onChange={(e) => setUpdateForm({ ...updateForm, targetType: e.target.value })}
                      />
                      <label className="form-check-label" htmlFor="updateSpecific">
                        个别会员
                      </label>
                    </div>
                  </div>
                </div>
                {updateForm.targetType === 'specific' && (
                  <div className="mb-3">
                    <label className="form-label">选择会员</label>
                    {members.length === 0 ? (
                      <div className="alert alert-warning">
                        暂无会员数据，请先添加会员
                      </div>
                    ) : (
                      <>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', padding: '10px', borderRadius: '4px' }}>
                          {members.map((member) => (
                            <div key={member.member_account} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`update-member-${member.member_account}`}
                                checked={updateForm.selectedAccounts.includes(member.member_account)}
                                onChange={() => handleAccountToggle(member.member_account, 'update')}
                              />
                              <label className="form-check-label" htmlFor={`update-member-${member.member_account}`}>
                                {member.member_name} ({member.member_account})
                              </label>
                            </div>
                          ))}
                        </div>
                        <small className="text-muted">
                          已选择 {updateForm.selectedAccounts.length} 位会员
                        </small>
                      </>
                    )}
                  </div>
                )}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">剩余课时数</label>
                    <input
                      type="number"
                      className="form-control"
                      value={updateForm.cardNextClass}
                      onChange={(e) => setUpdateForm({ ...updateForm, cardNextClass: e.target.value })}
                      min="0"
                      placeholder="留空则不更新"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">会籍时长（月）</label>
                    <input
                      type="number"
                      className="form-control"
                      value={updateForm.membershipDuration}
                      onChange={(e) => setUpdateForm({ ...updateForm, membershipDuration: e.target.value })}
                      min="0"
                      placeholder="留空则不更新"
                    />
                  </div>
                </div>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-1"></i>
                  提示：至少需要填写一个字段。留空的字段将不会被更新。
                </div>
                <button type="submit" className="btn btn-primary">
                  更新会员信息
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NotificationManagement;
