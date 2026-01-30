import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('adminAccount');
    sessionStorage.removeItem('adminStats');
    navigate('/admin/login');
  };

  return (
    <div className="sb-nav-fixed">
      <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
        <Link className="navbar-brand ps-3" to="/admin/main">
          健身房管理系统
        </Link>
        <button
          className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0"
          id="sidebarToggle"
          href="#!"
          onClick={(e) => {
            e.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
          }}
        >
          <i className="bi bi-list"></i>
        </button>
        <ul className="navbar-nav ms-auto me-3 me-lg-4">
          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              id="navbarDropdown"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-person-fill"></i>
            </a>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
              <li>
                <a className="dropdown-item" href="#!" onClick={handleLogout}>
                  退出登录
                </a>
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
                  主页
                </Link>
                <Link className="nav-link" to="/admin/members">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-people"></i>
                  </div>
                  会员管理
                </Link>
                <Link className="nav-link" to="/admin/employees">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-person-badge"></i>
                  </div>
                  员工管理
                </Link>
                <Link className="nav-link" to="/admin/equipment">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-gear"></i>
                  </div>
                  器材管理
                </Link>
                <Link className="nav-link" to="/admin/classes">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-calendar-event"></i>
                  </div>
                  课程管理
                </Link>
                <Link className="nav-link" to="/admin/notifications">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-bell"></i>
                  </div>
                  通知管理
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
