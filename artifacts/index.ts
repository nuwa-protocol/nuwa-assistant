// Export all artifact components
export { textArtifact } from "./text";
export { codeArtifact } from "./code";
export { imageArtifact } from "./image";
export { sheetArtifact } from "./sheet";

// Export unified artifact definitions
import { textArtifact } from "./text";
import { codeArtifact } from "./code";
import { imageArtifact } from "./image";
import { sheetArtifact } from "./sheet";

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
];

export type ArtifactKind = (typeof artifactDefinitions)[number]["kind"];
