'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sale } from '@/types';
import Modal from '@/components/Modal';
import SaleForm from '@/components/SaleForm';
import Toast from '@/components/Toast';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`/api/sales?${params}`);
    const data = await res.json();
    setSales(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleRecordSale = async (data: { product_id: number; quantity: number; sale_price: number; sale_date: string; notes: string }) => {
    setFormLoading(true);
    try {
      const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (res.ok) {
        setShowModal(false);
        setToast({ message: 'Sale recorded successfully!', type: 'success' });
        fetchSales();
      } else {
        setToast({ message: json.error || 'Failed to record sale', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error — could not record sale', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const totalRevenue = sales.reduce((s, x) => s + x.sale_price * x.quantity, 0);
  const totalProfit = sales.reduce((s, x) => s + x.profit, 0);
  const totalItems = sales.reduce((s, x) => s + x.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500 text-sm mt-1">{sales.length} transactions</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          + Record Sale
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Profit</p>
          <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(totalProfit)}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Items Sold</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Clear</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading sales...</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No sales found</p>
            <p className="text-gray-300 text-sm mt-1">Record your first sale to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Sale Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Profit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(s.sale_date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.product_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.product_sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.quantity}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(s.sale_price)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(s.cost_price)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${s.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {s.profit >= 0 ? '+' : ''}{fmt(s.profit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{s.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Record Sale" onClose={() => setShowModal(false)}>
          <SaleForm onSubmit={handleRecordSale} onCancel={() => setShowModal(false)} loading={formLoading} />
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
