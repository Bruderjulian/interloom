import { createRequire } from "module";
import type { Logger, PluginSource, PluginSourceType } from "./types.ts";
import type { EventEmitter } from "eventemitter3";
import { LoadingError } from "./utils.ts";

export class SourceRegistry {
  private sources = new Map<string, PluginSource>();

  #logger;
  #emitter;
  constructor(logger: Logger, emitter: EventEmitter) {
    this.#logger = logger;
    this.#emitter = emitter;
  }

  register(name: string, path: string, type: PluginSourceType): void {
    if (this.sources.has(name)) {
      throw new LoadingError(`Source ${name} is already registered`);
    }

    const registration: PluginSource = {
      name: name,
      path: path,
      type: type,
    };
    this.sources.set(name, registration);
    this.#emitter.emit("plugin:registered", { name, type, path });
  }

  unregister(name: string): boolean {
    if (this.sources.delete(name)) {
      this.#emitter.emit("plugin:unregistered", { name });
      return true;
    }
    return false;
  }

  list(): PluginSource[] {
    return Array.from(this.sources.values());
  }

  resolve(name: string) {
    const registration = this.sources.get(name);
    if (!registration) {
      return undefined;
    }
    if (registration.type === "module") {
      return loadWithRequire(registration.path);
    } else if (registration.type === "file") {
      return loadWithRequire(registration.path);
    } else if (registration.type === "url") {
      throw new Error("URL plugin sources are currently not implemented");
    }
  }
}

const require = createRequire(import.meta.url);
function loadWithRequire(path: string) {
  try {
    const pluginCls = require(path)?.default;
    if (!pluginCls) {
      throw new LoadingError(`No exported Plugin found in ${path}`);
    }
    return pluginCls;
  } catch (error) {
    if (error instanceof LoadingError) {
      throw error;
    }
    throw new LoadingError(`Failed to load plugin from ${path}: ${error}`);
  }
}
