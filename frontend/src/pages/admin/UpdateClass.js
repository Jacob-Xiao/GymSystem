import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { classAPI } from '../../services/api';

const UpdateClass = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchClass();
  }, [id]);

  const fetchClass = async () => {
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
        // Extract number from classTime (remove "分钟" suffix)
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
      setError('加载课程信息失败');
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

    if (!formData.className || !formData.classBegin || !formData.classTime || !formData.coach) {
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

      // Validate classId
      const classIdNum = parseInt(formData.classId);
      if (isNaN(classIdNum)) {
        setError('课程ID无效');
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
        setError(response.data.message || '更新失败');
      }
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || error.message || '更新失败');
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
        <h1 className="mt-4">修改课程信息</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/classes">课程管理</Link>
          </li>
          <li className="breadcrumb-item active">修改课程信息</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-calendar-event me-1"></i>
            修改课程信息
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
                  <label className="form-label">课程ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.classId}
                    disabled
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
                  保存
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

export default UpdateClass;
