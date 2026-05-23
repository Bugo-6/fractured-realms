// Builds complete 3D arena environments for WASTELAND COMMAND.
// Returns a group of static scenery plus configures scene fog/background.

import * as THREE from 'three';
import type { ArenaType } from './types';

export interface ArenaSetup {
  scenery: THREE.Group;
  background: number;
  fog: THREE.Fog | null;
  ambient: number; // ambient light color
  ambientIntensity: number;
  sun: number; // directional light color
  sunIntensity: number;
  sunPos: [number, number, number];
  extraLights?: THREE.Light[];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildingMesh(
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  z: number,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.05 });
  const me = new THREE.Mesh(geo, m);
  me.position.set(x, h / 2, z);
  me.castShadow = true;
  me.receiveShadow = true;
  return me;
}

function ground(w: number, d: number, color: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(w, d, 1, 1);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
  const me = new THREE.Mesh(geo, m);
  me.rotation.x = -Math.PI / 2;
  me.receiveShadow = true;
  return me;
}

export function buildArena(type: ArenaType): ArenaSetup {
  const scenery = new THREE.Group();

  switch (type) {
    case 'desertTown': {
      scenery.add(ground(110, 80, 0xc4a45a));
      // scattered ruined buildings on the edges
      const cols = [0x9c8a5e, 0xb0a070, 0x8c7a52, 0xa89668];
      const spots: [number, number][] = [
        [-34, -22], [-30, 20], [-20, -24], [32, -20],
        [28, 22], [22, -22], [0, -28], [-8, 26],
      ];
      spots.forEach(([x, z], i) => {
        const h = rand(2.5, 7);
        scenery.add(buildingMesh(rand(3, 6), h, rand(3, 6), cols[i % cols.length], x, z));
      });
      // rubble piles
      for (let i = 0; i < 14; i++) {
        const r = rand(0.4, 1.1);
        const m = new THREE.Mesh(
          new THREE.DodecahedronGeometry(r, 0),
          new THREE.MeshStandardMaterial({ color: 0x8a7850, roughness: 1 }),
        );
        m.position.set(rand(-38, 38), r * 0.4, rand(-24, 24));
        m.castShadow = true;
        scenery.add(m);
      }
      return {
        scenery,
        background: 0xcfa87a,
        fog: new THREE.Fog(0xcfa87a, 45, 110),
        ambient: 0xffe8c0,
        ambientIntensity: 0.7,
        sun: 0xffd9a0,
        sunIntensity: 1.3,
        sunPos: [25, 40, 20],
      };
    }

    case 'coastalRuins': {
      // sand on left 2/3, water on right 1/3
      const sand = ground(80, 80, 0xc4a45a);
      sand.position.x = -15;
      scenery.add(sand);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x1a5f8a,
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0.9,
      });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(40, -0.05, 0);
      scenery.add(water);
      // stone ruins (grey cubes) on the sand
      const ruins: [number, number][] = [
        [-30, -18], [-24, 16], [-14, -20], [-6, 18], [-32, 4], [-18, 0],
      ];
      ruins.forEach(([x, z]) => {
        const h = rand(2.5, 6);
        scenery.add(buildingMesh(rand(2.5, 4.5), h, rand(2.5, 4.5), 0x8b8d90, x, z));
      });
      // broken bridge pillars near the water line
      for (let i = 0; i < 5; i++) {
        const p = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 1.0, rand(2, 4), 8),
          new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 }),
        );
        p.position.set(14 + i * 5, 1.5, -8 + i * 4);
        p.castShadow = true;
        scenery.add(p);
      }
      return {
        scenery,
        background: 0x7ab0d4,
        fog: new THREE.Fog(0x9fc4dd, 55, 120),
        ambient: 0xcfe6ff,
        ambientIntensity: 0.75,
        sun: 0xfff4e0,
        sunIntensity: 1.25,
        sunPos: [20, 38, 25],
      };
    }

    case 'industrial': {
      scenery.add(ground(110, 80, 0x444444));
      // factory structures
      const cols = [0x3a3a3a, 0x555555, 0x4a4540];
      const spots: [number, number, number][] = [
        [-34, -20, 8], [-28, 22, 7], [30, -22, 9], [26, 20, 6], [0, -28, 5],
      ];
      spots.forEach(([x, z, h], i) => {
        scenery.add(buildingMesh(rand(4, 7), h, rand(4, 7), cols[i % cols.length], x, z));
      });
      // pipes (cylinders)
      for (let i = 0; i < 8; i++) {
        const pipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, rand(4, 9), 10),
          new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.6, metalness: 0.5 }),
        );
        pipe.position.set(rand(-38, 38), rand(2, 4), rand(-24, 24));
        pipe.castShadow = true;
        scenery.add(pipe);
      }
      // glowing vats
      for (let i = 0; i < 3; i++) {
        const vat = new THREE.Mesh(
          new THREE.CylinderGeometry(1.4, 1.4, 1.5, 12),
          new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.6 }),
        );
        vat.position.set(rand(-30, 30), 0.75, rand(-20, 20));
        scenery.add(vat);
      }
      return {
        scenery,
        background: 0x2a2a2e,
        fog: new THREE.Fog(0x3a2a20, 35, 95),
        ambient: 0x9090a0,
        ambientIntensity: 0.55,
        sun: 0xffae66,
        sunIntensity: 0.9,
        sunPos: [-20, 35, 15],
      };
    }

    case 'desertOpen': {
      scenery.add(ground(120, 90, 0xd8b66a));
      // dunes: half-buried large spheres
      for (let i = 0; i < 12; i++) {
        const r = rand(4, 9);
        const dune = new THREE.Mesh(
          new THREE.SphereGeometry(r, 12, 8),
          new THREE.MeshStandardMaterial({ color: 0xceac62, roughness: 1 }),
        );
        dune.position.set(rand(-40, 40), -r * 0.65, rand(-26, 26));
        dune.receiveShadow = true;
        scenery.add(dune);
      }
      // a few bleached rocks
      for (let i = 0; i < 6; i++) {
        const r = rand(0.8, 2);
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(r, 0),
          new THREE.MeshStandardMaterial({ color: 0xb09a6a, roughness: 1 }),
        );
        rock.position.set(rand(-38, 38), r * 0.3, rand(-24, 24));
        rock.castShadow = true;
        scenery.add(rock);
      }
      return {
        scenery,
        background: 0xe8c27a,
        fog: new THREE.Fog(0xe8c27a, 50, 115),
        ambient: 0xfff0d0,
        ambientIntensity: 0.85,
        sun: 0xfff0c8,
        sunIntensity: 1.5,
        sunPos: [10, 50, 10],
      };
    }

    case 'underground': {
      scenery.add(ground(110, 80, 0x2a2420));
      // cave ceiling
      const ceil = new THREE.Mesh(
        new THREE.PlaneGeometry(110, 80),
        new THREE.MeshStandardMaterial({ color: 0x181410, roughness: 1, side: THREE.DoubleSide }),
      );
      ceil.rotation.x = Math.PI / 2;
      ceil.position.y = 14;
      scenery.add(ceil);
      // stalagmites / rock columns
      for (let i = 0; i < 10; i++) {
        const col = new THREE.Mesh(
          new THREE.ConeGeometry(rand(1, 2), rand(4, 9), 6),
          new THREE.MeshStandardMaterial({ color: 0x3a322a, roughness: 1 }),
        );
        col.position.set(rand(-38, 38), 3, rand(-24, 24));
        col.castShadow = true;
        scenery.add(col);
      }
      // glowing lava cracks
      const extraLights: THREE.Light[] = [];
      for (let i = 0; i < 6; i++) {
        const crack = new THREE.Mesh(
          new THREE.BoxGeometry(rand(3, 8), 0.1, rand(0.5, 1.5)),
          new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff4400, emissiveIntensity: 1.2 }),
        );
        const cx = rand(-34, 34);
        const cz = rand(-22, 22);
        crack.position.set(cx, 0.06, cz);
        crack.rotation.y = rand(0, Math.PI);
        scenery.add(crack);
        const pl = new THREE.PointLight(0xff5a00, 1.6, 22, 2);
        pl.position.set(cx, 1.5, cz);
        extraLights.push(pl);
      }
      return {
        scenery,
        background: 0x0a0806,
        fog: new THREE.Fog(0x140d08, 28, 80),
        ambient: 0x664433,
        ambientIntensity: 0.45,
        sun: 0xaa5522,
        sunIntensity: 0.4,
        sunPos: [0, 30, 0],
        extraLights,
      };
    }

    case 'crater': {
      scenery.add(ground(120, 90, 0x16100e));
      // glowing crater rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(34, 1.6, 8, 48),
        new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff3300, emissiveIntensity: 1.4 }),
      );
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 0.2;
      scenery.add(rim);
      // central lava pool
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(10, 24),
        new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 1.5 }),
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.y = 0.05;
      scenery.add(pool);
      // jagged volcanic rocks
      for (let i = 0; i < 12; i++) {
        const r = rand(1, 3);
        const rock = new THREE.Mesh(
          new THREE.TetrahedronGeometry(r, 0),
          new THREE.MeshStandardMaterial({ color: 0x231a18, roughness: 1, emissive: 0x220000, emissiveIntensity: 0.3 }),
        );
        rock.position.set(rand(-38, 38), r * 0.3, rand(-26, 26));
        rock.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
        rock.castShadow = true;
        scenery.add(rock);
      }
      const extraLights: THREE.Light[] = [];
      const glow = new THREE.PointLight(0xff4400, 2.2, 60, 2);
      glow.position.set(0, 6, 0);
      extraLights.push(glow);
      return {
        scenery,
        background: 0x3a0a08,
        fog: new THREE.Fog(0x3a0a08, 35, 100),
        ambient: 0xff6644,
        ambientIntensity: 0.5,
        sun: 0xff7744,
        sunIntensity: 0.8,
        sunPos: [15, 40, -20],
        extraLights,
      };
    }

    default: {
      scenery.add(ground(110, 80, 0x556b2f));
      return {
        scenery,
        background: 0x223322,
        fog: new THREE.Fog(0x223322, 45, 110),
        ambient: 0xffffff,
        ambientIntensity: 0.7,
        sun: 0xffffff,
        sunIntensity: 1.2,
        sunPos: [20, 40, 20],
      };
    }
  }
}

export const ARENA_NAMES: Record<ArenaType, string> = {
  desertTown: 'Abandoned Desert Town',
  coastalRuins: 'Coastal Ruins',
  industrial: 'Industrial Zone',
  desertOpen: 'Open Dunes',
  underground: 'Underground Cavern',
  crater: 'Crater Battlefield',
};
