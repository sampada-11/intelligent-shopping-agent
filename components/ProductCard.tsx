
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  isSaved: boolean;
  isAlertEnabled: boolean;
  onToggleSelection: (product: Product) => void;
  onVirtualTryOn: (product: Product) => void;
  onToggleSave: (product: Product) => void;
  onToggleAlert: (product: Product) => void;
  selectionDisabled?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isSelected, 
  isSaved,
  isAlertEnabled,
  onToggleSelection,
  onVirtualTryOn,
  onToggleSave,
  onToggleAlert,
  selectionDisabled 
}) => {
  return (
    <div 
      className={`relative bg-white rounded-2xl border transition-all flex flex-col h-full overflow-hidden ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-50 shadow-lg' 
          : 'border-gray-100 hover:shadow-xl'
      }`}
    >
      {/* Top Actions: Selection & Save */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <button
          onClick={() => onToggleSelection(product)}
          disabled={selectionDisabled && !isSelected}
          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'bg-white/90 backdrop-blur border-gray-300 hover:border-blue-400 shadow-sm'
          } ${selectionDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title="Compare this product"
        >
          {isSelected && <i className="fas fa-check text-xs"></i>}
        </button>
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          onClick={() => onToggleSave(product)}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
            isSaved 
              ? 'bg-red-50 text-red-600 border-red-100' 
              : 'bg-white/90 backdrop-blur border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
          }`}
          title={isSaved ? "Remove from saved" : "Save for later"}
        >
          <i className={`${isSaved ? 'fas' : 'far'} fa-heart text-sm`}></i>
        </button>
      </div>

      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <img
          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/225`}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
          {product.platform}
        </div>
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug h-10">
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex text-yellow-400 text-xs">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < Math.floor(product.rating || 4) ? '' : 'text-gray-200'}`}></i>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewsCount || '120+'})</span>
          </div>

          {/* Price Drop Alert Toggle */}
          <button
            onClick={() => onToggleAlert(product)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight transition-all ${
              isAlertEnabled 
                ? 'bg-green-50 text-green-700 border border-green-100' 
                : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'
            }`}
          >
            <i className={`fas ${isAlertEnabled ? 'fa-bell' : 'fa-bell-slash'}`}></i>
            {isAlertEnabled ? 'Alert On' : 'Set Alert'}
          </button>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {product.description || "Top-rated product matching your requirements."}
        </p>

        <button
          onClick={() => onVirtualTryOn(product)}
          className="w-full mb-4 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <i className="fas fa-magic"></i>
          <span>Virtual Try-On</span>
        </button>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div>
            <span className="text-xs text-gray-500 block">Best Price</span>
            <span className="text-xl font-bold text-gray-900">
              {product.currency === 'USD' ? '$' : product.currency}{product.price.toLocaleString()}
            </span>
          </div>
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors shadow-sm text-sm font-bold"
          >
            View Deal
            <i className="fas fa-external-link-alt text-xs"></i>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
