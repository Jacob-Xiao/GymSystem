import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

const AdminMain = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    memberTotal: 0,
    employeeTotal: 0,
    humanTotal: 0,
    equipmentTotal: 0,
  });

  useEffect(() => {
    const adminAccount = sessionStorage.getItem('adminAccount');
    if (!adminAccount) {
      navigate('/admin/login');
      return;
    }

    const savedStats = sessionStorage.getItem('adminStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, [navigate]);

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">管理员主页</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item active">仪表盘</li>
        </ol>
        <div className="row">
          <div className="col-xl-3 col-md-6">
            <div className="card bg-primary text-white mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div>会员人数</div>
                    <div className="h2">{stats.memberTotal}</div>
                  </div>
                  <i className="bi bi-people fs-1"></i>
                </div>
              </div>
              <div className="card-footer d-flex align-items-center justify-content-between">
                <a className="small text-white stretched-link" href="/admin/members">
                  查看详情
                </a>
                <div className="small text-white">
                  <i className="bi bi-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-warning text-white mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div>员工人数</div>
                    <div className="h2">{stats.employeeTotal}</div>
                  </div>
                  <i className="bi bi-person-badge fs-1"></i>
                </div>
              </div>
              <div className="card-footer d-flex align-items-center justify-content-between">
                <a className="small text-white stretched-link" href="/admin/employees">
                  查看详情
                </a>
                <div className="small text-white">
                  <i className="bi bi-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-success text-white mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div>健身房总人数</div>
                    <div className="h2">{stats.humanTotal}</div>
                  </div>
                  <i className="bi bi-people-fill fs-1"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-danger text-white mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div>器材数</div>
                    <div className="h2">{stats.equipmentTotal}</div>
                  </div>
                  <i className="bi bi-gear fs-1"></i>
                </div>
              </div>
              <div className="card-footer d-flex align-items-center justify-content-between">
                <a className="small text-white stretched-link" href="/admin/equipment">
                  查看详情
                </a>
                <div className="small text-white">
                  <i className="bi bi-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMain;
