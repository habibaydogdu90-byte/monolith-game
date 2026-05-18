'use client';
import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useGameStore, BlockData } from '@/store/useGameStore';
import { playSound } from '@/utils/soundEngine';

function CameraController() {
  const { blocks, gameState } = useGameStore();
  const controlsRef = useRef<any>(null);

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
    
    // Yükleme işlemini sessiz ve pürüzsüz hale getirdik
    loader.load('/textures/concrete_color.jpg', (colorMap) => {
      colorMap.wrapS = THREE.RepeatWrapping;
      colorMap.wrapT = THREE.RepeatWrapping;
      setTextures(prev => ({ ...prev, color: colorMap }));
    });

    // Uzantı .png olarak güncellendi!
    loader.load('/textures/concrete_normal.png', (normalMap) => {
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      setTextures(prev => ({ ...prev, normal: normalMap }));
    });
  }, []);

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
                  map={textures.color} 
                  normalMap={textures.normal} 
                  color={i === 0 ? "#333333" : "#757575"} 
                  roughness={0.9} 
                />
                {block.isPerfect && (
                  <Edges scale={1.002} threshold={15}>
                    <lineBasicMaterial color="#ffb800" toneMapped={false} />
                  </Edges>
                )}
              </mesh>
            ))}
            {debris.map((piece, i) => <FallingDebris key={i} data={piece} colorMap={textures.color} normalMap={textures.normal} />)}
            <ActiveBlock colorMap={textures.color} normalMap={textures.normal} />
          </>
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