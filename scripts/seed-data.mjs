// Demo data for scripts/seed.mjs.
//
// HOSPITALS are real, well-known hospitals across Bangladesh's eight divisions
// (names, cities and addresses as publicly listed). Their PHONE NUMBERS ARE
// PLACEHOLDERS (area code + 000xxx) — replace them with each hospital's
// official lines in the admin dashboard before relying on the emergency
// buttons. Logos are left empty (the UI shows initials) rather than copying
// the hospitals' trademarks.
//
// DOCTORS are fictional: realistic Bangladeshi names, qualifications and
// schedules, but not real people, because every seeded doctor gets an
// invented fee, rating, reviews and a demo login. Portraits are stock images:
// Unsplash (Unsplash License) for the first ten, randomuser.me for the rest.

export const SPECIALTY_DEGREES = {
  Cardiology: "MBBS, MD (Cardiology)",
  Dermatology: "MBBS, DDV, FCPS (Dermatology)",
  Neurology: "MBBS, MD (Neurology)",
  Orthopedics: "MBBS, MS (Orthopedics)",
  Pediatrics: "MBBS, DCH, FCPS (Pediatrics)",
  Gynecology: "MBBS, FCPS (Gynae & Obs)",
  "General Medicine": "MBBS, FCPS (Medicine)",
  Dentistry: "BDS, MDS (Conservative Dentistry)",
  Psychiatry: "MBBS, MD (Psychiatry)",
  ENT: "MBBS, FCPS (ENT)",
  Ophthalmology: "MBBS, DO, FCPS (Ophthalmology)",
  Gastroenterology: "MBBS, MD (Gastroenterology)",
  Nephrology: "MBBS, MD (Nephrology)",
  Endocrinology: "MBBS, MD (Endocrinology & Metabolism)",
  Pulmonology: "MBBS, MD (Chest Diseases)",
  Urology: "MBBS, MS (Urology)",
  Oncology: "MBBS, MD (Clinical Oncology)",
};

const FOCUS = {
  Cardiology: "hypertension, chest pain, heart failure and preventive cardiac care",
  Dermatology: "acne, eczema, skin allergies, hair loss and cosmetic dermatology",
  Neurology: "stroke, epilepsy, migraine and nerve disorders",
  Orthopedics: "fractures, back and joint pain, sports injuries and arthritis",
  Pediatrics: "newborn care, childhood illnesses, growth and immunisation",
  Gynecology: "pregnancy care, menstrual problems, infertility and women's health",
  "General Medicine": "fever, diabetes, blood pressure and everyday health problems",
  Dentistry: "toothache, root canal treatment, fillings and gum care",
  Psychiatry: "anxiety, depression, sleep problems and stress management",
  ENT: "sinusitis, ear infections, hearing loss and throat problems",
  Ophthalmology: "eye infections, cataract, glaucoma and vision problems",
  Gastroenterology: "gastric pain, liver disease, IBS and digestive problems",
  Nephrology: "kidney disease, kidney stones and dialysis care",
  Endocrinology: "diabetes, thyroid disorders and hormonal problems",
  Pulmonology: "asthma, COPD, cough and breathing problems",
  Urology: "urinary tract problems, kidney stones and prostate care",
  Oncology: "cancer screening, chemotherapy and follow-up care",
};

export const bioFor = (d, hospitalName) =>
  `${d.specialty} specialist with ${d.experience} years of experience` +
  (hospitalName ? ` at ${hospitalName}` : " in private and online practice") +
  `. Focuses on ${FOCUS[d.specialty]}.` +
  (d.consultationType !== "in-person" ? " Available for video consultations." : "");

