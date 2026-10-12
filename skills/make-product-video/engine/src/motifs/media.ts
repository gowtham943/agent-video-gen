import * as THREE from "three";
import {IMAGE_TINT, captureOpacity, fitLabel, halo, itemsOf, setGroupOpacity, setLabelScale, type MotifDef} from "./common";

/**
 * Real pictures of the product (screenshots, photos, artwork) hung in space. One to five `images`; `items` caption them.
 * This is the motif that shows the actual product rather than a symbol of it.
 */
export const mediaMotif: MotifDef = {
  span: 9,
  view: 17,
  create({palette, glow, scene, label, assets}) {
    const group = new THREE.Group();
    const urls = (scene.images ?? []).slice(0, 5);
    const count = Math.max(1, urls.length);
    const captions = itemsOf(scene, 5);
    const frames: {holder: THREE.Group; x: number; y: number; z: number; ry: number; caption?: THREE.Sprite}[] = [];

    urls.forEach((url, i) => {
      const image = assets.image(url);
      const hero = count === 1 || i === Math.floor(count / 2);
      const height = hero ? 5.2 : 4;
      const width = Math.min(hero ? 9.2 : 6.4, image.aspect * height);
      const fitHeight = width / image.aspect;
      const holder = new THREE.Group();
      const picture = new THREE.Mesh(new THREE.PlaneGeometry(width, fitHeight), new THREE.MeshBasicMaterial({map: image.texture, color: IMAGE_TINT, transparent: true, toneMapped: false}));
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(width + 0.16, fitHeight + 0.16)), new THREE.LineBasicMaterial({color: hero ? palette.primary : palette.secondary, transparent: true, opacity: 0.85}));
      const backing = new THREE.Mesh(new THREE.PlaneGeometry(width + 0.16, fitHeight + 0.16), new THREE.MeshBasicMaterial({color: palette.ink, transparent: true, opacity: 0.9}));
      backing.position.z = -0.02;
      holder.add(backing, picture, edge);
      let caption: THREE.Sprite | undefined;
      if (captions[i]) {
        caption = fitLabel(label(captions[i], {height: 0.5, pill: true}), width);
        caption.position.set(0, -fitHeight / 2 - 0.6, 0.1);
        holder.add(caption);
      }
      const offset = i - (count - 1) / 2;
      const spread = count === 1 ? 0 : 6.2;
      frames.push({holder, x: offset * spread, y: hero ? 0 : (i % 2 ? -0.5 : 0.6), z: hero ? 0 : -1.6 - Math.abs(offset) * 0.8, ry: -offset * 0.2, caption});
      group.add(holder);
    });
    const backGlow = halo(glow, palette.primary, 0.22, 26);
    backGlow.position.z = -3;
    group.add(backGlow);
    captureOpacity(group);

    return {
      group,
      update({time, energy, exit}) {
        frames.forEach(({holder, x, y, z, ry, caption}, i) => {
          holder.position.set(x * (0.6 + energy * 0.4), y + Math.sin(time * 0.35 + i * 1.4) * 0.16, z - (1 - energy) * 3);
          holder.rotation.y = ry + Math.sin(time * 0.2 + i) * 0.03;
          holder.scale.setScalar(0.82 + energy * 0.18);
          if (caption) setLabelScale(caption, 1);
        });
        setGroupOpacity(group, energy * (1 - exit));
      }
    };
  }
};
