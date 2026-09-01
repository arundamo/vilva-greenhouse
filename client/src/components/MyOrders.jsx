import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { formatCAD } from '../utils/currency';

const statusLabel = (status) => {
  if (status === 'unconfirmed') return 'Unconfirmed';
  if (status === 'pending') return 'Pending';
  if (status === 'packed') return 'Packed';
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  return status || 'Unknown';
};

const statusClass = (status) => {
  if (status === 'unconfirmed') return 'bg-amber-100 text-amber-800';
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'packed') return 'bg-blue-100 text-blue-800';
  if (status === 'delivered') return 'bg-green-100 text-green-800';
  if (status === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = () => {
    setLoading(true);
    setError('');

    axios.get('/api/orders/my')
      .then((res) => {
        setOrders(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load your orders.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.delivery_status === statusFilter);
  }, [orders, statusFilter]);

  if (loading) {
    return <div className="text-center py-10">Loading your orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">My Orders</h2>
          <p className="text-sm text-gray-600 mt-1">Track your submitted orders and delivery status.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="unconfirmed">Unconfirmed</option>
            <option value="pending">Pending</option>
            <option value="packed">Packed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          No orders found for this account.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <article key={order.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ordered: {order.order_date || '-'}
                    {order.delivery_date ? ` • Delivery: ${order.delivery_date}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(order.delivery_status)}`}>
                    {statusLabel(order.delivery_status)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {formatCAD(order.total_amount || 0)}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {(order.items || []).map((item) => (
                    <li key={item.id}>
                      • {item.variety_name} - {item.quantity} {item.unit}
                    </li>
                  ))}
                </ul>
              </div>

              {order.delivery_address && (
                <p className="mt-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Delivery Address:</span> {order.delivery_address}
                </p>
              )}

              {order.notes && (
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Notes:</span> {order.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
