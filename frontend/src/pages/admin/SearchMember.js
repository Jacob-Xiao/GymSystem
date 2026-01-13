import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { memberAPI } from '../../services/api';

const SearchMember = () => {
  const [account, setAccount] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setMembers([]);

    if (!account) {
      setError('请输入会员卡号');
      return;
    }

    try {
      const response = await memberAPI.getByAccount(account);
      if (response.data.success) {
        if (response.data.data.length > 0) {
          setMembers(response.data.data);
        } else {
          setError(response.data.message || '会员卡号不存在！');
        }
      } else {
        setError(response.data.message || '查询失败');
      }
    } catch (error) {
      setError(error.response?.data?.message || '查询失败');
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">查询会员</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/members">会员管理</Link>
          </li>
          <li className="breadcrumb-item active">查询会员</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-search me-1"></i>
            根据会员卡号查询
          </div>
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">会员卡号</label>
                  <input
                    type="text"
                    className="form-control"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="请输入会员卡号"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                查询
              </button>
              <Link to="/admin/members" className="btn btn-secondary ms-2">
                返回
              </Link>
            </form>
            {error && (
              <div className="alert alert-warning mt-3" role="alert">
                {error}
              </div>
            )}
            {members.length > 0 && (
              <div className="table-responsive mt-4">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>会员账号</th>
                      <th>姓名</th>
                      <th>性别</th>
                      <th>年龄</th>
                      <th>身高(cm)</th>
                      <th>体重(kg)</th>
                      <th>电话</th>
                      <th>办卡时间</th>
                      <th>购买课时</th>
                      <th>剩余课时</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.member_account}>
                        <td>{member.member_account}</td>
                        <td>{member.member_name}</td>
                        <td>{member.member_gender}</td>
                        <td>{member.member_age}</td>
                        <td>{member.member_height}</td>
                        <td>{member.member_weight}</td>
                        <td>{member.member_phone}</td>
                        <td>{member.card_time}</td>
                        <td>{member.card_class}</td>
                        <td>{member.card_next_class}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SearchMember;
