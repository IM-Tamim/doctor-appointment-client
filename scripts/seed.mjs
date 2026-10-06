// Full reset + seed for DocAppoint.
// Run from the project root:  node scripts/seed.mjs
// Target a scratch database instead with:  DB_NAME=DocAppoint_dev node scripts/seed.mjs
//
// WARNING: this wipes ALL existing data (users, doctors, hospitals,
// appointments, payments, notifications…) in the target database before
// seeding fresh. There is no undo.
//
// Creates REAL Better Auth accounts (so passwords are hashed correctly and
// you can actually log in), then patches role/status/image directly in
// Mongo, and (for doctors) inserts an approved doctor profile document.
// What the data is (real hospitals, fictional doctors, image sources) is
// documented in seed-data.mjs.

import dotenv from "dotenv";
dotenv.config();

const { auth } = await import("../src/lib/auth.js");
const { MongoClient } = await import("mongodb");
const { HOSPITALS, DOCTORS, SCHEDULES, bioFor, hospitalDoc } = await import("./seed-data.mjs");
const { buildHistory, buildDonors, AMBULANCE_PLAN, clinicToday, addDays } = await import("./seed-history.mjs");
const { ObjectId } = await import("mongodb");

const DB_NAME = process.env.DB_NAME || "DocAppoint";

// ── Accounts ────────────────────────────────────────────────────────────

const ADMIN = {
  name: "Admin",
  email: "admin@gmail.com",
  password: "admin@123",
};

const PATIENTS = [
  { name: "Tamim Hasan", email: "tamim.patient@docappoint.test", password: "patient@123", phone: "01911000001", image: "https://randomuser.me/api/portraits/men/11.jpg" },
  { name: "Rafiul Karim", email: "rafiul.karim@docappoint.test", password: "patient@123", phone: "01911000002", image: "https://randomuser.me/api/portraits/men/23.jpg" },
  { name: "Mim Akter", email: "mim.akter@docappoint.test", password: "patient@123", phone: "01911000003", image: "https://randomuser.me/api/portraits/women/12.jpg" },
  { name: "Sabbir Rahman", email: "sabbir.rahman@docappoint.test", password: "patient@123", phone: "01911000004", image: "https://randomuser.me/api/portraits/men/45.jpg" },
  { name: "Nusrat Sultana", email: "nusrat.sultana@docappoint.test", password: "patient@123", phone: "01911000005", image: "https://randomuser.me/api/portraits/women/56.jpg" },
  { name: "Arif Chowdhury", email: "arif.chowdhury@docappoint.test", password: "patient@123", phone: "01911000006", image: "https://randomuser.me/api/portraits/men/71.jpg" },
  { name: "Sumaiya Islam", email: "sumaiya.islam@docappoint.test", password: "patient@123", phone: "01911000007", image: "https://randomuser.me/api/portraits/women/29.jpg" },
  { name: "Mehedi Hasan", email: "mehedi.hasan@docappoint.test", password: "patient@123", phone: "01911000008", image: "https://randomuser.me/api/portraits/men/38.jpg" },
  { name: "Rima Akter", email: "rima.akter@docappoint.test", password: "patient@123", phone: "01911000009", image: "https://randomuser.me/api/portraits/women/64.jpg" },
  { name: "Jahid Hasan", email: "jahid.hasan@docappoint.test", password: "patient@123", phone: "01911000010", image: "https://randomuser.me/api/portraits/men/52.jpg" },
];

// A hospital manager (role "hospital_admin") for Square Hospitals.
const MANAGER = {
  name: "Square Hospital Manager",
  email: "manager.square@docappoint.test",
  password: "manager@123",
  hospitalKey: "square",
};

// ── Reviews ─────────────────────────────────────────────────────────────

const SAMPLE_REVIEWS = [
  { userName: "Tamim Hasan", rating: 5, comment: "Very attentive and explained everything clearly." },
  { userName: "Rafiul Karim", rating: 4, comment: "Good experience, a bit of a wait but worth it." },
  { userName: "Mim Akter", rating: 5, comment: "Listened carefully and the treatment worked. Highly recommended." },
  { userName: "Sabbir Rahman", rating: 4, comment: "Professional and courteous. Would book again." },
  { userName: "Nusrat Sultana", rating: 5, comment: "Took time to answer all my questions." },
  { userName: "Arif Chowdhury", rating: 4, comment: "Clean clinic, friendly staff, on-time appointment." },
  { userName: "Sumaiya Islam", rating: 5, comment: "Extremely knowledgeable and caring." },
  { userName: "Mehedi Hasan", rating: 4, comment: "Solved my issue quickly. Reasonable fee too." },
];

