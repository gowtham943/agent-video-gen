import * as THREE from "three";
import {captureOpacity, edgePlane, fitLabel, flatBar, itemsOf, setGroupOpacity, type MotifDef} from "./common";

/** An arc of document-like panels with a live chart. Reports, dashboards, deliverables, outputs. */
export const panelsMotif: MotifDef = {
  span: 10,
  view: 20,
  create({palette, random, scene, label}) {
    const group = new THREE.Group();
    const panels: THREE.Group[] = [];
    for (let i = 0; i < 5; i++) {
      const hero = i === 2;
      const panel = edgePlane(hero ? 6.8 : 4.7, hero ? 7.3 : 5.4, hero ? palette.primary : palette.secondary, hero ? 0.9 : 0.66);
      const angle = (i - 2) * 0.31;
      panel.position.set(Math.sin(angle) * 13.5, i % 2 ? -0.45 : 0.45, Math.cos(angle) * -4 + Math.abs(i - 2) * -1.2);
      panel.rotation.y = -angle;
      for (let j = 0; j < 6; j++) {
        const w = 1.2 + random() * (hero ? 3.7 : 2.2);
        const line = flatBar(w, j === 0 ? 0.12 : 0.055, j === 0 ? palette.highlight : palette.ink, j === 0 ? 0.88 : 0.43);
        line.position.set(-(hero ? 2.4 : 1.55) + w / 2, (hero ? 2.55 : 1.75) - j * 0.58, 0.04);
        panel.add(line);
      }
      panels.push(panel);
      group.add(panel);
    }
    const titleOrder = [2, 1, 3, 0, 4];
    itemsOf(scene, 5).forEach((text, k) => {
      const index = titleOrder[k];
      const hero = index === 2;
      const sprite = fitLabel(label(text, {height: hero ? 0.55 : 0.44, color: palette.ink}), hero ? 5.8 : 4);
      sprite.position.set(0, hero ? 3.2 : 2.3, 0.05);
      panels[index].add(sprite);
    });
    const chart = [[-2.25, -1.65], [-1.35, -0.95], [-0.55, -1.2], [0.35, -0.2], [1.15, -0.58], [2.25, 0.75]]
      .map(([x, y]) => new THREE.Vector3(x, y, 0.08));
    panels[2].add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(chart), new THREE.LineBasicMaterial({color: palette.primary, transparent: true, opacity: 0.95})));
    captureOpacity(group);
    return {
      group,
      update({time, energy, exit}) {
        panels.forEach((panel, i) => {
          const spread = i - 2;
          panel.position.y = (i % 2 ? -0.45 : 0.45) + Math.sin(time * 0.32 + i) * 0.18;
          panel.position.x = Math.sin(spread * 0.31) * 13.5 + (1 - energy) * spread * 6;
          panel.rotation.y = -spread * 0.31 + (1 - energy) * spread * 0.25;
          panel.scale.setScalar(0.75 + energy * 0.25);
        });
        setGroupOpacity(group, energy * (1 - exit));
      }
    };
  }
};
