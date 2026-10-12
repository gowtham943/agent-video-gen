import * as THREE from "three";
import {ICONS} from "../icons";
import {shapesFromPath} from "../svgPath";
import {fitLabel, halo, itemsOf, setLabelScale, type MotifDef} from "./common";

/**
 * One bold 3D symbol of the product's world (a shield for security, a leaf for sustainability, a cart for commerce...)
 * with `items` orbiting it. Pick `icon` from the built-in set or pass `iconPath` for a custom silhouette.
 */
export const iconMotif: MotifDef = {
  span: 8,
  view: 17,
  create({palette, glow, scene, label}) {
    const group = new THREE.Group();
    const path = scene.iconPath ?? ICONS[scene.icon ?? "star"];
    const geometry = new THREE.ExtrudeGeometry(shapesFromPath(path, 6.4), {depth: 1.1, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 3, curveSegments: 10});
    geometry.center();
    const body = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({color: palette.ink, emissive: palette.primary, emissiveIntensity: 0.42, roughness: 0.22, metalness: 0.55}));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), new THREE.LineBasicMaterial({color: palette.secondary, transparent: true, opacity: 0.8}));
    const hero = new THREE.Group();
    hero.add(body, edges);
    group.add(hero);

    const rings = [4.2, 5.4].map((radius, k) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 6, 160), new THREE.MeshBasicMaterial({color: k ? palette.secondary : palette.primary, transparent: true, opacity: 0.4}));
      ring.rotation.x = 1.15 + k * 0.5;
      ring.rotation.y = k * 0.7;
      group.add(ring);
      return ring;
    });
    const aura = halo(glow, palette.primary, 0.3, 17);
    aura.position.z = -1.6;
    group.add(aura);

    const chips = itemsOf(scene, 6).map((text, k, all) => {
      const sprite = fitLabel(label(text, {height: 0.56, pill: true}), 4.4);
      group.add(sprite);
      return {sprite, phase: (k / all.length) * Math.PI * 2};
    });

    return {
      group,
      update({time, energy}) {
        hero.rotation.y = Math.sin(time * 0.45) * 0.55 - 0.15;
        hero.rotation.x = Math.sin(time * 0.33) * 0.1;
        hero.scale.setScalar(0.2 + energy * 0.8 + Math.sin(time * 1.6) * 0.012);
        (aura.material as THREE.SpriteMaterial).opacity = energy * 0.3;
        rings.forEach((ring, k) => { ring.rotation.z = time * (k ? -0.07 : 0.09); ring.scale.setScalar(energy); });
        chips.forEach(({sprite, phase}) => {
          const a = phase + time * 0.2;
          sprite.position.set(Math.cos(a) * 4.9, Math.sin(a) * 2.9 + 0.2, Math.sin(a) * 2.2 + 0.8);
          setLabelScale(sprite, energy);
        });
      }
    };
  }
};
