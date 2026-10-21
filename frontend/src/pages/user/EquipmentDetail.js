import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { equipmentAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const EquipmentDetail = () => {
  const ready = useAuthGuard('user');
  const { t } = useI18n();
  const { equipmentId, memberAccount } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEquipmentDetail = useCallback(async () => {
    try {
      const response = await equipmentAPI.getById(equipmentId);
      if (response.data.success && response.data.data.length > 0) {
        setEquipment(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching equipment detail:', error);
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    if (ready) fetchEquipmentDetail();
  }, [ready, fetchEquipmentDetail]);

  if (loading) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </UserLayout>
    );
  }

  if (!equipment) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="alert alert-danger">{t('equipment.detail.notFound')}</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('equipment.detail.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/user/equipment-booking/${memberAccount}`}>{t('user.booking.title')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('equipment.detail.title')}</li>
        </ol>
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-image me-1"></i>
                {t('equipment.detail.image')}
              </div>
              <div className="card-body text-center">
                {equipment.equipment_image ? (
                  <img 
                    src={equipment.equipment_image} 
                    alt={equipment.equipment_name}
                    className="img-fluid"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = '/img/error-404-monochrome.svg';
                      e.target.alt = t('equipment.field.noImage');
                    }}
                  />
                ) : (
                  <div className="py-5">
                    <i className="bi bi-image fs-1 text-muted"></i>
                    <p className="text-muted mt-2">{t('equipment.field.noImage')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-info-circle me-1"></i>
                {t('equipment.detail.info')}
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-4"><strong>{t('equipment.field.name')}</strong></div>
                  <div className="col-md-8">{equipment.equipment_name}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4"><strong>{t('equipment.field.location')}</strong></div>
                  <div className="col-md-8">{equipment.equipment_location}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4"><strong>{t('equipment.field.status')}</strong></div>
                  <div className="col-md-8">
                    <span className={`badge ${
                      equipment.equipment_status === t('equipment.status.normal') ? 'bg-success' : 
                      equipment.equipment_status === t('equipment.status.damaged') ? 'bg-danger' : 'bg-warning'
                    }`}>
                      {equipment.equipment_status}
                    </span>
                  </div>
                </div>
                {equipment.equipment_message && (
                  <div className="row mb-3">
                    <div className="col-md-4"><strong>{t('equipment.field.message')}</strong></div>
                    <div className="col-md-8">{equipment.equipment_message}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-list-check me-1"></i>
                {t('equipment.detail.function')}
              </div>
              <div className="card-body">
                {equipment.equipment_function ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{equipment.equipment_function}</div>
                ) : (
                  <p className="text-muted">{t('equipment.detail.noFunction')}</p>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <Link
                  to={`/user/equipment-booking/${memberAccount}`}
                  className="btn btn-secondary w-100"
                >
                  {t('user.booking.backToList')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default EquipmentDetail;
