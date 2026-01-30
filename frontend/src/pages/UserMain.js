import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { equipmentBookingAPI } from '../services/api';

const UserMain = () => {
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    const memberData = sessionStorage.getItem('member');
    if (!memberData) {
      navigate('/user/login');
      return;
    }
    const memberInfo = JSON.parse(memberData);
    setMember(memberInfo);
    fetchBookings(memberInfo.memberAccount);

    // 监听分享请求更新事件，刷新预约数据
    const handleShareRequestUpdate = () => {
      fetchBookings(memberInfo.memberAccount);
    };
    window.addEventListener('shareRequestUpdated', handleShareRequestUpdate);

    return () => {
      window.removeEventListener('shareRequestUpdated', handleShareRequestUpdate);
    };
  }, [navigate]);

  const fetchBookings = async (memberAccount) => {
    try {
      const response = await equipmentBookingAPI.getMemberBookings(memberAccount);
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
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

  if (!member) {
    return <div>加载中...</div>;
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">会员主页</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item active">主页</li>
        </ol>
        <div className="row">
          <div className="col-xl-6">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-person me-1"></i>
                个人信息
              </div>
              <div className="card-body">
                <div className="text-center mb-3">
                  {member.memberPhoto ? (
                    <img 
                      src={member.memberPhoto} 
                      alt={member.memberName}
                      className="img-thumbnail"
                      style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect width="150" height="150" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E暂无照片%3C/text%3E%3C/svg%3E';
                        e.target.alt = '照片加载失败';
                      }}
                    />
                  ) : (
                    <div className="bg-light d-inline-block p-4 rounded">
                      <i className="bi bi-person fs-1 text-muted"></i>
                      <p className="text-muted mt-2 mb-0 small">暂无照片</p>
                    </div>
                  )}
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>会员账号：</strong>{member.memberAccount}</p>
                    <p><strong>姓名：</strong>{member.memberName}</p>
                    <p><strong>性别：</strong>{member.memberGender}</p>
                    <p><strong>电话：</strong>{member.memberPhone}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>年龄：</strong>{member.memberAge}</p>
                    <p><strong>身高：</strong>{member.memberHeight} cm</p>
                    <p><strong>体重：</strong>{member.memberWeight} kg</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/user/info/${member.memberAccount}`}
                    className="btn btn-primary"
                  >
                    查看详细信息
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-6">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-calendar-event me-1"></i>
                会籍信息
              </div>
              <div className="card-body">
                <p><strong>办卡时间：</strong>{member.cardTime}</p>
                <p><strong>购买课时：</strong>{member.cardClass}</p>
                <p><strong>剩余课时：</strong>{member.cardNextClass}</p>
                <p><strong>会籍剩余时长：</strong>{
                  (() => {
                    if (!member.cardTime || !member.membershipDuration) {
                      return '未设置';
                    }
                    const cardDate = new Date(member.cardTime);
                    const now = new Date();
                    const monthsDiff = (now.getFullYear() - cardDate.getFullYear()) * 12 + (now.getMonth() - cardDate.getMonth());
                    const remainingMonths = member.membershipDuration - monthsDiff;
                    if (remainingMonths <= 0) {
                      return <span className="text-danger">已过期</span>;
                    } else if (remainingMonths < 1) {
                      const daysRemaining = Math.ceil((new Date(cardDate.getFullYear(), cardDate.getMonth() + member.membershipDuration, cardDate.getDate()) - now) / (1000 * 60 * 60 * 24));
                      return `${daysRemaining}天`;
                    } else {
                      return `${remainingMonths}个月`;
                    }
                  })()
                }</p>
                <div className="mt-3">
                  <Link
                    to={`/user/classes/${member.memberAccount}`}
                    className="btn btn-primary me-2"
                  >
                    我的课程
                  </Link>
                  <Link
                    to={`/user/classes/apply/${member.memberAccount}`}
                    className="btn btn-success"
                  >
                    报名选课
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 器材预约信息 */}
        <div className="row">
          <div className="col-xl-12">
            <div className="card mb-4">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-gear me-1"></i>
                    器材预约信息
                  </div>
                  <Link
                    to={`/user/equipment-booking/${member.memberAccount}`}
                    className="btn btn-info btn-sm"
                  >
                    查看全部
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {bookingsLoading ? (
                  <p>加载中...</p>
                ) : bookings.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>器材名称</th>
                          <th>器材位置</th>
                          <th>开始时间</th>
                          <th>结束时间</th>
                          <th>训练地址备注</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 5).map((booking) => {
                          const id = booking.booking_id ?? booking.bookingId;
                          return (
                            <tr key={id}>
                              <td>{booking.equipment_name}</td>
                              <td>{booking.equipment_location}</td>
                              <td>{formatDateTime(booking.start_time)}</td>
                              <td>{formatDateTime(booking.end_time)}</td>
                              <td>{booking.location_note || '-'}</td>
                              <td>
                                <Link
                                  to={`/user/equipment-booking/detail/${id}/${member.memberAccount}`}
                                  className="btn btn-sm btn-primary"
                                >
                                  查看详情
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {bookings.length > 5 && (
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          显示最近5条预约，共有 {bookings.length} 条预约记录
                        </small>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted mb-3">暂无器材预约记录</p>
                    <Link
                      to={`/user/equipment-booking/${member.memberAccount}`}
                      className="btn btn-primary"
                    >
                      立即预约
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserMain;
