import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { employeeAPI } from '../../services/api';

const UpdateEmployee = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchEmployee();
  }, [account]);

  const fetchEmployee = async () => {
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
      setError('加载员工信息失败');
    } finally {
      setLoading(false);
    }
  };

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
        setError(response.data.message || '更新失败');
      }
    } catch (error) {
      setError(error.response?.data?.message || '更新失败');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4">
          <div className="text-center">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">修改员工信息</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/employees">员工管理</Link>
          </li>
          <li className="breadcrumb-item active">修改员工信息</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person-check me-1"></i>
            修改员工信息
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
                  <label className="form-label">员工账号</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.employeeAccount}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">姓名</label>
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
                  <label className="form-label">性别</label>
                  <select
                    className="form-control"
                    name="employeeGender"
                    value={formData.employeeGender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">年龄</label>
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
                  <label className="form-label">职务</label>
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
                  <label className="form-label">备注信息</label>
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
                  保存
                </button>
                <Link to="/admin/employees" className="btn btn-secondary ms-2">
                  取消
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
