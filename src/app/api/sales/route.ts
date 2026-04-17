import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface ProductRow {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  quantity: number;
  cost_price: number;
  selling_price: number;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const productId = searchParams.get('productId');
    const category = searchParams.get('category');

    let query = `
      SELECT s.*, p.name as product_name, p.sku as product_sku, p.category
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (startDate) { query += ' AND s.sale_date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND s.sale_date <= ?'; params.push(endDate + ' 23:59:59'); }
    if (productId) { query += ' AND s.product_id = ?'; params.push(productId); }
    if (category) { query += ' AND p.category = ?'; params.push(category); }

    query += ' ORDER BY s.sale_date DESC';

    const sales = db.prepare(query).all(...params);
    return NextResponse.json(sales);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { product_id, quantity, sale_price, sale_date, notes } = body;

    if (!product_id || !quantity || sale_price == null) {
      return NextResponse.json({ error: 'product_id, quantity, and sale_price are required' }, { status: 400 });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id) as ProductRow | undefined;
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.quantity < quantity) {
      return NextResponse.json({ error: `Insufficient stock. Available: ${product.quantity}` }, { status: 400 });
    }

    const profit = (sale_price - product.cost_price) * quantity;
    const finalDate = sale_date || new Date().toISOString();

    const recordSale = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO sales (product_id, quantity, sale_price, cost_price, profit, sale_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(product_id, quantity, sale_price, product.cost_price, profit, finalDate, notes || null);

      db.prepare('UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(quantity, product_id);

      return db.prepare(`
        SELECT s.*, p.name as product_name FROM sales s JOIN products p ON s.product_id = p.id WHERE s.id = ?
      `).get(result.lastInsertRowid);
    });

    const sale = recordSale();
    return NextResponse.json(sale, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
  }
}
