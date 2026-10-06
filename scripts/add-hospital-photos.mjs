// Adds the cover photos from seed-data.mjs to hospitals that are already in
// the database, matched by name. Safe to run on live data: it only sets the
// image fields, and never overwrites a photo an admin uploaded.
//
//   node scripts/add-hospital-photos.mjs
//   DB_NAME=DocAppoint_dev node scripts/add-hospital-photos.mjs

import dotenv from "dotenv";
dotenv.config();

const { MongoClient } = await import("mongodb");
const { HOSPITALS, HOSPITAL_PHOTOS } = await import("./seed-data.mjs");

const DB_NAME = process.env.DB_NAME || "DocAppoint";
const client = new MongoClient(process.env.MONGO_URI);

try {
  await client.connect();
  const hospitals = client.db(DB_NAME).collection("hospitals");
  console.log(`Database: ${DB_NAME}`);
  for (const h of HOSPITALS) {
    const photo = HOSPITAL_PHOTOS[h.key];
    if (!photo) continue;
    const result = await hospitals.updateOne(
      { name: h.name, $or: [{ image: { $exists: false } }, { image: "" }, { image: { $regex: "^/hospitals/" } }] },
      { $set: photo }
    );
    console.log(`${result.modifiedCount ? "updated" : result.matchedCount ? "unchanged" : "skipped"}  ${h.name}`);
  }
} finally {
  await client.close();
}
