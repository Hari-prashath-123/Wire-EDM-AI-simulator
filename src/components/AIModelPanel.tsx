import React, { useState, useRef } from 'react';
import { Brain, Target, Zap, Dna, Upload, FileText, Database } from 'lucide-react';

interface AIModelPanelProps {
  onTrainModel: (modelType: string, data: any) => void;
  trainingResults: Record<string, any>;
}

interface DatasetInfo {
  name: string;
  size: number;
  columns: string[];
  preview: any[];
}

const AIModelPanel: React.FC<AIModelPanelProps> = ({ onTrainModel, trainingResults }) => {
  const [selectedModel, setSelectedModel] = useState('SVM');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [uploadedDataset, setUploadedDataset] = useState<DatasetInfo | null>(null);
  const [useUploadedData, setUseUploadedData] = useState(false);
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = [
    { id: 'SVM', name: 'Support Vector Machine', icon: Target, color: 'text-blue-400' },
    { id: 'ANN', name: 'Artificial Neural Network', icon: Brain, color: 'text-green-400' },
    { id: 'ELM', name: 'Extreme Learning Machine', icon: Zap, color: 'text-yellow-400' },
    { id: 'GA', name: 'Genetic Algorithm', icon: Dna, color: 'text-purple-400' },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDatasetError(null);

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setDatasetError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setDatasetError('CSV file must contain at least a header and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredColumns = ['voltage', 'current', 'pulseOnTime', 'pulseOffTime', 'materialRemovalRate', 'surfaceRoughness'];
        
        const missingColumns = requiredColumns.filter(col => 
          !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
        );

        if (missingColumns.length > 0) {
          setDatasetError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            const value = values[index];
            row[header] = isNaN(Number(value)) ? value : Number(value);
          });
          return row;
        });

        const preview = data.slice(0, 5);
        
        setUploadedDataset({
          name: file.name,
          size: data.length,
          columns: headers,
          preview: data
        });

        setUseUploadedData(true);
      } catch (error) {
        setDatasetError('Error parsing CSV file. Please check the format.');
      }
    };

    reader.readAsText(file);
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          const trainingData = useUploadedData && uploadedDataset 
            ? uploadedDataset.preview 
            : generateTrainingData();
          onTrainModel(selectedModel, trainingData);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const generateTrainingData = () => {
    // Generate synthetic training data
    const data = [];
    for (let i = 0; i < 100; i++) {
      data.push({
        voltage: 20 + Math.random() * 280,
        current: 1 + Math.random() * 49,
        pulseOn: 0.5 + Math.random() * 99.5,
        pulseOff: 1 + Math.random() * 199,
        materialRemovalRate: Math.random() * 10,
        surfaceRoughness: Math.random() * 5,
        accuracy: 0.8 + Math.random() * 0.2,
      });
    }
    return data;
  };

  const downloadSampleDataset = () => {
    const sampleData = generateTrainingData();
    const headers = ['voltage', 'current', 'pulseOnTime', 'pulseOffTime', 'materialRemovalRate', 'surfaceRoughness', 'dimensionalAccuracy'];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => row[header] || Math.random() * 100).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_edm_dataset.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Brain className="w-6 h-6 text-green-400" />
        AI Model Training
      </h3>

      {/* Dataset Upload Section */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Training Dataset
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload CSV Dataset
            </button>
            
            <button
              onClick={downloadSampleDataset}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Download Sample
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useUploadedData"
              checked={useUploadedData}
              onChange={(e) => setUseUploadedData(e.target.checked)}
              disabled={!uploadedDataset}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="useUploadedData" className="text-sm text-gray-300">
              Use uploaded dataset for training
            </label>
          </div>

          {datasetError && (
            <div className="p-3 bg-red-900/50 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm">{datasetError}</p>
            </div>
          )}

          {uploadedDataset && (
            <div className="p-3 bg-green-900/50 border border-green-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-medium">{uploadedDataset.name}</span>
                <span className="text-sm text-gray-400">{uploadedDataset.size} samples</span>
              </div>
              
              <div className="text-sm text-gray-300 mb-2">
                Columns: {uploadedDataset.columns.join(', ')}
              </div>
              
              {uploadedDataset.preview.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-gray-400 mb-2">Data Preview:</div>
                  <div className="bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          {uploadedDataset.columns.slice(0, 6).map(col => (
                            <th key={col} className="text-left pr-4 text-gray-400">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedDataset.preview.slice(0, 3).map((row, i) => (
                          <tr key={i}>
                            {uploadedDataset.columns.slice(0, 6).map(col => (
                              <td key={col} className="pr-4 text-white">
                                {typeof row[col] === 'number' ? row[col].toFixed(2) : row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Model Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {models.map(({ id, name, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setSelectedModel(id)}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedModel === id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <div className="text-left">
                <div className="font-medium text-white text-sm">{id}</div>
                <div className="text-xs text-gray-400">{name}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Training Controls */}
      <button
        onClick={handleTrainModel}
        disabled={isTraining}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors mb-4"
      >
        {isTraining ? 'Training...' : `Train ${selectedModel} Model`}
        {useUploadedData && uploadedDataset && (
          <span className="text-xs block mt-1">
            Using {uploadedDataset.name} ({uploadedDataset.size} samples)
          </span>
        )}
      </button>

      {isTraining && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Training Progress</span>
            <span>{trainingProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-100"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Training Results */}
      {trainingResults[selectedModel] && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-medium text-white mb-2">Training Results</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Accuracy:</span>
              <span className="text-green-400 ml-2 font-mono">
                {(trainingResults[selectedModel].accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Training Time:</span>
              <span className="text-blue-400 ml-2 font-mono">
                {trainingResults[selectedModel].trainingTime}ms
              </span>
            </div>
            <div>
              <span className="text-gray-400">Samples:</span>
              <span className="text-yellow-400 ml-2 font-mono">
                {trainingResults[selectedModel].samples}
              </span>
            </div>
            <div>
              <span className="text-gray-400">RMSE:</span>
              <span className="text-orange-400 ml-2 font-mono">
                {trainingResults[selectedModel].rmse.toFixed(3)}
              </span>
            </div>
          </div>
          
          {useUploadedData && uploadedDataset && (
            <div className="mt-2 text-xs text-blue-400">
              Trained with uploaded dataset: {uploadedDataset.name}
            </div>
          )}
        </div>
      )}

      {/* Dataset Requirements */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <h5 className="text-sm font-medium text-white mb-2">Dataset Requirements:</h5>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• CSV format with headers</li>
          <li>• Required columns: voltage, current, pulseOnTime, pulseOffTime</li>
          <li>• Output columns: materialRemovalRate, surfaceRoughness</li>
          <li>• Minimum 10 samples recommended</li>
          <li>• Numeric values only (except headers)</li>
        </ul>
      </div>
    </div>
  );
};

export default AIModelPanel;