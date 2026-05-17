'use client';
import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useGameStore, BlockData } from '@/store/useGameStore';

// --- PROSEDÜREL BRÜTALİST BETON DOKU MOTORU ---
// Kodla, ham betonun gözenek ve pürüzlerini çizen fonksiyon
const createConcreteTexture = () => {
  if (typeof window === 'undefined') return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Ana Beton Grisi Taban
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, 512, 512);

  // 2. Mikro Gözenekler ve Çimento Grenleri (Noise)
  for (let i = 0; i < 90000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 1.5;
    const noise = (Math.random() - 0.5) * 40; // Açık ve koyu noktacıklar
    ctx.fillStyle = `rgba(${122 + noise}, ${122 + noise}, ${122 + noise}, 0.2)`;
    ctx.fillRect(x, y, size, size);
  }

  // 3. Kalıp Lekeleri ve Su İzleri (Mimari Kusurlar)
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = Math.random() * 120 + 40;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(45, 45, 45, 0.25)');
    gradient.addColorStop(1, 'rgba(122, 122, 122, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1); 
  return texture;
};

function CameraController() {
  const { blocks, gameState } = useGameStore();
  const controlsRef = useRef<any>(null);
  const prevGameState = useRef(gameState);

  useEffect(() => {
    if (gameState === 'city_view' && prevGameState.current !== 'city_view') {
      if (controlsRef.current) {
        const cam = controlsRef.current.object;
        cam.position.set(20, 15, 20);
        controlsRef.current.target.set(0, 2, 0);
        controlsRef.current.update();
      }
    }
    prevGameState.current = gameState;
  }, [gameState]);

  useFrame((state) => {
    if (gameState !== 'city_view') {
      const targetY = blocks.length > 3 ? blocks.length - 2 : 0;
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + 8, 0.05);
      if (controlsRef.current) {
        controlsRef.current.target.y = THREE.MathUtils.lerp(controlsRef.current.target.y, targetY, 0.05);
        controlsRef.current.update();
      }
    }
  });

  return <OrbitControls ref={controlsRef} enableZoom={gameState === 'city_view'} enableRotate={gameState === 'city_view'} enablePan={false} />;
}

function FallingDebris({ data, texture }: { data: BlockData; texture: THREE.CanvasTexture | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y -= 0.15; 
      meshRef.current.rotation.x += 0.03; 
      meshRef.current.rotation.z += 0.03;
    }
  });
  return (
    <mesh ref={meshRef} position={data.position} scale={data.size}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666666" map={texture} bumpMap={texture} bumpScale={0.03} roughness={1.0} />
    </mesh>
  );
}

