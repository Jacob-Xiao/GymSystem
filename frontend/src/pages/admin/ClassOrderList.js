import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { classAPI } from '../../services/api';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useI18n } from '../../i18n';

const ClassOrderList = () => {
  const { classId } = useParams();
  const ready = useAuthGuard('admin');
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await classAPI.getOrders(classId);
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (ready) fetchOrders();
  }, [ready, fetchOrders]);

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
        <h1 className="mt-4">{t('class.orders.title')}</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/admin/main">{t('common.home')}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/admin/classes">{t('class.list.title')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('class.orders.title')}</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-table me-1"></i>
            {t('class.orders.cardTitle')}
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>{t('class.field.orderId')}</th>
                    <th>{t('class.field.id')}</th>
                    <th>{t('class.field.name')}</th>
                    <th>{t('class.field.coach')}</th>
                    <th>{t('class.field.memberName')}</th>
                    <th>{t('class.field.memberAccount')}</th>
                    <th>{t('class.field.begin')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.class_order_id}>
                        <td>{order.class_order_id}</td>
                        <td>{order.class_id}</td>
                        <td>{order.class_name}</td>
                        <td>{order.coach}</td>
                        <td>{order.member_name}</td>
                        <td>{order.member_account}</td>
                        <td>{order.class_begin}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        {t('class.orders.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Link to="/admin/classes" className="btn btn-secondary">
                {t('common.back')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClassOrderList;
