export interface Profile {
  id: string;
  name: string;
  email: string;
  mobile_number: string;
  college_name: string;
  branch: string;
  semester: string;
  id_card_url: string;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  buyer_id?: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  type: 'sale' | 'rent';
  price: number;
  rent_period: 'day' | 'week' | 'month' | null;
  status: 'available' | 'sold' | 'rented';
  created_at: string;
  // Joins details
  seller?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string;
  content: string;
  created_at: string;
  // Joins details
  sender?: Profile;
}

export interface Rating {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  product_rating: number; // 1-5
  attitude_rating: number; // 1-5
  behavior_rating: number; // 1-5
  comment: string;
  created_at: string;
}

// Transaction purchase details for user's dashboard view
export interface Transaction {
  id: string;
  buyer_id: string;
  product_id: string;
  type: 'sale' | 'rent';
  amount: number;
  created_at: string;
  product?: Product;
}
