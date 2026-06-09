import { Video, Music2, Camera, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import type { Provider } from "@/lib/types";

/** Display metadata (label, icon, accent color) for each provider. */
export const PROVIDER_META: Record<
  Provider,
  { label: string; Icon: typeof LinkIcon; color: string }
> = {
  youtube: { label: "YouTube", Icon: Video, color: "#ff0033" },
  tiktok: { label: "TikTok", Icon: Music2, color: "#111111" },
  instagram: { label: "Instagram", Icon: Camera, color: "#d6249f" },
  generic: { label: "Link", Icon: LinkIcon, color: "#4f46e5" },
  image: { label: "Image", Icon: ImageIcon, color: "#0ea5e9" },
};
