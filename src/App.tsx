import React, { useState, useCallback, useMemo } from 'react';
import { Settings, Zap, Brain, BarChart3 } from 'lucide-react';
import ParameterPanel from './components/ParameterPanel';
import CuttingSimulation from './components/CuttingSimulation';
import AIModelPanel from './components/AIModelPanel';
import ResultsPanel from './components/ResultsPanel';
import { trainSVM, trainANN, trainELM, trainGA, ModelResult } from './utils/aiModels';

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

function App() {
  const [parameters, setParameters] = useState<EDMParameters>({
    voltage: 150,
    current: 25,
    pulseOnTime: 50,
    pulseOffTime: 100,
    wireSpeed: 250,
    dielectricFlow: 10,
    wireOffset: 2.5,
    sparkGap: 0.05,
  });

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [trainedModels, setTrainedModels] = useState<Record<string, ModelResult>>({});
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('parameters');

  // Calculate process metrics based on current parameters
  const processMetrics = useMemo(() => {
    const dischargeEnergy = (parameters.voltage * parameters.current * parameters.pulseOnTime) / 1000;
    const dutyCycle = (parameters.pulseOnTime / (parameters.pulseOnTime + parameters.pulseOffTime)) * 100;
    const powerConsumption = (parameters.voltage * parameters.current) / 1000;
    const estimatedCostPerHour = powerConsumption * 0.12 + 15 + (parameters.wireSpeed * 0.02);
    const materialRemovalRate = (dischargeEnergy * dutyCycle * parameters.current) / 100;
    const surfaceRoughness = Math.max(0.1, 5 - (parameters.voltage / 100) + (parameters.pulseOnTime / 20));
    const wireWearRate = (parameters.current * parameters.voltage) / (parameters.wireSpeed * 100);
    const efficiency = Math.min(100, (dutyCycle * parameters.dielectricFlow * parameters.wireSpeed) / 1000);
    
    return {
      dischargeEnergy,
      dutyCycle,
      powerConsumption,
      estimatedCostPerHour,
      materialRemovalRate,
      surfaceRoughness,
      wireWearRate,
      efficiency
    };
  }, [parameters]);

  const handleParameterChange = useCallback((key: keyof EDMParameters, value: number) => {
    setParameters(prev => ({ ...prev, [key]: value }));
    
    // Update predictions for all trained models
    const newPredictions: Record<string, any> = {};
    Object.entries(trainedModels).forEach(([modelType, model]) => {
      newPredictions[modelType] = model.predict({ ...parameters, [key]: value });
    });
    setPredictions(newPredictions);
  }, [trainedModels, parameters]);

  const handleToggleSimulation = () => {
    setIsSimulationRunning(prev => !prev);
  };

  const handleStopSimulation = () => {
    setIsSimulationRunning(false);
  };

  const handleTrainModel = async (modelType: string, data: any) => {
    let model: ModelResult;
    
    switch (modelType) {
      case 'SVM':
        model = trainSVM(data);
        break;
      case 'ANN':
        model = trainANN(data);
        break;
      case 'ELM':
        model = trainELM(data);
        break;
      case 'GA':
        model = trainGA(data);
        break;
      default:
        return;
    }

    setTrainedModels(prev => ({ ...prev, [modelType]: model }));
    
    // Generate prediction for current parameters
    const prediction = model.predict(parameters);
    setPredictions(prev => ({ ...prev, [modelType]: prediction }));
  };

  const tabs = [
    { id: 'parameters', label: 'Parameters', icon: Settings },
    { id: 'simulation', label: 'Simulation', icon: Zap },
    { id: 'ai', label: 'AI Models', icon: Brain },
    { id: 'results', label: 'Results', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Wire EDM Simulator</h1>
                <p className="text-sm sm:text-base text-gray-400 hidden sm:block">Advanced Machining Process Simulation & AI Analysis</p>
                <p className="text-xs text-gray-400 sm:hidden">AI-Powered EDM Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isSimulationRunning ? 'bg-green-400' : 'bg-gray-600'}`} />
              <span className="text-xs sm:text-sm text-gray-400">
                {isSimulationRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Scrollable on mobile */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {activeTab === 'parameters' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
              <ParameterPanel
                parameters={parameters}
                onParameterChange={handleParameterChange}
              />
              <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Process Overview</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded text-sm sm:text-base">
                    <span className="text-gray-300">Discharge Energy</span>
                    <span className="font-mono text-blue-400">
                      {processMetrics.dischargeEnergy.toFixed(2)} mJ
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded text-sm sm:text-base">
                    <span className="text-gray-300">Duty Cycle</span>
                    <span className="font-mono text-green-400">
                      {processMetrics.dutyCycle.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded text-sm sm:text-base">
                    <span className="text-gray-300">Power Consumption</span>
                    <span className="font-mono text-yellow-400">
                      {processMetrics.powerConsumption.toFixed(2)} kW
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded text-sm sm:text-base">
                    <span className="text-gray-300">Material Removal Rate</span>
                    <span className="font-mono text-purple-400">
                      {processMetrics.materialRemovalRate.toFixed(2)} mm³/min
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded text-sm sm:text-base">
                    <span className="text-gray-300">Surface Roughness</span>
                    <span className="font-mono text-cyan-400">
                      {processMetrics.surfaceRoughness.toFixed(2)} Ra
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded text-sm sm:text-base">
                    <span className="text-gray-300">Wire Wear Rate</span>
                    <span className="font-mono text-red-400">
                      {processMetrics.wireWearRate.toFixed(3)} %/min
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded text-sm sm:text-base">
                    <span className="text-gray-300">Process Efficiency</span>
                    <span className="font-mono text-emerald-400">
                      {processMetrics.efficiency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded text-sm sm:text-base">
                    <span className="text-gray-300">Estimated Cost/Hour</span>
                    <span className="font-mono text-orange-400">
                      ${processMetrics.estimatedCostPerHour.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Process Quality Indicators */}
                <div className="mt-4 sm:mt-6">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Quality Indicators</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span className="text-gray-300">Cutting Precision</span>
                        <span className="text-blue-400">{Math.min(100, 100 - processMetrics.wireWearRate * 10).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, 100 - processMetrics.wireWearRate * 10)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span className="text-gray-300">Surface Quality</span>
                        <span className="text-green-400">{Math.max(0, 100 - processMetrics.surfaceRoughness * 15).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(0, 100 - processMetrics.surfaceRoughness * 15)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span className="text-gray-300">Energy Efficiency</span>
                        <span className="text-yellow-400">{Math.min(100, processMetrics.efficiency).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, processMetrics.efficiency)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <CuttingSimulation
              isRunning={isSimulationRunning}
              parameters={parameters}
              onToggleSimulation={handleToggleSimulation}
              onStopSimulation={handleStopSimulation}
            />
          )}

          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
              <AIModelPanel
                onTrainModel={handleTrainModel}
                trainingResults={trainedModels}
              />
              <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Model Comparison</h3>
                {Object.keys(trainedModels).length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    No models trained yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(trainedModels).map(([modelType, model]) => (
                      <div key={modelType} className="p-3 sm:p-4 bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-white text-sm sm:text-base">{modelType}</span>
                          <span className="text-xs sm:text-sm text-green-400">
                            {(model.accuracy * 100).toFixed(1)}% accuracy
                          </span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${model.accuracy * 100}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          RMSE: {model.rmse.toFixed(3)} | Training Time: {model.trainingTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <ResultsPanel
              predictions={predictions}
              currentParameters={parameters}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;