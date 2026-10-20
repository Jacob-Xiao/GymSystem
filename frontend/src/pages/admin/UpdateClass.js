import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { classAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const UpdateClass = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    classId: id,
    className: '',
    classBegin: '',
    classTime: '',
    coach: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClass = useCallback(async () => {
    try {
      const response = await classAPI.getById(id);
      if (response.data.success) {
        const classItem = response.data.data;
        // Convert classBegin from "2021年1月1日 15:00" to datetime-local format
        let formattedClassBegin = '';
        if (classItem.class_begin) {
          try {
            // Parse "2021年1月1日 15:00" format
            const match = classItem.class_begin.match(/(\d+)年(\d+)月(\d+)日\s+(\d+):(\d+)/);
            if (match) {
              const year = match[1];
              const month = String(match[2]).padStart(2, '0');
              const day = String(match[3]).padStart(2, '0');
              const hour = String(match[4]).padStart(2, '0');
              const minute = String(match[5]).padStart(2, '0');
              formattedClassBegin = `${year}-${month}-${day}T${hour}:${minute}`;
            }
          } catch (e) {
            // If parsing fails, leave empty
            formattedClassBegin = '';
          }
        }
        // Extract number from classTime (remove t('class.minutes') suffix)
        let classTimeValue = '';
        if (classItem.class_time) {
          const match = classItem.class_time.match(/(\d+)/);
          if (match) {
            classTimeValue = match[1];
          }
        }
        setFormData({
          classId: classItem.class_id,
          className: classItem.class_name || '',
          classBegin: formattedClassBegin,
          classTime: classTimeValue,
          coach: classItem.coach || '',
        });
      }
    } catch (error) {
      setError(t('class.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (ready) fetchClass();
  }, [ready, fetchClass]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.className || !formData.classBegin || !formData.classTime || !formData.coach) {
      setError(t('class.required'));
      return;
    }

    try {
      // Format classBegin from datetime-local to readable format
      let formattedClassBegin = formData.classBegin;
      if (formData.classBegin) {
        const date = new Date(formData.classBegin);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formattedClassBegin = `${year}年${month}月${day}日 ${hours}:${minutes}`;
      }
      
      // Format classTime with t('class.minutes') suffix
      const formattedClassTime = formData.classTime ? `${formData.classTime}分钟` : '';

      // Validate classId
      const classIdNum = parseInt(formData.classId);
      if (isNaN(classIdNum)) {
        setError(t('class.invalidId'));
        return;
      }

      const response = await classAPI.update({
        classId: classIdNum,
        className: formData.className,
        classBegin: formattedClassBegin,
        classTime: formattedClassTime,
        coach: formData.coach,
      });

      if (response.data.success) {
        navigate('/admin/classes');
      } else {
        setError(response.data.message || t('member.update.failed'));
      }
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || error.message || t('member.update.failed'));
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
        <h1 className="mt-4">{t('class.edit.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/classes">{t('admin.nav.classes')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('class.edit.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-calendar-event me-1"></i>
            {t('class.edit.title')}
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
                  <label className="form-label">{t('class.field.id')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.classId}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('class.field.name')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('class.field.begin')}</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="classBegin"
                    value={formData.classBegin}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('class.field.duration')}</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      name="classTime"
                      value={formData.classTime}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                    <span className="input-group-text">{t('class.minutes')}</span>
                  </div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('class.field.coach')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="coach"
                    value={formData.coach}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="mt-4 mb-0">
                <button type="submit" className="btn btn-primary">
                  {t('common.save')}
                </button>
                <Link to="/admin/classes" className="btn btn-secondary ms-2">
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

export default UpdateClass;
