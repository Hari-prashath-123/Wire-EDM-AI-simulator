import React, { useState, useRef } from 'react';
import { Upload, File, AlertCircle, CheckCircle, Trash2, Eye } from 'lucide-react';
import { fileParser, ParsedModel } from '../utils/fileParser';

interface FileUploadPanelProps {
  onModelLoaded: (model: ParsedModel) => void;
  onModelRemoved: () => void;
  currentModel: ParsedModel | null;
}

const FileUploadPanel: React.FC<FileUploadPanelProps> = ({ 
  onModelLoaded, 
  onModelRemoved, 
  currentModel 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['.stl', '.obj', '.ply'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Validate file
    if (file.size > maxFileSize) {
      setError('File size exceeds 50MB limit');
      setIsUploading(false);
      return;
    }

    const extension = '.' + file.name.toLowerCase().split('.').pop();
    if (!supportedFormats.includes(extension)) {
      setError(`Unsupported file format. Supported formats: ${supportedFormats.join(', ')}`);
      setIsUploading(false);
      return;
    }

    // Simulate progress for user feedback
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      const result = await fileParser.parseFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.model) {
        setTimeout(() => {
          onModelLoaded(result.model!);
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        setError(result.error || 'Failed to parse file');
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleRemoveModel = () => {
    onModelRemoved();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <File className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
        3D Model Upload
      </h3>

      {!currentModel ? (
        <div>
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <div className="text-white font-medium mb-2">Processing 3D Model...</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{uploadProgress}%</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <div className="text-white font-medium mb-2">
                    Drop your 3D model here or click to browse
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    Supported formats: {supportedFormats.join(', ')} • Max size: 50MB
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Choose File
                  </button>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={supportedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-600 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Sample Files */}
          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-3">Sample Files:</h4>
            <div className="space-y-2 text-sm">
              <div className="text-gray-300">
                • <span className="font-mono">cube.stl</span> - Simple geometric shape
              </div>
              <div className="text-gray-300">
                • <span className="font-mono">gear.obj</span> - Mechanical component
              </div>
              <div className="text-gray-300">
                • <span className="font-mono">bracket.ply</span> - Complex geometry
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              Upload your own CAD files to simulate Wire EDM cutting
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Model Info */}
          <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Model Loaded Successfully</span>
              </div>
              <button
                onClick={handleRemoveModel}
                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                title="Remove Model"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Vertices:</span>
                <span className="text-white ml-2 font-mono">
                  {currentModel.metadata.vertices.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Faces:</span>
                <span className="text-white ml-2 font-mono">
                  {currentModel.metadata.faces.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Volume:</span>
                <span className="text-white ml-2 font-mono">
                  {currentModel.metadata.volume.toFixed(2)} mm³
                </span>
              </div>
              <div>
                <span className="text-gray-400">Surface Area:</span>
                <span className="text-white ml-2 font-mono">
                  {currentModel.metadata.surfaceArea.toFixed(2)} mm²
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="text-sm">
                <span className="text-gray-400">Cutting Paths:</span>
                <span className="text-blue-400 ml-2 font-mono">
                  {currentModel.cuttingPaths.length} layers generated
                </span>
              </div>
            </div>
          </div>

          {/* Model Preview Controls */}
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
              <Eye className="w-4 h-4" />
              Preview Model
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload New
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={supportedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default FileUploadPanel;