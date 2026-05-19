'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { useGameStore, BlockData } from '@/store/useGameStore';
import { playSound } from '@/utils/soundEngine';

// YENİ VE HATASIZ: TASLAĞA SADIK AĞIR BETON VE ALTIN ÇATLAK RENKLERİ
const SKIN_CONFIGS: Record<string, { baseColor: string; activeColor: string; roughness: number; metalness: number; emissive?: string; useTexture: boolean }> = {
  default: { baseColor: "#7a7a7c", activeColor: "#ffc857", roughness: 1.0, metalness: 0.1, useTexture: true }, 
  cyber: { baseColor: "#202528", activeColor: "#00ffcc", roughness: 0.8, metalness: 0.3, useTexture: false }, 
  obsidian: { baseColor: "#111111", activeColor: "#ffd700", roughness: 0.9, metalness: 0.4, useTexture: false },
  ruby: { baseColor: "#2a1f22", activeColor: "#ff0055", roughness: 0.8, metalness: 0.2, useTexture: false }
};

function Cityscape() {
  const highScore = useGameStore(state => state.highScore);
  const buildingCount = Math.min(40, Math.floor(highScore / 50) + 5); 

  const buildings = useMemo(() => {
    const arr = [];
    for(let i = 0; i < 40; i++) {
       const isVisible = i < buildingCount;
       const height = 10 + Math.random() * 40; 
       const angle = Math.random() * Math.PI * 2;
       const radius = 25 + Math.random() * 30; 
       const x = Math.cos(angle) * radius;
       const z = Math.sin(angle) * radius;
       const width = 2 + Math.random() * 6;
       const depth = 2 + Math.random() * 6;
       arr.push({ x, z, width, height, depth, isVisible });
    }
    return arr;
  }, [buildingCount]);

  return (
    <group>
      {buildings.map((b, i) => b.isVisible && (
        <mesh key={i} position={[b.x, b.height / 2 - 5, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color="#0a0a0c" roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function CameraController() {
  const { blocks, gameState, actionTrigger } = useGameStore();
  const controlsRef = useRef<any>(null);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (actionTrigger > 0 && gameState === 'playing') {
      const isPerfect = blocks[blocks.length - 1]?.isPerfect;
      setShake(isPerfect ? 0.03 : 0.15); 
    }
  }, [actionTrigger, gameState, blocks]);

  useFrame((state) => {
    if (gameState === 'gameover') {
      const targetCenterY = blocks.length / 2;
      let camY = THREE.MathUtils.lerp(state.camera.position.y, blocks.length + 6, 0.02);
      state.camera.position.y = camY;
      if (controlsRef.current) {
        controlsRef.current.target.y = THREE.MathUtils.lerp(controlsRef.current.target.y, targetCenterY, 0.02);
        controlsRef.current.update();
      }
    } else if (gameState !== 'city_view') {
      const targetY = blocks.length > 3 ? blocks.length - 2 : 0;
      let camY = THREE.MathUtils.lerp(state.camera.position.y, targetY + 12, 0.05);
      let targetCenterY = THREE.MathUtils.lerp(controlsRef.current?.target.y || 0, targetY, 0.05);

      let currentShakeX = 0;
      let currentShakeZ = 0;

      if (shake > 0) {
        currentShakeX = (Math.random() - 0.5) * shake;
        currentShakeZ = (Math.random() - 0.5) * shake;
        setShake((s) => Math.max(0, s - 0.01)); 
      }

      state.camera.position.y = camY;
      state.camera.position.x += currentShakeX;
      state.camera.position.z += currentShakeZ;

      if (controlsRef.current) {
        controlsRef.current.target.y = targetCenterY;
        controlsRef.current.update();
      }
      state.camera.position.x -= currentShakeX;
      state.camera.position.z -= currentShakeZ;
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef} 
      enableZoom={gameState !== 'playing'} 
      enableRotate={gameState !== 'playing'} 
      enablePan={false} 
      autoRotate={gameState === 'gameover'}
      autoRotateSpeed={0.5} 
    />
  );
}

// YUMUŞATILMIŞ IŞIK EFEKTİ (Kör edici beyaz patlama düzeltildi)
function ImpactEffects() {
  const { blocks, actionTrigger, gameState, currentSkin } = useGameStore();
  const lightRef = useRef<THREE.PointLight>(null);
  const [intensity, setIntensity] = useState(0);
  const skin = SKIN_CONFIGS[currentSkin] || SKIN_CONFIGS.default;

  useEffect(() => {
    if (actionTrigger > 0 && gameState === 'playing') {
      setIntensity(8); // Eskiden 50'ydi, çok patlıyordu. Şimdi 8.
    }
  }, [actionTrigger, gameState]);

  useFrame(() => {
    if (intensity > 0) {
      setIntensity((prev) => Math.max(0, prev - 0.4)); 
      if (lightRef.current) {
         lightRef.current.intensity = intensity;
      }
    }
  });

  if (blocks.length === 0) return null;
  const lastBlock = blocks[blocks.length - 1];
  const isPerfect = lastBlock.isPerfect;

  return (
    <pointLight
      ref={lightRef}
      position={[lastBlock.position[0], lastBlock.position[1] - 0.2, lastBlock.position[2]]}
      distance={10}
      color={isPerfect ? skin.activeColor : "#ffffff"}
      intensity={0}
    />
  );
}

interface DebrisProps {
  data: BlockData;
  colorMap?: THREE.Texture;
  normalMap?: THREE.Texture;
}

function FallingDebris({ data, colorMap, normalMap }: DebrisProps) {
  const meshRef = useRef<THREE.Group>(null);
  const currentSkin = useGameStore(state => state.currentSkin);
  const skin = SKIN_CONFIGS[currentSkin] || SKIN_CONFIGS.default;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y -= 0.2; 
      meshRef.current.rotation.x += 0.02; 
      meshRef.current.rotation.z += 0.02;
    }
  });
  return (
    <group ref={meshRef} position={data.position}>
      <mesh scale={data.size} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          map={skin.useTexture ? colorMap : undefined} 
          normalMap={skin.useTexture ? normalMap : undefined} 
          color={skin.baseColor} 
          roughness={skin.roughness}
          metalness={skin.metalness}
        />
      </mesh>
    </group>
  );
}

interface ActiveBlockProps {
  colorMap?: THREE.Texture;
  normalMap?: THREE.Texture;
}

function ActiveBlock({ colorMap, normalMap }: ActiveBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { blocks, actionTrigger, addBlock, addDebris, setGameOver, gameState, combo, currentSkin } = useGameStore();
  const skin = SKIN_CONFIGS[currentSkin] || SKIN_CONFIGS.default;
  
  const lastBlock = blocks[blocks.length - 1];
  const level = blocks.length;
  const axis = level % 2 === 0 ? 'x' : 'z'; 
  
  const baseSpeed = 2.0;
  const speedMultiplier = 1 + Math.min(level * 0.05, 1.2);
  const speed = baseSpeed * speedMultiplier;

  useEffect(() => {
    if (actionTrigger === 0 || gameState !== 'playing' || !meshRef.current) return;
    
    const axisIndex = axis === 'x' ? 0 : 2;
    const currentPos = axis === 'x' ? meshRef.current.position.x : meshRef.current.position.z;
    const targetPos = lastBlock.position[axisIndex];
    const distance = Math.abs(currentPos - targetPos);
    const currentSize = lastBlock.size[axisIndex];

    if (distance > currentSize) {
      playSound('gameover'); 
      setGameOver();
    } else {
      const isPerfect = distance < 0.15; 
      let newSize: [number, number, number] = [...lastBlock.size];
      let newPos: [number, number, number] = [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];

      if (isPerfect) {
        playSound('perfect'); 
        newPos[axisIndex] = targetPos; 
        addBlock({ position: newPos, size: newSize }, true, false);
      } else {
        playSound('drop'); 
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
    const positionOffset = Math.sin(time * speed) * 4.5; 
    
    if (axis === 'x') {
      meshRef.current.position.set(lastBlock.position[0] + positionOffset, lastBlock.position[1] + 1, lastBlock.position[2]);
    } else {
      meshRef.current.position.set(lastBlock.position[0], lastBlock.position[1] + 1, lastBlock.position[2] + positionOffset);
    }
  });

  if (gameState !== 'playing') return null;

  return (
    <mesh ref={meshRef} scale={lastBlock.size} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        map={skin.useTexture ? colorMap : undefined} 
        normalMap={skin.useTexture ? normalMap : undefined} 
        color={skin.baseColor} 
        roughness={skin.roughness}
        metalness={skin.metalness}
      />
      {/* HOLOGRAFİK YEŞİL IZGARA (Lazer Hedefleme) */}
      <mesh position={[0, -0.501, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1, 4, 4]} />
        <meshBasicMaterial color="#00ff66" wireframe transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </mesh>
  );
}

export default function MonolithScene() {
  const { blocks, debris, gameState, currentSkin } = useGameStore();
  const [textures, setTextures] = useState<{ color?: THREE.Texture, normal?: THREE.Texture }>({});
  const skin = SKIN_CONFIGS[currentSkin] || SKIN_CONFIGS.default;

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/textures/concrete_color.jpg', (colorMap) => {
      colorMap.wrapS = THREE.RepeatWrapping;
      colorMap.wrapT = THREE.RepeatWrapping;
      colorMap.repeat.set(2, 2);
      setTextures(prev => ({ ...prev, color: colorMap }));
    });
    loader.load('/textures/concrete_normal.png', (normalMap) => {
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.repeat.set(2, 2);
      setTextures(prev => ({ ...prev, normal: normalMap }));
    });
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-[#0a0b0e]">
      <Canvas shadows={{ type: THREE.PCFSoftShadowMap }} dpr={[1, 2]} camera={{ position: [16, 20, 16], fov: 20 }}>
        
        <color attach="background" args={['#0a0b0e']} />
        <fogExp2 attach="fog" args={['#0a0b0e', 0.025]} />
        
        <ambientLight intensity={0.1} />
        
        <directionalLight 
          castShadow 
          position={[12, 18, 5]} 
          intensity={4.5} 
          color="#ffffff" 
          shadow-mapSize={[2048, 2048]} 
          shadow-bias={-0.0005} 
        />
        
        <Cityscape />

        <ImpactEffects />

        {gameState !== 'city_view' && (
          <group position={[0, -2, 0]}>
            {blocks.map((block, i) => (
              <mesh key={i} position={block.position} scale={block.size} receiveShadow castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                  map={skin.useTexture ? textures.color : undefined} 
                  normalMap={skin.useTexture ? textures.normal : undefined} 
                  color={i === 0 ? "#111" : skin.baseColor} 
                  roughness={skin.roughness}
                  metalness={skin.metalness}
                />
                
                {/* ALTIN ÇATLAK (PERFECT COMBO) EFEKTİ */}
                {block.isPerfect && (
                  <Edges scale={1.01} threshold={10}>
                    <lineBasicMaterial color={skin.activeColor} transparent opacity={0.9} toneMapped={false} />
                  </Edges>
                )}
              </mesh>
            ))}
            {debris.map((piece, i) => <FallingDebris key={i} data={piece} colorMap={textures.color} normalMap={textures.normal} />)}
            <ActiveBlock colorMap={textures.color} normalMap={textures.normal} />
          </group>
        )}

        <mesh receiveShadow position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.8} />
        </mesh>

        <CameraController />

        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.8} intensity={2.5} mipmapBlur />
          <Noise opacity={0.03} /> 
          <Vignette eskil={false} offset={0.2} darkness={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}