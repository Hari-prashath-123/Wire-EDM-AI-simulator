import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';
import { PLYLoader } from 'three-stdlib';

export interface ParsedModel {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  mesh: THREE.Mesh;
  boundingBox: THREE.Box3;
  cuttingPaths: THREE.Vector3[][];
  metadata: {
    vertices: number;
    faces: number;
    volume: number;
    surfaceArea: number;
  };
}

export interface FileParseResult {
  success: boolean;
  model?: ParsedModel;
  error?: string;
}

export class ModelFileParser {
  private stlLoader: STLLoader;
  private objLoader: OBJLoader;
  private plyLoader: PLYLoader;

  constructor() {
    this.stlLoader = new STLLoader();
    this.objLoader = new OBJLoader();
    this.plyLoader = new PLYLoader();
  }

  async parseFile(file: File): Promise<FileParseResult> {
    try {
      const extension = file.name.toLowerCase().split('.').pop();
      const arrayBuffer = await file.arrayBuffer();

      let geometry: THREE.BufferGeometry;

      switch (extension) {
        case 'stl':
          geometry = this.stlLoader.parse(arrayBuffer);
          break;
        case 'obj':
          const objText = new TextDecoder().decode(arrayBuffer);
          const objGroup = this.objLoader.parse(objText);
          geometry = (objGroup.children[0] as THREE.Mesh).geometry;
          break;
        case 'ply':
          geometry = this.plyLoader.parse(arrayBuffer);
          break;
        default:
          return {
            success: false,
            error: `Unsupported file format: ${extension}. Supported formats: STL, OBJ, PLY`
          };
      }

      // Ensure geometry has proper attributes
      if (!geometry.attributes.position) {
        return {
          success: false,
          error: 'Invalid geometry: missing position attributes'
        };
      }

      // Compute normals if missing
      if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
      }

      // Center and scale the geometry
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox!;
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      const scale = 100 / maxDimension; // Scale to fit in 100 unit cube

      geometry.translate(-center.x, -center.y, -center.z);
      geometry.scale(scale, scale, scale);
      geometry.computeBoundingBox();

      // Create material
      const material = new THREE.MeshPhongMaterial({
        color: 0x888888,
        shininess: 100,
        transparent: true,
        opacity: 0.8
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);

      // Calculate metadata
      const vertices = geometry.attributes.position.count;
      const faces = geometry.index ? geometry.index.count / 3 : vertices / 3;
      const volume = this.calculateVolume(geometry);
      const surfaceArea = this.calculateSurfaceArea(geometry);

      // Generate cutting paths
      const cuttingPaths = this.generateCuttingPaths(geometry);

      const parsedModel: ParsedModel = {
        geometry,
        material,
        mesh,
        boundingBox: geometry.boundingBox!,
        cuttingPaths,
        metadata: {
          vertices,
          faces,
          volume,
          surfaceArea
        }
      };

      return {
        success: true,
        model: parsedModel
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private calculateVolume(geometry: THREE.BufferGeometry): number {
    const positions = geometry.attributes.position.array;
    let volume = 0;

    if (geometry.index) {
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3;
        const b = indices[i + 1] * 3;
        const c = indices[i + 2] * 3;

        const v1 = new THREE.Vector3(positions[a], positions[a + 1], positions[a + 2]);
        const v2 = new THREE.Vector3(positions[b], positions[b + 1], positions[b + 2]);
        const v3 = new THREE.Vector3(positions[c], positions[c + 1], positions[c + 2]);

        volume += v1.dot(v2.cross(v3)) / 6;
      }
    } else {
      for (let i = 0; i < positions.length; i += 9) {
        const v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
        const v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

        volume += v1.dot(v2.cross(v3)) / 6;
      }
    }

    return Math.abs(volume);
  }

  private calculateSurfaceArea(geometry: THREE.BufferGeometry): number {
    const positions = geometry.attributes.position.array;
    let area = 0;

    if (geometry.index) {
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3;
        const b = indices[i + 1] * 3;
        const c = indices[i + 2] * 3;

        const v1 = new THREE.Vector3(positions[a], positions[a + 1], positions[a + 2]);
        const v2 = new THREE.Vector3(positions[b], positions[b + 1], positions[b + 2]);
        const v3 = new THREE.Vector3(positions[c], positions[c + 1], positions[c + 2]);

        const edge1 = v2.clone().sub(v1);
        const edge2 = v3.clone().sub(v1);
        area += edge1.cross(edge2).length() / 2;
      }
    } else {
      for (let i = 0; i < positions.length; i += 9) {
        const v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
        const v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

        const edge1 = v2.clone().sub(v1);
        const edge2 = v3.clone().sub(v1);
        area += edge1.cross(edge2).length() / 2;
      }
    }

    return area;
  }

  private generateCuttingPaths(geometry: THREE.BufferGeometry): THREE.Vector3[][] {
    const boundingBox = geometry.boundingBox!;
    const paths: THREE.Vector3[][] = [];
    
    // Generate horizontal slicing paths
    const sliceCount = 20;
    const minZ = boundingBox.min.z;
    const maxZ = boundingBox.max.z;
    const sliceHeight = (maxZ - minZ) / sliceCount;

    for (let i = 0; i <= sliceCount; i++) {
      const z = minZ + i * sliceHeight;
      const slicePath = this.generateSliceContour(geometry, z);
      if (slicePath.length > 0) {
        paths.push(slicePath);
      }
    }

    return paths;
  }

  private generateSliceContour(geometry: THREE.BufferGeometry, z: number): THREE.Vector3[] {
    const contour: THREE.Vector3[] = [];
    const positions = geometry.attributes.position.array;
    const tolerance = 0.1;

    // Simple contour generation - find edges that intersect the Z plane
    if (geometry.index) {
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3;
        const b = indices[i + 1] * 3;
        const c = indices[i + 2] * 3;

        const v1 = new THREE.Vector3(positions[a], positions[a + 1], positions[a + 2]);
        const v2 = new THREE.Vector3(positions[b], positions[b + 1], positions[b + 2]);
        const v3 = new THREE.Vector3(positions[c], positions[c + 1], positions[c + 2]);

        // Check if triangle intersects the Z plane
        const intersections = this.getTriangleZPlaneIntersections(v1, v2, v3, z, tolerance);
        contour.push(...intersections);
      }
    }

    // Sort contour points to form a continuous path
    if (contour.length > 2) {
      return this.sortContourPoints(contour);
    }

    return contour;
  }