// Cover photos: freely licensed pictures from Wikimedia Commons, cropped to
// 16:10 and saved as WebP in next/public/hospitals. The credit is shown under
// the photo on the hospital's page, as the licences require.
export const HOSPITAL_PHOTOS = {
  "dmch": { image: "/hospitals/dmch.webp", imageCredit: "Jashem farhan · CC BY-SA 3.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:DMC1.jpg" },
  "bmu": { image: "/hospitals/bmu.webp", imageCredit: "Motiur Rahman Oni · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Bangabandhu_Sheikh_Mujib_Medical_University_(01).jpg" },
  "square": { image: "/hospitals/square.webp", imageCredit: "Zzaman · CC BY 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Square_hospital_02.jpg" },
  "evercare-dhaka": { image: "/hospitals/evercare-dhaka.webp", imageCredit: "Aashaa · CC BY-SA 3.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Apollo_Hospital_Dhaka_2014.jpg" },
  "united": { image: "/hospitals/united.webp", imageCredit: "Tajwar.thesuperman · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Entrance_of_United_Hospital_Limited.jpg" },
  "labaid": { image: "/hospitals/labaid.webp", imageCredit: "Yahya · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Labaid_Specialized_Hospital.jpg" },
  "nicvd": { image: "/hospitals/nicvd.webp", imageCredit: "ইব্রাহিম হাসান · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:National_Institute_of_Cardiovascular_Diseases_3.jpg" },
  "shishu": { image: "/hospitals/shishu.webp", imageCredit: "Sabah Azman Nahean · CC0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Bangladesh_Shishu_(Children)_Hospital_2.0.jpg" },
  "cmch": { image: "/hospitals/cmch.webp", imageCredit: "OB · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:CMC_BUILDING.jpg" },
  "rmch": { image: "/hospitals/rmch.webp", imageCredit: "Nahid.rajbd · CC BY-SA 3.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Rajshahi_Medical_College_Hospital_4.jpg" },
  "kmch": { image: "/hospitals/kmch.webp", imageCredit: "Ovijatrik · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Khulna_medical_college_hospital_building.jpg" },
  "somch": { image: "/hospitals/somch.webp", imageCredit: "Sajibur · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Hospital_of_Sylhet_M.A.G._Osmani_Medical_College.jpg" },
  "sbmch": { image: "/hospitals/sbmch.webp", imageCredit: "Lonely Explorer · CC BY 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Sher-e-Bangla_Medical_College_Hospital,_Barisal.jpg" },
  "rpmch": { image: "/hospitals/rpmch.webp", imageCredit: "Mahtabb · CC BY-SA 3.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Rangpur_Medical_college.jpg" },
  "mmch": { image: "/hospitals/mmch.webp", imageCredit: "Hermitage17 · Public domain · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:MMCH.JPG" },
  "comch": { image: "/hospitals/comch.webp", imageCredit: "DelwarHossain · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:Comilla_Medical_college.png" },
  "szmch": { image: "/hospitals/szmch.webp", imageCredit: "মুসফিক মুন্না · CC BY-SA 4.0 · Wikimedia Commons (cropped)", imageSource: "https://commons.wikimedia.org/wiki/File:A_Hospital_of_Bogra.jpg" },
  // Supplied by the project owner (no credit line): one building photo and
  // four hospital logos set on a white cover, which also serve as the logo.
  "evercare-ctg": { image: "/hospitals/evercare-ctg.webp", imageCredit: "", imageSource: "" },
  "bsh": { image: "/hospitals/bsh.webp", logo: "/hospitals/logos/bsh.webp", imageCredit: "", imageSource: "" },
  "ibnsina": { image: "/hospitals/ibnsina.webp", logo: "/hospitals/logos/ibnsina.webp", imageCredit: "", imageSource: "" },
  "cmosh": { image: "/hospitals/cmosh.webp", logo: "/hospitals/logos/cmosh.webp", imageCredit: "", imageSource: "" },
  "mountadora": { image: "/hospitals/mountadora.webp", logo: "/hospitals/logos/mountadora.webp", imageCredit: "", imageSource: "" },
};

/** The database document for HOSPITALS[i] (shared by seed.mjs and reseed-hospitals.mjs). */
export const hospitalDoc = (h, i) => {
  const { key, code, ...fields } = h;
  const n = String(i + 1).padStart(2, "0");
  return {
    ...fields,
    // Placeholders — real hospital numbers aren't published here.
    phone: `${code}-0000${n}1`,
    emergencyPhone: `${code}-0000${n}9`,
    logo: "",
    image: "",
    imageCredit: "",
    imageSource: "",
    ...HOSPITAL_PHOTOS[key],
    createdAt: new Date(),
  };
};

