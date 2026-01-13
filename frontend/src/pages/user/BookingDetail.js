import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { equipmentBookingAPI } from '../../services/api';

const BookingDetail = () => {
  const navigate = useNavigate();
  const { bookingId, memberAccount } = useParams();
  const [booking, setBooking] = useState(null);
  const [shareRequests, setShareRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const fetchBookingDetail = async () => {
    try {
      const response = await equipmentBookingAPI.getBookingDetail(bookingId);
      if (response.data.success) {
        setBooking(response.data.data);
        setShareRequests(response.data.data.shareRequests || []);
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareRequest = async (action, requestId) => {
    try {
      await equipmentBookingAPI.handleShareRequest(requestId, parseInt(memberAccount), action);
      setMessage(action === 'accept' ? '已接受分享请求' : '已拒绝分享请求');
      fetchBookingDetail();
    } catch (error) {
      setMessage(error.response?.data?.message || '操作失败');
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

  const isOwner = booking && parseInt(booking.member_account) === parseInt(memberAccount);

  if (loading) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="text-center">加载中...</div>
        </div>
      </UserLayout>
    );
  }

  if (!booking) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="alert alert-danger">预约不存在</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">预约详情</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/user/equipment-booking/${memberAccount}`}>器材预约</Link>
          </li>
          <li className="breadcrumb-item active">预约详情</li>
        </ol>

        {message && (
          <div className={`alert ${message.includes('失败') ? 'alert-danger' : 'alert-success'}`}>
            {message}
          </div>
        )}

        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-info-circle me-1"></i>
                预约信息
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>器材名称：</strong>{booking.equipment_name}
                  </div>
                  <div className="col-md-6">
                    <strong>器材位置：</strong>{booking.equipment_location}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>预约会员：</strong>{booking.member_name} ({booking.member_account})
                  </div>
                  <div className="col-md-6">
                    <strong>状态：</strong>
                    <span className={`badge ${
                      booking.status === 'active' ? 'bg-success' : 
                      booking.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                    }`}>
                      {booking.status === 'active' ? '有效' : 
                       booking.status === 'cancelled' ? '已取消' : '已完成'}
                    </span>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>开始时间：</strong>{formatDateTime(booking.start_time)}
                  </div>
                  <div className="col-md-6">
                    <strong>结束时间：</strong>{formatDateTime(booking.end_time)}
                  </div>
                </div>
                {booking.location_note && (
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <strong>训练地址备注：</strong>
                      <p className="mt-1">{booking.location_note}</p>
                    </div>
                  </div>
                )}
                <div className="row">
                  <div className="col-md-12">
                    <strong>创建时间：</strong>{formatDateTime(booking.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            {isOwner && booking.status === 'active' && (
              <div className="card mb-4">
                <div className="card-header">
                  <i className="bi bi-people me-1"></i>
                  分享请求
                </div>
                <div className="card-body">
                  {shareRequests.length > 0 ? (
                    <div>
                      {shareRequests
                        .filter(req => req.status === 'pending')
                        .map((request) => (
                          <div key={request.request_id} className="card mb-2">
                            <div className="card-body p-3">
                              <h6 className="card-title">
                                {request.requester_name} ({request.requester_account})
                              </h6>
                              <p className="card-text small text-muted mb-2">
                                请求时间：{formatDateTime(request.created_at)}
                              </p>
                              <div className="btn-group w-100" role="group">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleShareRequest('accept', request.request_id)}
                                >
                                  接受
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleShareRequest('reject', request.request_id)}
                                >
                                  拒绝
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {shareRequests.filter(req => req.status === 'pending').length === 0 && (
                        <p className="text-muted text-center">暂无待处理的分享请求</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted text-center">暂无分享请求</p>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <i className="bi bi-list-ul me-1"></i>
                操作
              </div>
              <div className="card-body">
                <Link
                  to={`/user/equipment-booking/${memberAccount}`}
                  className="btn btn-secondary w-100 mb-2"
                >
                  返回列表
                </Link>
                {isOwner && booking.status === 'active' && (
                  <button
                    className="btn btn-danger w-100"
                    onClick={async () => {
                      if (window.confirm('确定要取消这个预约吗？')) {
                        try {
                          await equipmentBookingAPI.cancelBooking(bookingId, parseInt(memberAccount));
                          alert('预约已取消');
                          navigate(`/user/equipment-booking/${memberAccount}`);
                        } catch (error) {
                          alert(error.response?.data?.message || '取消失败');
                        }
                      }
                    }}
                  >
                    取消预约
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 分享请求历史 */}
        {shareRequests.length > 0 && (
          <div className="card mt-4">
            <div className="card-header">
              <i className="bi bi-clock-history me-1"></i>
              分享请求历史
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>请求者</th>
                      <th>状态</th>
                      <th>请求时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareRequests.map((request) => (
                      <tr key={request.request_id}>
                        <td>{request.requester_name} ({request.requester_account})</td>
                        <td>
                          <span className={`badge ${
                            request.status === 'pending' ? 'bg-warning' :
                            request.status === 'accepted' ? 'bg-success' : 'bg-danger'
                          }`}>
                            {request.status === 'pending' ? '待处理' :
                             request.status === 'accepted' ? '已接受' : '已拒绝'}
                          </span>
                        </td>
                        <td>{formatDateTime(request.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default BookingDetail;
