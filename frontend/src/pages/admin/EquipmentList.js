import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { equipmentAPI } from '../../services/api';

const EquipmentList = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminAccount = sessionStorage.getItem('adminAccount');
    if (!adminAccount) {
      navigate('/admin/login');
      return;
    }
    fetchEquipment();
  }, [navigate]);

  const fetchEquipment = async () => {
    try {
      const response = await equipmentAPI.getAll();
      if (response.data.success) {
        setEquipment(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除该设备吗？')) {
      try {
        await equipmentAPI.delete(id);
        fetchEquipment();
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
        <h1 className="mt-4">器材管理</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">器材管理</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-table me-1"></i>
                器材列表
              </div>
              <Link to="/admin/equipment/add" className="btn btn-primary btn-sm">
                添加器材
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>器材ID</th>
                    <th>器材名称</th>
                    <th>器材位置</th>
                    <th>器材状态</th>
                    <th>备注信息</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item) => (
                    <tr key={item.equipment_id}>
                      <td>{item.equipment_id}</td>
                      <td>{item.equipment_name}</td>
                      <td>{item.equipment_location}</td>
                      <td>{item.equipment_status}</td>
                      <td>{item.equipment_message}</td>
                      <td>
                        <Link
                          to={`/admin/equipment/update/${item.equipment_id}`}
                          className="btn btn-sm btn-warning me-1"
                        >
                          修改
                        </Link>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.equipment_id)}
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

export default EquipmentList;
