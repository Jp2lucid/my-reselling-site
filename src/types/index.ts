export interface Product {
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

export interface Sale {
  id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  category?: string;
  quantity: number;
  sale_price: number;
  cost_price: number;
  profit: number;
  sale_date: string;
  notes: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_products: number;
  total_inventory_value: number;
  total_revenue: number;
  total_profit: number;
  recent_sales: Sale[];
  low_stock: Product[];
}
