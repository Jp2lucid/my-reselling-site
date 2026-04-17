'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';

interface SaleFormProps {
  onSubmit: (data: { product_id: number; quantity: number; sale_price: number; sale_date: string; notes: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function SaleForm({ onSubmit, onCancel, loading }: SaleFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    product_id: '',
    quantity: '1',
    sale_price: '',
    sale_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'product_id') {
      const prod = products.find(p => p.id === Number(value)) || null;
      setSelected(prod);
      if (prod) setForm(prev => ({ ...prev, product_id: value, sale_price: String(prod.selling_price) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      product_id: Number(form.product_id),
      quantity: Number(form.quantity),
      sale_price: Number(form.sale_price),
      sale_date: form.sale_date,
      notes: form.notes,
    });
  };

  const qty = Number(form.quantity);
  const salePrice = Number(form.sale_price);
  const estimatedProfit = selected ? (salePrice - selected.cost_price) * qty : null;
  const overStock = selected && qty > selected.quantity;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
        <select name="product_id" value={form.product_id} onChange={handleChange} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Select product...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.quantity}</option>
          ))}
        </select>
        {selected && (
          <p className="mt-1 text-xs text-gray-500">
            Available: <span className={selected.quantity <= 5 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>{selected.quantity}</span> units
            &nbsp;| Cost: {fmt(selected.cost_price)}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
          <input name="quantity" type="number" min="1" max={selected?.quantity || undefined} value={form.quantity} onChange={handleChange} required
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${overStock ? 'border-red-400' : 'border-gray-300'}`} />
          {overStock && <p className="mt-1 text-xs text-red-600">Exceeds available stock!</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price *</label>
          <input name="sale_price" type="number" step="0.01" min="0" value={form.sale_price} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
          <input name="sale_date" type="date" value={form.sale_date} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {estimatedProfit !== null && (
          <div className="flex items-end">
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${estimatedProfit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              Est. Profit: {fmt(estimatedProfit)}
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Optional notes..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading || !!overStock}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
          {loading ? 'Recording...' : 'Record Sale'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
