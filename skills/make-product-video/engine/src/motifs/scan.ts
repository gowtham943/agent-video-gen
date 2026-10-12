import * as THREE from "three";
import {fitLabel, itemsOf, setLabelScale, type MotifDef} from "./common";

/** A tunnel of wireframe frames the camera flies through. Analysis, reading, processing, understanding. */
export const scanMotif: MotifDef = {
  span: 40,
  view: 4,
  create({palette, scene, label}) {
    const group = new THREE.Group();
    const rings: THREE.Mesh[] = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const strong = i % 4 === 0;
      const base = strong ? 0.34 : 0.12;
      const ring = new THREE.Mesh(new THREE.BoxGeometry(12.4, 8.2, 0.045), new THREE.MeshBasicMaterial({
        color: strong ? palette.primary : palette.secondary, wireframe: true, transparent: true, opacity: base,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      ring.position.z = 20 - i * (40 / (count - 1));
      ring.userData.base = base;
      rings.push(ring);
      group.add(ring);
    }
    const tags = itemsOf(scene, 6).map((text, k) => {
      const sprite = fitLabel(label(text, {height: 0.55, pill: true}), 4.4);
      sprite.position.set(k % 2 ? 3.6 : -3.6, k % 3 === 1 ? 1.5 : -1.3, 20 - (2 + k * 3) * (40 / (count - 1)));
      group.add(sprite);
      return sprite;
    });
    return {
      group,
      update({time, energy, exit}) {
        tags.forEach((sprite) => setLabelScale(sprite, energy * (1 - exit)));
        rings.forEach((ring, i) => {
          ring.rotation.z = Math.sin(i * 0.9) * 0.06 + time * (i % 2 ? -0.018 : 0.024);
          ring.scale.setScalar(1 + Math.sin(time * 1.3 - i * 0.43) * 0.022);
          (ring.material as THREE.MeshBasicMaterial).opacity = ring.userData.base * energy * (1 - exit);
        });
      }
    };
  }
};
