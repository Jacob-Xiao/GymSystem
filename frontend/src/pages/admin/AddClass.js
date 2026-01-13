import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { classAPI } from '../../services/api';

const AddClass = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    classId: '',
    className: '',
    classBegin: '',
    classTime: '',
    coach: '',
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

    if (!formData.classId || !formData.className || !formData.classBegin || !formData.classTime || !formData.coach) {
      setError('请填写所有必填项');
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
      
      // Format classTime with "分钟" suffix
      const formattedClassTime = formData.classTime ? `${formData.classTime}分钟` : '';

      const response = await classAPI.add({
        classId: parseInt(formData.classId),
        className: formData.className,
        classBegin: formattedClassBegin,
        classTime: formattedClassTime,
        coach: formData.coach,
      });

      if (response.data.success) {
        navigate('/admin/classes');
      } else {
        setError(response.data.message || '添加失败');
      }
    } catch (error) {
      setError(error.response?.data?.message || '添加失败');
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">添加课程</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/classes">课程管理</Link>
          </li>
          <li className="breadcrumb-item active">添加课程</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-calendar-plus me-1"></i>
            添加课程信息
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
                  <label className="form-label">课程ID *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">课程名称 *</label>
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
                  <label className="form-label">开课时间 *</label>
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
                  <label className="form-label">课程时长 *</label>
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
                    <span className="input-group-text">分钟</span>
                  </div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">教练 *</label>
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
                  添加
                </button>
                <Link to="/admin/classes" className="btn btn-secondary ms-2">
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

export default AddClass;
