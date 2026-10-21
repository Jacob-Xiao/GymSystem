import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { equipmentAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const EquipmentList = () => {
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready) fetchEquipment();
  }, [ready]);

  const fetchEquipment = async () => {
    try {
      const response = await equipmentAPI.getAll();
      if (response.data.success) {
        setEquipment(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('equipment.delete.confirm'))) {
      try {
        await equipmentAPI.delete(id);
        fetchEquipment();
      } catch (error) {
        alert(t('equipment.delete.failed') + (error.response?.data?.message || error.message));
      }
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
        <h1 className="mt-4">{t('equipment.list.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('equipment.list.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-table me-1"></i>
                {t('equipment.list.cardTitle')}
              </div>
              <Link to="/admin/equipment/add" className="btn btn-primary btn-sm">
                {t('equipment.action.add')}
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>{t('equipment.field.id')}</th>
                    <th>{t('equipment.field.name')}</th>
                    <th>{t('equipment.field.location')}</th>
                    <th>{t('equipment.field.status')}</th>
                    <th>{t('equipment.field.message')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item) => (
                    <tr key={item.equipment_id}>
                      <td>{item.equipment_id}</td>
                      <td>{item.equipment_name}</td>
                      <td>{item.equipment_location}</td>
                      <td>{item.equipment_status}</td>
                      <td>{item.equipment_message}</td>
                      <td>
                        <Link
                          to={`/admin/equipment/update/${item.equipment_id}`}
                          className="btn btn-sm btn-warning me-1"
                        >
                          {t('common.edit')}
                        </Link>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.equipment_id)}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EquipmentList;
