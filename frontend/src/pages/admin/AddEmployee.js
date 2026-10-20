import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { employeeAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const AddEmployee = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeGender: '',
    employeeAge: '',
    staff: '',
    employeeMessage: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.employeeName || !formData.employeeGender || !formData.staff) {
      setError(t('employee.required'));
      return;
    }

    try {
      const response = await employeeAPI.add({
        employeeName: formData.employeeName,
        employeeGender: formData.employeeGender,
        employeeAge: formData.employeeAge ? parseInt(formData.employeeAge) : null,
        staff: formData.staff,
        employeeMessage: formData.employeeMessage || '',
      });

      if (response.data.success) {
        navigate('/admin/employees');
      } else {
        setError(response.data.message || t('member.add.failed'));
      }
    } catch (error) {
      setError(error.response?.data?.message || t('member.add.failed'));
    }
  };

  if (!ready) {
    return <div className="text-center mt-5">{t('common.loading')}</div>;
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('employee.add.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/employees">{t('admin.nav.employees')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('employee.add.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person-plus me-1"></i>
            {t('employee.add.cardTitle')}
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
                  <label className="form-label">{t('employee.field.name')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('employee.field.gender')}</label>
                  <select
                    className="form-control"
                    name="employeeGender"
                    value={formData.employeeGender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('common.selectPlaceholder')}</option>
                    <option value={t('common.male')}>{t('common.male')}</option>
                    <option value={t('common.female')}>{t('common.female')}</option>
                  </select>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('employee.field.age')}</label>
                  <input
                    type="number"
                    className="form-control"
                    name="employeeAge"
                    value={formData.employeeAge}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('employee.field.staff')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="staff"
                    value={formData.staff}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">{t('employee.field.message')}</label>
                  <textarea
                    className="form-control"
                    name="employeeMessage"
                    value={formData.employeeMessage}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>
              <div className="mt-4 mb-0">
                <button type="submit" className="btn btn-primary">
                  {t('common.add')}
                </button>
                <Link to="/admin/employees" className="btn btn-secondary ms-2">
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

export default AddEmployee;