// Deterministic "random" so every seed produces the same ratings.
const pseudo = (i, mod) => (i * 7919 + 104729) % mod;

const reviewsForDoctor = (i) => {
  const count = 2 + pseudo(i, 7); // 2–8
  return SAMPLE_REVIEWS.slice(0, count).map((r, k) => ({
    ...r,
    userEmail: `${r.userName.toLowerCase().replace(/\s+/g, ".")}@docappoint.test`,
    date: new Date(Date.now() - (pseudo(i + k, 60) + 1) * 86400000).toISOString(),
  }));
};

const ratingOf = (reviews) =>
  Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1));

// ── Seed logic ──────────────────────────────────────────────────────────

const client = new MongoClient(process.env.MONGO_URI);

// Accounts are created through Better Auth's internal adapter rather than the
// sign-up endpoint: same password hashing and field defaults, but no sign-up
// hooks — so seeding doesn't email a verification code to every demo address.
// Demo accounts are created already verified.
const authContext = await auth.$context;

const signUpOrGetExisting = async ({ name, email, password }) => {
  const existing = await authContext.internalAdapter.findUserByEmail(email);
  if (existing?.user) {
    console.log(`  already existed, reusing ${email}`);
  } else {
    const user = await authContext.internalAdapter.createUser({ name, email, emailVerified: true });
    await authContext.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: await authContext.password.hash(password),
    });
    console.log(`  created ${email}`);
  }
  const db = client.db(DB_NAME);
  const userDoc = await db.collection("user").findOne({ email });
  if (!userDoc) throw new Error(`Could not find or create user for ${email}`);
  return userDoc;
};

const WIPE = [
  "hospitals", "doctors", "appointments", "notifications", "payments", "prescriptions",
  "settings", "counters", "queues", "donors", "bloodRequests", "ambulances",
  "user", "account", "session", "verification", "otpThrottle",
];

