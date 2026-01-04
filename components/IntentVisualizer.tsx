
import React from 'react';
import { SearchIntent } from '../types';

interface IntentVisualizerProps {
  intent: SearchIntent;
}

const IntentVisualizer: React.FC<IntentVisualizerProps> = ({ intent }) => {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
          <i className="fas fa-brain"></i>
        </div>
        <div>
          <h2 className="font-bold text-blue-900 leading-tight">Intent Analysis</h2>
          <p className="text-xs text-blue-700">How the agent parsed your request</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest block mb-1">Target Category</span>
            <div className="text-blue-900 font-semibold">{intent.category}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest block mb-1">Budget Target</span>
            <div className="text-blue-900 font-semibold">
              ${intent.budgetRange.min} — {intent.budgetRange.max ? `$${intent.budgetRange.max}` : 'No Limit'}
            </div>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest block mb-1">Key Features Identified</span>
          <div className="flex flex-wrap gap-2">
            {intent.keyFeatures.map((f, i) => (
              <span key={i} className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest block mb-1">Personalized Advice</span>
          <p className="text-sm text-blue-800 leading-relaxed italic">
            "{intent.userProfileMatch}"
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${intent.urgency === 'high' ? 'bg-red-500' : intent.urgency === 'medium' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Urgency: {intent.urgency}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntentVisualizer;