// [code] → area code used for placeholder numbers.
export const HOSPITALS = [
  { key: "dmch", code: "02", name: "Dhaka Medical College Hospital", city: "Dhaka", address: "Bakshibazar, Dhaka 1000",
    departments: ["Medicine", "Surgery", "Cardiology", "Neurology", "Nephrology", "Gynecology", "Pediatrics", "Orthopedics", "Burn & Plastic Surgery", "Emergency"] },
  { key: "bmu", code: "02", name: "Bangladesh Medical University (BMU)", city: "Dhaka", address: "Shahbag, Dhaka 1000",
    departments: ["Neurology", "Nephrology", "Oncology", "Cardiology", "Gastroenterology", "Endocrinology", "Psychiatry", "Pediatrics"] },
  { key: "square", code: "02", name: "Square Hospitals Ltd.", city: "Dhaka", address: "18/F Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205",
    departments: ["Cardiology", "Gastroenterology", "Pediatrics", "Dentistry", "Orthopedics", "ICU", "Emergency"] },
  { key: "evercare-dhaka", code: "02", name: "Evercare Hospital Dhaka", city: "Dhaka", address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229",
    departments: ["Gynecology", "Oncology", "Ophthalmology", "Cardiology", "Neurosurgery", "ICU", "Emergency"] },
  { key: "united", code: "02", name: "United Hospital Limited", city: "Dhaka", address: "Plot 15, Road 71, Gulshan 2, Dhaka 1212",
    departments: ["Orthopedics", "Endocrinology", "Cardiac Surgery", "Nephrology", "Emergency"] },
  { key: "labaid", code: "02", name: "Labaid Specialized Hospital", city: "Dhaka", address: "House 6, Road 4, Dhanmondi, Dhaka 1205",
    departments: ["Dermatology", "Urology", "Cardiology", "Medicine", "Emergency"] },
  { key: "ibnsina", code: "02", name: "Ibn Sina Hospital Dhanmondi", city: "Dhaka", address: "House 48, Road 9/A, Dhanmondi, Dhaka 1209",
    departments: ["ENT", "Dentistry", "Medicine", "Gynecology", "Diagnostics"] },
  { key: "nicvd", code: "02", name: "National Institute of Cardiovascular Diseases (NICVD)", city: "Dhaka", address: "Sher-e-Bangla Nagar, Dhaka 1207",
    departments: ["Cardiology", "Cardiac Surgery", "Pediatric Cardiology", "CCU"] },
  { key: "bsh", code: "02", name: "Bangladesh Specialized Hospital", city: "Dhaka", address: "21 Shyamoli, Mirpur Road, Dhaka 1207",
    departments: ["Psychiatry", "Neurology", "Orthopedics", "Medicine", "Emergency"] },
  { key: "shishu", code: "02", name: "Dhaka Shishu (Children) Hospital", city: "Dhaka", address: "Sher-e-Bangla Nagar, Dhaka 1207",
    departments: ["Pediatrics", "Neonatology", "Pediatric Surgery", "Pediatric Cardiology"] },
  { key: "cmch", code: "031", name: "Chittagong Medical College Hospital", city: "Chattogram", address: "K.B. Fazlul Kader Road, Panchlaish, Chattogram 4203",
    departments: ["Medicine", "Orthopedics", "Cardiology", "Pulmonology", "Surgery", "Emergency"] },
  { key: "evercare-ctg", code: "031", name: "Evercare Hospital Chattogram", city: "Chattogram", address: "Ananya R/A, Kuwaish Road, Chattogram",
    departments: ["Neurology", "ENT", "Urology", "Cardiology", "ICU", "Emergency"] },
  { key: "cmosh", code: "031", name: "Chattogram Maa-O-Shishu Hospital", city: "Chattogram", address: "Agrabad, Chattogram 4100",
    departments: ["Gynecology", "Pediatrics", "Neonatology", "Medicine"] },
  { key: "rmch", code: "0721", name: "Rajshahi Medical College Hospital", city: "Rajshahi", address: "Laxmipur, Rajshahi 6000",
    departments: ["Medicine", "Gynecology", "Cardiology", "Dermatology", "Orthopedics", "Emergency"] },
  { key: "kmch", code: "041", name: "Khulna Medical College Hospital", city: "Khulna", address: "Boyra, Khulna 9000",
    departments: ["Orthopedics", "Pediatrics", "Gastroenterology", "Medicine", "Emergency"] },
  { key: "somch", code: "0821", name: "Sylhet MAG Osmani Medical College Hospital", city: "Sylhet", address: "Medical College Road, Kajolshah, Sylhet 3100",
    departments: ["Cardiology", "Ophthalmology", "Medicine", "Surgery", "Emergency"] },
  { key: "mountadora", code: "0821", name: "Mount Adora Hospital", city: "Sylhet", address: "Akhalia, Sylhet 3114",
    departments: ["Gynecology", "ENT", "Medicine", "Diagnostics"] },
  { key: "sbmch", code: "0431", name: "Sher-e-Bangla Medical College Hospital", city: "Barishal", address: "Band Road, Barishal 8200",
    departments: ["Medicine", "Pediatrics", "Surgery", "Gynecology", "Emergency"] },
  { key: "rpmch", code: "0521", name: "Rangpur Medical College Hospital", city: "Rangpur", address: "Dhap, Rangpur 5400",
    departments: ["Orthopedics", "Dermatology", "Medicine", "Pediatrics", "Emergency"] },
  { key: "mmch", code: "091", name: "Mymensingh Medical College Hospital", city: "Mymensingh", address: "Charpara, Mymensingh 2200",
    departments: ["Neurology", "Gynecology", "Medicine", "Surgery", "Emergency"] },
  { key: "comch", code: "081", name: "Cumilla Medical College Hospital", city: "Cumilla", address: "Kuchaitoli, Cumilla 3500",
    departments: ["Medicine", "Pediatrics", "Nephrology", "Gynecology", "Emergency"] },
  { key: "szmch", code: "051", name: "Shaheed Ziaur Rahman Medical College Hospital", city: "Bogura", address: "Bogura 5800",
    departments: ["Cardiology", "Dentistry", "Medicine", "Surgery", "Emergency"] },
];

