
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { shoppingAgentService } from '../services/geminiService';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface ComparisonOverlayProps {
  selectedProducts: Product[];
  onClose: () => void;
}

const ComparisonOverlay: React.FC<ComparisonOverlayProps> = ({ selectedProducts, onClose }) => {
  const [forecasts, setForecasts] = useState<Record<string, string>>({});
  const [loadingForecasts, setLoadingForecasts] = useState(false);

  // Generate mock historical data for each product
  const historicalData = useMemo(() => {
    return selectedProducts.reduce((acc, p) => {
      const base = p.price;
      acc[p.id] = Array.from({ length: 7 }, (_, i) => ({
        day: i,
        price: base + (Math.random() * base * 0.1) - (base * 0.05)
      }));
      return acc;
    }, {} as Record<string, { day: number, price: number }[]>);
  }, [selectedProducts]);

  useEffect(() => {
    const fetchForecasts = async () => {
      setLoadingForecasts(true);
      const newForecasts: Record<string, string> = {};
      await Promise.all(selectedProducts.map(async (p) => {
        try {
          const trend = await shoppingAgentService.predictPriceTrend(p);
          newForecasts[p.id] = trend;
        } catch (e) {
          newForecasts[p.id] = "No data";
        }
      }));
      setForecasts(newForecasts);
      setLoadingForecasts(false);
    };

    if (selectedProducts.length > 0) {
      fetchForecasts();
    }
  }, [selectedProducts]);

  if (selectedProducts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Compare Products</h2>
            <p className="text-sm text-gray-500">Side-by-side feature breakdown</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="overflow-x-auto p-6">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th scope="col" className="w-48 text-left py-4 px-4 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">Features</th>
                {selectedProducts.map(p => (
                  <th scope="col" key={p.id} className="py-4 px-4 border-b border-gray-100 text-left align-top min-w-[200px]">
                    <div className="flex flex-col gap-3">
                      <img src={p.imageUrl || `https://picsum.photos/seed/${p.id}/150/100`} alt="" className="w-full aspect-video object-cover rounded-xl border border-gray-100 shadow-sm" />
                      <div className="text-sm font-bold text-gray-900 line-clamp-2 h-10 leading-tight">{p.name}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className="py-6 px-4 font-semibold text-gray-700 text-sm bg-gray-50/50 text-left">Price</th>
                {selectedProducts.map(p => (
                  <td key={p.id} className="py-6 px-4 text-lg font-bold text-blue-600 bg-gray-50/50">
                    {p.currency === 'USD' ? '$' : p.currency}{p.price.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-6 px-4 font-semibold text-gray-700 text-sm text-left">Price History (7d)</th>
                {selectedProducts.map(p => (
                  <td key={p.id} className="py-6 px-4">
                    <div className="h-12 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData[p.id]}>
                          <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            dot={false} 
                            isAnimationActive={true}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-6 px-4 font-semibold text-gray-700 text-sm text-left bg-gray-50/50">Smart Forecast</th>
                {selectedProducts.map(p => (
                  <td key={p.id} className="py-6 px-4 bg-gray-50/50">
                    {loadingForecasts ? (
                      <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                        <i className="fas fa-brain text-xs"></i>
                        <span className="text-xs">Analyzing...</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <i className="fas fa-chart-line text-green-500 mt-1"></i>
                        <span className="text-xs font-medium text-gray-600">{forecasts[p.id] || "No forecast available."}</span>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-6 px-4 font-semibold text-gray-700 text-sm text-left">Platform</th>
                {selectedProducts.map(p => (
                  <td key={p.id} className="py-6 px-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wide border border-blue-100">
                      {p.platform}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-6 px-4 font-semibold text-gray-700 text-sm text-left bg-gray-50/50">Rating</th>
                {selectedProducts.map(p => (
                  <td key={p.id} className="py-6 px-4 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <div className="flex text-yellow-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`fas fa-star ${i < Math.floor(p.rating || 4) ? '' : 'text-gray-200'}`}></i>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-500">{p.rating || '4.0'}</span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-6 px-4 font-semibold text-gray-700 text-sm align-top text-left">Action</th>
                {selectedProducts.map(p => (
                  <td key={p.id} className="py-6 px-4">
                    <a 
                      href={p.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md active:scale-95"
                    >
                      <i className="fas fa-cart-plus"></i>
                      Add to Cart
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonOverlay;
