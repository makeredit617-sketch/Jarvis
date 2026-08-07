import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 3D core visualization — Phase 7 slice 1.
 *
 * Deliberately lightweight given confirmed hardware constraints
 * (2 CPU cores, 3.7GB RAM, no CUDA — see src/system-intelligence/).
 * No antialiasing, no shadows, no post-processing, low poly counts,
 * pixel ratio capped at 1.5.
 */
export default function JarvisVisualEngine3D({ state }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const size = mount.clientWidth;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "low-power"
    });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const palette = {
      idle: 0x2f8fff,
      listening: 0x4fd8ff,
      thinking: 0xeaf6ff
    };
    const color = palette[state] || palette.idle;

    const coreGeometry = new THREE.IcosahedronGeometry(1.1, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.2,
      flatShading: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    const shellGeometry = new THREE.IcosahedronGeometry(1.8, 0);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    scene.add(shell);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(color, 1.2, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const speed = state === "thinking" ? 0.02 : state === "listening" ? 0.012 : 0.006;

    let animationFrameId;
    let disposed = false;

    function animate() {
      if (disposed) return;
      core.rotation.y += speed;
      core.rotation.x += speed * 0.4;
      shell.rotation.y -= speed * 0.5;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrameId);
      coreGeometry.dispose();
      coreMaterial.dispose();
      shellGeometry.dispose();
      shellMaterial.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [state]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", aspectRatio: "1 / 1" }}
    />
  );
}
