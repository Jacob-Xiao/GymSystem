import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { userAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const UserClass = () => {
  const ready = useAuthGuard('user');
  const { t } = useI18n();
  const { account } = useParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await userAPI.getClasses(account);
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (ready) fetchClasses();
  }, [ready, fetchClasses]);

  const handleCancel = async (orderId) => {
    if (window.confirm(t('user.class.cancelConfirm'))) {
      try {
        await userAPI.cancelClass(orderId);
        fetchClasses();
      } catch (error) {
        alert(t('user.class.cancelFailed') + (error.response?.data?.message || error.message));
      }
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
        <h1 className="mt-4">{t('user.class.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('user.class.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-calendar-event me-1"></i>
                {t('user.class.cardTitle')}
              </div>
              <Link to={`/user/classes/apply/${account}`} className="btn btn-primary btn-sm">
                {t('user.class.apply')}
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
                    <th>{t('class.field.coach')}</th>
                    <th>{t('class.field.begin')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length > 0 ? (
                    classes.map((classItem) => (
                      <tr key={classItem.class_order_id}>
                        <td>{classItem.class_id}</td>
                        <td>{classItem.class_name}</td>
                        <td>{classItem.coach}</td>
                        <td>{classItem.class_begin}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleCancel(classItem.class_order_id)}
                          >
                            {t('user.class.cancel')}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        {t('user.class.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserClass;
