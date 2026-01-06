import { SearchResult, Product } from "../types";

const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:8000";
  // If URL doesn't start with http:// or https://, prepend https://
  let finalUrl: string;
  if (!url.startsWith("http")) {
    finalUrl = `https://${url}`;
  } else {
    finalUrl = url;
  }
  console.log("API Base URL configured:", finalUrl);
  return finalUrl;
};

const API_BASE_URL = getApiBaseUrl();

export const shoppingAgentService = {
  async analyzeAndSearch(query: string): Promise<SearchResult> {
    try {
      console.log("Making search request to:", `${API_BASE_URL}/api/search`);
      console.log("Query:", query);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error("Search failed with status:", response.status, errorMessage);
        throw new Error(errorMessage);
      }

      const data: SearchResult = await response.json();
      console.log("Search successful, received data:", data);
      return data;
    } catch (error: any) {
      console.error("Failed to search", error);
      
      if (error.name === 'AbortError') {
        throw new Error("Request timed out. The search is taking too long. Please try again.");
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please check if the backend is running and the URL is correct.`);
      }
      
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
