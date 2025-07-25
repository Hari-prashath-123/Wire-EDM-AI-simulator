import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box } from '@react-three/drei';
import * as THREE from 'three';
import { ParsedModel } from '../utils/fileParser';
import { RotateCcw, ZoomIn, ZoomOut, Move3D } from 'lucide-react';

interface Model3DViewerProps {
  model: ParsedModel | null;
  showCuttingPaths?: boolean;
  cuttingProgress?: number;
  isAnimating?: boolean;
}

interface ModelMeshProps {
  model: ParsedModel;
  showCuttingPaths: boolean;
  cuttingProgress: number;
}

const ModelMesh: React.FC<ModelMeshProps> = ({ model, showCuttingPaths, cuttingProgress }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cuttingPathsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation animation
      meshRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    if (cuttingPathsRef.current && showCuttingPaths) {
      // Clear existing paths
      cuttingPathsRef.current.clear();

      // Add cutting paths based on progress
      const pathsToShow = Math.floor((cuttingProgress / 100) * model.cuttingPaths.length);
      
      model.cuttingPaths.slice(0, pathsToShow).forEach((path, index) => {
        if (path.length > 1) {
          const points = path.map(p => new THREE.Vector3(p.x, p.y, p.z));
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          
          const material = new THREE.LineBasicMaterial({
            color: new THREE.Color().setHSL(index / model.cuttingPaths.length, 0.8, 0.6),
            linewidth: 2,
            transparent: true,
            opacity: 0.8
          });
          
          const line = new THREE.Line(geometry, material);
          cuttingPathsRef.current!.add(line);
        }
      });
    }
  }, [model, showCuttingPaths, cuttingProgress]);

  return (
    <group>
      {/* Main model */}
      <mesh
        ref={meshRef}
        geometry={model.geometry}
        material={model.material}
        castShadow
        receiveShadow
      />
      
      {/* Cutting paths */}
      {showCuttingPaths && (
        <group ref={cuttingPathsRef} />
      )}
      
      {/* Bounding box wireframe */}
      <Box
        args={[
          model.boundingBox.max.x - model.boundingBox.min.x,
          model.boundingBox.max.y - model.boundingBox.min.y,
          model.boundingBox.max.z - model.boundingBox.min.z
        ]}
        position={[
          (model.boundingBox.max.x + model.boundingBox.min.x) / 2,
          (model.boundingBox.max.y + model.boundingBox.min.y) / 2,
          (model.boundingBox.max.z + model.boundingBox.min.z) / 2
        ]}
      >
        <meshBasicMaterial color="yellow" wireframe transparent opacity={0.3} />
      </Box>
    </group>
  );
};

const CameraController: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const { camera, gl } = useThree();
  
  useEffect(() => {
    const resetCamera = () => {
      camera.position.set(150, 150, 150);
      camera.lookAt(0, 0, 0);
      onReset();
    };
    
    // Initial camera setup
    resetCamera();
  }, [camera, onReset]);

  return null;
};

const Model3DViewer: React.FC<Model3DViewerProps> = ({ 
  model, 
  showCuttingPaths = false, 
  cuttingProgress = 0,
  isAnimating = false 
}) => {
  const [cameraReset, setCameraReset] = useState(0);

  const handleResetCamera = () => {
    setCameraReset(prev => prev + 1);
  };

  if (!model) {
    return (
      <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <Move3D className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Upload a 3D model to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [150, 150, 150], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[100, 100, 100]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-100, -100, -100]} intensity={0.5} />

        {/* Grid */}
        <Grid
          args={[200, 200]}
          cellSize={10}
          cellThickness={0.5}
          cellColor="#374151"
          sectionSize={50}
          sectionThickness={1}
          sectionColor="#4b5563"
          fadeDistance={300}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        {/* Model */}
        <ModelMesh
          model={model}
          showCuttingPaths={showCuttingPaths}
          cuttingProgress={cuttingProgress}
        />

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={50}
          maxDistance={500}
          autoRotate={isAnimating}
          autoRotateSpeed={1}
        />

        <CameraController onReset={() => setCameraReset(0)} />
      </Canvas>

      {/* Control Panel */}
      <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
        <button
          onClick={handleResetCamera}
          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2 text-sm transition-colors"
          title="Reset Camera"
        >
          <RotateCcw className="w-4 h-4" />
          Reset View
        </button>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3">
        <div className="text-xs text-gray-300 space-y-1">
          <div>Vertices: {model.metadata.vertices.toLocaleString()}</div>
          <div>Volume: {model.metadata.volume.toFixed(2)} mm³</div>
          {showCuttingPaths && (
            <div>Cutting Progress: {cuttingProgress.toFixed(1)}%</div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-2">
        <div className="text-xs text-gray-400">
          Mouse: Rotate • Wheel: Zoom • Right-click: Pan
        </div>
      </div>
    </div>
  );
};

export default Model3DViewer;