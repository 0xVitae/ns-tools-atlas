import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { projects, projectRequests, requestUpvotes } from "../api/_db";

// Always target local DB — never accidentally seed production
neonConfig.fetchEndpoint = "http://db.localtest.me:4444/sql";
neonConfig.useSecureWebSocket = false;

const DATABASE_URL = "postgres://postgres:postgres@db.localtest.me:5432/atlas";

const client = neon(DATABASE_URL);
const db = drizzle(client);

const mockProjects = [
  {
    id: "ns-hub",
    name: "NS Hub",
    category: "networks",
    description:
      "Central platform connecting Network School members worldwide.",
    url: "https://example.com/ns-hub",
    emoji: "🌐",
    status: "active" as const,
    approvalStatus: "approved" as const,
    tags: ["nsOfficial", "free"],
    addedAt: "2025-01-15",
  },
  {
    id: "cowork-bali",
    name: "Bali Cowork Space",
    category: "coworking",
    description: "Coworking space in Canggu for NS members and digital nomads.",
    url: "https://example.com/bali-cowork",
    emoji: "🏝️",
    status: "active" as const,
    approvalStatus: "approved" as const,
    tags: ["paid"],
    addedAt: "2025-02-10",
  },
  {
    id: "ns-meetups",
    name: "NS Global Meetups",
    category: "events",
    description: "Monthly community meetups in cities around the world.",
    url: "https://example.com/meetups",
    emoji: "🎉",
    status: "active" as const,
    approvalStatus: "approved" as const,
    tags: ["nsOfficial", "free"],
    addedAt: "2025-03-01",
  },
  {
    id: "tool-weekly",
    name: "tool Weekly Podcast",
    category: "media",
    description: "Weekly podcast covering tool stories from the NS community.",
    url: "https://example.com/podcast",
    emoji: "🎙️",
    status: "active" as const,
    approvalStatus: "approved" as const,
    tags: ["free"],
    addedAt: "2025-01-20",
  },
  {
    id: "ns-academy",
    name: "NS Academy",
    category: "education",
    description: "Online courses and workshops for aspiring founders.",
    url: "https://example.com/academy",
    emoji: "📚",
    status: "active" as const,
    approvalStatus: "approved" as const,
    tags: ["nsOfficial", "paid"],
    addedAt: "2025-04-05",
  },
  {
    id: "seed-capital",
    name: "Seed Capital Local",
    category: "local-vcs",
    description: "Early-stage VC fund focused on Southeast Asian tools.",
    url: "https://example.com/seed-capital",
    emoji: "💰",
    status: "active" as const,
    approvalStatus: "approved" as const,
    addedAt: "2025-02-28",
  },
  {
    id: "global-ventures",
    name: "Global Ventures Fund",
    category: "global-vcs",
    description: "International venture fund investing in NS alumni companies.",
    url: "https://example.com/global-ventures",
    emoji: "🌍",
    status: "active" as const,
    approvalStatus: "approved" as const,
    addedAt: "2025-03-15",
  },
  {
    id: "launch-pad",
    name: "NS LaunchPad",
    category: "accelerators",
    description: "3-month accelerator program for early-stage tools.",
    url: "https://example.com/launchpad",
    emoji: "🚀",
    status: "active" as const,
    approvalStatus: "approved" as const,
    tags: ["nsOfficial"],
    addedAt: "2025-01-10",
  },
  {
    id: "corp-connect",
    name: "Corporate Connect",
    category: "corporate",
    description:
      "Enterprise partnership program linking tools with corporates.",
    url: "https://example.com/corp-connect",
    emoji: "🏢",
    status: "active" as const,
    approvalStatus: "approved" as const,
    addedAt: "2025-05-01",
  },
  {
    id: "ns-shuttle",
    name: "NS Shuttle",
    category: "transport",
    description:
      "Shared transport service between NS hubs and coworking spaces.",
    url: "https://example.com/shuttle",
    emoji: "🚌",
    status: "active" as const,
    approvalStatus: "approved" as const,
    tags: ["free"],
    addedAt: "2025-04-20",
  },
  // Pending projects
  {
    id: "crypto-club",
    name: "NS Crypto Club",
    category: "networks",
    description: "Community for NS members interested in web3 and crypto.",
    emoji: "₿",
    status: "active" as const,
    approvalStatus: "pending" as const,
    tags: ["free"],
    addedAt: "2025-06-01",
  },
  {
    id: "design-studio",
    name: "Design Studio Co",
    category: "coworking",
    description: "Design-focused coworking space with prototyping lab.",
    emoji: "🎨",
    status: "active" as const,
    approvalStatus: "pending" as const,
    tags: ["paid"],
    addedAt: "2025-06-05",
  },
  // Dead project (graveyard)
  {
    id: "old-forum",
    name: "NS Forums",
    category: "networks",
    description:
      "The original community forums, replaced by the NS Hub platform.",
    emoji: "💀",
    status: "dead" as const,
    approvalStatus: "approved" as const,
    postMortem:
      "Replaced by NS Hub which offered better real-time collaboration.",
    addedAt: "2024-06-01",
  },
  {
    id: "failed-delivery",
    name: "QuickShip Logistics",
    category: "transport",
    description:
      "Last-mile delivery tool that couldn't find product-market fit.",
    emoji: "📦",
    status: "dead" as const,
    approvalStatus: "approved" as const,
    postMortem:
      "Ran out of runway. Market too competitive with established players.",
    addedAt: "2024-09-15",
  },
];

const mockRequests = [
  {
    id: "req-yoga",
    name: "NS Yoga & Wellness",
    description: "Yoga and wellness sessions for NS community members.",
    category: "events",
    submittedBy: "Alice",
    emoji: "🧘",
    upvotes: 12,
    submittedAt: "2025-05-20",
  },
  {
    id: "req-newsletter",
    name: "The NS Newsletter",
    description: "Weekly curated newsletter of NS ecosystem updates.",
    category: "media",
    submittedBy: "Bob",
    emoji: "📰",
    upvotes: 8,
    submittedAt: "2025-05-25",
  },
  {
    id: "req-mentor",
    name: "Mentor Match",
    description: "Platform to match experienced founders with newcomers.",
    category: "education",
    submittedBy: "Carol",
    emoji: "🤝",
    upvotes: 15,
    submittedAt: "2025-06-01",
  },
];

const mockUpvotes = [
  { requestId: "req-yoga", voterId: "voter-1" },
  { requestId: "req-yoga", voterId: "voter-2" },
  { requestId: "req-yoga", voterId: "voter-3" },
  { requestId: "req-newsletter", voterId: "voter-1" },
  { requestId: "req-newsletter", voterId: "voter-4" },
  { requestId: "req-mentor", voterId: "voter-2" },
  { requestId: "req-mentor", voterId: "voter-3" },
  { requestId: "req-mentor", voterId: "voter-5" },
];

async function seed() {
  console.log(`Seeding database: ${DATABASE_URL.replace(/\/\/.*@/, "//***@")}`);

  // Clear existing data
  await db.delete(requestUpvotes);
  await db.delete(projectRequests);
  await db.delete(projects);
  console.log("Cleared existing data.");

  // Insert projects
  await db.insert(projects).values(mockProjects);
  console.log(`Inserted ${mockProjects.length} projects.`);

  // Insert requests
  await db.insert(projectRequests).values(mockRequests);
  console.log(`Inserted ${mockRequests.length} project requests.`);

  // Insert upvotes
  await db.insert(requestUpvotes).values(mockUpvotes);
  console.log(`Inserted ${mockUpvotes.length} upvotes.`);

  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
