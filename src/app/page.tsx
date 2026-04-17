'use client';

import { useEffect, useState } from 'react';
import { DashboardStats, Sale, Product } from '@/types';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 border-l-4 ${color}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-lg">Loading dashboard...</div>
    </div>
  );

  if (!stats) return <div className="text-red-500">Failed to load dashboard</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your reselling business at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={String(stats.total_products)} sub="active listings" color="border-blue-500" />
        <StatCard label="Inventory Value" value={fmt(stats.total_inventory_value)} sub="at cost price" color="border-purple-500" />
        <StatCard label="Total Revenue" value={fmt(stats.total_revenue)} sub="all time sales" color="border-green-500" />
        <StatCard label="Total Profit" value={fmt(stats.total_profit)} sub="net earnings" color={stats.total_profit >= 0 ? "border-emerald-500" : "border-red-500"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Sales</h2>
          {stats.recent_sales.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales recorded yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_sales.map((sale: Sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.product_name}</p>
                    <p className="text-xs text-gray-500">{fmtDate(sale.sale_date)} · Qty: {sale.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{fmt(sale.sale_price * sale.quantity)}</p>
                    <p className={`text-xs font-medium ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sale.profit >= 0 ? '+' : ''}{fmt(sale.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Low Stock Alerts
            {stats.low_stock.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{stats.low_stock.length}</span>
            )}
          </h2>
          {stats.low_stock.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">All products are well-stocked ✅</p>
          ) : (
            <div className="space-y-2">
              {stats.low_stock.map((p: Product) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sku}</p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${p.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.quantity === 0 ? 'Out of stock' : `${p.quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
