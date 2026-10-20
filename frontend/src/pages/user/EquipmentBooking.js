import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';
import UserLayout from '../../components/UserLayout';
import { equipmentBookingAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const EquipmentBooking = () => {
  const ready = useAuthGuard('user');
  const { t, language } = useI18n();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
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

  const fetchEquipmentList = useCallback(async () => {
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
  }, []);

  const fetchEquipmentBookings = useCallback(async (equipmentId) => {
    try {
      const response = await equipmentBookingAPI.getEquipmentBookings(equipmentId);
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, []);

  useEffect(() => {
    if (ready) fetchEquipmentList();
  }, [ready, fetchEquipmentList]);

  useEffect(() => {
    if (selectedEquipment) {
      fetchEquipmentBookings(selectedEquipment.equipment_id);
    }
  }, [selectedEquipment, fetchEquipmentBookings]);

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
      setError(t('user.booking.selectTime'));
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
        alert(t('user.booking.success'));
        setShowBookingForm(false);
        setFormData({ startTime: '', endTime: '', locationNote: '' });
        fetchEquipmentBookings(selectedEquipment.equipment_id);
      } else {
        setError(response.data.message || t('user.booking.failed'));
      }
    } catch (error) {
      setError(error.response?.data?.message || t('user.booking.failed'));
    }
  };

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
        <h1 className="mt-4">{t('user.booking.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('user.booking.title')}</li>
        </ol>

        <div className="row">
          {/* equipment list */}
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-list me-1"></i>
                {t('user.booking.list')}
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
                          {t('common.details')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* bookings */}
          <div className="col-md-8">
            {selectedEquipment ? (
              <div className="card mb-4">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-gear me-1"></i>
                      {selectedEquipment.equipment_name} - {t('user.booking.info')}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowBookingForm(!showBookingForm)}
                    >
                      {showBookingForm ? t('user.booking.cancelForm') : t('user.booking.new')}
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {showBookingForm ? (
                    <div>
                      <h5>{t('user.booking.create')}</h5>
                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}
                      <form onSubmit={handleCreateBooking}>
                        <div className="mb-3">
                          <label className="form-label">{t('user.booking.startTime')} *</label>
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
                          <label className="form-label">{t('user.booking.endTime')} *</label>
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
                          <label className="form-label">{t('user.booking.locationNote')}</label>
                          <textarea
                            className="form-control"
                            name="locationNote"
                            value={formData.locationNote}
                            onChange={handleFormChange}
                            rows="3"
                            placeholder={t('user.booking.locationNotePlaceholder')}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary">
                          {t('user.booking.submit')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary ms-2"
                          onClick={() => {
                            setShowBookingForm(false);
                            setError('');
                          }}
                        >
                          {t('common.cancel')}
                        </button>
                      </form>
                    </div>
                  ) : bookings.length > 0 ? (
                    <div>
                      <h5>{t('user.booking.current')}</h5>
                      {bookings.map((booking) => (
                        <div key={booking.booking_id} className="card mb-3">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6>{t('user.booking.member')}: {booking.member_name} ({booking.member_account})</h6>
                                <p className="mb-1">
                                  <strong>{t('user.booking.time')}</strong>
                                  {formatDateTime(booking.start_time, locale)} - {formatDateTime(booking.end_time, locale)}
                                </p>
                                {booking.location_note && (
                                  <p className="mb-1">
                                    <strong>{t('user.booking.locationNote')}</strong>
                                    {booking.location_note}
                                  </p>
                                )}
                                <p className="mb-0">
                                  <small className="text-muted">
                                    {t('user.booking.createdAt')}: {formatDateTime(booking.created_at, locale)}
                                  </small>
                                </p>
                              </div>
                              <div>
                                <Link
                                  to={`/user/equipment-booking/detail/${booking.booking_id}/${account}`}
                                  className="btn btn-sm btn-info me-2"
                                >
                                  {t('common.details')}
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
                                        alert(t('user.booking.shareSubmitted'));
                                      } catch (error) {
                                        alert(error.response?.data?.message || t('user.booking.shareFailed'));
                                      }
                                    }}
                                  >
                                    {t('user.booking.applyShare')}
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
                      <h5>{t('user.booking.none')}</h5>
                      <p className="text-muted">{t('user.booking.canCreate')}</p>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowBookingForm(true)}
                      >
                        {t('user.booking.create')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card mb-4">
                <div className="card-body text-center py-5">
                  <p className="text-muted">{t('user.booking.selectPrompt')}</p>
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
