
import React, { useState, useRef } from 'react';
import SearchInput from './components/SearchInput';
import ProductCard from './components/ProductCard';
import IntentVisualizer from './components/IntentVisualizer';
import PriceChart from './components/PriceChart';
import ComparisonOverlay from './components/ComparisonOverlay';
import { shoppingAgentService } from './services/geminiService';
import { SearchResult, Product } from './types';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Selection & Saved state
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [savedItems, setSavedItems] = useState<Product[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<Set<string>>(new Set());
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // Virtual Try-On state
  const [showTryOn, setShowTryOn] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [tryOnAnalysis, setTryOnAnalysis] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_COMPARE = 4;

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setSelectedProducts([]);
    try {
      const data = await shoppingAgentService.analyzeAndSearch(query);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isAlreadySelected = prev.some(p => p.id === product.id);
      if (isAlreadySelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= MAX_COMPARE) return prev;
        return [...prev, product];
      }
    });
  };

  const toggleSaveProduct = (product: Product) => {
    setSavedItems(prev => {
      const isSaved = prev.some(p => p.id === product.id);
      if (isSaved) return prev.filter(p => p.id !== product.id);
      return [...prev, product];
    });
  };

  const togglePriceAlert = (product: Product) => {
    setPriceAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(product.id)) newSet.delete(product.id);
      else newSet.add(product.id);
      return newSet;
    });
  };

  const startTryOn = async (product: Product) => {
    setActiveProduct(product);
    setShowTryOn(true);
    setTryOnAnalysis(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera for AR preview.");
      setShowTryOn(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !activeProduct) return;
    
    // Trigger flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    
    setCapturing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
    try {
      const analysis = await shoppingAgentService.visualizeTryOn(base64, activeProduct);
      setTryOnAnalysis(analysis);
    } catch (err) {
      setTryOnAnalysis("Failed to process preview.");
    } finally {
      setCapturing(false);
    }
  };

  const closeTryOn = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setShowTryOn(false);
    setActiveProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">SmartShop AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSavedPanel(true)}
              className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors"
              title="Saved Items"
            >
              <i className="fas fa-heart text-xl"></i>
              {savedItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {savedItems.length}
                </span>
              )}
            </button>
            <div className="hidden md:flex items-center gap-4 border-l pl-4 ml-4">
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Track Prices</a>
              <a href="#" className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all">Sign In</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero & Search */}
      <div className="bg-white pt-12 pb-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Stop Searching. <span className="text-blue-600">Start Deciding.</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Our AI Shopping Agent parses your specific needs and scans the web in real-time.
          </p>
        </div>
        <SearchInput onSearch={handleSearch} isLoading={loading} />
      </div>

      <main className="max-w-7xl mx-auto px-4 mt-12">
        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl mb-4">
              <i className="fas fa-robot fa-bounce"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Agent is scanning...</h3>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <IntentVisualizer intent={result.intent} />
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-line text-blue-600"></i>
                  Price Landscape
                </h3>
                <PriceChart products={result.products} />
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Summary</h2>
                <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                  {result.summary}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recommended Deals</h2>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Select up to {MAX_COMPARE} to compare</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    isSelected={selectedProducts.some(p => p.id === product.id)}
                    isSaved={savedItems.some(p => p.id === product.id)}
                    isAlertEnabled={priceAlerts.has(product.id)}
                    onToggleSelection={toggleProductSelection}
                    onVirtualTryOn={startTryOn}
                    onToggleSave={toggleSaveProduct}
                    onToggleAlert={togglePriceAlert}
                    selectionDisabled={selectedProducts.length >= MAX_COMPARE}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="py-20 text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-6">
              <i className="fas fa-search-dollar text-gray-400 text-4xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your AI Personal Shopper is Ready</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Tell me what you want to buy, and I'll find the best quality for the lowest price using real-time search grounding.
            </p>
          </div>
        )}
      </main>

      {/* Saved Items Panel (Drawer) */}
      {showSavedPanel && (
        <div className="fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSavedPanel(false)}></div>
          <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Saved Items</h3>
                <p className="text-sm text-gray-500">{savedItems.length} products stored</p>
              </div>
              <button onClick={() => setShowSavedPanel(false)} className="text-gray-400 hover:text-gray-900">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {savedItems.length === 0 ? (
                <div className="text-center py-20">
                  <i className="far fa-heart text-gray-200 text-6xl mb-4"></i>
                  <p className="text-gray-400 font-medium">No saved items yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Tap the heart on any product to save it.</p>
                </div>
              ) : (
                savedItems.map(item => (
                  <div key={item.id} className="flex gap-4 p-3 border rounded-2xl hover:bg-gray-50 transition-colors group">
                    <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-xl" alt="" />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-blue-600 font-bold">${item.price.toLocaleString()}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <a href={item.link} target="_blank" className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1">
                          View <i className="fas fa-external-link-alt text-[10px]"></i>
                        </a>
                        <button onClick={() => toggleSaveProduct(item)} className="text-xs font-bold text-red-400 hover:text-red-600">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Bottom Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-white/10 backdrop-blur-md bg-opacity-90">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 overflow-hidden p-1">
                {selectedProducts.map(p => (
                  <img key={p.id} src={p.imageUrl || `https://picsum.photos/seed/${p.id}/40/40`} className="inline-block h-10 w-10 rounded-full ring-2 ring-gray-900 object-cover" alt="" />
                ))}
              </div>
              <div>
                <div className="font-bold text-sm">{selectedProducts.length} Selected</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedProducts([])}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button 
                disabled={selectedProducts.length < 2}
                onClick={() => setIsComparing(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <i className="fas fa-columns"></i>
                Compare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Overlay */}
      {isComparing && (
        <ComparisonOverlay 
          selectedProducts={selectedProducts} 
          onClose={() => setIsComparing(false)} 
        />
      )}

      {/* Virtual Try-On Modal */}
      {showTryOn && activeProduct && (
        <div className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-gray-900 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white/10 flex flex-col">
            {/* Header */}
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/30">
                  <i className="fas fa-magic text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">Virtual Stylist</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Predicting fit & style for <span className="text-blue-400 font-bold">{activeProduct.name}</span></p>
                </div>
              </div>
              <button onClick={closeTryOn} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Viewport */}
            <div className="relative aspect-[4/5] bg-black overflow-hidden group">
              {/* Flash effect overlay */}
              {flash && <div className="absolute inset-0 bg-white z-[60] animate-pulse"></div>}

              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale-[0.2]" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Overlay Animation */}
              {(capturing || tryOnAnalysis) && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                </div>
              )}

              {/* Viewport Guides */}
              <div className="absolute inset-10 border-2 border-dashed border-white/20 rounded-3xl pointer-events-none flex items-center justify-center">
                 <div className="text-white/20 text-4xl">
                   <i className="fas fa-expand"></i>
                 </div>
              </div>
              
              {!tryOnAnalysis && !capturing && (
                <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-4 z-30">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    </div>
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">Step 1: Position Yourself</span>
                  </div>
                  <button 
                    onClick={captureAndAnalyze}
                    className="w-20 h-20 bg-white rounded-full border-[6px] border-blue-600/30 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-90 transition-all group"
                  >
                    <div className="w-14 h-14 bg-white rounded-full border-2 border-gray-900 flex items-center justify-center">
                       <i className="fas fa-camera text-gray-900 text-2xl group-hover:text-blue-600 transition-colors"></i>
                    </div>
                  </button>
                  <p className="text-white/60 text-xs font-medium">Click to capture and analyze fit</p>
                </div>
              )}

              {capturing && (
                <div className="absolute inset-0 z-40 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-blue-500 text-2xl">
                       <i className="fas fa-brain animate-pulse"></i>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-white mt-8">Synthesizing AR Fit...</h4>
                  <p className="text-gray-400 text-sm mt-2 max-w-xs leading-relaxed">Gemini is analyzing your photo to calculate size, style compatibility, and room placement.</p>
                </div>
              )}
            </div>

            {/* Results Overlay */}
            {tryOnAnalysis && (
              <div className="p-8 bg-white flex flex-col flex-grow animate-slide-up relative z-50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Stylist Match Found</h4>
                      <p className="text-gray-500 text-xs">Based on visual context</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">98% Fit Score</div>
                </div>

                <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl mb-8 relative">
                   <i className="fas fa-quote-left absolute top-4 left-4 text-gray-200 text-3xl"></i>
                   <p className="text-gray-800 italic leading-relaxed relative z-10 pl-6">
                     "{tryOnAnalysis}"
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <button 
                    onClick={() => setTryOnAnalysis(null)}
                    className="py-4 bg-gray-100 text-gray-900 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-redo"></i>
                    Retake
                  </button>
                  <a 
                    href={activeProduct.link}
                    target="_blank"
                    className="py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    Buy This Look
                    <i className="fas fa-arrow-right"></i>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scan-line {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
