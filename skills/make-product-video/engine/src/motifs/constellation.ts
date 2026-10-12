import * as THREE from "three";
import {fitLabel, halo, itemsOf, setLabelScale, type MotifDef} from "./common";

/** Linked nodes around a glowing core. Connections, knowledge, intelligence, community, answers. */
export const constellationMotif: MotifDef = {
  span: 10,
  view: 18,
  create({palette, random, glow, scene, label}) {
    const group = new THREE.Group();
    const points: THREE.Vector3[] = [];
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = i * 2.399;
      const radius = 2.1 + (i % 8) * 0.62;
      const point = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.66, (random() - 0.5) * 6);
      points.push(point);
      const node = new THREE.Mesh(new THREE.SphereGeometry(i % 7 === 0 ? 0.2 : 0.085, 14, 14), new THREE.MeshBasicMaterial({
        color: i % 5 === 0 ? palette.highlight : i % 3 === 0 ? palette.primary : palette.secondary
      }));
      node.position.copy(point);
      nodes.push(node);
      group.add(node);
    }
    const labels = itemsOf(scene, 5).map((text, k) => {
      const sprite = fitLabel(label(text, {height: 0.62, pill: true}), 4.6);
      sprite.position.copy(points[k * 7]).add(new THREE.Vector3(0, 0.95, 0.3));
      group.add(sprite);
      return sprite;
    });
    const links: number[] = [];
    for (let i = 1; i < points.length; i++) {
      const a = points[i], b = points[Math.max(0, i - 1 - (i % 5 === 0 ? 4 : 0))];
      links.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const linkGeometry = new THREE.BufferGeometry();
    linkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(links, 3));
    group.add(new THREE.LineSegments(linkGeometry, new THREE.LineBasicMaterial({color: palette.secondary, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending})));
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 32), new THREE.MeshPhysicalMaterial({
      color: palette.ink, emissive: palette.primary, emissiveIntensity: 0.5, roughness: 0.18, metalness: 0.48
    }));
    const coreHalo = halo(glow, palette.primary, 0.42, 10);
    group.add(core, coreHalo);
    return {
      group,
      update({time, energy}) {
        group.rotation.z = time * -0.018;
        group.rotation.y = Math.sin(time * 0.18) * 0.12;
        nodes.forEach((node, i) => node.scale.setScalar(energy * (0.76 + Math.max(0, Math.sin(time * 2.2 - i * 0.45)) * 0.72)));
        core.scale.setScalar(0.2 + energy * (0.8 + Math.sin(time * 1.8) * 0.045));
        (coreHalo.material as THREE.SpriteMaterial).opacity = energy * 0.18;
        labels.forEach((sprite) => setLabelScale(sprite, energy));
      }
    };
  }
};
