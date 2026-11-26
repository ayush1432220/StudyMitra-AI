import fs from "fs";
import path from "path";
import { config } from "../config/index.js";

// Minimal collection-backed JSON file store (swap for a real DB later).
export class JsonCollection {
  constructor(name) {
    this.file = path.join(config.dataDir, `${name}.json`);
  }
  all() {
    try {
      return JSON.parse(fs.readFileSync(this.file, "utf8"));
    } catch {
      return [];
    }
  }
  save(items) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(items, null, 2));
    fs.renameSync(tmp, this.file);
  }
  find(pred) {
    return this.all().find(pred);
  }
  insert(item) {
    const items = this.all();
    items.push(item);
    this.save(items);
    return item;
  }
  update(id, patch) {
    const items = this.all();
    const i = items.findIndex((x) => x.id === id);
    if (i === -1) return null;
    items[i] = { ...items[i], ...patch };
    this.save(items);
    return items[i];
  }
  remove(id) {
    const items = this.all();
    const next = items.filter((x) => x.id !== id);
    this.save(next);
    return next.length !== items.length;
  }
}
