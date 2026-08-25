// Full reset + seed for DocAppoint.
// Run from the project root:  node scripts/seed.mjs
//
// WARNING: this wipes ALL existing data (users, doctors, appointments,
// notifications) before seeding fresh. There is no undo.
//
// Creates REAL Better Auth accounts (so passwords are hashed correctly and
// you can actually log in), then patches role/status/image directly in
// Mongo, and (for doctors) inserts an approved doctor profile document.
//
// NOTE ON IMAGES: doctor photos are Unsplash editorial portraits of real
// medical professionals (white coats / scrubs / stethoscopes, faces visible),
// hand-picked so each headshot actually reads as a doctor. Patients still use
// randomuser.me portraits, which is fine — they're meant to be ordinary people.
// Unsplash images are free to use under the Unsplash License.

import dotenv from "dotenv";
dotenv.config();

const { auth } = await import("../src/lib/auth.js");
const { MongoClient } = await import("mongodb");

const DB_NAME = "DocAppoint";

// ── Data to seed ────────────────────────────────────────────────────────

const ADMIN = {
  name: "Admin",
  email: "admin@gmail.com",
  password: "admin@123",
};

const DOCTORS = [
  {
    name: "Dr. Farhana Islam",
    email: "farhana.islam@docappoint.test",
    password: "doctor@123",
    phone: "01711000001",
    specialty: "Cardiology",
    degree: "MBBS, FCPS (Cardiology)",
    registrationNumber: "BMDC-A-48213",
    hospital: "Rajshahi Medical College Hospital",
    experience: "12 years",
    location: "Rajshahi, Bangladesh",
    bio: "Cardiologist with 12+ years of experience in interventional cardiology and heart failure management.",
    fee: 800,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.8,
    totalReviews: 3,
  },
  {
    name: "Dr. Kamal Hasan",
    email: "kamal.hasan@docappoint.test",
    password: "doctor@123",
    phone: "01711000002",
    specialty: "Dermatology",
    degree: "MBBS, DDV",
    registrationNumber: "BMDC-A-51902",
    hospital: "Rajshahi Medical College Hospital",
    experience: "9 years",
    location: "Rajshahi, Bangladesh",
    bio: "Dermatologist specializing in skin allergies, acne treatment, and cosmetic dermatology.",
    fee: 600,
    image: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.6,
    totalReviews: 2,
  },
  {
    name: "Dr. Nusrat Jahan",
    email: "nusrat.jahan@docappoint.test",
    password: "doctor@123",
    phone: "01711000003",
    specialty: "Pediatrics",
    degree: "MBBS, DCH",
    registrationNumber: "BMDC-A-60217",
    hospital: "Rajshahi Shishu Hospital",
    experience: "15 years",
    location: "Rajshahi, Bangladesh",
    bio: "Pediatrician with a special interest in newborn care and childhood immunization.",
    fee: 500,
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.9,
    totalReviews: 5,
  },
  {
    name: "Dr. Ariful Islam",
    email: "ariful.islam@docappoint.test",
    password: "doctor@123",
    phone: "01711000004",
    specialty: "Orthopedics",
    degree: "MBBS, MS (Ortho)",
    registrationNumber: "BMDC-A-39804",
    hospital: "Rajshahi Medical College Hospital",
    experience: "11 years",
    location: "Rajshahi, Bangladesh",
    bio: "Orthopedic surgeon focused on sports injuries, joint replacement, and trauma care.",
    fee: 900,
    image: "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.5,
    totalReviews: 4,
  },
  {
    name: "Dr. Shirin Akter",
    email: "shirin.akter@docappoint.test",
    password: "doctor@123",
    phone: "01711000005",
    specialty: "Gynecology",
    degree: "MBBS, FCPS (Gynae & Obs)",
    registrationNumber: "BMDC-A-27651",
    hospital: "Rajshahi Medical College Hospital",
    experience: "14 years",
    location: "Rajshahi, Bangladesh",
    bio: "Gynecologist providing comprehensive women's health, prenatal, and postnatal care.",
    fee: 700,
    image: "https://images.unsplash.com/photo-1643297654416-05795d62e39c?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.7,
    totalReviews: 6,
  },
  {
    name: "Dr. Tanvir Ahmed",
    email: "tanvir.ahmed@docappoint.test",
    password: "doctor@123",
    phone: "01711000006",
    specialty: "General Medicine",
    degree: "MBBS",
    registrationNumber: "BMDC-A-71098",
    hospital: "Rajshahi General Hospital",
    experience: "6 years",
    location: "Rajshahi, Bangladesh",
    bio: "General physician for everyday illnesses, chronic disease management, and health checkups.",
    fee: 400,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.4,
    totalReviews: 2,
  },
  {
    name: "Dr. Mahbuba Rahman",
    email: "mahbuba.rahman@docappoint.test",
    password: "doctor@123",
    phone: "01711000007",
    specialty: "Psychiatry",
    degree: "MBBS, MD (Psychiatry)",
    registrationNumber: "BMDC-A-83421",
    hospital: "Rajshahi Medical College Hospital",
    experience: "10 years",
    location: "Rajshahi, Bangladesh",
    bio: "Psychiatrist focused on anxiety, depression, and adolescent mental health.",
    fee: 750,
    image: "https://images.unsplash.com/photo-1665080954352-5a12ef53017a?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.8,
    totalReviews: 7,
  },
  {
    name: "Dr. Rezaul Karim",
    email: "rezaul.karim@docappoint.test",
    password: "doctor@123",
    phone: "01711000008",
    specialty: "ENT",
    degree: "MBBS, FCPS (ENT)",
    registrationNumber: "BMDC-A-19345",
    hospital: "Rajshahi General Hospital",
    experience: "8 years",
    location: "Rajshahi, Bangladesh",
    bio: "ENT specialist treating sinus, hearing, and throat conditions for all ages.",
    fee: 550,
    image: "https://images.unsplash.com/photo-1666887360742-974c8fce8e6b?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.3,
    totalReviews: 3,
  },
  {
    name: "Dr. Taslima Begum",
    email: "taslima.begum@docappoint.test",
    password: "doctor@123",
    phone: "01711000009",
    specialty: "Dentistry",
    degree: "BDS, MDS",
    registrationNumber: "BMDC-A-56230",
    hospital: "Rajshahi Dental College",
    experience: "7 years",
    location: "Rajshahi, Bangladesh",
    bio: "Dental surgeon specializing in root canal treatment and cosmetic dentistry.",
    fee: 500,
    image: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.6,
    totalReviews: 4,
  },
  {
    name: "Dr. Imran Hossain",
    email: "imran.hossain@docappoint.test",
    password: "doctor@123",
    phone: "01711000010",
    specialty: "Neurology",
    degree: "MBBS, MD (Neurology)",
    registrationNumber: "BMDC-A-90876",
    hospital: "Rajshahi Medical College Hospital",
    experience: "13 years",
    location: "Rajshahi, Bangladesh",
    bio: "Neurologist with expertise in stroke management, epilepsy, and headache disorders.",
    fee: 950,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&h=600&q=80&crop=faces",
    rating: 4.9,
    totalReviews: 8,
  },
];

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

