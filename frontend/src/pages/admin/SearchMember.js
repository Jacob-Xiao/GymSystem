import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { memberAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const SearchMember = () => {
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const [account, setAccount] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setMembers([]);

    if (!account) {
      setError(t('member.search.placeholder'));
      return;
    }

    try {
      const response = await memberAPI.getByAccount(account);
      if (response.data.success) {
        if (response.data.data.length > 0) {
          setMembers(response.data.data);
        } else {
          setError(response.data.message || t('member.search.notFound'));
        }
      } else {
        setError(response.data.message || t('server.genericError'));
      }
    } catch (error) {
      setError(error.response?.data?.message || t('server.genericError'));
    }
  };

  if (!ready) {
    return <div className="text-center mt-5">{t('common.loading')}</div>;
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">{t('member.search.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/members">{t('admin.nav.members')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('member.search.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-search me-1"></i>
            {t('member.search.cardTitle')}
          </div>
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">{t('member.search.label')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder={t('member.search.placeholder')}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                {t('common.search')}
              </button>
              <Link to="/admin/members" className="btn btn-secondary ms-2">
                {t('common.back')}
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
