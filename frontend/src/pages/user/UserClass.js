import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { userAPI } from '../../services/api';

const UserClass = () => {
  const navigate = useNavigate();
  const { account } = useParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, [account]);

  const fetchClasses = async () => {
    try {
      const response = await userAPI.getClasses(account);
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (window.confirm('确定要退课吗？')) {
      try {
        await userAPI.cancelClass(orderId);
        fetchClasses();
      } catch (error) {
        alert('退课失败：' + (error.response?.data?.message || error.message));
      }
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
        <h1 className="mt-4">我的课程</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">我的课程</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-calendar-event me-1"></i>
                已报名课程
              </div>
              <Link to={`/user/classes/apply/${account}`} className="btn btn-primary btn-sm">
                报名选课
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
                    <th>教练</th>
                    <th>开课时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length > 0 ? (
                    classes.map((classItem) => (
                      <tr key={classItem.class_order_id}>
                        <td>{classItem.class_id}</td>
                        <td>{classItem.class_name}</td>
                        <td>{classItem.coach}</td>
                        <td>{classItem.class_begin}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleCancel(classItem.class_order_id)}
                          >
                            退课
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        暂无已报名课程
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserClass;