// ── Seed logic ──────────────────────────────────────────────────────────

const SAMPLE_REVIEWS = [
  { userName: "Tamim Hasan", rating: 5, comment: "Very attentive and explained everything clearly." },
  { userName: "Rafiul Karim", rating: 4, comment: "Good experience, a bit of a wait but worth it." },
  { userName: "Mim Akter", rating: 5, comment: "Best doctor I've visited in Rajshahi. Highly recommended." },
  { userName: "Sabbir Rahman", rating: 4, comment: "Professional and courteous. Would book again." },
  { userName: "Nusrat Sultana", rating: 5, comment: "Took time to answer all my questions." },
  { userName: "Arif Chowdhury", rating: 4, comment: "Clean clinic, friendly staff, on-time appointment." },
  { userName: "Sumaiya Islam", rating: 5, comment: "Extremely knowledgeable and caring." },
  { userName: "Mehedi Hasan", rating: 4, comment: "Solved my issue quickly. Reasonable fee too." },
];

const reviewsForDoctor = (count) =>
  SAMPLE_REVIEWS.slice(0, count).map((r) => ({
    ...r,
    userEmail: `${r.userName.toLowerCase().replace(/\s+/g, ".")}@docappoint.test`,
    date: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
  }));

const DAY_AVAILABILITY = [
  { day: "Sunday", slots: ["10:00", "10:30", "11:00", "16:00", "16:30"] },
  { day: "Monday", slots: ["10:00", "10:30", "11:00"] },
  { day: "Tuesday", slots: ["16:00", "16:30", "17:00"] },
  { day: "Wednesday", slots: ["10:00", "10:30", "11:00"] },
  { day: "Thursday", slots: ["16:00", "16:30", "17:00"] },
  { day: "Friday", slots: [] },
  { day: "Saturday", slots: ["10:00", "10:30"] },
];

