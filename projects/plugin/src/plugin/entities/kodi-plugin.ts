export interface KodiPlugin {
  name: string;
  handleAddonExecute: boolean;
  plugin: string;
  enabled?: boolean;
  tvUrl?: string;
  movieUrl?: string;
}

export interface KodiPluginList {
  [key: string]: KodiPlugin;
}
