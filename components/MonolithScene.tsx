'use client';
import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useGameStore, BlockData } from '@/store/useGameStore';
import { playSound } from '@/utils/soundEngine';

function Shockwave({ size }: { size: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current && ref.current.scale.x < 1.8) {
      ref.current.scale.x += 0.06;
      ref.current.scale.y += 0.06; 
      (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (ref.current.material as THREE.MeshBasicMaterial).opacity - 0.04);
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.51, 0]}>
      <planeGeometry args={[size[0], size[2]]} />
      <meshBasicMaterial color={[15, 10, 0]} transparent opacity={1} toneMapped={false} wireframe />
    </mesh>
  );
}

function RubbleParticle({ size }: { size: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 0.4, (Math.random() - 0.5) * 0.4));
  const rotationSpeed = useRef(new THREE.Vector3(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2));

  useFrame(() => {
    if (ref.current) {
      ref.current.position.add(velocity.current);
      velocity.current.y -= 0.02; 
      ref.current.rotation.x += rotationSpeed.current.x;
      ref.current.rotation.y += rotationSpeed.current.y;
      ref.current.scale.multiplyScalar(0.92); 
    }
  });

  const pSize = (Math.random() * 0.15 + 0.05) * Math.max(size[0], size[2]);

  return (
    <mesh ref={ref}>
      <boxGeometry args={[pSize, pSize, pSize]} />
      <meshStandardMaterial color="#888888" roughness={1} />
    </mesh>
  );
}

function CameraController() {
  const { blocks, gameState, actionTrigger } = useGameStore();
  const controlsRef = useRef<any>(null);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (actionTrigger > 0 && gameState === 'playing') {
      const isPerfect = blocks[blocks.length - 1]?.isPerfect;
      // DÜZELTME 1: Sarsıntı kuvveti %70 azaltıldı. (Perfect: 0.05, Hata: 0.25)
      setShake(isPerfect ? 0.05 : 0.25); 
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
      // DÜZELTME 2: Kamera yüksekliği +8'den +12'ye çıkarıldı. Kuleye daha tepeden bakacak.
      let camY = THREE.MathUtils.lerp(state.camera.position.y, targetY + 12, 0.05);
      let targetCenterY = THREE.MathUtils.lerp(controlsRef.current?.target.y || 0, targetY, 0.05);

      let currentShakeX = 0;
      let currentShakeZ = 0;

      if (shake > 0) {
        currentShakeX = (Math.random() - 0.5) * shake;
        currentShakeZ = (Math.random() - 0.5) * shake;
        setShake((s) => Math.max(0, s - 0.015)); 
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
      autoRotateSpeed={1.5}
    />
  );
}

function ImpactEffects() {
  const { blocks, actionTrigger, gameState } = useGameStore();
  const lightRef = useRef<THREE.PointLight>(null);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    if (actionTrigger > 0 && gameState === 'playing') {
      setIntensity(50); 
    }
  }, [actionTrigger, gameState]);

  useFrame(() => {
    if (intensity > 0) {
      setIntensity((prev) => Math.max(0, prev - 0.3)); 
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
      distance={15}
      color={isPerfect ? "#ffb800" : "#ffffff"}
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
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y -= 0.15; 
      meshRef.current.rotation.x += 0.03; 
      meshRef.current.rotation.z += 0.03;
    }
  });
  return (
    <group ref={meshRef} position={data.position}>
      <mesh scale={data.size}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={colorMap} normalMap={normalMap} color="#666666" roughness={0.8} />
      </mesh>
      {[...Array(6)].map((_, i) => <RubbleParticle key={i} size={data.size} />)}
    </group>
  );
}

interface ActiveBlockProps {
  colorMap?: THREE.Texture;
  normalMap?: THREE.Texture;
}

function ActiveBlock({ colorMap, normalMap }: ActiveBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { blocks, actionTrigger, addBlock, addDebris, setGameOver, gameState, combo } = useGameStore();
  
  const lastBlock = blocks[blocks.length - 1];
  const level = blocks.length;
  const axis = level % 2 === 0 ? 'x' : 'z'; 
  
  const baseSpeed = 2.0;
  const speedMultiplier = 1 + Math.min(level * 0.06, 1.5);
  const rhythmVariation = Math.sin(level * Math.PI / 4) * 0.6; 
  const speed = baseSpeed * speedMultiplier + rhythmVariation;

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
        
        let isGrowth = false;
        if (combo >= 2 && (newSize[0] < 3 || newSize[2] < 3)) {
          isGrowth = true;
          newSize[0] = Math.min(3, newSize[0] + 0.4);
          newSize[2] = Math.min(3, newSize[2] + 0.4);
        }
        
        addBlock({ position: newPos, size: newSize }, true, isGrowth);
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
        <meshStandardMaterial map={colorMap} normalMap={normalMap} color="#aaaaaa" roughness={0.6} />
      </mesh>
      <mesh position={[lastBlock.position[0], lastBlock.position[1] + 0.502, lastBlock.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lastBlock.size[0], lastBlock.size[2], 5, 5]} />
        <meshBasicMaterial color="#00ff66" wireframe transparent opacity={0.5} toneMapped={false} />
      </mesh>
    </>
  );
}

export default function MonolithScene() {
  const { blocks, debris, gameState } = useGameStore();
  const [textures, setTextures] = useState<{ color?: THREE.Texture, normal?: THREE.Texture }>({});

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    loader.load('/textures/concrete_color.jpg', (colorMap) => {
      colorMap.wrapS = THREE.RepeatWrapping;
      colorMap.wrapT = THREE.RepeatWrapping;
      setTextures(prev => ({ ...prev, color: colorMap }));
    });

    loader.load('/textures/concrete_normal.png', (normalMap) => {
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      setTextures(prev => ({ ...prev, normal: normalMap }));
    });
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-[#101112]">
      {/* DÜZELTME 3: Kameranın başlangıç mesafesi uzaklaştırıldı ve görüş açısı (FOV) 42'den 45'e çıkarıldı */}
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} camera={{ position: [8, 12, 8], fov: 45 }}>
        
        <color attach="background" args={['#101112']} />
        <fog attach="fog" args={['#101112', 20, 70]} />
        <Environment preset="city" environmentIntensity={0.8} />
        
        <ambientLight intensity={0.3} />
        <directionalLight castShadow position={[12, 25, 8]} intensity={4} color="#ffeebb" shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />

        <ImpactEffects />

        {gameState !== 'city_view' && (
          <>
            {blocks.map((block, i) => (
              <mesh key={i} position={block.position} scale={block.size} receiveShadow castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                  map={textures.color} 
                  normalMap={textures.normal} 
                  color={i === 0 ? "#444444" : "#999999"} 
                  roughness={0.7} 
                  metalness={0.2}
                />
                
                {block.isPerfect && (
                  <>
                    <Edges scale={1.002} threshold={15}>
                      <lineBasicMaterial color={[15, 10, 0]} toneMapped={false} />
                    </Edges>
                    <Shockwave size={block.size} />
                  </>
                )}
              </mesh>
            ))}
            {debris.map((piece, i) => <FallingDebris key={i} data={piece} colorMap={textures.color} normalMap={textures.normal} />)}
            <ActiveBlock colorMap={textures.color} normalMap={textures.normal} />
          </>
        )}

        <gridHelper args={[150, 75, '#1e2022', '#101112']} position={[0, -0.49, 0]} />
        <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#101112" roughness={1} />
        </mesh>

        <CameraController />

        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={3.5} mipmapBlur />
          <Vignette eskil={false} offset={0.3} darkness={1.2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}