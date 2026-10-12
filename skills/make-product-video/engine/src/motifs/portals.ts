import * as THREE from "three";
import {fitLabel, halo, itemsOf, type MotifDef} from "./common";

/** Three glowing rings opening around the brand. Capabilities, pillars, the closing resolve. */
export const portalsMotif: MotifDef = {
  span: 6,
  view: 15,
  create({palette, glow, scene, label}) {
    const group = new THREE.Group();
    const colors = [palette.primary, palette.secondary, palette.highlight];
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.75 - i * 0.26, 0.1, 12, 120), new THREE.MeshPhysicalMaterial({
        color: colors[i], emissive: colors[i], emissiveIntensity: 0.48, roughness: 0.18, metalness: 0.35, transparent: true, opacity: 0.8
      }));
      ring.position.x = (i - 1) * 6.1;
      ring.rotation.y = (i - 1) * -0.18;
      rings.push(ring);
      group.add(ring);
    }
    itemsOf(scene, 3).forEach((text, k) => {
      const sprite = fitLabel(label(text, {height: 0.62}), 3.6);
      rings[k].add(sprite);
    });
    const glowSprite = halo(glow, palette.primary, 0.28, 30);
    glowSprite.position.z = -2;
    group.add(glowSprite);
    return {
      group,
      update({time, energy}) {
        group.scale.setScalar(0.35 + energy * 0.65);
        group.rotation.y = (1 - energy) * -0.65 + Math.sin(time * 0.16) * 0.035;
        rings.forEach((ring, i) => {
          ring.rotation.z = time * (i % 2 ? -0.12 : 0.1);
          ring.position.y = Math.sin(time * 0.55 + i * 2) * 0.28;
        });
        (glowSprite.material as THREE.SpriteMaterial).opacity = energy * 0.25;
      }
    };
  }
};
