export type ToolId =
  | 'merge'
  | 'split'
  | 'extract-pages'
  | 'delete-pages'
  | 'rotate'
  | 'organize'
  | 'compress'
  | 'sign-pdf'
  | 'image-to-pdf'
  | 'pdf-to-images';

export interface AlertService {
  show(title: string, message: string): void;
  hide(): void;
}

export interface ProgressService {
  show(message?: string): void;
  hide(): void;
}

export interface DownloadService {
  save(blob: Blob, filename: string): void;
}

export interface AppServices {
  alerts: AlertService;
  progress: ProgressService;
  downloads: DownloadService;
}

export interface ToolContext {
  container: HTMLElement;
  services: AppServices;
}

export interface ToolModule {
  mount(context: ToolContext): void | Promise<void>;
  dispose(): void | Promise<void>;
}

export interface ToolDefinition {
  id: ToolId;
  name: string;
  icon: string;
  subtitle: string;
  load(): Promise<ToolModule>;
}
