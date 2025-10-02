import "dotenv/config";
import mongoose from "mongoose";
import { Ticket } from "@modules/tickets/ticket.model";

async function run(label: string, filter: any) {
  // updateMany con pipeline para castear a Double
  const res = await Ticket.collection.updateMany(
    filter,
    [{ $set: { [label]: { $toDouble: `$${label}` } } }]
  );
  console.log(`${label} ${JSON.stringify(filter)} =>`, res.modifiedCount);
}

async function main() {
  const uri = process.env.MONGO_URI!;
  const dbName = process.env.MONGO_DB_NAME || undefined;
  if (!uri) throw new Error("Falta MONGO_URI");

  await mongoose.connect(uri, dbName ? { dbName } : undefined);

  // total -> double
  await run("total",   { total: { $type: "string" } });
  await run("total",   { total: { $type: "int" } });
  await run("total",   { total: { $type: "long" } });

  // importe -> double (sólo peajes si lo usas)
  await run("importe", { importe: { $type: "string" } });
  await run("importe", { importe: { $type: "int" } });
  await run("importe", { importe: { $type: "long" } });

  await mongoose.disconnect();
  console.log("OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
