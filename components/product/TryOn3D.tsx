"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { GarmentKind } from "@/lib/tryOn";

// Mannequin stylisé construit à partir de formes simples (aucun modèle 3D à
// télécharger) : la pièce prend la couleur choisie dans le nuancier et la
// personnalisation tapée s'affiche en direct dans le dos.

const SKIN = "#cdbfae";
const DEFAULT_TOP = "#141414";
const DEFAULT_BOTTOM = "#3b4250"; // jean brut : contraste avec un haut noir

// Profil du buste (rayon en fonction de la hauteur), échantillonné à pas
// régulier pour que la coordonnée de texture v reste proportionnelle à la
// hauteur : on peut alors placer le logo à une hauteur précise.
const TORSO_BOTTOM = 0.86;
const TORSO_TOP = 1.47;
const TORSO_KEYS: [number, number][] = [
  [0.86, 0.172],
  [1.0, 0.164],
  [1.12, 0.17],
  [1.25, 0.186],
  [1.36, 0.19],
  [1.42, 0.165],
  [1.455, 0.11],
  [1.47, 0.062],
];
const TORSO_DEPTH = 0.64; // aplatissement avant/arrière

function torsoRadius(y: number) {
  for (let i = 1; i < TORSO_KEYS.length; i++) {
    const [y1, r1] = TORSO_KEYS[i];
    const [y0, r0] = TORSO_KEYS[i - 1];
    if (y <= y1) {
      const t = (y - y0) / (y1 - y0);
      const s = t * t * (3 - 2 * t); // lissage
      return r0 + (r1 - r0) * s;
    }
  }
  return TORSO_KEYS[TORSO_KEYS.length - 1][1];
}

function torsoGeometry(scale = 1) {
  const points: THREE.Vector2[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const y = TORSO_BOTTOM + ((TORSO_TOP - TORSO_BOTTOM) * i) / steps;
    points.push(new THREE.Vector2(torsoRadius(y) * scale, y));
  }
  // phiStart = π/2 : la couture de la texture tombe sur le côté, l'avant du
  // buste correspond à u = 0,75 et le dos à u = 0,25.
  const geometry = new THREE.LatheGeometry(points, 96, Math.PI / 2, Math.PI * 2);
  geometry.scale(1, 1, TORSO_DEPTH);
  return geometry;
}

