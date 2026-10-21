import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';
import UserLayout from '../../components/UserLayout';
import { equipmentBookingAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

// 单行训练记录结构：组数、重量、重复次数、是否完成、训练动作名称
const createEmptyRow = (setNumber) => ({
  setNumber,
  weight: '',
  repetitions: '',
  completed: false,
  exerciseName: ''
});

const BookingDetail = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('user');
  const { t, language } = useI18n();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const { bookingId, memberAccount } = useParams();
  const [booking, setBooking] = useState(null);
  const [shareRequests, setShareRequests] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]); // saved plans (read only)
  const [trainingRows, setTrainingRows] = useState([createEmptyRow(1)]); // the plan being edited
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  // Drives the alert style without inspecting the message text, which would break
  // once the copy is translated.
  const [isError, setIsError] = useState(false);
  const [savingRecords, setSavingRecords] = useState(false);

  const fetchBookingDetail = useCallback(async () => {
    setMessage('');
    try {
      const response = await equipmentBookingAPI.getBookingDetail(bookingId);
      if (response.data.success) {
        const data = response.data.data;
        setBooking(data);
        setShareRequests(data.shareRequests || []);
        setTrainingSessions(data.trainingSessions || []);
        setTrainingRows([createEmptyRow(1)]); // the editable area always starts from a fresh row
      } else {
        setBooking(null);
        setIsError(true);
      setMessage(response.data.message || t('user.booking.loadFailed'));
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
      setBooking(null);
      setIsError(true);
      setMessage(error.response?.data?.message || t('user.booking.notFound'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    if (ready) fetchBookingDetail();
  }, [ready, fetchBookingDetail]);

  const handleShareRequest = async (action, requestId) => {
    try {
      await equipmentBookingAPI.handleShareRequest(requestId, parseInt(memberAccount), action);
      setIsError(false);
      setMessage(action === 'accept' ? t('user.booking.accepted') : t('user.booking.rejected'));
      fetchBookingDetail();
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || t('user.booking.actionFailed'));
    }
  };

  const addTrainingRow = () => {
    const nextSet = trainingRows.length + 1;
    setTrainingRows([...trainingRows, createEmptyRow(nextSet)]);
  };

  const updateTrainingRow = (index, field, value) => {
    const next = [...trainingRows];
    next[index] = { ...next[index], [field]: value };
    setTrainingRows(next);
  };

  const toggleRowCompleted = (index) => {
    const next = [...trainingRows];
    next[index] = { ...next[index], completed: !next[index].completed };
    setTrainingRows(next);
  };

  const handleSaveTrainingRecords = async () => {
    setSavingRecords(true);
    try {
      const records = trainingRows.map((r, i) => ({
        set_number: i + 1,
        weight: String(r.weight).trim(),
        repetitions: String(r.repetitions).trim(),
        completed: r.completed,
        exercise_name: String(r.exerciseName).trim()
      }));
      await equipmentBookingAPI.saveTrainingRecords(
        bookingId,
        records,
        false,
        parseInt(memberAccount)
      ); // confirm the plan; the "done" column stays editable
      setIsError(false);
      setMessage(t('user.booking.planConfirmed'));
      fetchBookingDetail();
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || t('user.booking.saveFailed'));
    } finally {
      setSavingRecords(false);
    }
  };

  const handleDeleteTrainingSession = async (sessionId) => {
    if (!window.confirm(t('user.booking.deleteConfirm'))) return;
    try {
      await equipmentBookingAPI.deleteTrainingSession(bookingId, sessionId, parseInt(memberAccount));
      setIsError(false);
      setMessage(t('user.booking.deleted'));
      fetchBookingDetail();
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || t('user.booking.deleteFailed'));
    }
  };

  const handleToggleRecordCompleted = async (recordId, completed) => {
    try {
      await equipmentBookingAPI.updateRecordCompleted(
        recordId,
        completed,
        parseInt(memberAccount)
      );
      setTrainingSessions((prev) =>
        prev.map((s) =>
          s.session_id
            ? {
                ...s,
                records: (s.records || []).map((r) =>
                  r.record_id === recordId ? { ...r, completed } : r
                )
              }
            : s
        )
      );
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || t('user.booking.updateFailed'));
    }
  };

  const isOwner = booking && parseInt(booking.member_account) === parseInt(memberAccount);

  if (loading) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </UserLayout>
    );
  }

  if (!booking) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="alert alert-danger">{message || t('user.booking.notFound')}</div>
          <Link to="/user/main" className="btn btn-secondary">{t('common.home')}</Link>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('user.booking.detailTitle')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/user/equipment-booking/${memberAccount}`}>{t('user.booking.title')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('user.booking.detailTitle')}</li>
        </ol>

        {message && (
          <div className={`alert ${isError ? 'alert-danger' : 'alert-success'}`}>
            {message}
          </div>
        )}

        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-info-circle me-1"></i>
                {t('user.booking.infoCard')}
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>{t('user.booking.equipmentName')}</strong>{booking.equipment_name}
                  </div>
                  <div className="col-md-6">
                    <strong>{t('user.booking.equipmentLocation')}</strong>{booking.equipment_location}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>{t('user.booking.member')}</strong>{booking.member_name} ({booking.member_account})
                  </div>
                  <div className="col-md-6">
                    <strong>{t('user.booking.status')}</strong>
                    <span className={`badge ${
                      booking.status === 'active' ? 'bg-success' : 
                      booking.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                    }`}>
                      {booking.status === 'active' ? t('user.booking.statusActive') : 
                       booking.status === 'cancelled' ? t('user.booking.statusCancelled') : t('user.booking.statusCompleted')}
                    </span>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>{t('user.booking.startTime')}</strong>{formatDateTime(booking.start_time, locale)}
                  </div>
                  <div className="col-md-6">
                    <strong>{t('user.booking.endTime')}</strong>{formatDateTime(booking.end_time, locale)}
                  </div>
                </div>
                {booking.location_note && (
                  <div className="row mb-3">
                    <div className="col-md-12">
                      <strong>{t('user.booking.locationNote')}</strong>
                      <p className="mt-1">{booking.location_note}</p>
                    </div>
                  </div>
                )}
                <div className="row">
                  <div className="col-md-12">
                    <strong>{t('user.booking.createdAt')}</strong>{formatDateTime(booking.created_at, locale)}
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
                  {t('user.booking.shareRequests')}
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
                                {t('user.booking.requestTime')}: {formatDateTime(request.created_at, locale)}
                              </p>
                              <div className="btn-group w-100" role="group">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleShareRequest('accept', request.request_id)}
                                >
                                  {t('user.booking.accept')}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleShareRequest('reject', request.request_id)}
                                >
                                  {t('user.booking.reject')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {shareRequests.filter(req => req.status === 'pending').length === 0 && (
                        <p className="text-muted text-center">{t('user.booking.noPendingShares')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted text-center">{t('user.booking.noShareRequests')}</p>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <i className="bi bi-list-ul me-1"></i>
                {t('user.booking.actionsCard')}
              </div>
              <div className="card-body">
                <Link
                  to={`/user/equipment-booking/${memberAccount}`}
                  className="btn btn-secondary w-100 mb-2"
                >
                  {t('user.booking.backToList')}
                </Link>
                {isOwner && booking.status === 'active' && (
                  <button
                    className="btn btn-danger w-100"
                    onClick={async () => {
                      if (window.confirm(t('user.booking.cancelConfirm'))) {
                        try {
                          await equipmentBookingAPI.cancelBooking(bookingId, parseInt(memberAccount));
                          alert(t('user.booking.cancelled'));
                          navigate(`/user/equipment-booking/${memberAccount}`);
                        } catch (error) {
                          alert(error.response?.data?.message || t('user.booking.cancelFailed'));
                        }
                      }
                    }}
                  >
                    {t('user.booking.cancelForm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Saved plans: only the owner may toggle "done" or delete; others read only. */}
        {trainingSessions.map((session, idx) => {
          const key = session.session_id ?? `legacy-${idx}`;
          const canEditCompleted = isOwner && !!session.session_id; // only the owner may toggle the done column
          return (
            <div key={key} className="card mt-4">
              <div className="card-header bg-light d-flex justify-content-between align-items-center flex-wrap">
                <span>
                  <i className="bi bi-journal-check me-1"></i>
                  {t('user.booking.trainingTitle')}
                  {session.created_at && (
                    <span className="text-muted small ms-2">
                      {formatDateTime(session.created_at, locale)}
                    </span>
                  )}
                </span>
                {isOwner && session.session_id && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDeleteTrainingSession(session.session_id)}
                  >
                    {t('user.booking.deletePlan')}
                  </button>
                )}
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '80px' }}>{t('user.booking.setNumber')}</th>
                        <th>{t('user.booking.weight')}</th>
                        <th>{t('user.booking.repetitions')}</th>
                        <th style={{ width: '80px' }}>{t('user.booking.completed')}</th>
                        <th>{t('user.booking.exerciseName')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(session.records || []).map((r, i) => (
                        <tr key={r.record_id ?? i}>
                          <td className="text-center">{r.set_number}</td>
                          <td>{r.weight ?? '-'}</td>
                          <td>{r.repetitions ?? '-'}</td>
                          <td className="text-center">
                            {canEditCompleted && r.record_id ? (
                              <button
                                type="button"
                                className={`btn btn-sm ${r.completed ? 'btn-success' : 'btn-outline-secondary'}`}
                                onClick={() => handleToggleRecordCompleted(r.record_id, !r.completed)}
                                title={r.completed ? t('user.booking.completed') : t('user.booking.confirmPlan')}
                              >
                                <i className={`bi ${r.completed ? 'bi-check-lg' : 'bi-circle'}`}></i>
                              </button>
                            ) : r.completed ? (
                              <span className="text-success"><i className="bi bi-check-lg"></i></span>
                            ) : (
                              <span className="text-muted"><i className="bi bi-circle"></i></span>
                            )}
                          </td>
                          <td>{r.exercise_name ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

        {/* New editable plan: owner only. */}
        {isOwner && (
        <div className="card mt-4">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
            <span>
              <i className="bi bi-pencil-square me-1"></i>
              {t('user.booking.trainingTitle')}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveTrainingRecords}
              disabled={savingRecords}
            >
              {savingRecords ? t('user.booking.saving') : t('user.booking.confirmPlan')}
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>{t('user.booking.setNumber')}</th>
                    <th>{t('user.booking.weight')}</th>
                    <th>{t('user.booking.repetitions')}</th>
                    <th style={{ width: '80px' }}>{t('user.booking.completed')}</th>
                    <th>{t('user.booking.exerciseName')}</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingRows.map((row, index) => (
                    <tr key={index}>
                      <td className="text-center">{row.setNumber}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="20"
                          value={row.weight}
                          onChange={(e) => updateTrainingRow(index, 'weight', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="12"
                          value={row.repetitions}
                          onChange={(e) => updateTrainingRow(index, 'repetitions', e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className={`btn btn-sm ${row.completed ? 'btn-success' : 'btn-outline-secondary'}`}
                          onClick={() => toggleRowCompleted(index)}
                          title={row.completed ? t('user.booking.completed') : t('user.booking.confirmPlan')}
                        >
                          <i className={`bi ${row.completed ? 'bi-check-lg' : 'bi-circle'}`}></i>
                        </button>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Bench press"
                          value={row.exerciseName}
                          onChange={(e) => updateTrainingRow(index, 'exerciseName', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={addTrainingRow}
              >
                <i className="bi bi-plus-lg me-1"></i>{t('user.booking.addRow')}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* {t('user.booking.shareHistory')} */}
        {shareRequests.length > 0 && (
          <div className="card mt-4">
            <div className="card-header">
              <i className="bi bi-clock-history me-1"></i>
              {t('user.booking.shareHistory')}
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>{t('user.booking.requester')}</th>
                      <th>{t('user.booking.status')}</th>
                      <th>{t('user.booking.requestTime')}</th>
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
                            {request.status === 'pending' ? t('user.messages.pending') :
                             request.status === 'accepted' ? t('user.messages.accepted') : t('user.messages.rejected')}
                          </span>
                        </td>
                        <td>{formatDateTime(request.created_at, locale)}</td>
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
