import * as THREE from "three";
import {captureOpacity, coverImage, fitLabel, flatBar, halo, itemsOf, roundedRectShape, setGroupOpacity, setLabelScale, surfaceColor, type MotifDef} from "./common";

const SIZES = {
  phone: {w: 3.5, h: 7.2, r: 0.5, screenW: 3.1, screenH: 6.7},
  laptop: {w: 9.6, h: 6, r: 0.35, screenW: 9.1, screenH: 5.5},
  monitor: {w: 10.2, h: 6.2, r: 0.3, screenW: 9.7, screenH: 5.7}
} as const;

/**
 * A product shown on a phone, laptop, or monitor. `images[0]` is the screen content (a real screenshot);
 * `items` float around the device as feature callouts.
 */
export const deviceMotif: MotifDef = {
  span: 8,
  view: 19,
  create({palette, glow, scene, label, assets}) {
    const kind = scene.device ?? "laptop";
    const size = SIZES[kind];
    const group = new THREE.Group();
    const body = new THREE.Group();
    group.add(body);

    const shell = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedRectShape(size.w, size.h, size.r), {depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 10}),
      new THREE.MeshPhysicalMaterial({color: palette.ink, roughness: 0.35, metalness: 0.65, transparent: true, opacity: 1})
    );
    shell.position.z = -0.11;
    body.add(shell);
    body.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(size.w + 0.1, size.h + 0.1)), new THREE.LineBasicMaterial({color: palette.secondary, transparent: true, opacity: 0.55})));

    const image = scene.images?.[0];
    const screen = new THREE.Group();
    screen.position.z = 0.17;
    if (image) screen.add(coverImage(assets.image(image), size.screenW, size.screenH));
    else {
      const surface = surfaceColor(palette);
      screen.add(flatBar(size.screenW, size.screenH, palette.ink, 1));
      const topBar = flatBar(size.screenW, 0.5, surface, 0.5); topBar.position.set(0, size.screenH / 2 - 0.25, 0.01); screen.add(topBar);
      for (let i = 0; i < 3; i++) {
        const card = flatBar(size.screenW * 0.27, size.screenH * 0.2, i === 0 ? palette.primary : surface, i === 0 ? 0.8 : 0.5);
        card.position.set((i - 1) * size.screenW * 0.31, size.screenH * 0.18, 0.01);
        screen.add(card);
      }
      const panel = flatBar(size.screenW * 0.9, size.screenH * 0.38, surface, 0.4); panel.position.set(0, -size.screenH * 0.22, 0.01); screen.add(panel);
    }
    body.add(screen);

    if (kind === "laptop") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(size.w * 1.18, 0.22, 1.9), new THREE.MeshPhysicalMaterial({color: palette.ink, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 1}));
      base.position.set(0, -size.h / 2 - 0.1, 0.75);
      body.add(base);
    } else if (kind === "monitor") {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.2), new THREE.MeshPhysicalMaterial({color: palette.ink, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 1}));
      stand.position.set(0, -size.h / 2 - 0.7, -0.1);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.2), stand.material);
      foot.position.set(0, -size.h / 2 - 1.4, 0.1);
      body.add(stand, foot);
    }

    const glow2 = halo(glow, palette.primary, 0.22, 22);
    glow2.position.z = -2;
    group.add(glow2);

    // Phones get callouts on both sides; wide devices get a row beneath, so the words never fight the headline.
    const words = itemsOf(scene, 6);
    const callouts = words.map((text, k) => {
      const sprite = fitLabel(label(text, {height: 0.56, pill: true}), 4.2);
      const base = new THREE.Vector3();
      if (kind === "phone") base.set((k % 2 ? 1 : -1) * (3.2 + (k % 3) * 0.3), size.h * 0.3 - Math.floor(k / 2) * size.h * 0.3, 2.2);
      else {
        const perRow = Math.min(3, words.length), row = Math.floor(k / perRow), col = k % perRow;
        base.set((col - (perRow - 1) / 2) * 4.4, -size.h / 2 - 1.5 - row * 0.95, 1.6);
      }
      group.add(sprite);
      return {sprite, base, phase: k * 1.7};
    });
    captureOpacity(group);

    return {
      group,
      update({time, energy, exit}) {
        body.rotation.y = -0.32 + Math.sin(time * 0.22) * 0.07;
        body.rotation.x = Math.sin(time * 0.3) * 0.025;
        group.position.y = Math.sin(time * 0.4) * 0.14;
        group.scale.setScalar(0.85 + energy * 0.15);
        callouts.forEach(({sprite, base, phase}) => {
          sprite.position.set(base.x, base.y + Math.sin(time * 0.6 + phase) * 0.18, base.z);
          setLabelScale(sprite, 1);
        });
        setGroupOpacity(group, energy * (1 - exit));
      }
    };
  }
};