function luminance(hex: string) {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/** Police d'affichage du site, lue sur le DOM (variable CSS next/font). */
function displayFontFamily() {
  if (typeof document === "undefined") return "sans-serif";
  const probe = document.createElement("span");
  probe.className = "font-display";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || "sans-serif";
  probe.remove();
  return family;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, family: string, size: number, maxWidth: number) {
  let s = size;
  ctx.font = `700 ${s}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && s > 12) {
    s -= 4;
    ctx.font = `700 ${s}px ${family}`;
  }
}

/** Texture du haut : couleur de fond, wordmark poitrine, personnalisation dans le dos. */
function useTopTexture(color: string, personalization: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);

  const family = useMemo(() => displayFontFamily(), []);

  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const ink = luminance(color) > 0.55 ? "#151515" : "#f3f1ec";
    // v = 1 en haut du canvas ; la hauteur réelle est linéaire en v.
    const yToCanvas = (y: number) => (1 - (y - TORSO_BOTTOM) / (TORSO_TOP - TORSO_BOTTOM)) * H;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);

    // Léger grain de tissu.
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Avant : wordmark sur la poitrine.
    fitText(ctx, "JEUNE RICHE", family, 110, W * 0.17);
    ctx.fillText("JEUNE RICHE", W * 0.75, yToCanvas(1.3));

    // Dos : personnalisation (ou rien), sous l'encolure.
    const text = personalization.trim().toUpperCase();
    if (text) {
      fitText(ctx, text, family, 150, W * 0.2);
      ctx.fillText(text, W * 0.25, yToCanvas(1.31));
    }
    texture.needsUpdate = true;
  }, [texture, color, personalization, family]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Limb({
  position,
  rotation = [0, 0, 0],
  radius,
  length,
  color,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius: number;
  length: number;
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <capsuleGeometry args={[radius, length, 8, 24]} />
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  );
}

function Mannequin({
  kind,
  color,
  personalization,
}: {
  kind: GarmentKind;
  color: string;
  personalization: string;
}) {
  const topColor = kind === "tee" || kind === "tank" ? color : DEFAULT_TOP;
  const bottomColor = kind === "pants" ? color : DEFAULT_BOTTOM;
  const capColor = kind === "cap" ? color : null;

  const topTexture = useTopTexture(topColor, kind === "tee" || kind === "tank" ? personalization : "");
  const shirt = useMemo(() => torsoGeometry(1), []);
  useEffect(() => () => shirt.dispose(), [shirt]);

  const fabric = { roughness: 0.92, metalness: 0 };

  return (
    <group>
      {/* Tête et cou */}
      <mesh position={[0, 1.63, 0]} scale={[0.9, 1.1, 0.95]} castShadow>
        <sphereGeometry args={[0.105, 48, 48]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 24]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>

      {capColor && (
        <group position={[0, 1.665, 0]}>
          <mesh scale={[0.98, 0.8, 1.02]} castShadow>
            <sphereGeometry args={[0.107, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={capColor} {...fabric} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.005, 0.05]} rotation={[0.18, 0, 0]} scale={[1, 1, 0.75]}>
            <cylinderGeometry args={[0.1, 0.1, 0.008, 32, 1, false, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color={capColor} {...fabric} />
          </mesh>
        </group>
      )}

      {/* Haut */}
      <mesh geometry={shirt} castShadow>
        <meshStandardMaterial map={topTexture} {...fabric} side={THREE.DoubleSide} />
      </mesh>
      {kind !== "tank" &&
        ([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * 0.228, 1.33, 0]} rotation={[0, 0, side * 0.2]} castShadow>
            <cylinderGeometry args={[0.07, 0.066, 0.2, 32, 1, true]} />
            <meshStandardMaterial color={topColor} {...fabric} side={THREE.DoubleSide} />
          </mesh>
        ))}

      {/* Bras et mains */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <Limb position={[side * 0.245, 1.13, 0]} rotation={[0, 0, side * 0.1]} radius={0.043} length={0.48} color={SKIN} />
          <mesh position={[side * 0.27, 0.85, 0.01]} castShadow>
            <sphereGeometry args={[0.048, 24, 24]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Bas : bassin, jambes, chaussures */}
      <mesh position={[0, 0.86, 0]} scale={[1, 1, TORSO_DEPTH]}>
        <cylinderGeometry args={[0.168, 0.16, 0.14, 48]} />
        <meshStandardMaterial color={bottomColor} {...fabric} />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <Limb position={[side * 0.085, 0.45, 0]} radius={0.072} length={0.68} color={bottomColor} />
          <RoundedBox args={[0.11, 0.07, 0.26]} radius={0.03} position={[side * 0.09, 0.035, 0.04]} castShadow>
            <meshStandardMaterial color="#f2f0eb" roughness={0.5} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

export default function TryOn3D({
  kind,
  color,
  personalization,
  hint,
}: {
  kind: GarmentKind;
  /** Couleur CSS de la pièce (résolue depuis le nom de variante). */
  color: string;
  personalization: string;
  hint: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [touched, setTouched] = useState(false);
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Hors écran, la scène ne se redessine plus : aucune charge GPU pendant
  // que le visiteur lit la suite de la fiche.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} data-lenis-prevent className="relative h-full w-full touch-none select-none">
      <Canvas
        shadows
        dpr={[1, 2]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 1.0, 3.2], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        onPointerDown={() => setTouched(true)}
      >
        <hemisphereLight args={["#ffffff", "#8a8070", 0.9]} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} />
        <Mannequin kind={kind} color={color} personalization={personalization} />
        <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={3} blur={2.4} far={1.2} />
        <OrbitControls
          target={[0, 0.88, 0]}
          enablePan={false}
          minDistance={1.6}
          maxDistance={4}
          minPolarAngle={Math.PI * 0.28}
          maxPolarAngle={Math.PI * 0.56}
          autoRotate={!touched && !reducedMotion}
          autoRotateSpeed={1.6}
          enableDamping
        />
      </Canvas>
      <p
        className={`pointer-events-none absolute inset-x-0 bottom-4 text-center text-label text-ink/60 transition-opacity duration-500 ${
          touched ? "opacity-0" : "opacity-100"
        }`}
      >
        {hint}
      </p>
    </div>
  );
}
