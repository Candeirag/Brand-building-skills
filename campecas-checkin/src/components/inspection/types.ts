import type { ChecklistItemState } from "@/lib/checklist";
import type { PhotoCategory } from "@/lib/photos";

export type PhotoView = {
  id: string;
  category: PhotoCategory;
  item_key: string | null;
  storage_path: string;
  caption: string | null;
  url: string | null;
  created_at: string;
};

export type PendingUpload = {
  tempId: string;
  category: PhotoCategory;
  item_key: string | null;
  previewUrl: string;
  error?: string;
  file: File;
};

export type ItemsState = Record<string, ChecklistItemState>;

export type Mechanic = { id: string; full_name: string };

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "offline" }
  | { kind: "error"; message: string };