// Weekly session templates (clinic local time). Friday is the weekend.
const WEEKDAYS_NO_FRI = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const days = (names, sessions) => names.map((day) => ({ day, sessions }));

export const SCHEDULES = {
  // Hospital outpatient mornings.
  morning: days(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], [{ start: "09:00", end: "13:00" }]),
  // Private-chamber evenings.
  evening: days(WEEKDAYS_NO_FRI, [{ start: "17:00", end: "21:00" }]),
  // Morning + evening on alternate days.
  split: [
    ...days(["Sunday", "Tuesday", "Thursday"], [{ start: "10:00", end: "13:00" }, { start: "16:00", end: "19:00" }]),
    ...days(["Monday", "Wednesday"], [{ start: "16:00", end: "20:00" }]),
    ...days(["Saturday"], [{ start: "10:00", end: "13:00" }]),
  ],
  // Online-only doctors: late evenings plus a Friday morning block.
  online: [
    ...days(WEEKDAYS_NO_FRI, [{ start: "20:00", end: "23:00" }]),
    ...days(["Friday"], [{ start: "10:00", end: "13:00" }]),
  ],
};

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=600&q=80&crop=faces`;
const R = (g, n) => `https://randomuser.me/api/portraits/${g === "F" ? "women" : "men"}/${n}.jpg`;