  private getTriangleZPlaneIntersections(
    v1: THREE.Vector3, 
    v2: THREE.Vector3, 
    v3: THREE.Vector3, 
    z: number, 
    tolerance: number
  ): THREE.Vector3[] {
    const intersections: THREE.Vector3[] = [];
    const edges = [[v1, v2], [v2, v3], [v3, v1]];

    edges.forEach(([start, end]) => {
      if ((start.z <= z + tolerance && end.z >= z - tolerance) ||
          (start.z >= z - tolerance && end.z <= z + tolerance)) {
        
        if (Math.abs(start.z - end.z) > tolerance) {
          const t = (z - start.z) / (end.z - start.z);
          const intersection = start.clone().lerp(end, t);
          intersection.z = z; // Ensure exact Z value
          intersections.push(intersection);
        }
      }
    });

    return intersections;
  }

  private sortContourPoints(points: THREE.Vector3[]): THREE.Vector3[] {
    if (points.length <= 2) return points;

    const sorted: THREE.Vector3[] = [points[0]];
    const remaining = points.slice(1);

    while (remaining.length > 0) {
      const current = sorted[sorted.length - 1];
      let nearestIndex = 0;
      let nearestDistance = current.distanceTo(remaining[0]);

      for (let i = 1; i < remaining.length; i++) {
        const distance = current.distanceTo(remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      sorted.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return sorted;
  }
}

export const fileParser = new ModelFileParser();