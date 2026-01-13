import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { equipmentAPI } from '../../services/api';

const EquipmentDetail = () => {
  const navigate = useNavigate();
  const { equipmentId, memberAccount } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipmentDetail();
  }, [equipmentId]);

  const fetchEquipmentDetail = async () => {
    try {
      const response = await equipmentAPI.getById(equipmentId);
      if (response.data.success && response.data.data.length > 0) {
        setEquipment(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching equipment detail:', error);
    } finally {
      setLoading(false);
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

  if (!equipment) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="alert alert-danger">器材不存在</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">器材详情</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/user/equipment-booking/${memberAccount}`}>器材预约</Link>
          </li>
          <li className="breadcrumb-item active">器材详情</li>
        </ol>
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-image me-1"></i>
                器材图片
              </div>
              <div className="card-body text-center">
                {equipment.equipment_image ? (
                  <img 
                    src={equipment.equipment_image} 
                    alt={equipment.equipment_name}
                    className="img-fluid"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = '/img/error-404-monochrome.svg';
                      e.target.alt = '图片加载失败';
                    }}
                  />
                ) : (
                  <div className="py-5">
                    <i className="bi bi-image fs-1 text-muted"></i>
                    <p className="text-muted mt-2">暂无图片</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-info-circle me-1"></i>
                器材信息
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-4"><strong>器材名称：</strong></div>
                  <div className="col-md-8">{equipment.equipment_name}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4"><strong>器材位置：</strong></div>
                  <div className="col-md-8">{equipment.equipment_location}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4"><strong>器材状态：</strong></div>
                  <div className="col-md-8">
                    <span className={`badge ${
                      equipment.equipment_status === '正常' ? 'bg-success' : 
                      equipment.equipment_status === '损坏' ? 'bg-danger' : 'bg-warning'
                    }`}>
                      {equipment.equipment_status}
                    </span>
                  </div>
                </div>
                {equipment.equipment_message && (
                  <div className="row mb-3">
                    <div className="col-md-4"><strong>备注信息：</strong></div>
                    <div className="col-md-8">{equipment.equipment_message}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-list-check me-1"></i>
                器材功能
              </div>
              <div className="card-body">
                {equipment.equipment_function ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{equipment.equipment_function}</div>
                ) : (
                  <p className="text-muted">暂无功能说明</p>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <Link
                  to={`/user/equipment-booking/${memberAccount}`}
                  className="btn btn-secondary w-100"
                >
                  返回器材列表
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default EquipmentDetail;
