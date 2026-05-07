import { strictEqual, throws } from "assert";
import { describe, beforeEach, it } from "node:test";
import { Interloom } from "../src/index.ts";

describe("Interloom Source Management", () => {
  let interloom: Interloom;

  beforeEach(() => {
    interloom = new Interloom("test", {});
  });

  it("registers and lists sources", () => {
    interloom.registerSource("testSource", "./some/path", "file");
    const sources = interloom.listSources();
    strictEqual(sources.length, 1);
    strictEqual(sources[0].name, "testSource");
    strictEqual(sources[0].path, "./some/path");
    strictEqual(sources[0].type, "file");
  });

  it("unregisters sources", () => {
    interloom.registerSource("toRemove", "./remove/path", "file");
    strictEqual(interloom.unregisterSource("toRemove"), true);
    strictEqual(interloom.listSources().length, 0);
  });

  it("does not unregister missing sources", () => {
    strictEqual(interloom.unregisterSource("missing"), false);
  });

  it("throws on duplicate source registration", () => {
    interloom.registerSource("dup", "./a", "file");
    throws(() => interloom.registerSource("dup", "./b", "file"));
  });
});