const client = new MongoClient(process.env.MONGO_URI);

const signUpOrGetExisting = async ({ name, email, password }) => {
  try {
    await auth.api.signUpEmail({ body: { name, email, password } });
    console.log(`  created ${email}`);
  } catch (err) {
    console.log(`  already existed, reusing ${email}`);
  }
  const db = client.db(DB_NAME);
  const userDoc = await db.collection("user").findOne({ email });
  if (!userDoc) throw new Error(`Could not find or create user for ${email}`);
  return userDoc;
};

async function run() {
  await client.connect();
  const db = client.db(DB_NAME);

  console.log("Wiping ALL existing data (user, doctors, appointments, notifications)...");
  await db.collection("doctors").deleteMany({});
  await db.collection("appointments").deleteMany({});
  await db.collection("notifications").deleteMany({});
  await db.collection("user").deleteMany({});
  // Better Auth also keeps a linked "account" collection (password hashes,
  // OAuth links) — must be wiped too or old accounts silently survive.
  await db.collection("account").deleteMany({}).catch(() => {});
  await db.collection("session").deleteMany({}).catch(() => {});

  console.log("\nSeeding admin...");
  const adminUser = await signUpOrGetExisting(ADMIN);
  await db.collection("user").updateOne(
    { _id: adminUser._id },
    { $set: { role: "admin", status: "active" } }
  );
  console.log(`  ${ADMIN.email} is now admin`);

  console.log("\nSeeding doctors...");
  for (const d of DOCTORS) {
    const user = await signUpOrGetExisting({ name: d.name, email: d.email, password: d.password });
    const userId = String(user._id);

    await db.collection("user").updateOne(
      { _id: user._id },
      { $set: { role: "doctor", status: "active", image: d.image, phone: d.phone } }
    );

    await db.collection("doctors").insertOne({
      userId,
      name: d.name,
      email: d.email,
      phone: d.phone,
      specialty: d.specialty,
      degree: d.degree,
      registrationNumber: d.registrationNumber,
      hospital: d.hospital,
      experience: d.experience,
      location: d.location,
      credentialImageUrl: "",
      bio: d.bio,
      fee: d.fee,
      image: d.image,
      rating: d.rating,
      totalReviews: d.totalReviews,
      reviews: reviewsForDoctor(d.totalReviews),
      availability: DAY_AVAILABILITY,
      approvalStatus: "approved",
      rejectionReason: "",
      createdAt: new Date(),
    });
    console.log(`  doctor profile created for ${d.name}`);
  }

  console.log("\nSeeding patients...");
  for (const p of PATIENTS) {
    const user = await signUpOrGetExisting(p);
    await db.collection("user").updateOne(
      { _id: user._id },
      { $set: { image: p.image, phone: p.phone } }
    );
  }

  console.log("\nDone.");
  console.log("──────────────────────────────────────────");
  console.log(`Admin login:   ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`Doctor login:  any doctor email above / doctor@123`);
  console.log(`Patient login: any patient email above / patient@123`);
  console.log("──────────────────────────────────────────");

  await client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
