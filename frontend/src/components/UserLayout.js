import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { equipmentBookingAPI } from '../services/api';
import { clearMemberSession, getMemberAccount } from '../utils/session';
import { useI18n } from '../i18n';
import LanguageSwitch from './LanguageSwitch';

const UserLayout = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    clearMemberSession();
    navigate('/user/login');
  };

  const memberAccount = getMemberAccount();

  const fetchUnreadCount = useCallback(async () => {
    if (!memberAccount) return;
    try {
      const response = await equipmentBookingAPI.getReceivedShareRequests(memberAccount);
      if (response.data.success) {
        // Only pending requests count as unread.
        const pendingCount = response.data.data.filter(req => req.status === 'pending').length;
        setUnreadCount(pendingCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [memberAccount]);

  // Refresh the unread badge on mount, every 30s, and when a page reports a change.
  useEffect(() => {
    if (!memberAccount) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    window.addEventListener('shareRequestUpdated', fetchUnreadCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('shareRequestUpdated', fetchUnreadCount);
    };
  }, [memberAccount, fetchUnreadCount]);

  return (
    <div className="sb-nav-fixed">
      <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
        <Link className="navbar-brand ps-3" to="/user/main">
          {t('app.name')}
        </Link>
        <ul className="navbar-nav ms-auto me-3 me-lg-4 flex-row align-items-center">
          <li className="nav-item">
            <LanguageSwitch />
          </li>
          <li className="nav-item dropdown">
            <button
              type="button"
              className="nav-link dropdown-toggle position-relative btn btn-link"
              id="navbarDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label={t('app.accountMenu')}
            >
              <i className="bi bi-person-fill"></i>
              {unreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: '0.6rem', padding: '0.2em 0.4em' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
              {memberAccount && (
                <li>
                  <Link
                    className="dropdown-item"
                    to={`/user/share-requests/${memberAccount}`}
                    onClick={fetchUnreadCount}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    {t('user.shareRequests')}
                    {unreadCount > 0 && (
                      <span className="badge bg-danger ms-2">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </Link>
                </li>
              )}
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button type="button" className="dropdown-item" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
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
                <Link className="nav-link" to="/user/main">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-house"></i>
                  </div>
                  {t('common.home')}
                </Link>
                {memberAccount && (
                  <>
                    <Link
                      className="nav-link"
                      to={`/user/classes/apply/${memberAccount}`}
                    >
                      <div className="sb-nav-link-icon">
                        <i className="bi bi-calendar-plus"></i>
                      </div>
                      {t('user.class.apply')}
                    </Link>
                    <Link
                      className="nav-link"
                      to={`/user/equipment-booking/${memberAccount}`}
                    >
                      <div className="sb-nav-link-icon">
                        <i className="bi bi-gear"></i>
                      </div>
                      {t('user.booking.title')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
        <div id="layoutSidenav_content">
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
