import * as THREE from "three";
import {fitLabel, halo, itemsOf, type MotifDef} from "./common";

/** A core with satellites in tilted orbits. Platforms, ecosystems, integrations, hubs. */
export const orbitMotif: MotifDef = {
  span: 10,
  view: 18,
  create({palette, glow, scene, label}) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 2), new THREE.MeshPhysicalMaterial({
      color: palette.ink, emissive: palette.primary, emissiveIntensity: 0.42, roughness: 0.22, metalness: 0.5, flatShading: true
    }));
    const coreHalo = halo(glow, palette.primary, 0.3, 11);
    group.add(core, coreHalo);

    const tilts: [number, number][] = [[0.35, 0.1], [-0.55, 0.6], [0.95, -0.4]];
    const colors = [palette.primary, palette.secondary, palette.highlight];
    const orbits = tilts.map(([x, y], k) => {
      const radius = 3.1 + k * 1.15;
      const holder = new THREE.Group();
      holder.rotation.set(x, y, 0);
      const path = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 6, 140), new THREE.MeshBasicMaterial({color: colors[k], transparent: true, opacity: 0.4}));
      holder.add(path);
      const satellites = Array.from({length: 4 + k}, (_, i) => {
        const sat = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 2) * 0.07, 16, 16), new THREE.MeshBasicMaterial({color: colors[(k + i) % 3]}));
        holder.add(sat);
        return sat;
      });
      group.add(holder);
      return {radius, satellites, speed: (k % 2 ? -1 : 1) * (0.16 + k * 0.05), phase: k * 1.3};
    });
    const words = itemsOf(scene, 8);
    words.forEach((text, k) => {
      const orbit = orbits[k % orbits.length];
      const sat = orbit.satellites[Math.floor(k / orbits.length) % orbit.satellites.length];
      const sprite = fitLabel(label(text, {height: 0.5, pill: true}), 4.2);
      sprite.position.set(0, 0.75, 0);
      sat.add(sprite);
    });
    return {
      group,
      update({time, energy}) {
        core.rotation.y = time * 0.25;
        core.rotation.x = time * 0.11;
        core.scale.setScalar(0.3 + energy * 0.7);
        (coreHalo.material as THREE.SpriteMaterial).opacity = energy * 0.3;
        orbits.forEach(({radius, satellites, speed, phase}) => {
          satellites.forEach((sat, i) => {
            const angle = phase + time * speed + (i / satellites.length) * Math.PI * 2;
            sat.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
            sat.scale.setScalar(energy);
          });
        });
      }
    };
  }
};
