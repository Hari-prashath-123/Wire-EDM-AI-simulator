import React from 'react';
import { Zap, Clock, Gauge, Wind } from 'lucide-react';

interface EDMParameters {
  voltage: number;
  current: number;
  pulseOnTime: number;
  pulseOffTime: number;
  wireSpeed: number;
  dielectricFlow: number;
  wireOffset: number;
  sparkGap: number;
}

interface ParameterPanelProps {
  parameters: EDMParameters;
  onParameterChange: (key: keyof EDMParameters, value: number) => void;
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({ parameters, onParameterChange }) => {
  const parameterConfigs = [
    { key: 'voltage', label: 'Voltage (V)', min: 20, max: 300, step: 5, icon: Zap, color: 'text-yellow-400' },
    { key: 'current', label: 'Current (A)', min: 1, max: 50, step: 0.5, icon: Gauge, color: 'text-blue-400' },
    { key: 'pulseOnTime', label: 'Pulse On (µs)', min: 0.5, max: 100, step: 0.5, icon: Clock, color: 'text-green-400' },
    { key: 'pulseOffTime', label: 'Pulse Off (µs)', min: 1, max: 200, step: 1, icon: Clock, color: 'text-red-400' },
    { key: 'wireSpeed', label: 'Wire Speed (mm/min)', min: 10, max: 500, step: 5, icon: Wind, color: 'text-purple-400' },
    { key: 'dielectricFlow', label: 'Dielectric Flow (L/min)', min: 0.5, max: 20, step: 0.1, icon: Wind, color: 'text-cyan-400' },
    { key: 'wireOffset', label: 'Wire Offset (mm)', min: 0, max: 5, step: 0.01, icon: Gauge, color: 'text-orange-400' },
    { key: 'sparkGap', label: 'Spark Gap (mm)', min: 0.001, max: 0.1, step: 0.001, icon: Zap, color: 'text-pink-400' },
  ] as const;

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
        EDM Parameters
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {parameterConfigs.map(({ key, label, min, max, step, icon: Icon, color }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-medium text-gray-300 flex items-center gap-2">
                <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${color}`} />
                <span className="truncate">{label}</span>
              </label>
              <span className="text-xs sm:text-sm font-mono text-white bg-gray-700 px-2 py-1 rounded min-w-0 flex-shrink-0">
                {parameters[key]}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={parameters[key]}
              onChange={(e) => onParameterChange(key, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParameterPanel;