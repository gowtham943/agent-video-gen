import * as THREE from "three";
import {fitLabel, itemsOf, setLabelScale, type MotifDef} from "./common";

/** Particles flowing along ribbons into a gate. Workflows, pipelines, delivery, movement toward an outcome. */
export const streamMotif: MotifDef = {
  span: 12,
  view: 20,
  create({palette, random, scene, label}) {
    const group = new THREE.Group();
    const lanes = 6, perLane = 70;
    const colors = [palette.primary, palette.secondary, palette.highlight];
    const curves = Array.from({length: lanes}, (_, lane) => {
      const y0 = (lane - (lanes - 1) / 2) * 1.5;
      const z0 = (random() - 0.5) * 6;
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(-10, y0 * 1.3, z0),
        new THREE.Vector3(-5, y0 * 0.9 + Math.sin(lane) * 0.8, z0 * 0.6),
        new THREE.Vector3(-1, y0 * 0.35, z0 * 0.2),
        new THREE.Vector3(2.8, 0, 0)
      ]);
    });
    curves.forEach((curve, lane) => {
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), new THREE.LineBasicMaterial({
        color: colors[lane % 3], transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending
      })));
    });
    const laneLabels = itemsOf(scene, lanes).map((text, k) => {
      const sprite = fitLabel(label(text, {height: 0.5, pill: true}), 4.2);
      const start = curves[k].getPoint(0);
      sprite.position.set(start.x + 0.4, start.y + 0.85, start.z);
      group.add(sprite);
      return sprite;
    });
    const positions = new Float32Array(lanes * perLane * 3);
    const colorAttr = new Float32Array(lanes * perLane * 3);
    const offsets = Array.from({length: lanes * perLane}, () => random());
    for (let i = 0; i < lanes * perLane; i++) {
      const c = colors[Math.floor(i / perLane) % 3];
      colorAttr.set([c.r, c.g, c.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colorAttr, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({size: 0.16, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending}));
    points.frustumCulled = false;
    group.add(points);
    const gate = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.09, 12, 100), new THREE.MeshPhysicalMaterial({
      color: palette.primary, emissive: palette.primary, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.3
    }));
    gate.position.x = 3.2;
    gate.rotation.y = 1.15;
    group.add(gate);
    const scratch = new THREE.Vector3();
    return {
      group,
      update({time, energy}) {
        group.rotation.y = -0.2 + Math.sin(time * 0.14) * 0.05;
        for (let lane = 0; lane < lanes; lane++) for (let n = 0; n < perLane; n++) {
          const i = lane * perLane + n;
          const t = (offsets[i] + time * (0.07 + lane * 0.006)) % 1;
          curves[lane].getPoint(t, scratch);
          const squeeze = 1 - Math.pow(t, 3) * 0.7;
          positions[i * 3] = scratch.x;
          positions[i * 3 + 1] = scratch.y * squeeze + Math.sin(time * 1.4 + i) * 0.05;
          positions[i * 3 + 2] = scratch.z * squeeze;
        }
        geometry.attributes.position.needsUpdate = true;
        points.material.opacity = 0.95 * energy;
        gate.scale.setScalar(0.3 + energy * 0.7);
        gate.rotation.z = time * 0.1;
        laneLabels.forEach((sprite) => setLabelScale(sprite, energy));
      }
    };
  }
};
