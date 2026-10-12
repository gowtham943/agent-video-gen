import * as THREE from "three";
import {fitLabel, itemsOf, type MotifDef} from "./common";

/** Scattered pieces snapping into a precise grid. Structure, organisation, data, features, catalogues. */
export const latticeMotif: MotifDef = {
  span: 6,
  view: 19,
  create({palette, random, scene, label}) {
    const group = new THREE.Group();
    const cells: THREE.Mesh[] = [];
    for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
      const active = (row + col) % 4 === 0;
      const depth = 0.18 + random() * 0.42;
      const cell = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.78, depth), new THREE.MeshPhysicalMaterial({
        color: active ? palette.primary : 0xf4f8fa, emissive: active ? palette.primary : palette.ink,
        emissiveIntensity: active ? 0.55 : 0.03, transparent: true, opacity: active ? 0.92 : 0.68, roughness: 0.42, metalness: 0.12
      }));
      cell.position.set((col - 3) * 1.62, (2 - row) * 1.03, (random() - 0.5) * 1.5);
      cell.userData.depth = depth;
      cell.userData.home = cell.position.clone();
      cells.push(cell);
      group.add(cell);
    }
    // Product words sit on the glowing cells first, then the rest.
    const order = [0, 4, 10, 16, 20, 22, 26, 28];
    itemsOf(scene, 8).forEach((text, k) => {
      const cell = cells[order[k]];
      const sprite = fitLabel(label(text, {height: 0.36, color: palette.ink}), 1.2);
      sprite.position.z = (cell.userData.depth as number) / 2 + 0.12;
      cell.add(sprite);
    });
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(13, 7.8, 2.8)), new THREE.LineBasicMaterial({color: palette.secondary, transparent: true, opacity: 0.24})));
    return {
      group,
      update({time, energy}) {
        group.rotation.y = Math.sin(time * 0.16) * 0.1;
        cells.forEach((cell, i) => {
          const home = cell.userData.home as THREE.Vector3;
          const scatter = (1 - energy) * 6;
          cell.position.set(home.x + Math.sin(i * 2.2) * scatter, home.y + Math.cos(i * 1.7) * scatter, home.z + Math.sin(i) * scatter);
          cell.rotation.x = (1 - energy) * i * 0.13;
          cell.rotation.y = (1 - energy) * i * -0.09;
          cell.scale.setScalar(0.65 + energy * 0.35);
        });
      }
    };
  }
};
