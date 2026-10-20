import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { classAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const ClassList = () => {
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready) fetchClasses();
  }, [ready]);

  const fetchClasses = async () => {
    try {
      const response = await classAPI.getAll();
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('class.delete.confirm'))) {
      try {
        await classAPI.delete(id);
        fetchClasses();
      } catch (error) {
        alert(t('class.delete.failed') + (error.response?.data?.message || error.message));
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
        <h1 className="mt-4">{t('class.list.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('class.list.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-table me-1"></i>
                {t('class.list.cardTitle')}
              </div>
              <Link to="/admin/classes/add" className="btn btn-primary btn-sm">
                {t('class.action.add')}
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>{t('class.field.id')}</th>
                    <th>{t('class.field.name')}</th>
                    <th>{t('class.field.begin')}</th>
                    <th>{t('class.field.duration')}</th>
                    <th>{t('class.field.coach')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classItem) => (
                    <tr key={classItem.class_id}>
                      <td>{classItem.class_id}</td>
                      <td>{classItem.class_name}</td>
                      <td>{classItem.class_begin}</td>
                      <td>{classItem.class_time}</td>
                      <td>{classItem.coach}</td>
                      <td>
                        <Link
                          to={`/admin/classes/orders/${classItem.class_id}`}
                          className="btn btn-sm btn-info me-1"
                        >
                          {t('class.action.viewOrders')}
                        </Link>
                        <Link
                          to={`/admin/classes/update/${classItem.class_id}`}
                          className="btn btn-sm btn-warning me-1"
                        >
                          {t('common.edit')}
                        </Link>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(classItem.class_id)}
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

export default ClassList;
