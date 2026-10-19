// Élément <model-viewer> (Google) utilisé par components/product/ModelViewer3D.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  poster?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "auto-rotate-delay"?: number;
  "rotation-per-second"?: string;
  "interaction-prompt"?: string;
  "touch-action"?: string;
  "shadow-intensity"?: string;
  "shadow-softness"?: string;
  exposure?: string;
  "environment-image"?: string;
  "camera-orbit"?: string;
  "min-camera-orbit"?: string;
  "max-camera-orbit"?: string;
  "field-of-view"?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
