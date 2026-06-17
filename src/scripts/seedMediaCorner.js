// scripts/seedMediaCorner.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { MediaCorner } from "../models/mediaCornerModel.js";

const mediaItems = [
  {
    media_header: "NSS Volunteer Training Manual 2026",
    media_narration: "Official guide providing comprehensive instructions on volunteer registration, orientation protocols, active community work schemes, and safety guidelines for the 2026 cycle.",
    media_url: "https://www.education.gov.in",
    media_type: "pdf",
    media_file: "nss_volunteer_manual_2026.pdf"
  },
  {
    media_header: "SOP for Program Unit Grant Management",
    media_narration: "A step-by-step procedural manual detailing how Program Officers should apply for, manage, and submit utilization certificates for government development grants.",
    media_url: "https://www.nss.gov.in",
    media_type: "document",
    media_file: "grant_management_sop.docx"
  },
  {
    media_header: "Overview of NSS MIS Portal Features",
    media_narration: "A video walkthrough detailing user role separations, designation setups, creating rollout campaigns, and managing task completions as Program Coordinators.",
    media_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    media_type: "video",
    media_file: ""
  },
  {
    media_header: "Monthly Camp Progress Reporting Template",
    media_narration: "Standardized Excel reporting format for all state units to submit their monthly campsite details, volunteer attendance, and sanitation target sheets.",
    media_url: "",
    media_type: "template",
    media_file: "monthly_camp_template.xlsx"
  },
  {
    media_header: "FAQ: Auditing & Grant Claims Submissions",
    media_narration: "Frequently asked questions covering rules on permissible camping expenditures, auditor signature requirements, and budget revision timelines.",
    media_url: "https://www.nss.gov.in/faqs",
    media_type: "faq",
    media_file: ""
  },
  {
    media_header: "Special Camp Permission Application Template",
    media_narration: "Official authorization template to request camping space and sanitation resource support from local municipal and village councils.",
    media_url: "",
    media_type: "template",
    media_file: "special_camp_permission.docx"
  },
  {
    media_header: "NSS National Integration Camp (NIC) Notice 2026",
    media_narration: "Official notification inviting eligible award-winning volunteers to apply for the upcoming National Integration Camp in New Delhi. Includes strict selection criteria.",
    media_url: "https://www.nss.gov.in/nic-notice",
    media_type: "document",
    media_file: "nic_camp_notice_2026.pdf"
  },
  {
    media_header: "FAQ: Coordinator Portal Login and Security",
    media_narration: "Detailed assistance answers for coordinators recovering lost passwords, updating active profile contact numbers, or claiming permissions.",
    media_url: "",
    media_type: "faq",
    media_file: ""
  },
  {
    media_header: "Promotional Documentary: NSS Village Adoption Drive",
    media_narration: "Award-winning documentary showcasing the impact of cleanliness and educational initiatives across adopted model villages in Maharashtra.",
    media_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    media_type: "video",
    media_file: ""
  },
  {
    media_header: "NSS Emblem and Branding Identity Assets",
    media_narration: "High-resolution NSS logo files, font guidelines, banner graphics, and uniform badge patterns for use in camp brochures and college displays.",
    media_url: "https://www.nss.gov.in/branding",
    media_type: "image",
    media_file: "nss_branding_assets.zip"
  },
  {
    media_header: "NSS National Youth Festival Guidelines 2026",
    media_narration: "Important notification detailing eligibility criteria, cultural events, travel allowances, and selection lists for the annual youth congregation.",
    media_url: "https://www.nss.gov.in/nyf",
    media_type: "document",
    media_file: "nic_guidelines_2026.pdf"
  },
  {
    media_header: "NSS Song & Anthem Lyrics Sheet",
    media_narration: "Lyrics and musical notation sheet for the official NSS song. Designed for group singing sessions during morning orientation assemblies.",
    media_url: "",
    media_type: "document",
    media_file: "nss_song_lyrics.docx"
  },
  {
    media_header: "Video Tutorial: Managing Rollout Tasks on Mobile",
    media_narration: "Short video guide showing Program Officers how to login, view assigned rollout targets, and log task progress using mobile browsers.",
    media_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    media_type: "video",
    media_file: ""
  },
  {
    media_header: "Quarterly Financial Audit Report Template",
    media_narration: "Excel worksheet format to record local unit expenditures on food, travel, and camp logistics. Ready for submission to state offices.",
    media_url: "",
    media_type: "template",
    media_file: "financial_audit_template.xlsx"
  },
  {
    media_header: "FAQ: Volunteer Merit Certificate Application",
    media_narration: "Instructions on how volunteers can apply for the 240-hour merit certificate upon completion of two years of service.",
    media_url: "",
    media_type: "faq",
    media_file: ""
  },
  {
    media_header: "Village Adoption Action Plan Template",
    media_narration: "A comprehensive project layout template that guides units on survey conduction, health camp setups, and rural literacy program design.",
    media_url: "",
    media_type: "template",
    media_file: "village_adoption_plan.docx"
  },
  {
    media_header: "Clean India Campaign 2026 Orientation Video",
    media_narration: "Motivational video highlighting sanitation drives, single-use plastic reduction awareness campaigns, and success stories across target states.",
    media_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    media_type: "video",
    media_file: ""
  },
  {
    media_header: "FAQ: NSS Awards Nominations & Deadlines",
    media_narration: "Answers to common queries regarding the online submission of nominations for the National NSS Awards, including category divisions.",
    media_url: "https://www.nss.gov.in/awards",
    media_type: "faq",
    media_file: ""
  },
  {
    media_header: "NSS Day Celebration Circular 24th September",
    media_narration: "Advisory document requesting all program units to coordinate Blood Donation Drives and Tree Plantation Campaigns to mark the foundation day of NSS.",
    media_url: "",
    media_type: "pdf",
    media_file: "nss_day_circular.pdf"
  },
  {
    media_header: "Disaster Management Cell Volunteer Training Guide",
    media_narration: "Special resource booklet covering basic first aid training, fire safety drills, and emergency rescue operations in collaboration with NDRF.",
    media_url: "",
    media_type: "pdf",
    media_file: "disaster_management_guide.pdf"
  }
];

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nss-backend";
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    
    console.log("Clearing existing MediaCorner entries...");
    await MediaCorner.deleteMany({});
    
    console.log("Inserting dummy media items...");
    await MediaCorner.insertMany(mediaItems);
    
    console.log("MediaCorner seeded successfully with 20 detailed items!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding MediaCorner failed:", err);
    process.exit(1);
  }
})();
