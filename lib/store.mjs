import fs from "node:fs/promises";
import path from "node:path";

export class ReceiptStore {
  constructor(file) { this.file = file; this.lock = Promise.resolve(); }
  async read() { try { return JSON.parse(await fs.readFile(this.file, "utf8")); } catch (error) { if (error.code === "ENOENT") return { version: 1, receipts: [] }; throw error; } }
  async append(receipt, config) {
    const next = this.lock.then(async () => {
      const data = await this.read();
      if (data.receipts.some((item) => item.txid === receipt.txid)) throw new Error("Transaction already has a receipt.");
      const issued = data.receipts.reduce((sum, item) => sum + BigInt(item.amount), 0n);
      if (issued + BigInt(receipt.amount) > config.cap) throw new Error("Launch cap would be exceeded.");
      data.receipts.push(receipt); await fs.mkdir(path.dirname(this.file), { recursive: true });
      const temporary = `${this.file}.${process.pid}.${Date.now()}.tmp`; await fs.writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 }); await fs.rename(temporary, this.file); return receipt;
    });
    this.lock = next.catch(() => {}); return next;
  }
}
