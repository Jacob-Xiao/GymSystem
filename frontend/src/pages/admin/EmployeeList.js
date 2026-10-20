import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { employeeAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';
import { formatDate } from '../../utils/date';

const EmployeeList = () => {
  const ready = useAuthGuard('admin');
  const { t, language } = useI18n();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready) fetchEmployees();
  }, [ready]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (account) => {
    if (window.confirm(t('employee.delete.confirm'))) {
      try {
        await employeeAPI.delete(account);
        fetchEmployees();
      } catch (error) {
        alert(t('employee.delete.failed') + (error.response?.data?.message || error.message));
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
        <h1 className="mt-4">{t('employee.list.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('employee.list.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-table me-1"></i>
                {t('employee.list.cardTitle')}
              </div>
              <Link to="/admin/employees/add" className="btn btn-primary btn-sm">
                {t('employee.action.add')}
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>{t('employee.field.account')}</th>
                    <th>{t('employee.field.name')}</th>
                    <th>{t('employee.field.gender')}</th>
                    <th>{t('employee.field.age')}</th>
                    <th>{t('employee.field.entryTime')}</th>
                    <th>{t('employee.field.staff')}</th>
                    <th>{t('employee.field.message')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.employee_account}>
                      <td>{employee.employee_account}</td>
                      <td>{employee.employee_name}</td>
                      <td>{employee.employee_gender}</td>
                      <td>{employee.employee_age}</td>
                      <td>{formatDate(employee.entry_time, locale)}</td>
                      <td>{employee.staff}</td>
                      <td>{employee.employee_message}</td>
                      <td>
                        <Link
                          to={`/admin/employees/update/${employee.employee_account}`}
                          className="btn btn-sm btn-warning me-1"
                        >
                          {t('common.edit')}
                        </Link>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(employee.employee_account)}
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

export default EmployeeList;
