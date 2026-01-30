import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAPI } from '../services/api';
import './Login.css';

const AdminLogin = () => {
  const [adminAccount, setAdminAccount] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!adminAccount || !adminPassword) {
      setError('请输入账号和密码');
      return;
    }

    try {
      const response = await loginAPI.adminLogin(parseInt(adminAccount), adminPassword);
      
      if (response.data.success) {
        // Store admin info and stats in sessionStorage
        sessionStorage.setItem('adminAccount', response.data.admin.adminAccount);
        sessionStorage.setItem('adminStats', JSON.stringify(response.data.stats));
        navigate('/admin/main');
      } else {
        setError(response.data.message || '登录失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录失败，请检查网络连接');
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: 'url(/img/background.jpeg)', backgroundSize: 'cover' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg mt-5">
              <div className="card-header">
                <h3 className="text-center font-weight-light my-4">管理员登录</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      className="form-control"
                      id="inputAccount"
                      type="text"
                      placeholder="账号"
                      value={adminAccount}
                      onChange={(e) => setAdminAccount(e.target.value)}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                          e.preventDefault();
                        }
                      }}
                    />
                    <label htmlFor="inputAccount">账号</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input
                      className="form-control"
                      id="inputPassword"
                      type="password"
                      placeholder="密码"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <label htmlFor="inputPassword">密码</label>
                  </div>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="d-flex align-items-center justify-content-between mt-4 mb-0">
                    <a className="small" href="/user/login">
                      会员登录
                    </a>
                    <button className="btn btn-primary" type="submit">
                      登录
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
