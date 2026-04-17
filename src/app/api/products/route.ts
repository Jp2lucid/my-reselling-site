import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'ASC' : 'DESC';

    const allowedSortCols = ['name', 'sku', 'category', 'quantity', 'cost_price', 'selling_price', 'created_at'];
    const safeSort = allowedSortCols.includes(sortBy) ? sortBy : 'created_at';

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: string[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    query += ` ORDER BY ${safeSort} ${sortDir}`;

    const products = db.prepare(query).all(...params);
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, sku, category, quantity, cost_price, selling_price, image_url, notes } = body;

    if (!name || cost_price == null || selling_price == null) {
      return NextResponse.json({ error: 'name, cost_price, and selling_price are required' }, { status: 400 });
    }

    const finalSku = sku || `SKU-${Date.now()}`;

    const result = db.prepare(`
      INSERT INTO products (name, sku, category, quantity, cost_price, selling_price, image_url, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, finalSku, category || null, quantity || 0, cost_price, selling_price, image_url || null, notes || null);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
