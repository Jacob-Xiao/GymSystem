import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { equipmentBookingAPI } from '../services/api';

const UserLayout = ({ children }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    sessionStorage.removeItem('member');
    navigate('/user/login');
  };

  // 从sessionStorage获取会员信息
  const getMemberAccount = () => {
    const memberData = sessionStorage.getItem('member');
    if (memberData) {
      const member = JSON.parse(memberData);
      return member.memberAccount;
    }
    return null;
  };

  const memberAccount = getMemberAccount();

  const fetchUnreadCount = async () => {
    if (!memberAccount) return;
    try {
      const response = await equipmentBookingAPI.getReceivedShareRequests(memberAccount);
      if (response.data.success) {
        // 只计算pending状态的请求
        const pendingCount = response.data.data.filter(req => req.status === 'pending').length;
        setUnreadCount(pendingCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // 获取未读分享请求数量
  useEffect(() => {
    if (memberAccount) {
      fetchUnreadCount();
      // 每30秒刷新一次未读数量
      const interval = setInterval(fetchUnreadCount, 30000);
      
      // 监听分享请求更新事件
      const handleUpdate = () => {
        fetchUnreadCount();
      };
      window.addEventListener('shareRequestUpdated', handleUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('shareRequestUpdated', handleUpdate);
      };
    }
  }, [memberAccount]);

  return (
    <div className="sb-nav-fixed">
      <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
        <Link className="navbar-brand ps-3" to="/user/main">
          健身房管理系统
        </Link>
        <ul className="navbar-nav ms-auto me-3 me-lg-4">
          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle position-relative"
              id="navbarDropdown"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
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
            </a>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
              {memberAccount && (
                <li>
                  <Link 
                    className="dropdown-item" 
                    to={`/user/share-requests/${memberAccount}`}
                    onClick={fetchUnreadCount}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    消息
                    {unreadCount > 0 && (
                      <span className="badge bg-danger ms-2">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </Link>
                </li>
              )}
              <li><hr className="dropdown-divider" /></li>
              <li>
                <a className="dropdown-item" href="#!" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
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
                <Link className="nav-link" to="/user/main">
                  <div className="sb-nav-link-icon">
                    <i className="bi bi-house"></i>
                  </div>
                  主页
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
                      报名选课
                    </Link>
                    <Link 
                      className="nav-link" 
                      to={`/user/equipment-booking/${memberAccount}`}
                    >
                      <div className="sb-nav-link-icon">
                        <i className="bi bi-gear"></i>
                      </div>
                      器材预约
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
