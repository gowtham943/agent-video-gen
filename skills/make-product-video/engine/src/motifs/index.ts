import type {MotifName} from "../types";
import type {MotifDef} from "./common";
import {constellationMotif} from "./constellation";
import {deviceMotif} from "./device";
import {documentMotif} from "./document";
import {iconMotif} from "./icon";
import {latticeMotif} from "./lattice";
import {mediaMotif} from "./media";
import {orbitMotif} from "./orbit";
import {panelsMotif} from "./panels";
import {portalsMotif} from "./portals";
import {scanMotif} from "./scan";
import {screenMotif} from "./screen";
import {skylineMotif} from "./skyline";
import {streamMotif} from "./stream";

export const MOTIFS: Record<MotifName, MotifDef> = {
  document: documentMotif,
  scan: scanMotif,
  lattice: latticeMotif,
  constellation: constellationMotif,
  panels: panelsMotif,
  portals: portalsMotif,
  skyline: skylineMotif,
  orbit: orbitMotif,
  stream: streamMotif,
  screen: screenMotif,
  icon: iconMotif,
  device: deviceMotif,
  media: mediaMotif
};

export const MOTIF_NAMES = Object.keys(MOTIFS) as MotifName[];
