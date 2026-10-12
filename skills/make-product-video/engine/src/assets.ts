import * as THREE from "three";
import type {Assets, LoadedImage} from "./motifs/common";

/** Decode every image before the first frame so rendering never captures a half-loaded texture. */
export async function loadAssets(urls: string[]): Promise<Assets> {
  const unique = [...new Set(urls)];
  const entries = await Promise.all(unique.map(async (url): Promise<[string, LoadedImage]> => {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error(`Could not load image ${url}. Is it in public/assets/?`); }
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return [url, {texture, aspect: image.naturalWidth / image.naturalHeight}];
  }));
  const map = new Map(entries);
  return {
    image(url) {
      const found = map.get(url);
      if (!found) throw new Error(`Image ${url} was not preloaded`);
      return found;
    }
  };
}
