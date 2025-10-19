"use client";
import { cn } from '@/lib/format';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'> & {
  isSuccess?: boolean; // keep color sync with loader success
};

export function DottedSurface({ className, isSuccess = false, ...props }: DottedSurfaceProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points[];
    animationId: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    // Guard: if a previous instance exists (HMR or re-mount), dispose it and clear container
    if (sceneRef.current) {
      cancelAnimationFrame(sceneRef.current.animationId);
      try {
        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Points) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((m) => m.dispose());
            } else {
              (object.material as THREE.Material).dispose();
            }
          }
        });
        sceneRef.current.renderer.dispose();
      } catch (error) {
        // Ignore cleanup errors
         
        console.error('Error cleaning up scene:', error);
      }
      sceneRef.current = null;
    }
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Scene setup (match original)
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 2000, 10000);
    scene.clear();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene.fog.color, 0);

    // Layering fix: ensure canvas fills parent and is visible
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.zIndex = '1';

    containerRef.current.appendChild(renderer.domElement);

    // Create particles
    const particles: THREE.Points[] = [];
    const positions: number[] = [];
    const colors: number[] = [];

    // Create geometry for all particles
    const geometry = new THREE.BufferGeometry();

    // Decide base color (normalized 0..1 for Three.js)
    const baseColor = isSuccess
      ? [16 / 255, 185 / 255, 129 / 255] // green
      : [0, 179 / 255, 1.0]; // cyan

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0; // Will be animated
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);

        // Original used theme-based grayscale. We keep color-sync with loader instead.
        colors.push(baseColor[0], baseColor[1], baseColor[2]);
      }
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Mark position attribute as dynamic and initialize Y to wave prior to first render
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    {
      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const y = Math.sin(ix * 0.3) * 50 + Math.sin(iy * 0.5) * 50;
          positionAttr.setY(i, y);
          i++;
        }
      }
      positionAttr.needsUpdate = true;
    }

    // Create material
    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Create points object
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    particles.push(points);

    let count = 0;
    let animationId = 0;

    // Animation function (match original)
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const positionAttribute = geometry.attributes.position;
      const positions = positionAttribute.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3;

          // Animate Y position with sine waves
          positions[index + 1] =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50;

          i++;
        }
      }

      positionAttribute.needsUpdate = true;

      renderer.render(scene, camera);
      count += 0.1;
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Render once with initialized wave positions, then start animation
    renderer.render(scene, camera);
    animate();

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles: [points],
      animationId,
      count,
    };

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const container = containerRef.current;
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        try {
          sceneRef.current.scene.traverse((object) => {
            if (object instanceof THREE.Points) {
              object.geometry.dispose();
              if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose());
              } else {
                (object.material as THREE.Material).dispose();
              }
            }
          });
          sceneRef.current.scene.clear();
          sceneRef.current.renderer.dispose();
        } catch {
          // Ignore cleanup errors
        }
        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(
            sceneRef.current.renderer.domElement,
          );
        }
        sceneRef.current = null;
      }
    };
     
  }, [theme, isSuccess]);

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0', className)}
      {...props}
    />
  );
}

