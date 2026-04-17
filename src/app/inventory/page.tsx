'use client';

import { useEffect, useState, useCallback } from 'react';
import { Product } from '@/types';
import Modal from '@/components/Modal';
import ProductForm from '@/components/ProductForm';
import Toast from '@/components/Toast';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Toys', 'Home & Garden', 'Sports', 'Beauty', 'Automotive', 'Other'];

type SortKey = 'name' | 'sku' | 'category' | 'quantity' | 'cost_price' | 'selling_price';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sortBy, sortDir });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, category, sortBy, sortDir]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  const handleAdd = async (data: Partial<Product>) => {
    setFormLoading(true);
    try {
      const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (res.ok) {
        setShowModal(false);
        setToast({ message: 'Product added successfully!', type: 'success' });
        fetchProducts();
      } else {
        setToast({ message: json.error || 'Failed to add product', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error — could not add product', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (data: Partial<Product>) => {
    if (!editProduct) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/products/${editProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (res.ok) {
        setEditProduct(null);
        setToast({ message: 'Product updated!', type: 'success' });
        fetchProducts();
      } else {
        setToast({ message: json.error || 'Failed to update', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error — could not update product', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This will also delete all related sales.`)) return;
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    if (res.ok) {
      setToast({ message: 'Product deleted', type: 'success' });
      fetchProducts();
    } else {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-gray-400">
      {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const margin = (p: Product) => p.selling_price > 0
    ? (((p.selling_price - p.cost_price) / p.selling_price) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name or SKU..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No products found</p>
            <p className="text-gray-300 text-sm mt-1">Try adjusting your search or add a new product</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {(['name', 'sku', 'category', 'quantity', 'cost_price', 'selling_price'] as SortKey[]).map(col => (
                    <th key={col} onClick={() => handleSort(col)}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none">
                      {col.replace('_', ' ')} <SortIcon col={col} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Margin</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3">
                      {p.category && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{p.category}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.quantity === 0 ? 'text-red-600' : p.quantity <= 5 ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmt(p.cost_price)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(p.selling_price)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${Number(margin(p)) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {margin(p)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setEditProduct(p)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(p)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Add Product" onClose={() => setShowModal(false)}>
          <ProductForm onSubmit={handleAdd} onCancel={() => setShowModal(false)} loading={formLoading} />
        </Modal>
      )}

      {editProduct && (
        <Modal title="Edit Product" onClose={() => setEditProduct(null)}>
          <ProductForm initial={editProduct} onSubmit={handleEdit} onCancel={() => setEditProduct(null)} loading={formLoading} />
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
