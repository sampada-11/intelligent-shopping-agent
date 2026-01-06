# SmartShop AI Agent

An intelligent shopping assistant application that helps users find products, compare prices, and get personalized shopping recommendations using AI-powered search and analysis.

## Features

- AI-powered product search and recommendations
- Price trend predictions
- Virtual try-on visualization
- Product comparison and analysis
- Budget-aware suggestions

## Prerequisites

- Node.js (for frontend)
- Python 3.x (for backend)
- Gemini API key

## Local Development

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at **http://localhost:3000**

### Backend Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set the `GEMINI_API_KEY` environment variable:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

3. Run the FastAPI server:
   ```bash
   python main.py
   ```

The backend API will be available at **http://localhost:8000**

## Localhost URLs

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Backend API Docs**: http://localhost:8000/docs (FastAPI automatic documentation)

## Deployment

The application can be deployed using Render. See `render.yaml` for deployment configuration.

## API Endpoints

- `POST /api/search` - Search for products based on a query
- `POST /api/price-trend` - Predict price trends for a product
- `POST /api/try-on` - Analyze virtual try-on with image

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: FastAPI, Python
- **AI**: Google Gemini API