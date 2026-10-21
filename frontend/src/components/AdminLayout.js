import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAdminSession } from '../utils/session';
import { useI18n } from '../i18n';
import LanguageSwitch from './LanguageSwitch';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login');
  };

  return (
    <div className="sb-nav-fixed">
      <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
        <Link className="navbar-brand ps-3" to="/admin/main">
          {t('app.name')}
        </Link>
        <button
          type="button"
          className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0"
          id="sidebarToggle"
          aria-label={t('app.toggleSidebar')}
          onClick={() => document.body.classList.toggle('sb-sidenav-toggled')}
        >
          <i className="bi bi-list"></i>
        </button>
        <ul className="navbar-nav ms-auto me-3 me-lg-4 flex-row align-items-center">
          <li className="nav-item">
            <LanguageSwitch />
          </li>
          <li className="nav-item dropdown">
            <button
              type="button"
              className="nav-link dropdown-toggle btn btn-link"
              id="navbarDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label={t('app.accountMenu')}
            >
              <i className="bi bi-person-fill"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
              <li>
                <button type="button" className="dropdown-item" onClick={handleLogout}>
                  {t('app.logout')}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <div id="layoutSidenav">
        <div id="layoutSidenav_nav">
          <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
            <div className="sb-sidenav-menu">
              <div className="nav">
                <Link className="nav-link" to="/admin/main">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-house"></i>
                  </div>
                  {t('admin.nav.dashboard')}
                </Link>
                <Link className="nav-link" to="/admin/members">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-people"></i>
                  </div>
                  {t('admin.nav.members')}
                </Link>
                <Link className="nav-link" to="/admin/employees">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-person-badge"></i>
                  </div>
                  {t('admin.nav.employees')}
                </Link>
                <Link className="nav-link" to="/admin/equipment">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-gear"></i>
                  </div>
                  {t('admin.nav.equipment')}
                </Link>
                <Link className="nav-link" to="/admin/classes">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-calendar-event"></i>
                  </div>
                  {t('admin.nav.classes')}
                </Link>
                <Link className="nav-link" to="/admin/notifications">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-bell"></i>
                  </div>
                  {t('admin.nav.notifications')}
                </Link>
              </div>
            </div>
          </nav>
        </div>
        <div id="layoutSidenav_content">
          <main>{children}</main>
        </div>
      </div>
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
        crossOrigin="anonymous"
      ></script>
    </div>
  );
};

export default AdminLayout;
