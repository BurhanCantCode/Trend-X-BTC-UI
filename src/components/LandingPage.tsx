'use client'

import { useState, Suspense, useRef, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, extend as extendThree, type Object3DNode } from '@react-three/fiber'
import { OrbitControls, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'
import { Group, Vector3, Vector2 } from 'three'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { useSpring, animated } from '@react-spring/three'
import { Sparkles, shaderMaterial } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import { useAuth } from "@clerk/nextjs";
import WelcomeLoader from './WelcomeLoader';

// Custom shader for the holographic effect
const HolographicMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('#F7931A'),
    freqX: 4,
    freqY: 4,
    freqZ: 4,
    amp: 0.2
  },
  // Vertex shader
  `
    uniform float time;
    uniform float freqX;
    uniform float freqY;
    uniform float freqZ;
    uniform float amp;
    
    varying vec2 vUv;
    varying float vDisplacement;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      float displacement = sin(pos.x * freqX + time) * 
                         sin(pos.y * freqY + time) * 
                         sin(pos.z * freqZ + time) * amp;
      
      pos += normal * displacement;
      vDisplacement = displacement;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 color;
    uniform float time;
    
    varying vec2 vUv;
    varying float vDisplacement;
    
    void main() {
      float pulse = sin(time * 2.0) * 0.5 + 0.5;
      vec3 color = mix(color, color * 2.0, pulse);
      float alpha = 0.8 + vDisplacement * 0.2;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
)

// Extend Three.js with the custom material
extendThree({ HolographicMaterial })

// Define custom element type
interface CustomElements {
  holographicMaterial: Object3DNode<
    THREE.ShaderMaterial & {
      time: number;
      color: THREE.Color;
      freqX: number;
      freqY: number;
      freqZ: number;
      amp: number;
    },
    typeof HolographicMaterial
  >
}

// Extend JSX.IntrinsicElements
declare module '@react-three/fiber' {
  interface ThreeElements {
    holographicMaterial: Object3DNode<
      THREE.ShaderMaterial & {
        time: number;
        color: THREE.Color;
        freqX: number;
        freqY: number;
        freqZ: number;
        amp: number;
      },
      typeof HolographicMaterial
    >
  }
}

function ParticleRing({ radius = 2, count = 80 }) {
  const points = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      temp.push(
        new Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        )
      )
    }
    return temp
  }, [count, radius])

  const particleRef = useRef<Group>(null)

  useFrame((state) => {
    if (particleRef.current) {
      particleRef.current.rotation.z += 0.001
      particleRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      particleRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  return (
    <group ref={particleRef}>
      {points.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#F7931A" transparent={true} opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function BitcoinLogoTexture() {
  const texture = useLoader(TextureLoader, '/BitcoinSign.svg')
  
  return (
    <mesh>
      <planeGeometry args={[2.8, 2.8]} />
      <meshPhysicalMaterial 
        map={texture}
        transparent={true}
        color="#F7931A"
        emissive="#F7931A"
        emissiveIntensity={0.6}
        metalness={0.7}
        roughness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.1}
        opacity={1}
      />
    </mesh>
  )
}

function CoinEdgeDetail() {
  return (
    <group>
      {Array.from({ length: 120 }).map((_, i) => (
        <mesh key={i} rotation={[0, (i / 120) * Math.PI * 2, 0]} position={[3, 0, 0]}>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial attach="material" args={undefined} />
        </mesh>
      ))}
    </group>
  )
}

function CircularText() {
  return (
    <group>
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i / 32) * Math.PI * 2
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(angle) * 2.7,
              Math.sin(angle) * 2.7,
              0.1
            ]}
            rotation={[0, 0, angle + Math.PI / 2]}
          >
            <boxGeometry args={[0.1, 0.3, 0.02]} />
            <meshPhysicalMaterial 
              color="#F7931A"
              metalness={0.9}
              roughness={0.1}
              clearcoat={1}
              clearcoatRoughness={0.1}
              emissive="#F7931A"
              emissiveIntensity={0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function EnhancedBitcoinModel() {
  const mainRef = useRef<Group>(null)
  const bitcoinGold = '#F7931A'
  const [rotationY, setRotationY] = useState(0)
  
  const { scale } = useSpring({
    from: { scale: 0 },
    to: { scale: 1 },
    config: { mass: 1, tension: 120, friction: 14 }
  })

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    setRotationY(prev => prev + 0.002)
    
    if (mainRef.current) {
      mainRef.current.position.y = Math.sin(time * 0.5) * 0.1
    }
  })

  const commonMaterial = {
    color: bitcoinGold,
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 1.5,
    emissive: bitcoinGold,
    emissiveIntensity: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    reflectivity: 1
  }

  return (
    <animated.group 
      ref={mainRef}
      position={[0, 0, 0]} 
      rotation={[0, rotationY, 0]}
      scale={scale}
    >
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
        {/* Main coin body */}
        <mesh 
          castShadow 
          receiveShadow 
          position={[0, 0, 0]} 
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[3, 3, 0.3, 64]} />
          <meshPhysicalMaterial {...commonMaterial} />
        </mesh>

        {/* Optimized lighting - Consolidated from multiple lights */}
        <group>
          <pointLight 
            position={[3, 3, 3]} 
            intensity={1.2}
            color="#FFFFFF"
            distance={10}
            castShadow
          />
          <pointLight 
            position={[-3, -3, -3]} 
            intensity={1.2}
            color="#FFFFFF"
            distance={10}
            castShadow
          />
        </group>

        {/* Front side details with enhanced shadows */}
        <group position={[0, 0, 0.16]}>
          {/* Optimized lighting - single spotlight for front */}
          <spotLight
            position={[0, 0, 2]}
            angle={0.6}
            penumbra={0.5}
            intensity={2.5}
            color={bitcoinGold}
            distance={5}
            castShadow
          />
          
          <BitcoinLogoTexture />
          <CircularText />
          {/* Inner ring with shadow */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <ringGeometry args={[2.2, 2.4, 64]} />
            <meshPhysicalMaterial 
              color={bitcoinGold}
              metalness={0.95}
              roughness={0.05}
              emissive={bitcoinGold}
              emissiveIntensity={0.1}
              clearcoat={1}
            />
          </mesh>
          {/* Outer ring with shadow */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <ringGeometry args={[2.8, 3, 64]} />
            <meshPhysicalMaterial 
              color={bitcoinGold}
              metalness={0.95}
              roughness={0.05}
              emissive={bitcoinGold}
              emissiveIntensity={0.1}
              clearcoat={1}
            />
          </mesh>
        </group>

        {/* Back side details with enhanced shadows */}
        <group position={[0, 0, -0.16]} rotation={[0, Math.PI, 0]}>
          {/* Optimized lighting - single spotlight for back */}
          <spotLight
            position={[0, 0, 2]}
            angle={0.6}
            penumbra={0.5}
            intensity={2.5}
            color={bitcoinGold}
            distance={5}
            castShadow
          />
          
          <BitcoinLogoTexture />
          <CircularText />
          {/* Inner ring with shadow */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <ringGeometry args={[2.2, 2.4, 64]} />
            <meshPhysicalMaterial 
              color={bitcoinGold}
              metalness={0.95}
              roughness={0.05}
              emissive={bitcoinGold}
              emissiveIntensity={0.1}
              clearcoat={1}
            />
          </mesh>
          {/* Outer ring with shadow */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <ringGeometry args={[2.8, 3, 64]} />
            <meshPhysicalMaterial 
              color={bitcoinGold}
              metalness={0.95}
              roughness={0.05}
              emissive={bitcoinGold}
              emissiveIntensity={0.1}
              clearcoat={1}
            />
          </mesh>
        </group>

        {/* Enhanced edge details with shadows */}
        <CoinEdgeDetail />

        {/* Removed redundant scene lighting - using Environment and main lights */}

        <Sparkles
          count={20}
          scale={2}
          size={0.6}
          speed={0.2}
          color={bitcoinGold}
          opacity={0.3}
          position={[0, 0, 0.3]}
        />
      </Float>
    </animated.group>
  )
}

function EnhancedScene() {
  return (
    <Canvas 
      camera={{ position: [0, 0, 15], fov: 45 }}
      shadows
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'black',
        zIndex: 0
      }}
    >
      <Suspense fallback={null}>
        <Environment preset="studio" />
        
        <ambientLight intensity={0.2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.3}
          penumbra={1}
          intensity={1.5}
          color="#ffffff"
          castShadow
        />

        <EnhancedBitcoinModel />
        <ParticleRing radius={8} count={120} />
        
        <EffectComposer>
          <Bloom 
            intensity={0.8}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            radius={0.8}
          />
          <ChromaticAberration
            offset={new Vector2(0.001, 0.001)}
            radialModulation={false}
            modulationOffset={0.0}
          />
        </EffectComposer>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 2.5}
        />
      </Suspense>
    </Canvas>
  )
}

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Increase loading time to 10 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <AnimatePresence>
        {isLoading && <WelcomeLoader />}
      </AnimatePresence>

      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#F7931A_0%,transparent_35%)] opacity-15" />
      </div>
      
      {/* Canvas container */}
      <div className="relative h-screen w-full">
        <div className="absolute inset-0">
          <EnhancedScene />
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 sm:mb-6">
              Predict Bitcoin&apos;s Future{" "}
              <span className="text-[#F7931A]">
                with AI Precision
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              Harness the power of machine learning for smarter crypto investments
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link href={isSignedIn ? "/dashboard" : "/start"}>
                <button className="bg-[#F7931A] text-black px-6 sm:px-8 py-3 rounded-lg font-medium text-base sm:text-lg">
                  {isSignedIn ? "Go to Dashboard" : "Start Predicting Now"}
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