// [gender, name, specialty, hospital key | null, years, fee, consultationType, schedule, perHour, image]
const ROWS = [
  ["F", "Dr. Farhana Islam", "Cardiology", "square", 14, 1500, "both", "evening", 2, U("1559839734-2b71ea197ec2")],
  ["M", "Dr. Kamal Hasan", "Dermatology", "labaid", 11, 1000, "both", "evening", 3, U("1612531386530-97286d97c2d2")],
  ["F", "Dr. Nusrat Jahan", "Pediatrics", "shishu", 15, 800, "in-person", "morning", 3, U("1594824476967-48c8b964273f")],
  ["M", "Dr. Ariful Islam", "Orthopedics", "united", 12, 1500, "in-person", "split", 2, U("1622902046580-2b47f47f5471")],
  ["F", "Dr. Shirin Akter", "Gynecology", "evercare-dhaka", 16, 1500, "in-person", "split", 2, U("1643297654416-05795d62e39c")],
  ["M", "Dr. Tanvir Ahmed", "General Medicine", null, 7, 600, "online", "online", 4, U("1612349317150-e413f6a5b16d")],
  ["F", "Dr. Mahbuba Rahman", "Psychiatry", "bsh", 10, 1200, "both", "evening", 2, U("1665080954352-5a12ef53017a")],
  ["M", "Dr. Rezaul Karim", "ENT", "ibnsina", 9, 1000, "in-person", "evening", 3, U("1666887360742-974c8fce8e6b")],
  ["F", "Dr. Taslima Begum", "Dentistry", "ibnsina", 7, 800, "in-person", "evening", 3, U("1651008376811-b90baee60c1f")],
  ["M", "Dr. Imran Hossain", "Neurology", "bmu", 13, 1200, "both", "split", 2, U("1622253692010-333f2da6031d")],
  ["M", "Dr. Mahmudul Hasan", "Cardiology", "nicvd", 18, 1000, "in-person", "morning", 3, R("M", 1)],
  ["F", "Dr. Sadia Afrin", "Endocrinology", "united", 9, 1500, "both", "split", 2, R("F", 2)],
  ["M", "Dr. Shafiqul Alam", "Nephrology", "bmu", 20, 1200, "in-person", "morning", 2, R("M", 3)],
  ["F", "Dr. Nazia Haque", "Ophthalmology", "evercare-dhaka", 8, 1200, "in-person", "evening", 3, R("F", 4)],
  ["M", "Dr. Rashedul Islam", "Gastroenterology", "square", 12, 1500, "in-person", "split", 2, R("M", 5)],
  ["F", "Dr. Rumana Chowdhury", "Gynecology", "dmch", 17, 800, "in-person", "morning", 3, R("F", 5)],
  ["M", "Dr. Abdullah Al Mamun", "Urology", "labaid", 11, 1200, "in-person", "evening", 2, R("M", 6)],
  ["F", "Dr. Tahmina Sultana", "Oncology", "evercare-dhaka", 14, 1800, "both", "split", 2, R("F", 8)],
  ["M", "Dr. Mizanur Rahman", "Pulmonology", "dmch", 13, 800, "in-person", "morning", 3, R("M", 8)],
  ["F", "Dr. Shaila Parvin", "Dermatology", null, 6, 700, "online", "online", 4, R("F", 10)],
  ["M", "Dr. Habibur Rahman", "General Medicine", "dmch", 22, 700, "in-person", "morning", 4, R("M", 9)],
  ["F", "Dr. Fahmida Rahman", "Pediatrics", "square", 10, 1200, "both", "evening", 3, R("F", 15)],
  ["M", "Dr. Saiful Islam", "Orthopedics", "cmch", 15, 800, "in-person", "evening", 3, R("M", 14)],
  ["F", "Dr. Laila Arjumand", "Cardiology", "cmch", 12, 900, "in-person", "split", 2, R("F", 17)],
  ["M", "Dr. Nazmul Hoque", "Neurology", "evercare-ctg", 10, 1200, "both", "evening", 2, R("M", 15)],
  ["F", "Dr. Sharmin Sultana", "Gynecology", "cmosh", 13, 800, "in-person", "morning", 3, R("F", 19)],
  ["M", "Dr. Tariqul Islam", "ENT", "evercare-ctg", 8, 1000, "in-person", "evening", 3, R("M", 17)],
  ["F", "Dr. Kaniz Fatema", "Pediatrics", "cmosh", 9, 700, "in-person", "split", 3, R("F", 21)],
  ["M", "Dr. Anisur Rahman", "General Medicine", "rmch", 16, 600, "in-person", "evening", 4, R("M", 19)],
  ["F", "Dr. Rehana Parveen", "Gynecology", "rmch", 14, 700, "in-person", "split", 3, R("F", 24)],
  ["M", "Dr. Mostafizur Rahman", "Cardiology", "rmch", 12, 800, "both", "evening", 2, R("M", 20)],
  ["F", "Dr. Nasrin Akhter", "Dermatology", "rmch", 7, 600, "in-person", "evening", 3, R("F", 26)],
  ["M", "Dr. Rafiqul Islam", "Orthopedics", "kmch", 18, 700, "in-person", "evening", 3, R("M", 22)],
  ["F", "Dr. Sumaiya Tasnim", "Pediatrics", "kmch", 8, 600, "in-person", "morning", 3, R("F", 31)],
  ["M", "Dr. Kamrul Hasan", "Gastroenterology", "kmch", 11, 800, "in-person", "split", 2, R("M", 26)],
  ["M", "Dr. Shahidul Islam", "Cardiology", "somch", 15, 800, "in-person", "evening", 3, R("M", 28)],
  ["F", "Dr. Jannatul Ferdous", "Gynecology", "mountadora", 10, 1000, "in-person", "split", 2, R("F", 33)],
  ["M", "Dr. Jahangir Alam", "ENT", "mountadora", 13, 900, "in-person", "evening", 3, R("M", 31)],
  ["F", "Dr. Afroza Khanam", "Ophthalmology", "somch", 11, 700, "in-person", "morning", 3, R("F", 36)],
  ["M", "Dr. Asif Iqbal", "General Medicine", "sbmch", 9, 600, "in-person", "evening", 4, R("M", 32)],
  ["F", "Dr. Dilruba Yasmin", "Pediatrics", "sbmch", 12, 600, "in-person", "morning", 3, R("F", 40)],
  ["M", "Dr. Monirul Islam", "Orthopedics", "rpmch", 14, 700, "in-person", "evening", 3, R("M", 34)],
  ["F", "Dr. Nadia Mahmud", "Dermatology", "rpmch", 6, 600, "both", "evening", 3, R("F", 43)],
  ["M", "Dr. Sabbir Hossain", "Neurology", "mmch", 12, 800, "in-person", "split", 2, R("M", 36)],
  ["F", "Dr. Samira Haque", "Gynecology", "mmch", 11, 700, "in-person", "morning", 3, R("F", 46)],
  ["M", "Dr. Ferdous Wahid", "Psychiatry", null, 9, 1000, "online", "online", 2, R("M", 40)],
  ["M", "Dr. Golam Mostafa", "General Medicine", "comch", 19, 600, "in-person", "evening", 4, R("M", 42)],
  ["F", "Dr. Rokeya Begum", "Pediatrics", "comch", 13, 600, "in-person", "morning", 3, R("F", 49)],
  ["M", "Dr. Arif Hossain", "Cardiology", "szmch", 10, 700, "in-person", "evening", 3, R("M", 47)],
  ["F", "Dr. Israt Jahan", "Dentistry", "szmch", 5, 500, "in-person", "evening", 3, R("F", 52)],
  ["M", "Dr. Shamim Ahmed", "Nephrology", "comch", 12, 800, "in-person", "split", 2, R("M", 50)],
  ["F", "Dr. Munira Khan", "Endocrinology", null, 8, 1000, "online", "online", 3, R("F", 57)],
  ["M", "Dr. Zahid Hasan", "Pulmonology", "cmch", 9, 700, "in-person", "morning", 3, R("M", 54)],
  ["F", "Dr. Tanzila Rahman", "Oncology", "bmu", 12, 1000, "in-person", "morning", 2, R("F", 60)],
  ["M", "Dr. Omar Faruk", "Urology", "evercare-ctg", 14, 1200, "in-person", "split", 2, R("M", 57)],
  ["M", "Dr. Nurul Amin", "Dentistry", "square", 10, 1200, "in-person", "evening", 3, R("M", 60)],
];

const emailFor = (name) =>
  `${name.replace(/^Dr\.\s*/, "").toLowerCase().replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, ".")}@docappoint.test`;

export const DOCTORS = ROWS.map(([gender, name, specialty, hospitalKey, years, fee, consultationType, schedule, perHour, image], i) => ({
  gender,
  name,
  email: emailFor(name),
  password: "doctor@123",
  phone: `01711${String(1000000 + i + 1).slice(1)}`,
  specialty,
  degree: SPECIALTY_DEGREES[specialty],
  // Obviously-demo registration numbers so nothing collides with a real BMDC entry.
  registrationNumber: `DEMO-A-${String(70000 + i * 37).padStart(5, "0")}`,
  hospitalKey,
  experience: years,
  fee,
  consultationType,
  schedule,
  maxPerHour: perHour,
  followUpFeePercent: 50,
  image,
}));
