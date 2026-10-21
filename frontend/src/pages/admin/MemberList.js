import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { memberAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';
import { formatDate, membershipRemaining } from '../../utils/date';

const MemberList = () => {
  const ready = useAuthGuard('admin');
  const { t, language } = useI18n();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  // Copy passed to the formatter so the helper itself stays language-agnostic.
  const remainingLabels = {
    notSet: t('common.notSet'),
    expired: t('common.expired'),
    days: (count) => t('common.daysLeft', { count }),
    months: (count) => t('common.monthsLeft', { count })
  };
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready) fetchMembers();
  }, [ready]);

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
    if (window.confirm(t('member.delete.confirm'))) {
      try {
        await memberAPI.delete(account);
        fetchMembers();
      } catch (error) {
        alert(t('member.delete.failed') + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-fluid px-4">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('member.list.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('member.list.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-table me-1"></i>
                {t('member.list.cardTitle')}
              </div>
              <div>
                <Link to="/admin/members/add" className="btn btn-primary btn-sm me-2">
                  {t('member.action.add')}
                </Link>
                <Link to="/admin/members/search" className="btn btn-secondary btn-sm">
                  {t('member.action.search')}
                </Link>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>{t('member.field.account')}</th>
                    <th>{t('member.field.name')}</th>
                    <th>{t('member.field.gender')}</th>
                    <th>{t('member.field.age')}</th>
                    <th>{t('member.field.height')}</th>
                    <th>{t('member.field.weight')}</th>
                    <th>{t('member.field.phone')}</th>
                    <th>{t('member.field.cardTime')}</th>
                    <th>{t('member.field.cardClass')}</th>
                    <th>{t('member.field.cardNextClass')}</th>
                    <th>{t('member.field.remaining')}</th>
                    <th>{t('common.actions')}</th>
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
                      <td>{formatDate(member.card_time, locale)}</td>
                      <td>{member.card_class}</td>
                      <td>{member.card_next_class}</td>
                      <td>
                        {(() => {
                          const remaining = membershipRemaining(
                            member.card_time,
                            member.membership_duration,
                            remainingLabels
                          );
                          return remaining.expired ? (
                            <span className="text-danger">{remaining.text}</span>
                          ) : (
                            remaining.text
                          );
                        })()}
                      </td>
                      <td>
                        <Link
                          to={`/admin/members/update/${member.member_account}`}
                          className="btn btn-sm btn-warning me-1"
                        >
                          {t('common.edit')}
                        </Link>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(member.member_account)}
                        >
                          {t('common.delete')}
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
