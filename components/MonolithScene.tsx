'use client';
import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useGameStore, BlockData } from '@/store/useGameStore';
import { playSound } from '@/utils/soundEngine';

// --- 1. YENİ: KAMERA SARSINTISI SİSTEMİ ---
function CameraController() {
  const { blocks, gameState, actionTrigger } = useGameStore();
  const controlsRef = useRef<any>(null);
  const [shake, setShake] = useState(0);

  // Blok düştüğünde sarsıntıyı tetikle
  useEffect(() => {
    if (actionTrigger > 0 && gameState === 'playing') {
      const isPerfect = blocks[blocks.length - 1]?.isPerfect;
      // Hata yapıp bloğu kestiğinde çok daha şiddetli titrer (0.4), kusursuzda hafif titrer (0.15)
      setShake(isPerfect ? 0.15 : 0.4); 
    }
  }, [actionTrigger, gameState, blocks]);

  useFrame((state) => {
    if (gameState !== 'city_view') {
      const targetY = blocks.length > 3 ? blocks.length - 2 : 0;

      // Kameranın yumuşak takibi
      let camY = THREE.MathUtils.lerp(state.camera.position.y, targetY + 8, 0.05);
      let targetCenterY = THREE.MathUtils.lerp(controlsRef.current?.target.y || 0, targetY, 0.05);

      // Sarsıntı Matematiği
      let currentShakeX = 0;
      let currentShakeZ = 0;

      if (shake > 0) {
        currentShakeX = (Math.random() - 0.5) * shake;
        currentShakeZ = (Math.random() - 0.5) * shake;
        setShake((s) => Math.max(0, s - 0.03)); // Titremeyi yavaşça söndür
      }

      state.camera.position.y = camY;
      state.camera.position.x += currentShakeX;
      state.camera.position.z += currentShakeZ;

      if (controlsRef.current) {
        controlsRef.current.target.y = targetCenterY;
        controlsRef.current.update();
      }

      // Kameranın uzaya uçmaması için titremeyi frame sonunda geri al
      state.camera.position.x -= currentShakeX;
      state.camera.position.z -= currentShakeZ;
    }
  });

  return <OrbitControls ref={controlsRef} enableZoom={gameState === 'city_view'} enableRotate={gameState === 'city_view'} enablePan={false} />;
}

// --- 2. YENİ: DARBE IŞIĞI (IMPACT FLASH) ---
function ImpactEffects() {
  const { blocks, actionTrigger, gameState } = useGameStore();
  const lightRef = useRef<THREE.PointLight>(null);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    if (actionTrigger > 0 && gameState === 'playing') {
      setIntensity(10); // Işığı aniden patlat
    }
  }, [actionTrigger, gameState]);

  useFrame(() => {
    if (intensity > 0) {
      setIntensity((prev) => Math.max(0, prev - 0.6)); // Çok hızlı söndür (Flaş etkisi)
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
      position={[lastBlock.position[0], lastBlock.position[1] - 0.5, lastBlock.position[2]]}
      distance={8}
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
      <meshStandardMaterial map={colorMap} normalMap={normalMap} color="#555555" roughness={0.9} />
    </mesh>
  );
}

interface ActiveBlockProps {
  colorMap?: THREE.Texture;
  normalMap?: THREE.Texture;
}

function ActiveBlock({ colorMap, normalMap }: ActiveBlockProps) {
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
      playSound('gameover'); 
      setGameOver();
    } else {
      const isPerfect = distance < 0.15; 
      let newSize: [number, number, number] = [...lastBlock.size];
      let newPos: [number, number, number] = [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];

      if (isPerfect) {
        playSound('perfect'); 
        newPos[axisIndex] = targetPos; 
        addBlock({ position: newPos, size: newSize }, true);
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
        <meshStandardMaterial map={colorMap} normalMap={normalMap} color="#8a8a8a" roughness={0.9} />
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
    <div className="absolute inset-0 z-0 bg-[#070809]">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} camera={{ position: [6, 8, 6], fov: 42 }}>
        
        <color attach="background" args={['#070809']} />
        <fog attach="fog" args={['#070809', 15, 55]} />
        <Environment preset="night" environmentIntensity={0.6} />
        <ambientLight intensity={0.1} />
        <directionalLight castShadow position={[12, 25, 8]} intensity={2.5} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />

        {/* Patlama Efektini Sahneye Ekledik */}
        <ImpactEffects />

        {gameState !== 'city_view' && (
          <>
            {blocks.map((block, i) => (
              <mesh key={i} position={block.position} scale={block.size} receiveShadow castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                  map={textures.color} 
                  normalMap={textures.normal} 
                  color={i === 0 ? "#222222" : "#666666"} 
                  roughness={0.8} 
                  metalness={0.2}
                />
                {block.isPerfect && (
                  <Edges scale={1.002} threshold={15}>
                    <lineBasicMaterial color={[10, 8, 0]} toneMapped={false} />
                  </Edges>
                )}
              </mesh>
            ))}
            {debris.map((piece, i) => <FallingDebris key={i} data={piece} colorMap={textures.color} normalMap={textures.normal} />)}
            <ActiveBlock colorMap={textures.color} normalMap={textures.normal} />
          </>
        )}

        <gridHelper args={[150, 75, '#151719', '#070809']} position={[0, -0.49, 0]} />
        <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#070809" roughness={1} />
        </mesh>

        <CameraController />

        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} intensity={2.5} mipmapBlur />
          <Vignette eskil={false} offset={0.35} darkness={1.3} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}