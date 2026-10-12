import * as THREE from "three";
import {clamp, easeOutExpo} from "../timeline";
import {edgePlane, fitLabel, flatBar, halo, itemsOf, setLabelScale, type MotifDef} from "./common";

/** A stack of structured pages suspended in space, then released. Source material, the problem, or an opening. */
export const documentMotif: MotifDef = {
  span: 8,
  view: 20,
  create({palette, random, glow, scene, label}) {
    const group = new THREE.Group();
    const pages: THREE.Group[] = [];
    for (let p = 0; p < 9; p++) {
      const page = edgePlane(6.7, 8.7, p % 3 === 0 ? palette.primary : palette.secondary, 0.88 - p * 0.045);
      page.position.set((p - 4) * 0.09, (p - 4) * -0.055, p * -0.24);
      page.rotation.z = (p - 4) * 0.012;
      for (let row = 0; row < 7; row++) {
        const isTable = row > 3 && p % 3 === 0;
        const w = isTable ? 4.7 : 2.3 + random() * 2.2;
        const bar = flatBar(w, isTable ? 0.16 : 0.075, row === 0 ? palette.highlight : palette.ink, row === 0 ? 0.85 : 0.48);
        bar.position.set(-2.55 + w / 2, 3.15 - row * 0.78, 0.035);
        page.add(bar);
      }
      pages.push(page);
      group.add(page);
    }
    const chips = itemsOf(scene, 5).map((text, k) => {
      const sprite = fitLabel(label(text, {height: 0.55, pill: true}), 4);
      sprite.position.set(5.2, 2.6 - k * 1.3, 0.8);
      group.add(sprite);
      return sprite;
    });
    const glowSprite = halo(glow, palette.primary, 0.28, 16);
    glowSprite.position.z = -1.4;
    group.add(glowSprite);

    return {
      group,
      update({time, local, duration, energy}) {
        const release = easeOutExpo(clamp((local - duration * 0.52) / (duration * 0.7)));
        group.rotation.y = -0.22 + time * 0.055;
        group.rotation.x = Math.sin(time * 0.4) * 0.04;
        group.scale.setScalar(0.85 + energy * 0.15);
        pages.forEach((page, i) => {
          page.position.x = (i - 4) * 0.09 + release * (i - 4) * 0.82;
          page.position.y = (i - 4) * -0.055 + release * Math.sin(i * 1.7) * 1.05;
          page.position.z = i * -0.24 - release * (i % 3) * 1.4;
          page.rotation.y = release * (i - 4) * 0.075;
        });
        (glowSprite.material as THREE.SpriteMaterial).opacity = 0.28 * (1 - release * 0.75);
        chips.forEach((sprite) => setLabelScale(sprite, release));
      }
    };
  }
};
