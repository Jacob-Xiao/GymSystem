import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { employeeAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const UpdateEmployee = () => {
  const navigate = useNavigate();
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const { account } = useParams();
  const [formData, setFormData] = useState({
    employeeAccount: account,
    employeeName: '',
    employeeGender: '',
    employeeAge: '',
    staff: '',
    employeeMessage: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmployee = useCallback(async () => {
    try {
      const response = await employeeAPI.getByAccount(account);
      if (response.data.success && response.data.data.length > 0) {
        const employee = response.data.data[0];
        setFormData({
          employeeAccount: employee.employee_account,
          employeeName: employee.employee_name || '',
          employeeGender: employee.employee_gender || '',
          employeeAge: employee.employee_age || '',
          staff: employee.staff || '',
          employeeMessage: employee.employee_message || '',
        });
      }
    } catch (error) {
      setError(t('employee.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [account, t]);

  useEffect(() => {
    if (ready) fetchEmployee();
  }, [ready, fetchEmployee]);

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
      const response = await employeeAPI.update({
        employeeAccount: parseInt(formData.employeeAccount),
        employeeName: formData.employeeName,
        employeeGender: formData.employeeGender,
        employeeAge: formData.employeeAge ? parseInt(formData.employeeAge) : null,
        staff: formData.staff,
        employeeMessage: formData.employeeMessage || '',
      });

      if (response.data.success) {
        navigate('/admin/employees');
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
        <h1 className="mt-4">{t('employee.edit.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/employees">{t('admin.nav.employees')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('employee.edit.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person-check me-1"></i>
            {t('employee.edit.title')}
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
                  <label className="form-label">{t('employee.field.account')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.employeeAccount}
                    disabled
                  />
                </div>
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
              </div>
              <div className="row mb-3">
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
              </div>
              <div className="row mb-3">
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
                  {t('common.save')}
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

export default UpdateEmployee;
