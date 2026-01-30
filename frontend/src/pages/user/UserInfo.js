import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { userAPI } from '../../services/api';

const UserInfo = () => {
  const navigate = useNavigate();
  const { account } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMember();
  }, [account]);

  const fetchMember = async () => {
    try {
      const response = await userAPI.getInfo(account);
      if (response.data.success) {
        setMember(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching member info:', error);
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

  if (!member) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="alert alert-danger">会员信息不存在</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">个人信息</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">个人信息</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person me-1"></i>
            个人信息详情
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-12 text-center">
                {member.member_photo ? (
                  <img 
                    src={member.member_photo} 
                    alt={member.member_name}
                    className="img-thumbnail"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E暂无照片%3C/text%3E%3C/svg%3E';
                      e.target.alt = '照片加载失败';
                    }}
                  />
                ) : (
                  <div className="bg-light d-inline-block p-5 rounded">
                    <i className="bi bi-person fs-1 text-muted"></i>
                    <p className="text-muted mt-2 mb-0">暂无照片</p>
                  </div>
                )}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>会员账号：</strong>{member.member_account}
              </div>
              <div className="col-md-6">
                <strong>姓名：</strong>{member.member_name}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>性别：</strong>{member.member_gender}
              </div>
              <div className="col-md-6">
                <strong>年龄：</strong>{member.member_age}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>身高：</strong>{member.member_height} cm
              </div>
              <div className="col-md-6">
                <strong>体重：</strong>{member.member_weight} kg
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>电话：</strong>{member.member_phone}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>办卡时间：</strong>{member.card_time}
              </div>
              <div className="col-md-6">
                <strong>购买课时：</strong>{member.card_class}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>剩余课时：</strong>{member.card_next_class}
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={`/user/info/update/${account}`}
                className="btn btn-primary"
              >
                修改信息
              </Link>
              <Link to="/user/main" className="btn btn-secondary ms-2">
                返回
              </Link>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserInfo;
