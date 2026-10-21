import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAPI } from '../services/api';
import './Login.css';
import { useI18n } from '../i18n';

const AdminLogin = () => {
  const [adminAccount, setAdminAccount] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!adminAccount || !adminPassword) {
      setError(t('login.required'));
      return;
    }

    try {
      const response = await loginAPI.adminLogin(parseInt(adminAccount), adminPassword);
      
      if (response.data.success) {
        // Store the signed token alongside the account: the API client attaches it to
        // every subsequent request and the guards treat its presence as the session.
        sessionStorage.setItem('authToken', response.data.token);
        sessionStorage.setItem('adminAccount', response.data.admin.adminAccount);
        sessionStorage.setItem('adminStats', JSON.stringify(response.data.stats));
        navigate('/admin/main');
      } else {
        setError(response.data.message || t('login.failed'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('login.networkError'));
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: 'url(/img/background.jpeg)', backgroundSize: 'cover' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg mt-5">
              <div className="card-header">
                <h3 className="text-center font-weight-light my-4">{t('login.admin.title')}</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      className="form-control"
                      id="inputAccount"
                      type="text"
                      placeholder={t('login.account')}
                      value={adminAccount}
                      onChange={(e) => setAdminAccount(e.target.value)}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                          e.preventDefault();
                        }
                      }}
                    />
                    <label htmlFor="inputAccount">{t('login.account')}</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input
                      className="form-control"
                      id="inputPassword"
                      type="password"
                      placeholder={t('login.password')}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <label htmlFor="inputPassword">{t('login.password')}</label>
                  </div>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="d-flex align-items-center justify-content-between mt-4 mb-0">
                    <a className="small" href="/user/login">
                      {t('login.toMember')}
                    </a>
                    <button className="btn btn-primary" type="submit">
                      {t('login.submit')}
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
