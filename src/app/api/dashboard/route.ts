import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface CountRow { count: number }
interface TotalRow { total: number }
interface RevenueRow { revenue: number; profit: number }

export async function GET() {
  try {
    const db = getDb();

    const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as CountRow).count;
    const inventoryValue = (db.prepare('SELECT COALESCE(SUM(cost_price * quantity), 0) as total FROM products').get() as TotalRow).total;
    const revenueData = db.prepare('SELECT COALESCE(SUM(sale_price * quantity), 0) as revenue, COALESCE(SUM(profit), 0) as profit FROM sales').get() as RevenueRow;

    const recentSales = db.prepare(`
      SELECT s.*, p.name as product_name FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.sale_date DESC LIMIT 5
    `).all();

    const lowStock = db.prepare('SELECT * FROM products WHERE quantity <= 5 ORDER BY quantity ASC').all();

    return NextResponse.json({
      total_products: totalProducts,
      total_inventory_value: inventoryValue,
      total_revenue: revenueData.revenue,
      total_profit: revenueData.profit,
      recent_sales: recentSales,
      low_stock: lowStock,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
