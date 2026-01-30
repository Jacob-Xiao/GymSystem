import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { employeeAPI } from '../../services/api';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminAccount = sessionStorage.getItem('adminAccount');
    if (!adminAccount) {
      navigate('/admin/login');
      return;
    }
    fetchEmployees();
  }, [navigate]);

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
    if (window.confirm('确定要删除该员工吗？')) {
      try {
        await employeeAPI.delete(account);
        fetchEmployees();
      } catch (error) {
        alert('删除失败：' + (error.response?.data?.message || error.message));
      }
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
        <h1 className="mt-4">员工管理</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">员工管理</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-table me-1"></i>
                员工列表
              </div>
              <Link to="/admin/employees/add" className="btn btn-primary btn-sm">
                添加员工
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>员工账号</th>
                    <th>姓名</th>
                    <th>性别</th>
                    <th>年龄</th>
                    <th>入职时间</th>
                    <th>职务</th>
                    <th>备注信息</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.employee_account}>
                      <td>{employee.employee_account}</td>
                      <td>{employee.employee_name}</td>
                      <td>{employee.employee_gender}</td>
                      <td>{employee.employee_age}</td>
                      <td>{employee.entry_time}</td>
                      <td>{employee.staff}</td>
                      <td>{employee.employee_message}</td>
                      <td>
                        <Link
                          to={`/admin/employees/update/${employee.employee_account}`}
                          className="btn btn-sm btn-warning me-1"
                        >
                          修改
                        </Link>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(employee.employee_account)}
                        >
                          删除
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
