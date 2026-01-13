import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { classAPI, userAPI } from '../../services/api';

const ApplyClass = () => {
  const navigate = useNavigate();
  const { account } = useParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

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

  const handleApply = async (classId) => {
    setMessage('');
    try {
      const response = await userAPI.applyClass(classId, parseInt(account));
      if (response.data.success) {
        setMessage('报名成功！');
        setTimeout(() => {
          navigate(`/user/classes/${account}`);
        }, 1500);
      } else {
        setMessage(response.data.message || '报名失败');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || '报名失败');
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="text-center">加载中...</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">报名选课</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">报名选课</li>
        </ol>
        {message && (
          <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-calendar-plus me-1"></i>
            可选课程列表
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
                  {classes.length > 0 ? (
                    classes.map((classItem) => (
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
                          >
                            报名
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        暂无可选课程
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to={`/user/classes/${account}`} className="btn btn-secondary">
                返回我的课程
              </Link>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default ApplyClass;
