import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { classAPI } from '../../services/api';

const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminAccount = sessionStorage.getItem('adminAccount');
    if (!adminAccount) {
      navigate('/admin/login');
      return;
    }
    fetchClasses();
  }, [navigate]);

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
    if (window.confirm('确定要删除该课程吗？删除课程将同时删除所有相关报名信息。')) {
      try {
        await classAPI.delete(id);
        fetchClasses();
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
        <h1 className="mt-4">课程管理</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">课程管理</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-table me-1"></i>
                课程列表
              </div>
              <Link to="/admin/classes/add" className="btn btn-primary btn-sm">
                添加课程
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>课程ID</th>
                    <th>课程名称</th>
                    <th>开课时间</th>
                    <th>课程时长</th>
                    <th>教练</th>
                    <th>操作</th>
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
                          查看报名
                        </Link>
                        <Link
                          to={`/admin/classes/update/${classItem.class_id}`}
                          className="btn btn-sm btn-warning me-1"
                        >
                          修改
                        </Link>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(classItem.class_id)}
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

export default ClassList;
