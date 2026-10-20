import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { classAPI, userAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const ApplyClass = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('user');
  const { t } = useI18n();
  const { account } = useParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  // Classes this member already joined: the list marks them so the same course cannot be
  // submitted twice from the picker.
  const [enrolledClassIds, setEnrolledClassIds] = useState(new Set());

  const fetchClasses = useCallback(async () => {
    try {
      const [classesRes, enrolledRes] = await Promise.allSettled([
        classAPI.getAll(),
        userAPI.getClasses(parseInt(account, 10))
      ]);

      if (classesRes.status === 'fulfilled' && classesRes.value.data.success) {
        setClasses(classesRes.value.data.data);
      }
      if (enrolledRes.status === 'fulfilled' && enrolledRes.value.data.success) {
        setEnrolledClassIds(
          new Set(enrolledRes.value.data.data.map((order) => Number(order.class_id)))
        );
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

  const handleApply = async (classId) => {
    setMessage('');
    setIsSuccess(false);
    try {
      const response = await userAPI.applyClass(classId, parseInt(account));
      if (response.data.success) {
        setIsSuccess(true);
        setMessage(t('user.apply.success'));
        setEnrolledClassIds((prev) => new Set(prev).add(Number(classId)));
        setTimeout(() => {
          navigate(`/user/classes/${account}`);
        }, 1500);
      } else {
        setIsSuccess(false);
        setMessage(response.data.message || t('user.apply.failed'));
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.response?.data?.message || t('user.apply.failed'));
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
        <h1 className="mt-4">{t('user.apply.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('user.apply.title')}</li>
        </ol>
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-calendar-plus me-1"></i>
            {t('user.apply.cardTitle')}
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
                  {classes.length > 0 ? (
                    classes.map((classItem) => {
                      const enrolled = enrolledClassIds.has(Number(classItem.class_id));
                      return (
                        <tr key={classItem.class_id}>
                          <td>{classItem.class_id}</td>
                          <td>{classItem.class_name}</td>
                          <td>{classItem.class_begin}</td>
                          <td>{classItem.class_time}</td>
                          <td>{classItem.coach}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleApply(classItem.class_id)}
                              disabled={enrolled}
                            >
                              {enrolled ? t('user.apply.enrolled') : t('user.apply.action')}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        {t('user.apply.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to={`/user/classes/${account}`} className="btn btn-secondary">
                {t('user.apply.backToMyClasses')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default ApplyClass;
