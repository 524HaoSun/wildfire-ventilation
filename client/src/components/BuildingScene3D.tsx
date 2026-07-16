/*
 * Instrumented Architectural Modernism: a calm orthographic laboratory scene.
 * Geometry, interaction and annotations remain functional; no decorative 3D effects.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, BusFront, Home, Layers3, LocateFixed, ScanLine } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Building, Sensor } from "@/engine";
import "./BuildingScene3D.css";

type CameraView = "iso" | "front" | "top";

export const BUILDING_PROFILES: Record<Building, {
  name: string;
  shortName: string;
  icon: typeof Home;
  floorArea: string;
  volume: string;
  envelope: string;
  levels: string;
  description: string;
}> = {
  single_room: {
    name: "Single-room test cell",
    shortName: "Single-room",
    icon: Box,
    floorArea: "54 m²",
    volume: "162 m³",
    envelope: "30 m perimeter",
    levels: "1 level",
    description: "A transparent single-zone enclosure for direct envelope and filter comparisons.",
  },
  two_storey: {
    name: "Two-storey dwelling",
    shortName: "Two-storey",
    icon: Layers3,
    floorArea: "96 m²",
    volume: "288 m³",
    envelope: "40 m perimeter",
    levels: "2 levels",
    description: "Two coupled floors with a stair void for vertical transport and lag inspection.",
  },
  bus: {
    name: "Transit bus cabin",
    shortName: "Bus",
    icon: BusFront,
    floorArea: "30 m²",
    volume: "78 m³",
    envelope: "29 m perimeter",
    levels: "1 cabin",
    description: "A compact, high-leakage vehicle cabin with distributed supply and return paths.",
  },
};

const SENSOR_POSITIONS: Record<Building, [number, number, number][]> = {
  single_room: [
    [-3.25, 1.1, -1.85], [-1.1, 1.1, 1.65], [1.1, 1.1, -1.85], [3.2, 1.1, 1.65],
    [-2.45, 2.1, .15], [0, 2.1, 1.65], [2.45, 2.1, .15], [0, 1.1, -.15],
  ],
  two_storey: [
    [-2.9, 1.15, -1.65], [0, 1.15, 1.65], [2.75, 1.15, -1.65], [-2.9, 4.15, 1.65],
    [0, 4.15, -1.65], [2.75, 4.15, 1.65], [-1.7, 5.1, .1], [1.9, 5.1, .1],
  ],
  bus: [
    [-4.6, 1.1, -.65], [-3.1, 1.1, .65], [-1.4, 1.1, -.65], [.4, 1.1, .65],
    [2.1, 1.1, -.65], [3.75, 1.1, .65], [-2.2, 1.9, 0], [2.65, 1.9, 0],
  ],
};

const CAMERA_POSITIONS: Record<CameraView, [number, number, number]> = {
  iso: [12, 9, 14],
  front: [0, 4.5, 18],
  top: [0, 19, .01],
};

function isoCameraPosition(building: Building, runMode: boolean): [number, number, number] {
  if (building === "two_storey") return runMode ? [11.2, 8.4, 12.2] : [9.35, 7.2, 10.4];
  if (building === "bus") return runMode ? [11.4, 5.4, 10.6] : [8.9, 3.95, 8.9];
  return runMode ? [10.2, 6.6, 11.2] : [7.2, 4.75, 8.05];
}

function addEdges(mesh: THREE.Mesh, group: THREE.Object3D, color = 0x31413f, opacity = .7) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  edges.position.copy(mesh.position);
  edges.rotation.copy(mesh.rotation);
  edges.scale.copy(mesh.scale);
  group.add(edges);
}

function createPanel(
  group: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  color = 0xdde5df,
  opacity = .22,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: .82, metalness: .03, side: THREE.DoubleSide }),
  );
  mesh.position.set(...position);
  group.add(mesh);
  addEdges(mesh, group);
  return mesh;
}

function createSolid(
  group: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  color = 0xd8d7cf,
  roughness = .78,
  metalness = .04,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, roughness, metalness }),
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  addEdges(mesh, group, 0x3e4946, .34);
  return mesh;
}

function createGlass(group: THREE.Object3D, size: [number, number, number], position: [number, number, number]) {
  const pane = createPanel(group, size, position, 0x86a9ad, .34);
  (pane.material as THREE.MeshStandardMaterial).metalness = .08;
  (pane.material as THREE.MeshStandardMaterial).roughness = .2;
  return pane;
}

function createDuct(group: THREE.Object3D, length: number, position: [number, number, number], rotationZ = 0) {
  const duct = new THREE.Mesh(
    new THREE.CylinderGeometry(.18, .18, length, 14),
    new THREE.MeshStandardMaterial({ color: 0x7f8b88, roughness: .42, metalness: .72 }),
  );
  duct.rotation.z = Math.PI / 2 + rotationZ;
  duct.position.set(...position);
  duct.castShadow = true;
  group.add(duct);
  return duct;
}

function createWindowFrame(group: THREE.Object3D, x: number, y: number, z: number, width: number, height: number) {
  createGlass(group, [width, height, .055], [x, y, z]);
  createSolid(group, [width + .18, .08, .1], [x, y + height / 2, z], 0x4f5b58, .45, .32);
  createSolid(group, [width + .18, .08, .1], [x, y - height / 2, z], 0x4f5b58, .45, .32);
  createSolid(group, [.08, height, .1], [x - width / 2, y, z], 0x4f5b58, .45, .32);
  createSolid(group, [.08, height, .1], [x + width / 2, y, z], 0x4f5b58, .45, .32);
}

function createSingleRoom(group: THREE.Group) {
  createSolid(group, [9.3, .18, 6.25], [0, -.04, 0], 0xacaea8, .95);
  createSolid(group, [9.1, 3.15, .18], [0, 1.54, -3.04], 0xd7d5cb, .9);
  createSolid(group, [.18, 3.15, 6.1], [-4.54, 1.54, 0], 0xd7d5cb, .9);
  createSolid(group, [.18, 3.15, 6.1], [4.54, 1.54, 0], 0xd7d5cb, .9);
  createSolid(group, [9.1, .14, 6.1], [0, 3.1, 0], 0xc9cbc5, .78);
  createWindowFrame(group, 2.45, 1.75, -2.94, 2.15, 1.12);
  createSolid(group, [1.1, 2.25, .12], [-2.65, 1.1, -2.93], 0x8a8174, .7);
  createSolid(group, [.75, .12, .42], [-2.65, 2.22, -2.72], 0x525d59, .55, .24);
  createDuct(group, 7.1, [0, 2.73, -2.5]);
  [-2.8, 0, 2.8].forEach((x) => {
    createDuct(group, .75, [x, 2.73, -2.12], Math.PI / 2);
    createSolid(group, [.62, .06, .34], [x, 2.67, -1.73], 0x6e7a76, .46, .45);
  });
  for (let x = -3.8; x <= 3.8; x += .63) createSolid(group, [.045, 3, .05], [x, 1.5, -2.91], 0xb4b5af, .8);
  [-4.42, 4.42].forEach((x) => createSolid(group, [.13, 3.2, .13], [x, 1.56, 2.98], 0x59635f, .42, .58));
  createSolid(group, [9.0, .15, .16], [0, 3.02, 2.98], 0x59635f, .42, .58);
  createSolid(group, [9.0, .2, .22], [0, .12, 2.94], 0x757d79, .62, .3);
  createSolid(group, [6.7, .08, .28], [.5, 2.36, 2.58], 0x5d6864, .48, .55);
  [-2.3, .1, 2.5].forEach((x) => createSolid(group, [1.35, .06, .12], [x, 2.82, .45], 0xe4e2d8, .38, .08));
  createSolid(group, [1.55, .12, .72], [2.55, .82, 2.1], 0x7d7469, .76);
  [-.58, .58].forEach((offset) => createSolid(group, [.08, .78, .08], [2.55 + offset, .41, 2.1], 0x555e5b, .38, .52));
  createSolid(group, [.72, 1.55, .42], [-3.72, .82, 2.55], 0x65706c, .58, .28);
  for (let y = .28; y < 1.45; y += .23) createSolid(group, [.54, .035, .02], [-3.72, y, 2.32], 0xc8cfca, .35, .5);
  const filter = createSolid(group, [.76, .9, .5], [-3.75, 2.35, -2.6], 0x9f4e35, .58, .22);
  filter.userData.kind = "filter";
}

function createTwoStorey(group: THREE.Group) {
  createSolid(group, [8.3, .18, 6.2], [0, -.04, 0], 0xaaaCA6, .95);
  createSolid(group, [8.1, 6, .18], [0, 3, -3.04], 0xd7d5cb, .9);
  createSolid(group, [.18, 6, 6.1], [-4.04, 3, 0], 0xd7d5cb, .9);
  createSolid(group, [.18, 6, 6.1], [4.04, 3, 0], 0xd7d5cb, .9);
  createSolid(group, [8.1, .19, 4.65], [0, 3, -.68], 0xbfc1bb, .86);
  createSolid(group, [3.25, .19, 1.35], [-2.42, 3, 2.33], 0xbfc1bb, .86);
  const roofLeft = createSolid(group, [4.65, .15, 6.35], [-2.03, 6.72, 0], 0x777b78, .72, .16);
  roofLeft.rotation.z = Math.PI / 6;
  const roofRight = createSolid(group, [4.65, .15, 6.35], [2.03, 6.72, 0], 0x777b78, .72, .16);
  roofRight.rotation.z = -Math.PI / 6;
  createWindowFrame(group, -2.1, 1.65, -2.94, 1.55, 1.18);
  createWindowFrame(group, 2.05, 1.65, -2.94, 1.55, 1.18);
  createWindowFrame(group, -2.1, 4.65, -2.94, 1.55, 1.18);
  createWindowFrame(group, 2.05, 4.65, -2.94, 1.55, 1.18);
  createSolid(group, [.13, 2.75, 2.65], [0, 1.48, -1.7], 0xc6c7c1, .86);
  createSolid(group, [.13, 2.75, 2.65], [0, 4.48, -1.7], 0xc6c7c1, .86);
  for (let index = 0; index < 10; index += 1) {
    createSolid(group, [1.25, .13, .62], [-.68 + index * .13, .38 + index * .275, 2.4 - index * .38], 0x80786e, .68);
  }
  [-3.94, 3.94].forEach((x) => createSolid(group, [.13, 6.05, .13], [x, 3, 2.98], 0x59635f, .42, .58));
  createSolid(group, [8.0, .17, .2], [0, 5.98, 2.98], 0x59635f, .42, .58);
  createSolid(group, [8.0, .25, .28], [0, 3.02, 2.92], 0x707975, .5, .42);
  createSolid(group, [3.05, .08, .08], [2.2, 3.94, 2.56], 0x5e6764, .36, .62);
  createSolid(group, [.08, .92, .08], [.68, 3.48, 2.56], 0x5e6764, .36, .62);
  createSolid(group, [3.0, .06, .26], [-1.65, 2.45, 2.48], 0x5d6864, .48, .55);
  createSolid(group, [2.45, .06, .26], [2.15, 5.35, 2.48], 0x5d6864, .48, .55);
  [-2.3, 2.25].forEach((x) => createSolid(group, [1.2, .06, .12], [x, x < 0 ? 2.72 : 5.72, .38], 0xe4e2d8, .38, .08));
  createDuct(group, 5.1, [-3.35, 3.45, -.2], Math.PI / 2);
  createDuct(group, 5.25, [-3.35, 5.55, -.2], Math.PI / 2);
  createSolid(group, [.82, .82, .5], [-3.45, 5.35, -2.63], 0x9f4e35, .58, .22);
}

function createBus(group: THREE.Group) {
  const shellShape = new THREE.Shape();
  shellShape.moveTo(-6, .15);
  shellShape.lineTo(5.8, .15);
  shellShape.quadraticCurveTo(6.05, .2, 6.05, .55);
  shellShape.lineTo(6.05, 2.35);
  shellShape.quadraticCurveTo(5.75, 2.95, 5.1, 3.02);
  shellShape.lineTo(-5.35, 3.02);
  shellShape.quadraticCurveTo(-6.05, 2.82, -6.05, 2.18);
  shellShape.lineTo(-6.05, .55);
  shellShape.quadraticCurveTo(-6.05, .22, -6, .15);
  const shellGeometry = new THREE.ExtrudeGeometry(shellShape, { depth: 2.62, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 3 });
  shellGeometry.translate(0, 0, -1.31);
  const shell = new THREE.Mesh(shellGeometry, new THREE.MeshStandardMaterial({ color: 0xc7ccc7, transparent: true, opacity: .16, roughness: .48, metalness: .14, side: THREE.DoubleSide }));
  shell.castShadow = true;
  group.add(shell);
  addEdges(shell, group, 0x34423f, .58);
  createSolid(group, [11.75, .16, 2.35], [0, .18, 0], 0x777d78, .78);
  createSolid(group, [11.55, .66, .12], [-.08, .55, 1.27], 0xb7bbb6, .78, .12);
  createSolid(group, [11.55, .18, .13], [-.08, 2.72, 1.27], 0x9f4e35, .6, .22);
  createSolid(group, [11.5, .12, .18], [0, 2.82, -1.23], 0x9f4e35, .6, .22);
  for (let x = -4.6; x <= 4.5; x += 1.55) {
    createWindowFrame(group, x, 2.03, -1.29, 1.15, .88);
    createGlass(group, [1.18, .84, .055], [x, 2.02, 1.29]);
    createSolid(group, [.055, 1.08, .08], [x + .68, 2.01, 1.27], 0x606966, .42, .48);
    const seatBack = createSolid(group, [.68, .82, .11], [x, .9, .64], 0x496b68, .72);
    seatBack.rotation.x = -.12;
    createSolid(group, [.68, .12, .68], [x, .52, .35], 0x496b68, .72);
    createSolid(group, [.06, .45, .06], [x - .23, .27, .4], 0x5f6663, .42, .55);
    createSolid(group, [.06, .45, .06], [x + .23, .27, .4], 0x5f6663, .42, .55);
  }
  createGlass(group, [.08, 1.34, 2.08], [5.82, 2.02, 0]);
  createGlass(group, [.08, 1.18, 2.02], [-5.82, 1.95, 0]);
  createSolid(group, [.1, .72, 2.42], [5.9, .58, 0], 0xb7bbb6, .76, .12);
  createSolid(group, [.1, .72, 2.42], [-5.9, .58, 0], 0xb7bbb6, .76, .12);
  createSolid(group, [.1, 2.3, 2.45], [4.75, 1.35, 0], 0xa4aaa5, .75);
  createSolid(group, [.08, 2.1, .92], [3.95, 1.28, -1.28], 0x84796b, .66);
  createDuct(group, 10.5, [-.2, 2.63, 0]);
  [-4.2, 4.2].forEach((x) => {
    [-1.28, 1.28].forEach((z) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(.48, .48, .2, 24),
        new THREE.MeshStandardMaterial({ color: 0x26302f, roughness: .8 }),
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, .18, z);
      group.add(wheel);
    });
  });
  createSolid(group, [.9, .62, .5], [-5.2, 2.35, 0], 0x9f4e35, .58, .22);
}

function createAirflow(group: THREE.Group, building: Building) {
  const airflow = new THREE.Group();
  airflow.name = "airflow";
  const extent = building === "bus" ? 5.2 : 3.7;
  const height = building === "two_storey" ? 4.5 : 1.9;
  for (let index = 0; index < 7; index += 1) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(.035, 10, 10),
      new THREE.MeshBasicMaterial({ color: index % 3 === 0 ? 0xc45a36 : 0x2e7e8c, transparent: true, opacity: .46 }),
    );
    dot.userData.flowOffset = index / 7;
    dot.userData.flowExtent = extent;
    dot.userData.flowHeight = height;
    airflow.add(dot);
  }
  group.add(airflow);
  return airflow;
}

function createModel(building: Building) {
  const group = new THREE.Group();
  group.name = `model-${building}`;
  if (building === "single_room") createSingleRoom(group);
  if (building === "two_storey") createTwoStorey(group);
  if (building === "bus") createBus(group);
  const airflow = createAirflow(group, building);
  return { group, airflow };
}

export function BuildingScene3D({
  building,
  sensors,
  totalAch,
  runMode = false,
  externalSmokeIntensity = 0,
  activeSensor,
  sensorValues = {},
  selectedSensor,
  onSensorSelect,
}: {
  building: Building;
  sensors: Sensor[];
  totalAch: number;
  runMode?: boolean;
  externalSmokeIntensity?: number;
  activeSensor?: string;
  sensorValues?: Record<string, number>;
  selectedSensor?: string;
  onSensorSelect?: (sensorId: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [view, setView] = useState<CameraView>("iso");
  const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const profile = BUILDING_PROFILES[building];
  const SelectedIcon = profile.icon;
  const selectedData = sensors.find((sensor) => sensor.id === (selectedSensor ?? hoveredSensor));
  const selectedValue = selectedData ? sensorValues[selectedData.id] : undefined;
  const positions = useMemo(() => SENSOR_POSITIONS[building], [building]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xf0f3ef, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    mount.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe8ece8, 24, 46);
    const camera = new THREE.PerspectiveCamera(runMode ? 36 : 34, 1, .1, 100);
    const initialCameraPosition = isoCameraPosition(building, runMode);
    camera.position.set(...initialCameraPosition);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .075;
    controls.minDistance = building === "single_room" ? (runMode ? 7.4 : 5.2) : (runMode ? 8.4 : 7);
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI * .495;
    controls.target.set(0, building === "two_storey" ? 2.7 : 1.35, 0);
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x52615d, 1.7));
    const key = new THREE.DirectionalLight(0xfffbf2, 3.4);
    key.position.set(8, 13, 10);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x75a9a3, 1.7);
    rim.position.set(-9, 7, -6);
    scene.add(rim);

    const grid = new THREE.GridHelper(22, 44, 0x7e8986, 0xc0c6c2);
    grid.position.y = -.085;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = .3;
    scene.add(grid);
    const hallFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(17, 11),
      new THREE.MeshStandardMaterial({ color: 0xc9ccc7, roughness: .98, metalness: 0 }),
    );
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.y = -.1;
    hallFloor.receiveShadow = true;
    scene.add(hallFloor);
    createPanel(scene, [17.1, 8.4, .08], [0, 4.1, -5.48], 0xf2f6f2, .2);
    createPanel(scene, [.08, 8.4, 11], [-8.55, 4.1, 0], 0xf2f6f2, .16);
    createPanel(scene, [.08, 8.4, 11], [8.55, 4.1, 0], 0xf2f6f2, .16);
    createPanel(scene, [17.1, .08, 11], [0, 8.36, 0], 0xf2f6f2, .14);
    [-6.8, -3.4, 0, 3.4, 6.8].forEach((x) => createSolid(scene, [.035, 8.1, .05], [x, 4.05, -5.42], 0xb5beb9, .56, .22));
    [-3.6, -1.8, 0, 1.8, 3.6].forEach((z) => createSolid(scene, [16.6, .045, .035], [0, 8.27, z], 0xb5beb9, .5, .28));
    [-4.4, -2.2, 0, 2.2, 4.4].forEach((x) => {
      createSolid(scene, [.72, .055, .42], [x, 7.62, -3.85], 0x6b7773, .46, .55);
      createSolid(scene, [.34, .035, .34], [x, 7.2, -3.85], 0x8f9a96, .42, .5);
    });
    const returnWall = createSolid(scene, [.08, 4.4, 2.45], [8.36, 2.2, -3.5], 0x6c7874, .46, .6);
    returnWall.userData.kind = "return-wall";
    for (let y = .45; y <= 4.05; y += .38) createSolid(scene, [.09, .035, 2.08], [8.3, y, -3.5], 0xc2ccc7, .34, .62);
    [-6, -3, 0, 3, 6].forEach((x) => createSolid(scene, [1.7, .035, .07], [x, -.015, 4.15], 0x5d6864, .48, .55));
    const hallFrame = new THREE.Group();
    hallFrame.name = "cave-hall-structure";
    const steel = 0x59635f;
    const hallBeam = (size: [number, number, number], position: [number, number, number], opacity = .34) => {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        new THREE.MeshStandardMaterial({ color: steel, roughness: .46, metalness: .68, transparent: true, opacity }),
      );
      beam.position.set(...position);
      hallFrame.add(beam);
    };
    [-8.25, 8.25].forEach((x) => [-5.25, 5.25].forEach((z) => hallBeam([.075, 8.4, .075], [x, 4.1, z], .26)));
    [-8.25, -4.15, 0, 4.15, 8.25].forEach((x) => {
      hallBeam([.075, .075, 10.5], [x, 8.2, 0], .28);
      hallBeam([.075, .075, 10.5], [x, 7.78, 0], .2);
    });
    [-5.25, 5.25].forEach((z) => {
      hallBeam([16.5, .075, .075], [0, 8.2, z], .28);
      hallBeam([16.5, .075, .075], [0, 7.78, z], .2);
    });
    for (let x = -7.5; x <= 7.5; x += 3) {
      hallBeam([.045, .045, 10], [x, 7.95, 0], .18);
    }
    createDuct(hallFrame, 13.8, [0, 7.28, -4.55]);
    [-5.7, -1.9, 1.9, 5.7].forEach((x) => {
      createDuct(hallFrame, 1.35, [x, 6.72, -4.55], Math.PI / 2);
      createSolid(hallFrame, [.72, .08, .48], [x, 6.03, -4.55], 0x65716d, .46, .55);
    });
    scene.add(hallFrame);
    const hallHvac = createSolid(scene, [1.8, 1.45, 1.28], [-7.15, .68, -4.3], 0x476e6b, .5, .28);
    hallHvac.userData.kind = "hall-hvac";
    for (let y = .2; y <= 1.2; y += .23) createSolid(scene, [1.48, .055, .03], [-7.15, y, -3.64], 0xacc0b9, .34, .6);
    const testHvac = createSolid(scene, [1.2, .72, .7], [building === "bus" ? 5.1 : 3.7, building === "two_storey" ? 5.15 : 2.25, -2.55], 0x9f4e35, .54, .24);
    testHvac.userData.kind = "test-hvac";

    const { group: model, airflow } = createModel(building);
    scene.add(model);
    const sensorMeshes: THREE.Mesh[] = [];
    const sensorColors: Record<string, number> = { PM: 0xc45a36, NOx: 0x8d587d, "CO₂": 0x226d70, Temp: 0xb38b2d, RH: 0x4b6d91 };
    sensors.slice(0, 8).forEach((sensor, index) => {
      const position = positions[index] ?? [0, 1, 0];
      const baseY = building === "two_storey" && position[1] > 3 ? 3.08 : building === "bus" ? .2 : .02;
      const stand = new THREE.Group();
      stand.position.set(position[0], baseY, position[2]);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(.18, .22, .07, 20),
        new THREE.MeshStandardMaterial({ color: 0x4e5754, roughness: .48, metalness: .58 }),
      );
      base.position.y = .035;
      stand.add(base);
      [0, Math.PI * 2 / 3, Math.PI * 4 / 3].forEach((angle) => {
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(.014, .018, .38, 8),
          new THREE.MeshStandardMaterial({ color: 0x69726f, roughness: .34, metalness: .68 }),
        );
        foot.position.set(Math.cos(angle) * .11, .14, Math.sin(angle) * .11);
        foot.rotation.z = .43;
        foot.rotation.y = angle;
        stand.add(foot);
      });
      const poleHeight = Math.max(.35, position[1] - baseY - .06);
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(.025, .025, poleHeight, 12),
        new THREE.MeshStandardMaterial({ color: 0x8b9490, roughness: .3, metalness: .72 }),
      );
      pole.position.y = .07 + poleHeight / 2;
      stand.add(pole);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(.24, .18, .16),
        new THREE.MeshStandardMaterial({
          color: sensor.id === activeSensor ? 0xf0b34f : 0xe8e9e4,
          emissive: sensor.id === activeSensor ? 0x8a4615 : 0x000000,
          emissiveIntensity: runMode ? .38 : .08,
          roughness: .5,
          metalness: .12,
        }),
      );
      mesh.position.y = poleHeight + .16;
      mesh.userData.sensorId = sensor.id;
      stand.add(mesh);
      const typeBand = new THREE.Mesh(
        new THREE.BoxGeometry(.255, .045, .175),
        new THREE.MeshStandardMaterial({ color: sensorColors[sensor.kind] ?? 0x226d70, roughness: .48 }),
      );
      typeBand.position.y = poleHeight + .205;
      stand.add(typeBand);
      const statusLight = new THREE.Mesh(
        new THREE.SphereGeometry(.018, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xb8dbc8, emissive: 0x3b9b72, emissiveIntensity: runMode ? 1.1 : .28, roughness: .3 }),
      );
      statusLight.position.set(.085, poleHeight + .155, .085);
      stand.add(statusLight);
      const inlet = new THREE.Mesh(
        new THREE.CylinderGeometry(.025, .025, .13, 10),
        new THREE.MeshStandardMaterial({ color: 0x252b29, roughness: .35, metalness: .45 }),
      );
      inlet.position.y = poleHeight + .32;
      stand.add(inlet);
      const inletCap = new THREE.Mesh(
        new THREE.CylinderGeometry(.045, .03, .055, 12),
        new THREE.MeshStandardMaterial({ color: 0x303634, roughness: .42, metalness: .5 }),
      );
      inletCap.position.y = poleHeight + .41;
      stand.add(inletCap);
      const cable = new THREE.Mesh(
        new THREE.TorusGeometry(.085, .008, 7, 18, Math.PI * 1.45),
        new THREE.MeshStandardMaterial({ color: 0x252b29, roughness: .78 }),
      );
      cable.position.set(-.07, poleHeight + .1, -.08);
      cable.rotation.set(Math.PI / 2, 0, -.35);
      stand.add(cable);
      model.add(stand);
      sensorMeshes.push(mesh);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart = { x: 0, y: 0 };
    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(sensorMeshes, false)[0]?.object as THREE.Mesh | undefined;
    };
    const onPointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const onPointerMove = (event: PointerEvent) => {
      const hit = setPointer(event);
      setHoveredSensor(hit?.userData.sensorId ?? null);
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    };
    const onPointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
      const hit = setPointer(event);
      if (hit?.userData.sensorId) onSensorSelect?.(hit.userData.sensorId);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      camera.aspect = Math.max(1, width) / Math.max(1, height);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      controls.update();
      airflow.children.forEach((node) => {
        const offset = node.userData.flowOffset as number;
        const extent = node.userData.flowExtent as number;
        const flowHeight = node.userData.flowHeight as number;
        const progress = reducedMotion ? offset : (offset + elapsed * (.035 + totalAch * .018)) % 1;
        node.position.set(-extent + progress * extent * 2, .65 + Math.sin(progress * Math.PI) * flowHeight, Math.sin((progress + offset) * Math.PI * 2) * .58);
      });
      sensorMeshes.forEach((mesh) => {
        const isSelected = mesh.userData.sensorId === selectedSensor;
        const isHovered = mesh.userData.sensorId === hoveredSensor;
        const scale = isSelected ? 1.7 : isHovered ? 1.35 : 1;
        mesh.scale.lerp(new THREE.Vector3(scale, scale, scale), .16);
      });
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments) {
          object.geometry?.dispose();
          const material = object.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material?.dispose();
        }
      });
      renderer.dispose();
      mount.replaceChildren();
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, [activeSensor, building, onSensorSelect, positions, runMode, selectedSensor, sensors, totalAch]);

  const moveCamera = (nextView: CameraView) => {
    setView(nextView);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const nextPosition = nextView === "iso" ? isoCameraPosition(building, runMode) : CAMERA_POSITIONS[nextView];
    camera.position.set(...nextPosition);
    controls.target.set(0, building === "two_storey" ? 2.7 : 1.35, 0);
    controls.update();
  };

  return <section className="building-scene" data-building={building} data-run-mode={runMode ? "true" : "false"} data-testid={`building-scene-${building}`}>
    <div className="scene-toolbar">
      <div className="scene-identity"><SelectedIcon size={15} /><div><b>{profile.name}</b><span>{runMode ? "Model reconstruction" : "Interactive CAVE model"}</span></div></div>
      <div className="view-switch" aria-label="Camera view">
        {(["iso", "front", "top"] as CameraView[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => moveCamera(item)}>{item}</button>)}
        <button onClick={() => moveCamera("iso")} aria-label="Reset camera"><LocateFixed size={13} /></button>
      </div>
    </div>
    <div className="scene-canvas" aria-label={`Rotatable 3D model of ${profile.name}`}>
      <div className="scene-canvas-mount" ref={mountRef} />
      {fallback && <div className="scene-fallback"><ScanLine size={22} /><b>WebGL unavailable</b><span>The numerical experiment remains active.</span></div>}
      {runMode && externalSmokeIntensity > .015 && <div className="external-chamber-smoke" style={{ "--smoke-strength": Math.min(.12, externalSmokeIntensity * .12) } as React.CSSProperties} aria-hidden="true"><i /><i /></div>}
      <div className="scene-axis"><i className="axis-x">X</i><i className="axis-y">Y</i><i className="axis-z">Z</i></div>
      <div className="scene-instruction">Drag to orbit · Wheel to zoom · Select a sensor</div>
      {!runMode && <div className="scene-facility-readout"><span>UCL CAVE hall</span><b>206 m² · 9 m clear</b><small>Dual HVAC · exterior −5…43 °C · interior 10…28 °C</small></div>}
      {selectedData && <div className="scene-sensor-readout"><span>{selectedData.id} · {selectedData.kind}</span><b>{selectedValue == null ? "SELECTED" : selectedValue.toFixed(selectedData.kind === "PM" ? 0 : 1)}</b><small>{selectedValue == null ? "Pinned spatial node" : selectedData.kind === "PM" || selectedData.kind === "NOx" ? "µg/m³ · model + illustrative spatial offset" : "model reconstruction · illustrative spatial offset"}</small></div>}
      {runMode && <div className="scene-model-caveat">Single-zone model · one indoor mean · spatial variation is illustrative, not resolved.</div>}
    </div>
    {!runMode && <div className="scene-specs"><span><b>{profile.floorArea}</b> test area</span><span><b>{profile.volume}</b> test volume</span><span><b>CAVE hall</b> high-bay envelope</span><span><b>{totalAch.toFixed(2)} h⁻¹</b> model ACH</span></div>}
  </section>;
}
