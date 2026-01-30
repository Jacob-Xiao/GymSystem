import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { classAPI } from '../../services/api';

const ClassOrderList = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminAccount = sessionStorage.getItem('adminAccount');
    if (!adminAccount) {
      navigate('/admin/login');
      return;
    }
    fetchOrders();
  }, [classId, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await classAPI.getOrders(classId);
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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
        <h1 className="mt-4">课程报名信息</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/classes">课程管理</Link>
          </li>
          <li className="breadcrumb-item active">课程报名信息</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-table me-1"></i>
            报名列表
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>报名ID</th>
                    <th>课程ID</th>
                    <th>课程名称</th>
                    <th>教练</th>
                    <th>会员姓名</th>
                    <th>会员账号</th>
                    <th>开课时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.class_order_id}>
                        <td>{order.class_order_id}</td>
                        <td>{order.class_id}</td>
                        <td>{order.class_name}</td>
                        <td>{order.coach}</td>
                        <td>{order.member_name}</td>
                        <td>{order.member_account}</td>
                        <td>{order.class_begin}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        暂无报名信息
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/admin/classes" className="btn btn-secondary">
                返回
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClassOrderList;
