import { BasePlugin } from "./index.js";
import type { Plugin } from "./index.js";

export default class MathlyStringPlugin extends BasePlugin {
  constructor() {
    super({
      name: "",
      version: "",
    });
  }
}
export const plugin: Plugin = {
  metadata: {
    name: "",
    version: "",
  },
};
