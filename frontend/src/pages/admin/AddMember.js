import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { memberAPI } from '../../services/api';

const AddMember = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    memberName: '',
    memberGender: '',
    memberAge: '',
    memberHeight: '',
    memberWeight: '',
    memberPhone: '',
    cardClass: '',
    membershipDuration: '',
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

    // Validation
    if (!formData.memberName || !formData.memberGender || !formData.cardClass) {
      setError('请填写所有必填项');
      return;
    }

    try {
      const response = await memberAPI.add({
        memberName: formData.memberName,
        memberGender: formData.memberGender,
        memberAge: parseInt(formData.memberAge) || null,
        memberHeight: parseInt(formData.memberHeight) || null,
        memberWeight: parseInt(formData.memberWeight) || null,
        memberPhone: formData.memberPhone ? parseInt(formData.memberPhone) : null,
        cardClass: parseInt(formData.cardClass),
        membershipDuration: formData.membershipDuration ? parseInt(formData.membershipDuration) : null,
      });

      if (response.data.success) {
        navigate('/admin/members');
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
        <h1 className="mt-4">添加会员</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/members">会员管理</Link>
          </li>
          <li className="breadcrumb-item active">添加会员</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person-plus me-1"></i>
            添加会员信息
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
                  <label className="form-label">姓名 *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="memberName"
                    value={formData.memberName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">性别 *</label>
                  <select
                    className="form-control"
                    name="memberGender"
                    value={formData.memberGender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">年龄</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberAge"
                    value={formData.memberAge}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">电话</label>
                  <input
                    type="text"
                    className="form-control"
                    name="memberPhone"
                    value={formData.memberPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">身高(cm)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberHeight"
                    value={formData.memberHeight}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">体重(kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberWeight"
                    value={formData.memberWeight}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">购买课时 *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="cardClass"
                    value={formData.cardClass}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">会籍时长（月）</label>
                  <input
                    type="number"
                    className="form-control"
                    name="membershipDuration"
                    value={formData.membershipDuration}
                    onChange={handleChange}
                    min="0"
                    placeholder="请输入会籍时长（月）"
                  />
                </div>
              </div>
              <div className="mt-4 mb-0">
                <button type="submit" className="btn btn-primary">
                  添加
                </button>
                <Link to="/admin/members" className="btn btn-secondary ms-2">
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

export default AddMember;
