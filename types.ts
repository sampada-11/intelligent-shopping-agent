
export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  platform: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  link: string;
  description: string;
}

export interface SearchIntent {
  category: string;
  budgetRange: {
    min: number;
    max: number | null;
  };
  keyFeatures: string[];
  urgency: 'low' | 'medium' | 'high';
  userProfileMatch: string;
}

export interface SearchResult {
  summary: string;
  products: Product[];
  intent: SearchIntent;
  sources: { title: string; uri: string }[];
}

export interface UserPreferences {
  preferredPlatforms: string[];
  budgetSensitivity: 'low' | 'medium' | 'high';
  primaryCategories: string[];
}