async function run() {
  await client.connect();
  const db = client.db(DB_NAME);

  console.log(`Database: ${DB_NAME}`);
  console.log(`Wiping ALL existing data (${WIPE.join(", ")})...`);
  for (const name of WIPE) {
    // Better Auth's account/session collections must go too, or old logins survive.
    await db.collection(name).deleteMany({}).catch(() => {});
  }

  console.log("\nSeeding admin...");
  const adminUser = await signUpOrGetExisting(ADMIN);
  await db.collection("user").updateOne(
    { _id: adminUser._id },
    { $set: { role: "admin", status: "active" } }
  );
  console.log(`  ${ADMIN.email} is now admin`);

  console.log("\nSeeding hospitals...");
  const hospitalByKey = {};
  for (const [i, h] of HOSPITALS.entries()) {
    const { key } = h;
    const doc = hospitalDoc(h, i);
    const { insertedId } = await db.collection("hospitals").insertOne(doc);
    hospitalByKey[key] = { id: insertedId.toString(), name: h.name, city: h.city };
    console.log(`  ${h.name} (${h.city})`);
  }

  console.log("\nSeeding doctors...");
  const insertedDoctors = [];
  for (const [i, d] of DOCTORS.entries()) {
    const user = await signUpOrGetExisting({ name: d.name, email: d.email, password: d.password });
    const userId = String(user._id);
    const hospital = d.hospitalKey ? hospitalByKey[d.hospitalKey] : null;
    if (d.hospitalKey && !hospital) throw new Error(`Unknown hospital key ${d.hospitalKey} for ${d.name}`);

    await db.collection("user").updateOne(
      { _id: user._id },
      { $set: { role: "doctor", status: "active", image: d.image, phone: d.phone } }
    );

    const reviews = reviewsForDoctor(i);
    const doctorDoc = {
      userId,
      name: d.name,
      email: d.email,
      phone: d.phone,
      specialty: d.specialty,
      degree: d.degree,
      registrationNumber: d.registrationNumber,
      hospitalId: hospital?.id ?? null,
      hospital: hospital?.name ?? "",
      consultationType: d.consultationType,
      experience: `${d.experience} years`,
      location: hospital ? `${hospital.city}, Bangladesh` : "Online — anywhere in Bangladesh",
      credentialImageUrl: "",
      bio: bioFor(d, hospital?.name),
      fee: d.fee,
      followUpFeePercent: d.followUpFeePercent,
      image: d.image,
      rating: ratingOf(reviews),
      totalReviews: reviews.length,
      reviews,
      availability: SCHEDULES[d.schedule],
      maxPerHour: d.maxPerHour,
      leaveDates: [],
      approvalStatus: "approved",
      rejectionReason: "",
      createdAt: new Date(),
    };
    const { insertedId } = await db.collection("doctors").insertOne(doctorDoc);
    insertedDoctors.push({ ...doctorDoc, _id: insertedId });
  }
  console.log(`  ${DOCTORS.length} doctor profiles created`);

  console.log("\nSeeding patients...");
  const patientDocs = [];
  for (const p of PATIENTS) {
    const user = await signUpOrGetExisting(p);
    await db.collection("user").updateOne(
      { _id: user._id },
      { $set: { image: p.image, phone: p.phone } }
    );
    patientDocs.push({ ...p, _id: user._id, gender: p.image.includes("/women/") ? "Female" : "Male" });
  }

  console.log("\nSeeding hospital manager...");
  const managerUser = await signUpOrGetExisting(MANAGER);
  await db.collection("user").updateOne(
    { _id: managerUser._id },
    { $set: { role: "hospital_admin", status: "active", hospitalId: hospitalByKey[MANAGER.hospitalKey].id } }
  );
  console.log(`  ${MANAGER.email} manages ${hospitalByKey[MANAGER.hospitalKey].name}`);

  console.log("\nSeeding appointment history (past 60 days, today, next week)...");
  const { appointments, payments, receiptCount, year } = buildHistory({
    doctors: insertedDoctors,
    patients: patientDocs,
    queueDoctorEmail: DOCTORS[0].email,
  });
  for (const appt of appointments) appt._id = new ObjectId();
  if (appointments.length) await db.collection("appointments").insertMany(appointments);
  const ledger = payments.map(({ appointmentRef, ...entry }) => ({ ...entry, appointmentId: appointmentRef._id.toString() }));
  if (ledger.length) await db.collection("payments").insertMany(ledger);
  await db.collection("counters").updateOne({ _id: `receipt-${year}` }, { $set: { seq: receiptCount } }, { upsert: true });
  console.log(`  ${appointments.length} appointments, ${ledger.length} ledger entries`);

  console.log("\nSeeding blood donors, requests and ambulances...");
  const donorPeople = [
    ...patientDocs,
    ...insertedDoctors.slice(0, 22).map((d) => ({ _id: d.userId, name: d.name, phone: d.phone })),
  ];
  await db.collection("donors").insertMany(buildDonors(donorPeople));
  await db.collection("bloodRequests").insertMany([
    {
      userId: String(patientDocs[1]._id), requesterName: patientDocs[1].name, bloodGroup: "O-", area: "Mirpur, Dhaka",
      hospital: "Dhaka Medical College Hospital", units: 2, contactPhone: patientDocs[1].phone,
      note: "Surgery scheduled; please call.", neededBy: addDays(clinicToday(), 2), status: "open", notified: 0, createdAt: new Date(),
    },
    {
      userId: String(patientDocs[4]._id), requesterName: patientDocs[4].name, bloodGroup: "B+", area: "Panchlaish, Chattogram",
      hospital: "Chittagong Medical College Hospital", units: 1, contactPhone: patientDocs[4].phone,
      note: "Thalassaemia patient.", neededBy: addDays(clinicToday(), 1), status: "open", notified: 0, createdAt: new Date(),
    },
  ]);
  const ambulances = [];
  for (const [i, h] of HOSPITALS.entries()) {
    const n = String(i + 1).padStart(2, "0");
    for (let k = 0; k < 1 + (i % 3); k++) {
      ambulances.push({
        hospitalId: hospitalByKey[h.key].id,
        type: AMBULANCE_PLAN[k],
        // Placeholder numbers, like the hospitals' (see seed-data.mjs).
        phone: `${h.code}-0000${n}${5 + k}`,
        vehicleNo: `DEMO-${n}${k + 1}`,
        available: (i + k) % 4 !== 0,
        createdAt: new Date(),
      });
    }
  }
  await db.collection("ambulances").insertMany(ambulances);
  console.log(`  ${donorPeople.length} donors, 2 blood requests, ${ambulances.length} ambulances`);

  console.log("\nDone.");
  console.log("──────────────────────────────────────────");
  console.log(`Admin login:   ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`Doctor login:  any doctor email (e.g. ${DOCTORS[0].email}) / doctor@123`);
  console.log(`Patient login: any patient email (e.g. ${PATIENTS[0].email}) / patient@123`);
  console.log(`Hospital manager: ${MANAGER.email} / ${MANAGER.password}`);
  console.log("──────────────────────────────────────────");

  await client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
