import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { memberAPI } from '../../services/api';

const MemberList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminAccount = sessionStorage.getItem('adminAccount');
    if (!adminAccount) {
      navigate('/admin/login');
      return;
    }
    fetchMembers();
  }, [navigate]);

  const fetchMembers = async () => {
    try {
      const response = await memberAPI.getAll();
      if (response.data.success) {
        setMembers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (account) => {
    if (window.confirm('确定要删除该会员吗？')) {
      try {
        await memberAPI.delete(account);
        fetchMembers();
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
        <h1 className="mt-4">会员管理</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">主页</Link>
          </li>
          <li className="breadcrumb-item active">会员管理</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-table me-1"></i>
                会员列表
              </div>
              <div>
                <Link to="/admin/members/add" className="btn btn-primary btn-sm me-2">
                  添加会员
                </Link>
                <Link to="/admin/members/search" className="btn btn-secondary btn-sm">
                  查询会员
                </Link>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
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
                    <th>会籍剩余时长</th>
                    <th>操作</th>
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
                      <td>{
                        (() => {
                          if (!member.card_time || !member.membership_duration) {
                            return '未设置';
                          }
                          const cardDate = new Date(member.card_time);
                          const now = new Date();
                          const monthsDiff = (now.getFullYear() - cardDate.getFullYear()) * 12 + (now.getMonth() - cardDate.getMonth());
                          const remainingMonths = member.membership_duration - monthsDiff;
                          if (remainingMonths <= 0) {
                            return <span className="text-danger">已过期</span>;
                          } else if (remainingMonths < 1) {
                            const daysRemaining = Math.ceil((new Date(cardDate.getFullYear(), cardDate.getMonth() + member.membership_duration, cardDate.getDate()) - now) / (1000 * 60 * 60 * 24));
                            return `${daysRemaining}天`;
                          } else {
                            return `${remainingMonths}个月`;
                          }
                        })()
                      }</td>
                      <td>
                        <Link
                          to={`/admin/members/update/${member.member_account}`}
                          className="btn btn-sm btn-warning me-1"
                        >
                          修改
                        </Link>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(member.member_account)}
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

export default MemberList;
