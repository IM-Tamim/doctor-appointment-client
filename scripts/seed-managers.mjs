// Creates (or repairs) the hospital-manager accounts.
// Run from the next/ folder:  node scripts/seed-managers.mjs
// Target a scratch database with:  DB_NAME=DocAppoint_dev node scripts/seed-managers.mjs
//
// Unlike seed.mjs this wipes nothing — it is idempotent and safe to re-run on a
// live database. For each entry it:
//   1. creates a Better Auth account if the email is new (so the password is
//      hashed the same way the sign-in form expects, and verified already),
//   2. sets role "hospital_admin", status "active" and the hospitalId.
//
// It also repairs any OTHER existing hospital_admin that has no hospitalId —
// without one the manager dashboard can only answer 403, since the server reads
// the hospital from the user document on every request.

import dotenv from "dotenv";
dotenv.config();

const { auth } = await import("../src/lib/auth.js");
const { MongoClient } = await import("mongodb");
const { MANAGERS } = await import("./seed-data.mjs");

const DB_NAME = process.env.DB_NAME || "DocAppoint";


const client = new MongoClient(process.env.MONGO_URI);
const authContext = await auth.$context;

const run = async () => {
  await client.connect();
  const db = client.db(DB_NAME);
  const users = db.collection("user");
  const hospitals = db.collection("hospitals");

  console.log(`Database: ${DB_NAME}`);

  const byName = new Map(
    (await hospitals.find({}, { projection: { name: 1 } }).toArray()).map((h) => [h.name, String(h._id)])
  );
  if (byName.size === 0) throw new Error("No hospitals in this database — run scripts/seed.mjs first.");

  let created = 0;
  for (const m of MANAGERS) {
    const hospitalId = byName.get(m.hospitalName);
    if (!hospitalId) {
      console.warn(`  ! skipped ${m.email}: no hospital named "${m.hospitalName}"`);
      continue;
    }

    const existing = await authContext.internalAdapter.findUserByEmail(m.email);
    if (!existing?.user) {
      const user = await authContext.internalAdapter.createUser({ name: m.name, email: m.email, emailVerified: true });
      await authContext.internalAdapter.linkAccount({
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: await authContext.password.hash(m.password),
      });
      created += 1;
    }

    await users.updateOne(
      { email: m.email },
      { $set: { name: m.name, role: "hospital_admin", status: "active", hospitalId, phone: m.phone, image: m.image } }
    );
    console.log(`  ${m.email} → ${m.hospitalName}`);
  }

  // Any manager left without a hospital can't use the dashboard at all.
  const orphans = await users
    .find({ role: "hospital_admin", $or: [{ hospitalId: { $exists: false } }, { hospitalId: null }, { hospitalId: "" }] })
    .toArray();
  const fallback = byName.values().next().value;
  for (const o of orphans) {
    await users.updateOne({ _id: o._id }, { $set: { hospitalId: fallback } });
    console.warn(`  ! ${o.email} had no hospital — assigned the first one as a fallback`);
  }

  const total = await users.countDocuments({ role: "hospital_admin" });
  console.log(`\n${created} new account(s); ${total} hospital manager(s) in total.`);
  console.log(`Sign in with any of the emails above / ${MANAGERS[0].password}`);
  console.log("Each one must sign in fresh — the role is read into the session at login.");
};

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
