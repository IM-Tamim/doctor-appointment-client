// Resets every seeded hospital to the data in seed-data.mjs — details,
// departments, placeholder phones, cover photo and logo — and leaves the rest
// of the database alone.
//
// Each hospital is rewritten under the id the rest of the data already uses,
// so doctors, ambulances, appointments and hospital managers stay linked
// (deleting and re-inserting would give new ids and orphan all of those):
//   - an existing hospital with the same name keeps its id; if there are
//     duplicates, the one with the most links wins and the unlinked extras
//     are removed;
//   - a hospital that's missing but still referenced by doctors (or
//     ambulances / appointments) is recreated under that referenced id.
// Hospitals that aren't in the seed list are reported, not touched.
//
// Any edits made since seeding (by an admin or a hospital manager) are lost.
//
//   node scripts/reseed-hospitals.mjs
//   DB_NAME=DocAppoint_dev node scripts/reseed-hospitals.mjs

import dotenv from "dotenv";
dotenv.config();

const { MongoClient, ObjectId } = await import("mongodb");
const { HOSPITALS, hospitalDoc } = await import("./seed-data.mjs");

const DB_NAME = process.env.DB_NAME || "DocAppoint";
const client = new MongoClient(process.env.MONGO_URI);

try {
  await client.connect();
  const db = client.db(DB_NAME);
  const hospitals = db.collection("hospitals");
  const doctors = db.collection("doctors");
  const ambulances = db.collection("ambulances");
  const appointments = db.collection("appointments");
  const users = db.collection("user");
  console.log(`Database: ${DB_NAME}`);

  const linksTo = async (id) => {
    const hospitalId = String(id);
    const counts = await Promise.all([
      doctors.countDocuments({ hospitalId }),
      ambulances.countDocuments({ hospitalId }),
      appointments.countDocuments({ hospitalId }),
      users.countDocuments({ hospitalId }),
    ]);
    return counts.reduce((a, b) => a + b, 0);
  };

  /** An id still referenced under this hospital's name, though no hospital has it. */
  const orphanedIdFor = async (name) => {
    const existingIds = new Set((await hospitals.find({}, { projection: { _id: 1 } }).toArray()).map((h) => String(h._id)));
    // (aggregate rather than distinct, which the Stable API doesn't allow)
    for (const [collection, field] of [[doctors, "hospital"], [appointments, "hospitalName"]]) {
      const rows = await collection
        .aggregate([{ $match: { [field]: name, hospitalId: { $nin: [null, ""] } } }, { $group: { _id: "$hospitalId", n: { $sum: 1 } } }, { $sort: { n: -1 } }])
        .toArray();
      const orphan = rows.find((r) => !existingIds.has(r._id) && ObjectId.isValid(r._id));
      if (orphan) return new ObjectId(orphan._id);
    }
    return null;
  };

  let reset = 0;
  let restored = 0;
  let added = 0;
  let removed = 0;
  for (const [i, h] of HOSPITALS.entries()) {
    const doc = hospitalDoc(h, i);
    const sameName = await hospitals.find({ name: h.name }).toArray();
    const ranked = await Promise.all(sameName.map(async (x) => ({ x, links: await linksTo(x._id) })));
    ranked.sort((a, b) => b.links - a.links);
    const orphanId = await orphanedIdFor(h.name);

    // Records still point at a missing id and no same-named hospital has
    // links: bring the hospital back under that id, dropping empty copies.
    if (orphanId && !ranked.some((r) => r.links > 0)) {
      for (const { x } of ranked) {
        await hospitals.deleteOne({ _id: x._id });
        removed++;
        console.log(`removed   unlinked copy of ${h.name} (${x._id})`);
      }
      await hospitals.insertOne({ ...doc, _id: orphanId });
      restored++;
      console.log(`restored  ${h.name} under its old id ${orphanId} (${await linksTo(orphanId)} linked records reconnected)`);
      continue;
    }

    if (ranked.length) {
      // Keep the most-linked one; drop unlinked duplicates.
      const [keep, ...extras] = ranked;
      await hospitals.replaceOne({ _id: keep.x._id }, { ...doc, createdAt: keep.x.createdAt || doc.createdAt });
      reset++;
      for (const extra of extras) {
        if (extra.links === 0) {
          await hospitals.deleteOne({ _id: extra.x._id });
          removed++;
          console.log(`removed   duplicate ${h.name} (${extra.x._id}, nothing linked)`);
        } else {
          console.log(`kept      duplicate ${h.name} (${extra.x._id}, ${extra.links} linked records — fix by hand)`);
        }
      }
      console.log(`reset     ${h.name}`);
      continue;
    }

    await hospitals.insertOne(doc);
    added++;
    console.log(`added     ${h.name}`);
  }

  const seeded = new Set(HOSPITALS.map((h) => h.name));
  const extra = await hospitals.find({ name: { $nin: [...seeded] } }, { projection: { name: 1 } }).toArray();
  for (const h of extra) console.log(`kept      ${h.name} (not in the seed list)`);

  console.log(`\nDone: ${reset} reset, ${restored} restored, ${added} added, ${removed} duplicates removed, ${extra.length} left as they were.`);
} finally {
  await client.close();
}
