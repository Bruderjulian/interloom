import { strictEqual } from "assert";
import { describe, beforeEach, it } from "node:test";
import { Interloom, BasePlugin } from "../src/index.ts";

describe("Interloom Basic Plugin Management", () => {
  class DummyPlugin extends BasePlugin {
    loaded = false;
    activated = false;
    deactivated = false;
    async onLoad() {
      this.loaded = true;
    }
    async onActivate() {
      this.activated = true;
    }
    async onDeactivate() {
      this.deactivated = true;
    }
  }

  let interloom: Interloom;
  let plugin: DummyPlugin;

  beforeEach(() => {
    interloom = new Interloom("test", {});
    plugin = new DummyPlugin({ name: "dummy", version: "1.0.0" });
  });

  it("loads a plugin", async () => {
    await interloom.load(plugin);
    strictEqual(plugin.loaded, true);
  });

  it("activates a plugin", async () => {
    await interloom.load(plugin);
    await interloom.activate(plugin);
    strictEqual(plugin.activated, true);
  });

  it("deactivates a plugin", async () => {
    await interloom.load(plugin);
    await interloom.activate(plugin);
    await interloom.deactivate(plugin);
    strictEqual(plugin.deactivated, true);
  });
});
