import React from 'react';
import { TrendingUp, Target, Layers, Clock } from 'lucide-react';

interface Prediction {
  materialRemovalRate: number;
  surfaceRoughness: number;
  dimensionalAccuracy: number;
  processingTime: number;
}

interface ResultsPanelProps {
  predictions: Record<string, Prediction>;
  currentParameters: any;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ predictions, currentParameters }) => {
  const metrics = [
    { 
      key: 'materialRemovalRate', 
      label: 'Material Removal Rate', 
      unit: 'mm³/min', 
      icon: TrendingUp, 
      color: 'text-green-400',
      bgColor: 'bg-green-400/10' 
    },
    { 
      key: 'surfaceRoughness', 
      label: 'Surface Roughness', 
      unit: 'Ra (μm)', 
      icon: Layers, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10' 
    },
    { 
      key: 'dimensionalAccuracy', 
      label: 'Dimensional Accuracy', 
      unit: '±μm', 
      icon: Target, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10' 
    },
    { 
      key: 'processingTime', 
      label: 'Processing Time', 
      unit: 'min', 
      icon: Clock, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10' 
    },
  ] as const;

  const getBestModel = (metricKey: keyof Prediction) => {
    if (Object.keys(predictions).length === 0) return null;
    
    let bestModel = '';
    let bestValue = metricKey === 'surfaceRoughness' ? Infinity : -Infinity;
    
    Object.entries(predictions).forEach(([model, pred]) => {
      const value = pred[metricKey];
      if (metricKey === 'surfaceRoughness') {
        if (value < bestValue) {
          bestValue = value;
          bestModel = model;
        }
      } else {
        if (value > bestValue) {
          bestValue = value;
          bestModel = model;
        }
      }
    });
    
    return bestModel;
  };

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
        Prediction Results
      </h3>

      {Object.keys(predictions).length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          Train an AI model to see predictions
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {metrics.map(({ key, label, unit, icon: Icon, color, bgColor }) => (
            <div key={key} className={`p-3 sm:p-4 rounded-lg ${bgColor} border border-gray-600`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
                  <span className="font-medium text-white text-sm sm:text-base">{label}</span>
                </div>
                <span className="text-xs text-gray-400">Best: {getBestModel(key)}</span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {Object.entries(predictions).map(([model, prediction]) => (
                  <div key={model} className="bg-gray-700/50 p-2 rounded">
                    <div className="text-xs text-gray-400 mb-1">{model}</div>
                    <div className="font-mono text-xs sm:text-sm text-white">
                      {prediction[key].toFixed(2)} {unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
            <h4 className="font-medium text-white mb-3 text-sm sm:text-base">Current Parameter Impact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-400">Voltage Impact:</span>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full" 
                    style={{ width: `${(currentParameters.voltage / 300) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <span className="text-gray-400">Current Impact:</span>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-400 h-2 rounded-full" 
                    style={{ width: `${(currentParameters.current / 50) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;