import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { equipmentAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const UpdateEquipment = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    equipmentId: id,
    equipmentName: '',
    equipmentLocation: '',
    equipmentStatus: '',
    equipmentMessage: '',
    equipmentImage: '',
    equipmentFunction: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEquipment = useCallback(async () => {
    try {
      const response = await equipmentAPI.getById(id);
      if (response.data.success && response.data.data.length > 0) {
        const equipment = response.data.data[0];
        setFormData({
          equipmentId: equipment.equipment_id,
          equipmentName: equipment.equipment_name || '',
          equipmentLocation: equipment.equipment_location || '',
          equipmentStatus: equipment.equipment_status || '',
          equipmentMessage: equipment.equipment_message || '',
          equipmentImage: equipment.equipment_image || '',
          equipmentFunction: equipment.equipment_function || '',
        });
      }
    } catch (error) {
      setError(t('equipment.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (ready) fetchEquipment();
  }, [ready, fetchEquipment]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await equipmentAPI.update({
        equipmentId: parseInt(formData.equipmentId),
        equipmentName: formData.equipmentName,
        equipmentLocation: formData.equipmentLocation,
        equipmentStatus: formData.equipmentStatus,
        equipmentMessage: formData.equipmentMessage || '',
        equipmentImage: formData.equipmentImage || '',
        equipmentFunction: formData.equipmentFunction || '',
      });

      if (response.data.success) {
        navigate('/admin/equipment');
      } else {
        setError(response.data.message || t('member.update.failed'));
      }
    } catch (error) {
      setError(error.response?.data?.message || t('member.update.failed'));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('equipment.edit.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/equipment">{t('admin.nav.equipment')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('equipment.edit.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-gear me-1"></i>
            {t('equipment.edit.title')}
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('equipment.field.id')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.equipmentId}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('equipment.field.name')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="equipmentName"
                    value={formData.equipmentName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('equipment.field.location')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="equipmentLocation"
                    value={formData.equipmentLocation}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('equipment.field.status')}</label>
                  <select
                    className="form-control"
                    name="equipmentStatus"
                    value={formData.equipmentStatus}
                    onChange={handleChange}
                    required
                  >
                    <option value={t('equipment.status.normal')}>{t('equipment.status.normal')}</option>
                    <option value={t('equipment.status.damaged')}>{t('equipment.status.damaged')}</option>
                    <option value={t('equipment.status.repairing')}>{t('equipment.status.repairing')}</option>
                  </select>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">{t('equipment.field.message')}</label>
                  <textarea
                    className="form-control"
                    name="equipmentMessage"
                    value={formData.equipmentMessage}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">{t('equipment.field.image')}</label>
                  <div className="mb-2">
                    {formData.equipmentImage ? (
                      <img 
                        src={formData.equipmentImage} 
                        alt={t('equipment.field.image')}
                        className="img-thumbnail"
                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="bg-light d-inline-block p-3 rounded">
                        <i className="bi bi-image text-muted"></i>
                        <p className="text-muted mb-0 small">{t('equipment.field.noImage')}</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            equipmentImage: reader.result
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <small className="form-text text-muted">{t('equipment.field.image')}</small>
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder={t('equipment.field.image')}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({
                          ...formData,
                          equipmentImage: e.target.value
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">{t('equipment.field.function')}</label>
                  <textarea
                    className="form-control"
                    name="equipmentFunction"
                    value={formData.equipmentFunction}
                    onChange={handleChange}
                    rows="5"
                    placeholder={t('equipment.field.function')}
                  />
                </div>
              </div>
              <div className="mt-4 mb-0">
                <button type="submit" className="btn btn-primary">
                  {t('common.save')}
                </button>
                <Link to="/admin/equipment" className="btn btn-secondary ms-2">
                  {t('common.cancel')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UpdateEquipment;
