import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { equipmentBookingAPI } from '../../services/api';

const EquipmentBooking = () => {
  const navigate = useNavigate();
  const { account } = useParams();
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    locationNote: ''
  });

  useEffect(() => {
    fetchEquipmentList();
  }, []);

  useEffect(() => {
    if (selectedEquipment) {
      fetchEquipmentBookings(selectedEquipment.equipment_id);
    }
  }, [selectedEquipment]);

  const fetchEquipmentList = async () => {
    try {
      const response = await equipmentBookingAPI.getEquipmentList();
      if (response.data.success) {
        setEquipmentList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentBookings = async (equipmentId) => {
    try {
      const response = await equipmentBookingAPI.getEquipmentBookings(equipmentId);
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleEquipmentSelect = (equipment) => {
    setSelectedEquipment(equipment);
    setShowBookingForm(false);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.startTime || !formData.endTime) {
      setError('请选择开始时间和结束时间');
      return;
    }

    try {
      const response = await equipmentBookingAPI.createBooking({
        equipmentId: selectedEquipment.equipment_id,
        memberAccount: parseInt(account),
        startTime: formData.startTime,
        endTime: formData.endTime,
        locationNote: formData.locationNote
      });

      if (response.data.success) {
        alert('预约成功！');
        setShowBookingForm(false);
        setFormData({ startTime: '', endTime: '', locationNote: '' });
        fetchEquipmentBookings(selectedEquipment.equipment_id);
      } else {
        setError(response.data.message || '预约失败');
      }
    } catch (error) {
      setError(error.response?.data?.message || '预约失败');
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

  const isEquipmentAvailable = () => {
    const now = new Date();
    return bookings.length === 0 || bookings.every(booking => {
      const endTime = new Date(booking.end_time);
      return endTime < now;
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
        <h1 className="mt-4">器材预约</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">器材预约</li>
        </ol>

        <div className="row">
          {/* 器材列表 */}
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-list me-1"></i>
                器材列表
              </div>
              <div className="card-body">
                <div className="list-group">
                  {equipmentList.map((equipment) => (
                    <div
                      key={equipment.equipment_id}
                      className={`list-group-item list-group-item-action ${
                        selectedEquipment?.equipment_id === equipment.equipment_id ? 'active' : ''
                      }`}
                      style={{ padding: '0.75rem' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <button
                          className="btn btn-link text-start p-0 border-0 text-decoration-none flex-grow-1"
                          onClick={() => handleEquipmentSelect(equipment)}
                          style={{ 
                            color: 'inherit',
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          <div>
                            <strong>{equipment.equipment_name}</strong>
                            <br />
                            <small className="text-muted">{equipment.equipment_location}</small>
                            <br />
                            <small className={`badge ${
                              equipment.equipment_status === '正常' ? 'bg-success' : 
                              equipment.equipment_status === '损坏' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {equipment.equipment_status}
                            </small>
                          </div>
                        </button>
                        <Link
                          to={`/user/equipment/detail/${equipment.equipment_id}/${account}`}
                          className="btn btn-sm btn-info ms-2"
                          onClick={(e) => e.stopPropagation()}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          详情
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 预约信息 */}
          <div className="col-md-8">
            {selectedEquipment ? (
              <div className="card mb-4">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-gear me-1"></i>
                      {selectedEquipment.equipment_name} - 预约信息
                    </div>
                    {isEquipmentAvailable() && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowBookingForm(!showBookingForm)}
                      >
                        {showBookingForm ? '取消预约' : '新建预约'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {showBookingForm ? (
                    <div>
                      <h5>创建预约</h5>
                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}
                      <form onSubmit={handleCreateBooking}>
                        <div className="mb-3">
                          <label className="form-label">开始时间 *</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">结束时间 *</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">训练地址备注</label>
                          <textarea
                            className="form-control"
                            name="locationNote"
                            value={formData.locationNote}
                            onChange={handleFormChange}
                            rows="3"
                            placeholder="可选：备注具体的训练地点或说明"
                          />
                        </div>
                        <button type="submit" className="btn btn-primary">
                          提交预约
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary ms-2"
                          onClick={() => {
                            setShowBookingForm(false);
                            setError('');
                          }}
                        >
                          取消
                        </button>
                      </form>
                    </div>
                  ) : bookings.length > 0 ? (
                    <div>
                      <h5>当前预约信息</h5>
                      {bookings.map((booking) => (
                        <div key={booking.booking_id} className="card mb-3">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6>预约会员：{booking.member_name} ({booking.member_account})</h6>
                                <p className="mb-1">
                                  <strong>时间：</strong>
                                  {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                                </p>
                                {booking.location_note && (
                                  <p className="mb-1">
                                    <strong>训练地址备注：</strong>
                                    {booking.location_note}
                                  </p>
                                )}
                                <p className="mb-0">
                                  <small className="text-muted">
                                    创建时间：{formatDateTime(booking.created_at)}
                                  </small>
                                </p>
                              </div>
                              <div>
                                <Link
                                  to={`/user/equipment-booking/detail/${booking.booking_id}/${account}`}
                                  className="btn btn-sm btn-info me-2"
                                >
                                  查看详情
                                </Link>
                                {parseInt(booking.member_account) !== parseInt(account) && (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={async () => {
                                      try {
                                        await equipmentBookingAPI.createShareRequest(
                                          booking.booking_id,
                                          parseInt(account)
                                        );
                                        alert('分享请求已提交！');
                                      } catch (error) {
                                        alert(error.response?.data?.message || '提交失败');
                                      }
                                    }}
                                  >
                                    申请分享
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <h5>该器材当前无预约</h5>
                      <p className="text-muted">您可以创建新的预约</p>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowBookingForm(true)}
                      >
                        创建预约
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card mb-4">
                <div className="card-body text-center py-5">
                  <p className="text-muted">请从左侧选择器材查看预约信息</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default EquipmentBooking;
