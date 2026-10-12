import * as THREE from "three";
import {clamp, easeOutExpo} from "../timeline";
import {fitLabel, itemsOf, setLabelScale, surfaceColor, type MotifDef} from "./common";

/** A field of bars rising on a grid. Growth, momentum, impact, scale. Heights are illustrative, never data. */
export const skylineMotif: MotifDef = {
  span: 10,
  view: 19,
  create({palette, random, scene, label}) {
    const surface = surfaceColor(palette);
    const group = new THREE.Group();
    group.position.y = -3;
    const columns = 9, rowsCount = 6;
    const bars: {mesh: THREE.Mesh; height: number; order: number}[] = [];
    for (let row = 0; row < rowsCount; row++) for (let col = 0; col < columns; col++) {
      const trend = (col + 1) / columns;
      const height = 0.5 + trend * 4.2 * (0.45 + random() * 0.55) + (row === 2 ? 0.8 : 0);
      const geometry = new THREE.BoxGeometry(0.78, 1, 0.78);
      geometry.translate(0, 0.5, 0);
      const lit = (col + row) % 5 === 0;
      const mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
        color: lit ? palette.primary : surface, emissive: lit ? palette.primary : palette.ink, emissiveIntensity: lit ? 0.5 : 0.04,
        transparent: true, opacity: lit ? 0.94 : 0.72, roughness: 0.4, metalness: 0.12
      }));
      mesh.position.set((col - (columns - 1) / 2) * 1.35, 0, (row - (rowsCount - 1) / 2) * 1.35);
      bars.push({mesh, height, order: col + row * 0.35});
      group.add(mesh);
    }
    const words = itemsOf(scene, 8);
    const labels = words.map((text, k) => {
      const col = words.length === 1 ? 4 : Math.round((k * (columns - 1)) / (words.length - 1));
      const sprite = fitLabel(label(text, {height: 0.5, pill: true}), 3.4);
      sprite.position.set((col - (columns - 1) / 2) * 1.35, 0.55, (rowsCount / 2) * 1.35 + 0.7);
      group.add(sprite);
      return sprite;
    });
    const grid = new THREE.GridHelper(15, 15, palette.secondary, palette.secondary);
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.22;
    group.add(grid);
    return {
      group,
      update({time, energy}) {
        group.rotation.y = -0.55 + Math.sin(time * 0.15) * 0.06;
        bars.forEach(({mesh, height, order}) => {
          const grow = easeOutExpo(clamp(energy * 1.45 - order * 0.07));
          mesh.scale.y = Math.max(0.001, height * grow);
        });
        labels.forEach((sprite) => setLabelScale(sprite, energy));
      }
    };
  }
};
