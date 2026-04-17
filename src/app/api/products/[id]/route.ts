import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, sku, category, quantity, cost_price, selling_price, image_url, notes } = body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    db.prepare(`
      UPDATE products SET name=?, sku=?, category=?, quantity=?, cost_price=?, selling_price=?, image_url=?, notes=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, sku, category || null, quantity, cost_price, selling_price, image_url || null, notes || null, params.id);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    return NextResponse.json(product);
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    db.prepare('DELETE FROM sales WHERE product_id = ?').run(params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
