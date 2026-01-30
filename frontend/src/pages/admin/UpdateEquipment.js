import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { equipmentAPI } from '../../services/api';

const UpdateEquipment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    equipmentId: id,
    equipmentName: '',
    equipmentLocation: '',
    equipmentStatus: '',
    equipmentMessage: '',
    equipmentImage: '',
    equipmentFunction: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEquipment();
  }, [id]);

  const fetchEquipment = async () => {
    try {
      const response = await equipmentAPI.getById(id);
      if (response.data.success && response.data.data.length > 0) {
        const equipment = response.data.data[0];
        setFormData({
          equipmentId: equipment.equipment_id,
          equipmentName: equipment.equipment_name || '',
          equipmentLocation: equipment.equipment_location || '',
          equipmentStatus: equipment.equipment_status || '',
          equipmentMessage: equipment.equipment_message || '',
          equipmentImage: equipment.equipment_image || '',
          equipmentFunction: equipment.equipment_function || '',
        });
      }
    } catch (error) {
      setError('加载器材信息失败');
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
      const response = await equipmentAPI.update({
        equipmentId: parseInt(formData.equipmentId),
        equipmentName: formData.equipmentName,
        equipmentLocation: formData.equipmentLocation,
        equipmentStatus: formData.equipmentStatus,
        equipmentMessage: formData.equipmentMessage || '',
        equipmentImage: formData.equipmentImage || '',
        equipmentFunction: formData.equipmentFunction || '',
      });

      if (response.data.success) {
        navigate('/admin/equipment');
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
        <h1 className="mt-4">修改器材信息</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/equipment">器材管理</Link>
          </li>
          <li className="breadcrumb-item active">修改器材信息</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-gear me-1"></i>
            修改器材信息
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
                  <label className="form-label">器材ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.equipmentId}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">器材名称</label>
                  <input
                    type="text"
                    className="form-control"
                    name="equipmentName"
                    value={formData.equipmentName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">器材位置</label>
                  <input
                    type="text"
                    className="form-control"
                    name="equipmentLocation"
                    value={formData.equipmentLocation}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">器材状态</label>
                  <select
                    className="form-control"
                    name="equipmentStatus"
                    value={formData.equipmentStatus}
                    onChange={handleChange}
                    required
                  >
                    <option value="正常">正常</option>
                    <option value="损坏">损坏</option>
                    <option value="维修中">维修中</option>
                  </select>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">备注信息</label>
                  <textarea
                    className="form-control"
                    name="equipmentMessage"
                    value={formData.equipmentMessage}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">器材图片</label>
                  <div className="mb-2">
                    {formData.equipmentImage ? (
                      <img 
                        src={formData.equipmentImage} 
                        alt="预览"
                        className="img-thumbnail"
                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="bg-light d-inline-block p-3 rounded">
                        <i className="bi bi-image text-muted"></i>
                        <p className="text-muted mb-0 small">暂无图片</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            equipmentImage: reader.result
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <small className="form-text text-muted">可选择本地图片文件上传，或输入图片URL地址</small>
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder="或输入图片URL地址（可选）"
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({
                          ...formData,
                          equipmentImage: e.target.value
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">器材功能说明</label>
                  <textarea
                    className="form-control"
                    name="equipmentFunction"
                    value={formData.equipmentFunction}
                    onChange={handleChange}
                    rows="5"
                    placeholder="请输入器材的功能说明（可选）"
                  />
                </div>
              </div>
              <div className="mt-4 mb-0">
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
                <Link to="/admin/equipment" className="btn btn-secondary ms-2">
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

export default UpdateEquipment;
