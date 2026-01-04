from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import base64
import google.generativeai as genai

# Initialize FastAPI app
app = FastAPI(title="SmartShop AI Agent API")

# CORS Configuration - Allow requests from all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API key from environment variable
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY") or ""

if not API_KEY:
    print("Warning: GEMINI_API_KEY not set in environment variables")
else:
    # Configure Gemini API
    genai.configure(api_key=API_KEY)

# Pydantic models matching TypeScript types
class BudgetRange(BaseModel):
    min: float
    max: Optional[float] = None

class SearchIntent(BaseModel):
    category: str
    budgetRange: BudgetRange
    keyFeatures: List[str]
    urgency: str  # 'low' | 'medium' | 'high'
    userProfileMatch: str

class Product(BaseModel):
    id: str
    name: str
    price: float
    currency: str
    platform: str
    rating: float
    reviewsCount: int
    imageUrl: str
    link: str
    description: str

class Source(BaseModel):
    title: str
    uri: str

class SearchResult(BaseModel):
    summary: str
    products: List[Product]
    intent: SearchIntent
    sources: List[Source]

class SearchQuery(BaseModel):
    query: str

class PriceTrendRequest(BaseModel):
    product: Product

class TryOnRequest(BaseModel):
    base64Image: str
    product: Product

# API Endpoints

@app.get("/")
async def root():
    return {"message": "SmartShop AI Agent API is running"}

@app.post("/api/search", response_model=SearchResult)
async def analyze_and_search(request: SearchQuery):
    """Analyze search query and return product results"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        
        # First call: Search with Google Search tool
        search_prompt = f'You are a professional shopping agent. Search for products matching this request: "{request.query}". Focus on current prices, availability, and specific models. Provide a comparative summary of the best options found.'
        
        search_response = model.generate_content(
            search_prompt,
            tools=[{"google_search": {}}]
        )
        
        summary = search_response.text or "No summary available."
        
        # Extract sources from grounding metadata
        sources = []
        if hasattr(search_response, 'candidates') and search_response.candidates:
            candidate = search_response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                if hasattr(candidate.grounding_metadata, 'grounding_chunks'):
                    grounding_chunks = candidate.grounding_metadata.grounding_chunks or []
                    for chunk in grounding_chunks:
                        if hasattr(chunk, 'web') and chunk.web:
                            sources.append({
                                "title": getattr(chunk.web, 'title', 'Source') or "Source",
                                "uri": getattr(chunk.web, 'uri', '#') or "#"
                            })
        
        # Second call: Parse response into structured JSON
        parse_prompt = f'''Based on the search results for "{request.query}" and the following context: "{summary}", 
extract a list of 4-6 specific products with their details and parse the user's intent.

Return a JSON object with this structure:
{{
  "intent": {{
    "category": "string",
    "budgetRange": {{"min": number, "max": number or null}},
    "keyFeatures": ["string"],
    "urgency": "low" | "medium" | "high",
    "userProfileMatch": "string"
  }},
  "products": [
    {{
      "id": "string",
      "name": "string",
      "price": number,
      "currency": "string",
      "platform": "string",
      "rating": number,
      "reviewsCount": number,
      "imageUrl": "string",
      "link": "string",
      "description": "string"
    }}
  ]
}}'''
        
        parse_model = genai.GenerativeModel(
            "gemini-2.0-flash-exp",
            generation_config={"response_mime_type": "application/json"}
        )
        parse_response = parse_model.generate_content(parse_prompt)
        
        # Parse JSON response
        parsed_data = json.loads(parse_response.text)
        
        return SearchResult(
            summary=summary,
            intent=SearchIntent(**parsed_data["intent"]),
            products=[Product(**p) for p in parsed_data["products"]],
            sources=[Source(**s) for s in sources] if sources else []
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing search: {str(e)}")

@app.post("/api/price-trend")
async def predict_price_trend(request: PriceTrendRequest):
    """Predict price trend for a product"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        
        prompt = f'''As an AI market analyst, predict the price trend for this product: "{request.product.name}" currently priced at {request.product.price} on {request.product.platform}. 
Consider seasonal trends, typical tech cycles, and competitor pricing. 
Output a short, reassuring forecast like "Steady - unlikely to drop soon" or "Wait - price likely to drop by 10% next month".'''
        
        response = model.generate_content(prompt)
        
        return {"trend": response.text.strip() if response.text else "Trend data currently unavailable."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting price trend: {str(e)}")

@app.post("/api/try-on")
async def visualize_try_on(request: TryOnRequest):
    """Analyze virtual try-on with image"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        
        # Decode base64 image
        image_data = base64.b64decode(request.base64Image)
        
        # Prepare image part using PIL
        from PIL import Image
        import io
        
        image = Image.open(io.BytesIO(image_data))
        
        prompt = f'''You are an AR Stylist. Look at this user and the product: "{request.product.name}". 
Explain how this item would look on them or fit into their environment shown in the photo. 
Be descriptive, helpful, and highlight style compatibility. Max 3 sentences.'''
        
        response = model.generate_content([image, prompt])
        
        return {"analysis": response.text or "Could not generate preview."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing try-on: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Server runs on port 8000 by default
    uvicorn.run(app, host="0.0.0.0", port=8000)