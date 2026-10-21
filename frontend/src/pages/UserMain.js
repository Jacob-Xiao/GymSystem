import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import useAuthGuard from '../hooks/useAuthGuard';
import { useI18n } from '../i18n';
import { equipmentBookingAPI } from '../services/api';
import { formatDate, formatDateTime, membershipRemaining } from '../utils/date';

const UserMain = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('user');
  const { t, language } = useI18n();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const remainingLabels = {
    notSet: t('common.notSet'),
    expired: t('common.expired'),
    days: (count) => t('common.daysLeft', { count }),
    months: (count) => t('common.monthsLeft', { count })
  };
  const [member, setMember] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

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
  }, [navigate, ready]);

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

  if (!member) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('user.main.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item active">{t('common.home')}</li>
        </ol>
        <div className="row">
          <div className="col-xl-6">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-person me-1"></i>
                {t('user.main.profile')}
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
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect width="150" height="150" fill="%23ddd"/%3E%3C/svg%3E';
                        e.target.alt = t('user.main.noPhoto');
                      }}
                    />
                  ) : (
                    <div className="bg-light d-inline-block p-4 rounded">
                      <i className="bi bi-person fs-1 text-muted"></i>
                      <p className="text-muted mt-2 mb-0 small">{t('user.main.noPhoto')}</p>
                    </div>
                  )}
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>{t('member.field.account')}</strong>{member.memberAccount}</p>
                    <p><strong>{t('member.field.name')}</strong>{member.memberName}</p>
                    <p><strong>{t('member.field.gender')}</strong>{member.memberGender}</p>
                    <p><strong>{t('member.field.phone')}</strong>{member.memberPhone}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>{t('member.field.age')}</strong>{member.memberAge}</p>
                    <p><strong>{t('member.field.height')}</strong>{member.memberHeight} cm</p>
                    <p><strong>{t('member.field.weight')}</strong>{member.memberWeight} kg</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/user/info/${member.memberAccount}`}
                    className="btn btn-primary"
                  >
                    {t('common.details')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-6">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-calendar-event me-1"></i>
                {t('user.main.membership')}
              </div>
              <div className="card-body">
                <p><strong>{t('member.field.cardTime')}</strong>{formatDate(member.cardTime, locale)}</p>
                <p><strong>{t('member.field.cardClass')}</strong>{member.cardClass}</p>
                <p><strong>{t('member.field.cardNextClass')}</strong>{member.cardNextClass}</p>
                <p><strong>{t('member.field.remaining')}</strong>{
                  (() => {
                    const remaining = membershipRemaining(member.cardTime, member.membershipDuration, remainingLabels);
                    return remaining.expired
                      ? <span className="text-danger">{remaining.text}</span>
                      : remaining.text;
                  })()
                }</p>
                <div className="mt-3">
                  <Link
                    to={`/user/classes/${member.memberAccount}`}
                    className="btn btn-primary me-2"
                  >
                    {t('user.class.title')}
                  </Link>
                  <Link
                    to={`/user/classes/apply/${member.memberAccount}`}
                    className="btn btn-success"
                  >
                    {t('user.class.apply')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* equipment booking summary */}
        <div className="row">
          <div className="col-xl-12">
            <div className="card mb-4">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-gear me-1"></i>
                    {t('user.main.bookings')}
                  </div>
                  <Link
                    to={`/user/equipment-booking/${member.memberAccount}`}
                    className="btn btn-info btn-sm"
                  >
                    {t('common.viewAll')}
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {bookingsLoading ? (
                  <p>{t('common.loading')}</p>
                ) : bookings.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>{t('user.booking.equipmentName')}</th>
                          <th>{t('user.booking.equipmentLocation')}</th>
                          <th>{t('user.booking.startTime')}</th>
                          <th>{t('user.booking.endTime')}</th>
                          <th>{t('user.booking.locationNote')}</th>
                          <th>{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 5).map((booking) => {
                          const id = booking.booking_id ?? booking.bookingId;
                          return (
                            <tr key={id}>
                              <td>{booking.equipment_name}</td>
                              <td>{booking.equipment_location}</td>
                              <td>{formatDateTime(booking.start_time, locale)}</td>
                              <td>{formatDateTime(booking.end_time, locale)}</td>
                              <td>{booking.location_note || '-'}</td>
                              <td>
                                <Link
                                  to={`/user/equipment-booking/detail/${id}/${member.memberAccount}`}
                                  className="btn btn-sm btn-primary"
                                >
                                  {t('common.details')}
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
                          {t('user.main.recentBookings', { count: bookings.length })}
                        </small>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted mb-3">{t('user.main.noBookings')}</p>
                    <Link
                      to={`/user/equipment-booking/${member.memberAccount}`}
                      className="btn btn-primary"
                    >
                      {t('user.main.bookNow')}
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
