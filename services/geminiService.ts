
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, SearchIntent, Product } from "../types";

const API_KEY = process.env.API_KEY || "";

export const shoppingAgentService = {
  async analyzeAndSearch(query: string): Promise<SearchResult> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const searchResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional shopping agent. Search for products matching this request: "${query}". 
      Focus on current prices, availability, and specific models.
      Provide a comparative summary of the best options found.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = searchResponse.text || "No summary available.";
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || "#"
      }));

    const parseResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the search results for "${query}" and the following context: "${summary}", 
      extract a list of 4-6 specific products with their details and parse the user's intent.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                budgetRange: {
                  type: Type.OBJECT,
                  properties: {
                    min: { type: Type.NUMBER },
                    max: { type: Type.NUMBER, nullable: true },
                  },
                  required: ["min"]
                },
                keyFeatures: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                urgency: { type: Type.STRING, enum: ["low", "medium", "high"] },
                userProfileMatch: { type: Type.STRING },
              },
              required: ["category", "budgetRange", "keyFeatures", "urgency", "userProfileMatch"]
            },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  reviewsCount: { type: Type.NUMBER },
                  imageUrl: { type: Type.STRING },
                  link: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["id", "name", "price", "platform", "link"]
              }
            }
          },
          required: ["intent", "products"]
        }
      }
    });

    try {
      const parsedData = JSON.parse(parseResponse.text);
      return {
        summary,
        intent: parsedData.intent,
        products: parsedData.products,
        sources
      };
    } catch (error) {
      console.error("Failed to parse AI response", error);
      throw new Error("The AI failed to format the results correctly.");
    }
  },

  async predictPriceTrend(product: Product): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an AI market analyst, predict the price trend for this product: "${product.name}" currently priced at ${product.price} on ${product.platform}. 
      Consider seasonal trends, typical tech cycles, and competitor pricing. 
      Output a short, reassuring forecast like "Steady - unlikely to drop soon" or "Wait - price likely to drop by 10% next month".`,
    });
    return response.text?.trim() || "Trend data currently unavailable.";
  },

  async visualizeTryOn(base64Image: string, product: Product): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    };
    const textPart = {
      text: `You are an AR Stylist. Look at this user and the product: "${product.name}". 
      Explain how this item would look on them or fit into their environment shown in the photo. 
      Be descriptive, helpful, and highlight style compatibility. Max 3 sentences.`
    };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
    });
    return response.text || "Could not generate preview.";
  }
};
