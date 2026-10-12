import * as THREE from "three";
import {clamp, easeOutExpo} from "../timeline";
import {captureOpacity, coverImage, edgePlane, fitLabel, flatBar, itemsOf, setGroupOpacity, surfaceColor, type MotifDef} from "./common";

/**
 * A floating app window. `items` name the three cards, then the sidebar entries; `images[0]` fills the main panel
 * (a real screenshot of the product). Without them it shows a neutral interface skeleton.
 */
export const screenMotif: MotifDef = {
  span: 8,
  view: 19,
  create({palette, scene, label, assets}) {
    const surface = surfaceColor(palette);
    const group = new THREE.Group();
    const frame = edgePlane(11, 6.6, palette.ink, 0.92);
    group.add(frame);

    const words = itemsOf(scene, 8);
    const cardWords = words.slice(0, 3), sideWords = words.slice(3);
    const parts: {node: THREE.Object3D; order: number}[] = [];
    const add = (node: THREE.Object3D, x: number, y: number, order: number) => {
      const holder = new THREE.Group();
      holder.position.set(x, y, 0.05);
      holder.add(node);
      frame.add(holder);
      parts.push({node: holder, order});
    };

    add(flatBar(11, 0.5, palette.ink, 0.18), 0, 3.05, 0);
    [palette.highlight, palette.primary, palette.secondary].forEach((color, i) => {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.9}));
      add(dot, -5.1 + i * 0.3, 3.05, 0);
    });
    for (let i = 0; i < 5; i++) {
      const text = sideWords[i];
      if (text) add(fitLabel(label(text, {height: 0.3, color: i === 0 ? palette.primary : palette.text}), 1.9), -4.2, 1.9 - i * 0.7, 1 + i * 0.25);
      else add(flatBar(1.5, 0.2, i === 1 ? palette.primary : palette.ink, i === 1 ? 0.85 : 0.35), -4.35, 1.9 - i * 0.7, 1 + i * 0.25);
    }

    const cardColors = [palette.primary, palette.secondary, palette.highlight];
    for (let i = 0; i < 3; i++) {
      const card = new THREE.Group();
      card.add(flatBar(2.55, 1.25, surface, 0.9));
      const stripe = flatBar(2.55, 0.08, cardColors[i], 0.95); stripe.position.set(0, 0.585, 0.01);
      card.add(stripe);
      if (cardWords[i]) {
        const title = fitLabel(label(cardWords[i], {height: 0.34, color: palette.ink}), 2.2);
        title.position.set(0, -0.05, 0.02);
        card.add(title);
      } else {
        const labelBar = flatBar(1.1, 0.1, palette.ink, 0.5); labelBar.position.set(-0.6, 0.18, 0.01);
        const valueBar = flatBar(1.6, 0.26, palette.ink, 0.75); valueBar.position.set(-0.4, -0.2, 0.01);
        card.add(labelBar, valueBar);
      }
      add(card, -1.45 + i * 2.85, 1.75, 1.2 + i * 0.35);
    }

    const image = scene.images?.[0];
    if (image) {
      add(coverImage(assets.image(image), 5.6, 2.6, 0.95), -0.2, -1.1, 2.4);
    } else {
      add(flatBar(5.4, 2.55, surface, 0.86), -0.2, -1.1, 2.4);
      const chartPoints = [[-2.4, -0.9], [-1.5, -0.35], [-0.7, -0.6], [0.2, 0.3], [1.1, 0.0], [2.4, 0.9]].map(([x, y]) => new THREE.Vector3(x, y, 0.02));
      add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(chartPoints), new THREE.LineBasicMaterial({color: palette.primary, transparent: true, opacity: 1})), -0.2, -1.1, 2.7);
    }

    for (let i = 0; i < 4; i++) {
      add(flatBar(2.2, 0.18, palette.ink, 0.5), 3.65, -0.1 - i * 0.62, 2.6 + i * 0.2);
      add(flatBar(1.3, 0.1, palette.ink, 0.28), 3.2, -0.34 - i * 0.62, 2.7 + i * 0.2);
    }

    const cursor = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([
      new THREE.Vector2(0, 0), new THREE.Vector2(0, -0.62), new THREE.Vector2(0.17, -0.47), new THREE.Vector2(0.32, -0.78),
      new THREE.Vector2(0.46, -0.72), new THREE.Vector2(0.32, -0.42), new THREE.Vector2(0.56, -0.4)
    ])), new THREE.MeshBasicMaterial({color: palette.text, transparent: true, opacity: 1, side: THREE.DoubleSide}));
    cursor.position.z = 0.3;
    frame.add(cursor);
    captureOpacity(group);

    return {
      group,
      update({time, energy, exit, local}) {
        group.rotation.y = -0.28 + Math.sin(time * 0.2) * 0.05;
        group.rotation.x = Math.sin(time * 0.3) * 0.02;
        group.position.y = Math.sin(time * 0.4) * 0.15;
        group.scale.setScalar(0.85 + energy * 0.15);
        parts.forEach(({node, order}) => {
          const k = easeOutExpo(clamp(energy * 1.6 - order * 0.12));
          node.scale.set(1, Math.max(0.001, k), 1);
        });
        const sweep = clamp((local + 0.5) / 4);
        cursor.position.x = -4.2 + sweep * 3.9 + Math.sin(time * 0.9) * 0.15;
        cursor.position.y = 1.9 - Math.sin(sweep * Math.PI) * 0.8 - sweep * 1.5;
        setGroupOpacity(group, energy * (1 - exit));
      }
    };
  }
};
