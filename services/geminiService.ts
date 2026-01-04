import { SearchResult, Product } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const shoppingAgentService = {
  async analyzeAndSearch(query: string): Promise<SearchResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: SearchResult = await response.json();
      return data;
    } catch (error: any) {
      console.error("Failed to search", error);
      throw new Error(error.message || "An unexpected error occurred while searching.");
    }
  },

  async predictPriceTrend(product: Product): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/price-trend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.trend || "Trend data currently unavailable.";
    } catch (error: any) {
      console.error("Failed to predict price trend", error);
      throw new Error(error.message || "An unexpected error occurred while predicting price trend.");
    }
  },

  async visualizeTryOn(base64Image: string, product: Product): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/try-on`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Image,
          product,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.analysis || "Could not generate preview.";
    } catch (error: any) {
      console.error("Failed to process try-on", error);
      throw new Error(error.message || "An unexpected error occurred while processing try-on.");
    }
  },
};