function ActiveBlock({ texture }: { texture: THREE.CanvasTexture | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { blocks, actionTrigger, addBlock, addDebris, setGameOver, gameState } = useGameStore();
  
  const lastBlock = blocks[blocks.length - 1];
  const level = blocks.length;
  const axis = level % 2 === 0 ? 'x' : 'z'; 
  const speed = 2.0 + Math.min(level * 0.12, 3.5); 

  useEffect(() => {
    if (actionTrigger === 0 || gameState !== 'playing' || !meshRef.current) return;
    
    const axisIndex = axis === 'x' ? 0 : 2;
    const currentPos = axis === 'x' ? meshRef.current.position.x : meshRef.current.position.z;
    const targetPos = lastBlock.position[axisIndex];
    const distance = Math.abs(currentPos - targetPos);
    const currentSize = lastBlock.size[axisIndex];

    if (distance > currentSize) {
      setGameOver();
    } else {
      const isPerfect = distance < 0.15; 
      
      let newSize: [number, number, number] = [...lastBlock.size];
      let newPos: [number, number, number] = [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];

      if (isPerfect) {
        newPos[axisIndex] = targetPos; 
        addBlock({ position: newPos, size: newSize }, true);
      } else {
        const overhang = distance;
        newSize[axisIndex] = currentSize - overhang;
        const isGreater = currentPos > targetPos;
        const offset = (isGreater ? overhang : -overhang) / 2;
        newPos[axisIndex] = currentPos - offset;

        let debrisSize: [number, number, number] = [...lastBlock.size];
        debrisSize[axisIndex] = overhang;
        let debrisPos: [number, number, number] = [...newPos];
        const debrisOffset = (isGreater ? newSize[axisIndex] : -newSize[axisIndex]) / 2 + (isGreater ? overhang : -overhang) / 2;
        debrisPos[axisIndex] = newPos[axisIndex] + debrisOffset;

        addBlock({ position: newPos, size: newSize }, false);
        addDebris({ position: debrisPos, size: debrisSize }); 
      }
    }
  }, [actionTrigger]);

  useFrame((state) => {
    if (gameState !== 'playing' || !meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const positionOffset = Math.sin(time * speed) * 4; 
    
    if (axis === 'x') {
      meshRef.current.position.set(lastBlock.position[0] + positionOffset, lastBlock.position[1] + 1, lastBlock.position[2]);
    } else {
      meshRef.current.position.set(lastBlock.position[0], lastBlock.position[1] + 1, lastBlock.position[2] + positionOffset);
    }
  });

  if (gameState !== 'playing') return null;

  return (
    <>
      <mesh ref={meshRef} scale={lastBlock.size} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8a8a8a" map={texture} bumpMap={texture} bumpScale={0.04} roughness={1.0} />
      </mesh>
      {/* Yeşil Neon Izgara */}
      <mesh position={[lastBlock.position[0], lastBlock.position[1] + 0.502, lastBlock.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lastBlock.size[0], lastBlock.size[2], 5, 5]} />
        <meshBasicMaterial color="#00ff66" wireframe transparent opacity={0.5} toneMapped={false} />
      </mesh>
    </>
  );
}

export default function MonolithScene() {
  const { blocks, debris, gameState, cityBuildings } = useGameStore();
  const concreteTexture = useMemo(() => createConcreteTexture(), []);

  return (
    <div className="absolute inset-0 z-0 bg-[#0e0f10]">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={1} camera={{ position: [6, 8, 6], fov: 42 }}>
        
        <color attach="background" args={['#0e0f10']} />
        <fog attach="fog" args={['#0e0f10', 15, 65]} />
        
        <ambientLight intensity={0.4} />
        <directionalLight castShadow position={[12, 25, 8]} intensity={1.8} shadow-mapSize={[1024, 1024]} />

        {gameState !== 'city_view' && (
          <>
            {blocks.map((block, i) => (
              <mesh key={i} position={block.position} scale={block.size} receiveShadow castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                  color={i === 0 ? "#333333" : "#757575"} 
                  map={concreteTexture} bumpMap={concreteTexture} bumpScale={0.04} roughness={1.0} 
                />
                {block.isPerfect && (
                  <Edges scale={1.002} threshold={15}>
                    <lineBasicMaterial color="#ffb800" toneMapped={false} />
                  </Edges>
                )}
              </mesh>
            ))}
            {debris.map((piece, i) => <FallingDebris key={i} data={piece} texture={concreteTexture} />)}
            <ActiveBlock texture={concreteTexture} />
          </>
        )}

        {gameState === 'city_view' && (
          cityBuildings.map((bldg) => (
            <group key={bldg.id} position={[bGridX(bldg.gridX), 0, bldg.gridZ]}>
              {bldg.blocks && bldg.blocks.map((block, idx) => (
                <mesh key={idx} position={block.position} scale={block.size} castShadow receiveShadow>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial 
                    color={idx === 0 ? "#1a1a1a" : "#666666"} 
                    map={concreteTexture} bumpMap={concreteTexture} bumpScale={0.04} roughness={1.0}
                  />
                  {block.isPerfect && (
                    <Edges scale={1.002} threshold={15}>
                      <lineBasicMaterial color="#ffb800" toneMapped={false} opacity={0.6} transparent />
                    </Edges>
                  )}
                </mesh>
              ))}
            </group>
          ))
        )}

        <gridHelper args={[150, 75, '#1e2022', '#0e0f10']} position={[0, -0.49, 0]} />
        <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#0e0f10" roughness={1} />
        </mesh>

        <CameraController />

        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.9} intensity={2.2} mipmapBlur />
          <Vignette eskil={false} offset={0.3} darkness={1.2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function bGridX(x: number) {
  return x === 0 ? 0.1 : x;
}