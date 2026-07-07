import { FormEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Award,
  Binary,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Cpu,
  Download,
  FileText,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Moon,
  Network,
  Pause,
  Phone,
  Play,
  Radar,
  ShieldCheck,
  Siren,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
  Terminal,
  Trophy,
  Volume2,
  VolumeX
} from "lucide-react";
import { Profile, profileFallback } from "./data/profileFallback";
import { MusicTrack, musicTracks } from "./data/musicTracks";

type TabId = "intel" | "experience" | "projects" | "skills" | "certs";
type Theme = "dark" | "light";
type ViewMode = "viewer" | "recruiter";
type TerminalLine = {
  id: number;
  kind: "system" | "input" | "output" | "error";
  text: string;
};
type MiniGame = {
  active: boolean;
  vulnerablePort: number;
  ports: number[];
  attempts: number;
  traced: boolean;
  scanned: boolean;
  analyzed: boolean;
  wins: number;
};
type Impact = {
  id: number;
  x: number;
  y: number;
};
type ContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};
type ModeTransition = {
  target: ViewMode;
  label: string;
};
type ArsenalSkillNode = {
  id: string;
  label: string;
  level: string;
  signal: string;
  tools: string[];
  branches: string[];
};
type ArsenalDomain = {
  id: string;
  label: string;
  summary: string;
  icon: LucideIcon;
  nodes: ArsenalSkillNode[];
};
type TryHackMeRoom = {
  title: string;
  completedAt?: string;
  difficulty?: string;
  url?: string;
  skills?: string[];
  tags?: string[];
};
type TryHackMeSkill = {
  name: string;
  domain?: string;
  level?: string;
  rooms?: string[];
};
type TryHackMeTracker = {
  source: "loading" | "live" | "cache" | "disabled" | "error";
  updatedAt?: string;
  username?: string;
  profileUrl?: string;
  rooms: TryHackMeRoom[];
  skills: TryHackMeSkill[];
};

const bootLines = [
  "[*] Initializing Master_Demon security profile...",
  "[*] Establishing tunnel to GLA-CYBER-AI node...",
  "[+] Identity signature: SANSKAR-JAISWAL SHA256-OK",
  "[*] Loading modules: Purple Team, DFIR, OSINT, Malware Analysis...",
  "[+] Access granted. Portfolio core online."
];

const meshNodes = [
  { x: 6, y: 18 },
  { x: 16, y: 72 },
  { x: 23, y: 38 },
  { x: 35, y: 83 },
  { x: 42, y: 22 },
  { x: 53, y: 61 },
  { x: 61, y: 16 },
  { x: 72, y: 44 },
  { x: 82, y: 77 },
  { x: 93, y: 27 },
  { x: 11, y: 49 },
  { x: 49, y: 91 },
  { x: 68, y: 88 },
  { x: 89, y: 58 }
];

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "intel", label: "Intel" },
  { id: "experience", label: "Ops" },
  { id: "projects", label: "Builds" },
  { id: "skills", label: "Arsenal" },
  { id: "certs", label: "Achievement" }
];

const missionNodes: Array<{ href: string; label: string; signal: string; icon: LucideIcon; level: string; tab?: TabId }> = [
  { href: "#intel", label: "Intel Core", signal: "Resume bulletin, education, and live THM feed.", icon: Cpu, level: "Primary" },
  { href: "#cli", label: "Secure Shell", signal: "Interactive commands and breach-lab challenge.", icon: Terminal, level: "Playable" },
  { href: "#intel", label: "Build Vault", signal: "Case-file style projects and security decisions.", icon: BrainCircuit, level: "Evidence", tab: "projects" },
  { href: "#intel", label: "Arsenal Tree", signal: "SOC, AI security, DFIR, offensive, and engineering nodes.", icon: Radar, level: "Expandable", tab: "skills" },
  { href: "#intel", label: "Proof Cache", signal: "Achievements, certifications, and credibility signals.", icon: Trophy, level: "Verified", tab: "certs" },
  { href: "#contact", label: "Contact Link", signal: "Secure handoff through a prepared email draft.", icon: Mail, level: "Outbound" }
];

const securityBadges: Array<{ label: string; status: string; detail: string; icon: LucideIcon }> = [
  { label: "Secure Headers", status: "Browser", detail: "Browser security policies are enforced for safer browsing.", icon: ShieldCheck },
  { label: "Restricted Admin", status: "Access", detail: "Administrative workflows are separated from the public experience.", icon: Network },
  { label: "Protected Sessions", status: "Identity", detail: "Sensitive actions require authenticated access.", icon: Binary },
  { label: "No Client Secrets", status: "Build", detail: "Secrets are kept out of public assets.", icon: Terminal },
  { label: "Input Discipline", status: "Data", detail: "User-provided data is constrained before use.", icon: Cpu }
];

const resumeArtifact = {
  fileName: "sanskar-jaiswal-resume.txt",
  href: "/resume/sanskar-jaiswal-resume.txt",
  hash: "952DB48E6F6982761A16DF9C5336CF6C868A18A8AD659A4B0BFF15F2102F5105",
  updated: "2026-07-07"
};

const baseArsenalDomains: ArsenalDomain[] = [
  {
    id: "soc",
    label: "SOC",
    summary: "Primary blue-team domain for alert triage, investigation, incident response, and threat intelligence.",
    icon: Siren,
    nodes: [
      {
        id: "soc-triage",
        label: "Alert Triage",
        level: "Advanced",
        signal: "Prioritize suspicious activity, reduce noise, and connect events to investigation context.",
        tools: ["SIEM workflows", "Log analysis", "Threat hunting"],
        branches: ["Severity mapping", "False positive reduction", "Escalation notes"]
      },
      {
        id: "soc-ir",
        label: "Incident Response",
        level: "Advanced",
        signal: "Contain active threats and document the evidence chain from detection to remediation.",
        tools: ["Playbooks", "Endpoint review", "Evidence handling"],
        branches: ["Containment", "Eradication", "Post-incident review"]
      },
      {
        id: "soc-intel",
        label: "Threat Intelligence",
        level: "Advanced",
        signal: "Convert indicators, behavior, and open-source context into usable defensive leads.",
        tools: ["OSINT", "SOC Radar", "Indicator enrichment"],
        branches: ["IOC enrichment", "Dark web fundamentals", "Actor profiling"]
      }
    ]
  },
  {
    id: "ai-security",
    label: "AI Security",
    summary: "Primary domain for ML-backed threat detection, phishing analysis, URL intelligence, and safer AI-assisted defense workflows.",
    icon: BrainCircuit,
    nodes: [
      {
        id: "ai-rpds",
        label: "RPDS Threat Detection",
        level: "Intermediate",
        signal: "Use ML-backed analysis to classify phishing and malicious web threats in real time.",
        tools: ["RPDS", "FastAPI", "Threat datasets"],
        branches: ["Phishing detection", "Malicious URL scoring", "Batch URL analysis"]
      },
      {
        id: "ai-model-fusion",
        label: "Model Fusion",
        level: "Intermediate",
        signal: "Combine character-level and classical ML signals for stronger detection confidence.",
        tools: ["Character-level CNN", "LightGBM", "Whitelist filters"],
        branches: ["Ensemble logic", "False positive control", "Confidence scoring"]
      },
      {
        id: "ai-resilience",
        label: "Detection Resilience",
        level: "Intermediate",
        signal: "Design AI security systems that keep working when models, APIs, or datasets degrade.",
        tools: ["Circuit breakers", "Offline fallback", "Error handling"],
        branches: ["Graceful fallback", "Zero-crash flow", "Operational monitoring"]
      }
    ]
  },
  {
    id: "offensive",
    label: "Offensive Security",
    summary: "Recon, vulnerability assessment, exploitation discipline, and practical reporting.",
    icon: Radar,
    nodes: [
      {
        id: "offensive-pentest",
        label: "Penetration Testing",
        level: "Intermediate",
        signal: "Assess exposed surfaces and validate risk with controlled testing.",
        tools: ["Kali Linux", "Nmap", "OWASP ZAP"],
        branches: ["Web testing", "Network scanning", "Bug bounty method"]
      },
      {
        id: "offensive-recon",
        label: "Recon Automation",
        level: "Advanced",
        signal: "Build repeatable enumeration workflows for labs, CTFs, and assessments.",
        tools: ["IronCrypt", "ffuf", "Bash"],
        branches: ["Directory fuzzing", "DNS checks", "TLS/header analysis"]
      },
      {
        id: "offensive-va",
        label: "Vulnerability Assessment",
        level: "Intermediate",
        signal: "Find, classify, and communicate exploitable weaknesses with remediation detail.",
        tools: ["Nmap", "Gobuster", "Wireshark"],
        branches: ["Risk scoring", "Finding validation", "Fix guidance"]
      }
    ]
  },
  {
    id: "dfir",
    label: "DFIR",
    summary: "Digital forensics, malware analysis, and investigative workflows inspired by law-enforcement exposure.",
    icon: ShieldCheck,
    nodes: [
      {
        id: "dfir-forensics",
        label: "Digital Forensics",
        level: "Advanced",
        signal: "Preserve, inspect, and interpret artifacts during real-world cyber investigations.",
        tools: ["Forensic workflows", "Case notes", "Artifact review"],
        branches: ["Evidence chain", "Timeline analysis", "Report writing"]
      },
      {
        id: "dfir-malware",
        label: "Malware Analysis",
        level: "Intermediate",
        signal: "Analyze suspicious behavior and extract indicators for defensive action.",
        tools: ["Static review", "Sandbox thinking", "Behavior mapping"],
        branches: ["IOC extraction", "Persistence clues", "Network behavior"]
      },
      {
        id: "dfir-reverse",
        label: "Reverse Engineering",
        level: "Beginner",
        signal: "Build fundamentals for unpacking behavior, control flow, and executable logic.",
        tools: ["Binary basics", "Debugging mindset", "Notes-first workflow"],
        branches: ["Strings", "Control flow", "Function mapping"]
      }
    ]
  },
  {
    id: "engineering",
    label: "Secure Engineering",
    summary: "Backend services, automation, and secure full-stack delivery with small, controlled API surfaces.",
    icon: Network,
    nodes: [
      {
        id: "engineering-python",
        label: "Python Automation",
        level: "Professional",
        signal: "Script analysis pipelines, tooling, and security workflow automation.",
        tools: ["Python", "FastAPI", "Custom scripts"],
        branches: ["Data parsing", "Detection helpers", "Workflow glue"]
      },
      {
        id: "engineering-java",
        label: "Java Backend",
        level: "Intermediate",
        signal: "Create small, controlled API surfaces with secure defaults and validation.",
        tools: ["Java", "HTTP server", "Security headers"],
        branches: ["API routes", "Input validation", "Safe static serving"]
      }
    ]
  }
];

const emptyTryHackMeTracker: TryHackMeTracker = {
  source: "loading",
  rooms: [],
  skills: []
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeTextList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .slice(0, 8)
    : [];

const normalizeTryHackMeTracker = (value: unknown): TryHackMeTracker => {
  if (!value || typeof value !== "object") {
    return { ...emptyTryHackMeTracker, source: "error" };
  }

  const raw = value as Record<string, unknown>;
  const rawRooms = Array.isArray(raw.rooms) ? raw.rooms : [];
  const rooms = rawRooms
    .filter((room): room is Record<string, unknown> => Boolean(room) && typeof room === "object")
    .map((room) => ({
      title: normalizeText(room.title || room.name).slice(0, 100),
      completedAt: normalizeText(room.completedAt || room.completed_at || room.date).slice(0, 32),
      difficulty: normalizeText(room.difficulty).slice(0, 32),
      url: normalizeText(room.url || room.link).slice(0, 240),
      skills: normalizeTextList(room.skills),
      tags: normalizeTextList(room.tags)
    }))
    .filter((room) => room.title)
    .slice(0, 8);

  const rawSkills = Array.isArray(raw.skills) ? raw.skills : [];
  const explicitSkills = rawSkills
    .filter((skill): skill is Record<string, unknown> => Boolean(skill) && typeof skill === "object")
    .map((skill) => ({
      name: normalizeText(skill.name || skill.label).slice(0, 80),
      domain: normalizeText(skill.domain).slice(0, 40),
      level: normalizeText(skill.level).slice(0, 40),
      rooms: normalizeTextList(skill.rooms)
    }))
    .filter((skill) => skill.name)
    .slice(0, 12);

  const source = normalizeText(raw.source) as TryHackMeTracker["source"];
  return {
    source: ["live", "cache", "disabled", "error"].includes(source) ? source : "cache",
    updatedAt: normalizeText(raw.updatedAt || raw.updated_at).slice(0, 32),
    username: normalizeText(raw.username || raw.handle).slice(0, 40),
    profileUrl: normalizeText(raw.profileUrl || raw.profile_url).slice(0, 240),
    rooms,
    skills: explicitSkills.length > 0 ? explicitSkills : deriveTryHackMeSkills(rooms)
  };
};

const getTryHackMeTrackerLabel = (tracker: TryHackMeTracker) => {
  if (tracker.username) {
    return tracker.username;
  }

  if (!tracker.profileUrl) {
    return "";
  }

  try {
    const profilePath = new URL(tracker.profileUrl).pathname;
    return profilePath.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return "";
  }
};

const inferTryHackMeDomain = (skillName: string) => {
  const skill = skillName.toLowerCase();
  if (/(soc|siem|log|alert|incident|blue|defen|threat|intel|splunk|sigma|yara)/.test(skill)) {
    return "soc";
  }
  if (/(ai|ml|model|phish|url|detection|classif|data)/.test(skill)) {
    return "ai-security";
  }
  if (/(forensic|dfir|malware|reverse|memory|disk|artifact)/.test(skill)) {
    return "dfir";
  }
  if (/(pentest|web|recon|enum|nmap|burp|owasp|exploit|vulnerab|ctf)/.test(skill)) {
    return "offensive";
  }
  return "engineering";
};

const deriveTryHackMeSkills = (rooms: TryHackMeRoom[]): TryHackMeSkill[] => {
  const skillRooms = new Map<string, Set<string>>();

  rooms.forEach((room) => {
    [...(room.skills ?? []), ...(room.tags ?? [])].forEach((skill) => {
      const cleanSkill = skill.trim();
      if (!cleanSkill) {
        return;
      }

      const roomSet = skillRooms.get(cleanSkill) ?? new Set<string>();
      roomSet.add(room.title);
      skillRooms.set(cleanSkill, roomSet);
    });
  });

  return Array.from(skillRooms.entries())
    .slice(0, 12)
    .map(([name, roomsForSkill]) => ({
      name,
      domain: inferTryHackMeDomain(name),
      level: "THM Practice",
      rooms: Array.from(roomsForSkill).slice(0, 4)
    }));
};

const enrichArsenalDomains = (domains: ArsenalDomain[], thmSkills: TryHackMeSkill[]) =>
  domains.map((domain) => {
    const skillsForDomain = thmSkills.filter((skill) => (skill.domain || inferTryHackMeDomain(skill.name)) === domain.id);
    if (skillsForDomain.length === 0) {
      return domain;
    }

    const thmNodes = skillsForDomain.map((skill) => ({
      id: `thm-${domain.id}-${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      label: `THM: ${skill.name}`,
      level: skill.level || "THM Practice",
      signal: `TryHackMe practice signal mapped into ${domain.label}.`,
      tools: ["TryHackMe", "Hands-on lab", domain.label],
      branches: skill.rooms && skill.rooms.length > 0 ? skill.rooms : ["Recent solved room"]
    }));

    return {
      ...domain,
      nodes: [...domain.nodes, ...thmNodes]
    };
  });

const serviceByPort: Record<number, string> = {
  22: "ssh",
  53: "dns",
  80: "http",
  443: "https",
  3306: "mysql",
  5432: "postgres",
  8080: "alt-http",
  8443: "alt-https"
};

const labPorts = Object.keys(serviceByPort).map(Number);
const serviceClues: Record<number, string> = {
  22: "auth latency jitter",
  53: "resolver cache anomaly",
  80: "header order mismatch",
  443: "certificate timing drift",
  3306: "handshake entropy spike",
  5432: "schema probe echo",
  8080: "debug banner residue",
  8443: "legacy cipher shadow"
};

const isSafeHttpUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const getProfileLinkIcon = (label: string) => {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel.includes("linkedin")) {
    return Linkedin;
  }

  if (normalizedLabel.includes("github")) {
    return Github;
  }

  if (normalizedLabel.includes("tryhackme") || normalizedLabel.includes("thm")) {
    return Trophy;
  }

  return ArrowUpRight;
};

const formatList = (items: string[]) => items.map((item, index) => `${index + 1}. ${item}`).join("\n");
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createMiniGame = (wins: number): MiniGame => {
  const shuffledPorts = [...labPorts].sort(() => Math.random() - 0.5).slice(0, 6);
  const vulnerablePort = shuffledPorts[Math.floor(Math.random() * shuffledPorts.length)];
  return {
    active: true,
    vulnerablePort,
    ports: shuffledPorts.sort((first, second) => first - second),
    attempts: 2,
    traced: false,
    scanned: false,
    analyzed: false,
    wins
  };
};

const resolveCliCommand = (
  rawCommand: string,
  profile: Profile,
  game: MiniGame
): { text: string; clear?: boolean; error?: boolean; game?: MiniGame } => {
  const command = rawCommand.trim().toLowerCase();
  const primaryProject = profile.projects[0];
  const primaryEducation = profile.education[0];

  if (!command) {
    return { text: "No signal received." };
  }

  if (command === "game" || command === "start game" || command === "breach") {
    const nextGame = createMiniGame(game.wins);
    return {
      game: nextGame,
      text: [
        "Breach Lab armed.",
        "Target surface is dark. Recon discipline matters.",
        `Attempts: ${nextGame.attempts}`
      ].join("\n")
    };
  }

  if (command === "abort") {
    if (!game.active) {
      return { text: "No active breach lab. Start one with: game", error: true };
    }
    return {
      game: { ...game, active: false },
      text: "Breach Lab aborted. No changes persisted."
    };
  }

  if (command === "scan") {
    if (!game.active) {
      return { text: "No active target. A breach lab must be armed first.", error: true };
    }

    if (!game.traced) {
      return { text: "Route is dark. Trace the perimeter before scanning.", error: true };
    }

    const scannedGame = { ...game, scanned: true };
    return {
      game: scannedGame,
      text: [
        "Passive scan complete:",
        ...game.ports.map((port) => `${port}/tcp open ${serviceByPort[port]}`),
        "Telemetry cached."
      ].join("\n")
    };
  }

  if (command === "trace") {
    if (!game.active) {
      return {
        text: [
          "Public route trace:",
          "#mission-map -> node navigation",
          "#intel -> resume bulletin",
          "#cli -> secure shell",
          "#contact -> handoff"
        ].join("\n")
      };
    }

    return {
      game: { ...game, traced: true },
      text: [
        "Perimeter trace complete.",
        `Detected ${game.ports.length} exposed service shadows.`,
        "Scan window opened for one controlled pass."
      ].join("\n")
    };
  }

  if (command === "analyze" || command === "fingerprint") {
    if (!game.active) {
      return { text: "No active target.", error: true };
    }

    if (!game.scanned) {
      return { text: "No telemetry cache found.", error: true };
    }

    const decoy = game.ports.find((port) => port !== game.vulnerablePort) ?? game.ports[0];
    return {
      game: { ...game, analyzed: true },
      text: [
        "Signal analysis:",
        `${serviceByPort[game.vulnerablePort]} shows ${serviceClues[game.vulnerablePort]}.`,
        `${serviceByPort[decoy]} produced believable noise.`,
        "One shot can still burn the operation."
      ].join("\n")
    };
  }

  if (command.startsWith("exploit")) {
    if (!game.active) {
      return { text: "No active target. Start the mini game with: game", error: true };
    }

    if (!game.scanned) {
      return { text: "No telemetry. Blind fire blocked.", error: true };
    }

    if (!game.analyzed) {
      return { text: "Fingerprint unresolved. Exploit chain refused.", error: true };
    }

    const [, rawPort] = command.split(/\s+/);
    const selectedPort = Number(rawPort);
    if (!rawPort || !Number.isInteger(selectedPort)) {
      return { text: "Usage: exploit <port>", error: true };
    }

    if (!game.ports.includes(selectedPort)) {
      return {
        text: `Port ${rawPort} is not in the current target set. Run scan to inspect available ports.`,
        error: true
      };
    }

    if (selectedPort === game.vulnerablePort) {
      return {
        game: { ...game, active: false, wins: game.wins + 1 },
        text: [
          `Exploit matched on ${selectedPort}/tcp.`,
          "Lab complete: vulnerable service isolated and reported.",
          `Breach Lab wins: ${game.wins + 1}`
        ].join("\n")
      };
    }

    const attempts = game.attempts - 1;
    if (attempts <= 0) {
      return {
        game: { ...game, active: false, attempts: 0 },
        text: [
          `${selectedPort}/tcp rejected the payload.`,
          `Lab failed. Correct target was ${game.vulnerablePort}/tcp (${serviceByPort[game.vulnerablePort]}).`,
          "Start another round with: game"
        ].join("\n"),
        error: true
      };
    }

    return {
      game: { ...game, attempts },
      text: `${selectedPort}/tcp was a false lead. Attempts remaining: ${attempts}`,
      error: true
    };
  }

  if (command === "map") {
    return {
      text: missionNodes.map((node) => `${node.label}: ${node.signal}`).join("\n")
    };
  }

  if (command === "badges") {
    return {
      text: [
        "SECURE_HEADERS",
        "RESTRICTED_ADMIN",
        "PROTECTED_SESSIONS",
        "NO_CLIENT_SECRETS",
        "INPUT_DISCIPLINE"
      ].join("\n")
    };
  }

  if (command === "resume" || command === "hash resume") {
    return {
      text: [
        `Resume vault: ${resumeArtifact.fileName}`,
        `SHA-256: ${resumeArtifact.hash}`,
        `Path: ${resumeArtifact.href}`
      ].join("\n")
    };
  }

  if (command.startsWith("decrypt")) {
    if (game.wins < 1) {
      return { text: "Decrypt denied. Complete one breach lab to unlock operator fragments.", error: true };
    }
    return {
      text: [
        "Operator fragments decrypted:",
        "identity: whoami / id / status",
        "intel: summary / edu / skills / projects",
        "proof: experience / certs / achievements / contact"
      ].join("\n")
    };
  }

  switch (command) {
    case "help":
    case "?":
      return {
        text: [
          "Manual index is intentionally fragmented.",
          "Start with identity, route tracing, or breach lab language.",
          "A clean lab win unlocks deeper operator fragments."
        ].join("\n")
      };
    case "whoami":
      return { text: profile.name };
    case "id":
      return {
        text: [
          `uid=sanskar`,
          `role="${profile.title}"`,
          `status="${profile.availability}"`,
          `location="${profile.location}"`
        ].join("\n")
      };
    case "summary":
    case "about":
      return { text: formatList(profile.summary) };
    case "edu":
    case "education":
      return {
        text: primaryEducation
          ? `${primaryEducation.institution}\n${primaryEducation.degree} - ${primaryEducation.specialization}\n${primaryEducation.period} / ${primaryEducation.location} / ${primaryEducation.score}`
          : "No education data loaded."
      };
    case "skills":
    case "arsenal":
      return { text: profile.skills.map((skill) => `${skill.name}: ${skill.level}`).join("\n") };
    case "projects":
    case "builds":
      return {
        text: profile.projects
          .map((project) => `${project.name} (${project.period})\n${project.description}\nStack: ${project.stack.join(", ")}`)
          .join("\n\n")
      };
    case "rpds":
      return {
        text: primaryProject
          ? `${primaryProject.name}\n${primaryProject.securityHighlights.join("\n")}`
          : "RPDS project data is not loaded."
      };
    case "experience":
    case "ops":
      return {
        text: profile.experience
          .map((item) => `${item.role} @ ${item.organization} (${item.period}, ${item.location})`)
          .join("\n")
      };
    case "certs":
    case "certifications":
      return {
        text: profile.certifications.map((cert) => `${cert.name} - ${cert.issuer} (${cert.date})`).join("\n")
      };
    case "achievements":
    case "proof":
      return {
        text: profile.achievements.map((item) => `${item.name} - ${item.detail} / ${item.issuer}`).join("\n")
      };
    case "contact":
      return {
        text: [`email: ${profile.email}`, `phone: ${profile.phone}`, ...profile.links.map((link) => `${link.label}: ${link.url}`)].join("\n")
      };
    case "status":
      return {
        text: [
          `bulletin_updated=${profile.bulletin.updated}`,
          `metrics=${profile.metrics.map((metric) => `${metric.label}:${metric.value}`).join(" | ")}`,
          `focus=${profile.focusAreas.map((area) => area.name).join(", ")}`,
          `breach_lab=${game.active ? `active attempts=${game.attempts} scanned=${game.scanned} analyzed=${game.analyzed}` : `idle wins=${game.wins}`}`
        ].join("\n")
      };
    case "clear":
      return { text: "", clear: true };
    default:
      return { text: `Command not found: ${rawCommand.trim()}. Try: help`, error: true };
  }
};

function App() {
  const [profile, setProfile] = useState<Profile>(profileFallback);
  const [activeTab, setActiveTab] = useState<TabId>("intel");
  const [apiState, setApiState] = useState<"loading" | "live" | "fallback">("loading");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const [activeArsenalDomain, setActiveArsenalDomain] = useState(baseArsenalDomains[0].id);
  const [expandedArsenalNodes, setExpandedArsenalNodes] = useState<Set<string>>(() => new Set([baseArsenalDomains[0].nodes[0].id]));
  const [tryHackMeTracker, setTryHackMeTracker] = useState<TryHackMeTracker>(emptyTryHackMeTracker);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [contactStatus, setContactStatus] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { id: 1, kind: "system", text: "SanskarOS link established." },
    { id: 2, kind: "system", text: "Manual index unavailable." }
  ]);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalHistoryIndex, setTerminalHistoryIndex] = useState<number | null>(null);
  const [miniGame, setMiniGame] = useState<MiniGame>({
    active: false,
    vulnerablePort: 0,
    ports: [],
    attempts: 0,
    traced: false,
    scanned: false,
    analyzed: false,
    wins: 0
  });
  const terminalOutputRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const transitionTimersRef = useRef<number[]>([]);
  const transitionProgressTimerRef = useRef<number | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem("portfolio-theme");
    return saved === "light" ? "light" : "dark";
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = window.localStorage.getItem("portfolio-view-mode");
    return saved === "recruiter" ? "recruiter" : "viewer";
  });
  const [modeTransition, setModeTransition] = useState<ModeTransition | null>(null);
  const [modeTransitionProgress, setModeTransitionProgress] = useState(0);

  useEffect(() => {
    window.localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("portfolio-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => setBootComplete(true), 4300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    terminalOutputRef.current?.scrollTo({
      top: terminalOutputRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [terminalLines]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/profile", {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Profile API returned ${response.status}`);
        }
        return response.json() as Promise<Profile>;
      })
      .then((data) => {
        setProfile(data);
        setApiState("live");
      })
      .catch(() => {
        setProfile(profileFallback);
        setApiState("fallback");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTracker = (path: string) =>
      fetch(path, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`THM tracker returned ${response.status}`);
        }
        return response.json() as Promise<unknown>;
      });

    fetchTracker("/api/thm")
      .catch(() => fetchTracker("/thm-rooms.json"))
      .then((data) => setTryHackMeTracker(normalizeTryHackMeTracker(data)))
      .catch(() => setTryHackMeTracker({ ...emptyTryHackMeTracker, source: "error" }));

    return () => controller.abort();
  }, []);

  const safeLinks = useMemo(() => profile.links.filter((link) => isSafeHttpUrl(link.url)), [profile.links]);
  const arsenalDomains = useMemo(() => enrichArsenalDomains(baseArsenalDomains, tryHackMeTracker.skills), [tryHackMeTracker.skills]);
  const selectedArsenalDomain = useMemo(
    () => arsenalDomains.find((domain) => domain.id === activeArsenalDomain) ?? arsenalDomains[0],
    [activeArsenalDomain, arsenalDomains]
  );
  const activeTrack = musicTracks[trackIndex];
  const SelectedArsenalIcon = selectedArsenalDomain.icon;
  const bulletinFeedItems = useMemo(() => {
    const roomItems = tryHackMeTracker.rooms.slice(0, 4).map((room) => {
      const solvedAt = room.completedAt ? ` on ${room.completedAt}` : "";
      const skillHint = [...(room.skills ?? []), ...(room.tags ?? [])].slice(0, 3).join(", ");
      return `TryHackMe room solved${solvedAt}: ${room.title}${skillHint ? ` [${skillHint}]` : ""}.`;
    });

    if (tryHackMeTracker.source === "loading") {
      return ["Syncing TryHackMe tracker feed...", ...profile.bulletin.items];
    }

    if (roomItems.length === 0) {
      const trackerLabel = getTryHackMeTrackerLabel(tryHackMeTracker);
      if (trackerLabel && tryHackMeTracker.profileUrl) {
        return [`TryHackMe tracker linked: ${trackerLabel}. Recent solved rooms will appear here when the THM feed/cache includes room data.`, ...profile.bulletin.items];
      }

      return profile.bulletin.items;
    }

    return [...roomItems, ...profile.bulletin.items];
  }, [profile.bulletin.items, tryHackMeTracker]);

  const selectArsenalDomain = (domain: ArsenalDomain) => {
    setActiveArsenalDomain(domain.id);
    setExpandedArsenalNodes(new Set([domain.nodes[0].id]));
  };

  const toggleArsenalNode = (nodeId: string) => {
    setExpandedArsenalNodes((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const playTone = (frequency: number, duration: number, type: OscillatorType, gainValue: number, delay = 0) => {
    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!context || !masterGain) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  };

  const stopMusic = () => {
    if (musicTimerRef.current !== null) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }

    audioContextRef.current?.close();
    audioContextRef.current = null;
    masterGainRef.current = null;
    setIsMusicPlaying(false);
  };

  const startMusic = (track: MusicTrack) => {
    stopMusic();
    const context = new AudioContext();
    const masterGain = context.createGain();
    masterGain.gain.value = isMuted ? 0 : 0.055;
    masterGain.connect(context.destination);
    audioContextRef.current = context;
    masterGainRef.current = masterGain;

    let step = 0;
    const beatMs = 60000 / track.bpm;
    const tick = () => {
      const bass = track.bass[step % track.bass.length];
      const lead = track.lead[(step + Math.floor(step / 2)) % track.lead.length];
      playTone(track.pad, beatMs / 1000, "sawtooth", 0.012);
      playTone(bass, 0.18, "triangle", 0.08);
      if (step % 2 === 0) {
        playTone(lead, 0.12, "square", 0.028, 0.04);
      }
      if (step % 4 === 2) {
        playTone(lead * 2, 0.055, "sawtooth", 0.018, 0.08);
      }
      step += 1;
    };

    tick();
    musicTimerRef.current = window.setInterval(tick, beatMs / 2);
    setIsMusicPlaying(true);
  };

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : 0.055;
    }
  }, [isMuted]);

  useEffect(() => {
    if (isMusicPlaying) {
      startMusic(activeTrack);
    }

    return undefined;
  }, [trackIndex]);

  useEffect(() => () => stopMusic(), []);

  useEffect(
    () => () => {
      transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      transitionTimersRef.current = [];
      if (transitionProgressTimerRef.current !== null) {
        window.clearInterval(transitionProgressTimerRef.current);
        transitionProgressTimerRef.current = null;
      }
    },
    []
  );

  const startModeTransition = (target: ViewMode) => {
    if (modeTransition || target === viewMode) {
      return;
    }

    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];
    if (transitionProgressTimerRef.current !== null) {
      window.clearInterval(transitionProgressTimerRef.current);
      transitionProgressTimerRef.current = null;
    }
    setModeTransitionProgress(0);
    setModeTransition({
      target,
      label: target === "recruiter" ? "Recruiter Mode" : "Viewer Mode"
    });

    const progressStartedAt = window.performance.now();
    transitionProgressTimerRef.current = window.setInterval(() => {
      const elapsed = window.performance.now() - progressStartedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / 1500) * 100));
      setModeTransitionProgress(nextProgress);

      if (nextProgress >= 100 && transitionProgressTimerRef.current !== null) {
        window.clearInterval(transitionProgressTimerRef.current);
        transitionProgressTimerRef.current = null;
      }
    }, 24);

    if (target === "recruiter") {
      stopMusic();
      setIsMusicOpen(false);
    }

    transitionTimersRef.current = [
      window.setTimeout(() => setViewMode(target), 920),
      window.setTimeout(() => {
        setModeTransitionProgress(100);
        if (transitionProgressTimerRef.current !== null) {
          window.clearInterval(transitionProgressTimerRef.current);
          transitionProgressTimerRef.current = null;
        }
        setModeTransition(null);
        transitionTimersRef.current = [];
      }, 1900)
    ];
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    setCursorPosition({ x: event.clientX, y: event.clientY });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const id = Date.now();

    setImpacts((current) => [...current.slice(-8), { id, x: event.clientX, y: event.clientY }]);
    window.setTimeout(() => {
      setImpacts((current) => current.filter((impact) => impact.id !== id));
    }, 680);
  };

  const submitTerminalCommand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const command = terminalInput.trim();
    const result = resolveCliCommand(command, profile, miniGame);

    if (result.game) {
      setMiniGame(result.game);
    }

    if (result.clear) {
      setTerminalLines([{ id: Date.now(), kind: "system", text: "Terminal buffer cleared." }]);
      setTerminalInput("");
      return;
    }

    setTerminalLines((current) => [
      ...current,
      { id: Date.now(), kind: "input", text: `visitor@sanskar.dev:~$ ${command}` },
      { id: Date.now() + 1, kind: result.error ? "error" : "output", text: result.text }
    ]);
    if (command) {
      setTerminalHistory((current) => [command, ...current.filter((entry) => entry !== command)].slice(0, 18));
    }
    setTerminalHistoryIndex(null);
    setTerminalInput("");
  };

  const handleTerminalKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (terminalHistory.length === 0 || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) {
      return;
    }

    event.preventDefault();
    setTerminalHistoryIndex((current) => {
      if (event.key === "ArrowUp") {
        const nextIndex = current === null ? 0 : Math.min(current + 1, terminalHistory.length - 1);
        setTerminalInput(terminalHistory[nextIndex] ?? "");
        return nextIndex;
      }

      if (current === null || current <= 0) {
        setTerminalInput("");
        return null;
      }

      const nextIndex = current - 1;
      setTerminalInput(terminalHistory[nextIndex] ?? "");
      return nextIndex;
    });
  };

  const submitContactForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const subject = contactForm.subject.trim();
    const message = contactForm.message.trim();

    if (name.length < 2 || name.length > 80) {
      setContactStatus("Name must be between 2 and 80 characters.");
      return;
    }

    if (!isValidEmail(email) || email.length > 120) {
      setContactStatus("Enter a valid email address.");
      return;
    }

    if (subject.length < 3 || subject.length > 120) {
      setContactStatus("Subject must be between 3 and 120 characters.");
      return;
    }

    if (message.length < 10 || message.length > 1200) {
      setContactStatus("Message must be between 10 and 1200 characters.");
      return;
    }

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Message:",
      message
    ].join("\n");
    const mailtoUrl = `mailto:${profile.email}?subject=${encodeURIComponent(`Portfolio Contact: ${subject}`)}&body=${encodeURIComponent(body)}`;
    setContactStatus("Opening your email client with the secure message draft.");
    window.location.href = mailtoUrl;
  };

  const transitionContent = modeTransition?.target === "recruiter"
    ? {
        status: "Recruiter signal filter",
        primary: "Compressing portfolio into direct hiring intelligence.",
        route: "Brief -> Skills -> Experience -> Projects -> Contact",
        cards: ["CLI hidden", "Proof prioritized", "Noise reduced", "Contact armed"],
        footer: "Filtering recruiter signal"
      }
    : {
        status: "Viewer interface restore",
        primary: "Restoring gamified cyber interface, terminal, music, and live modules.",
        route: "Map -> Intel -> CLI -> Arsenal -> Contact",
        cards: ["HUD online", "CLI restored", "Music enabled", "Effects armed"],
        footer: "Restoring viewer interface"
      };

  return (
    <main className="app-shell" data-mode={viewMode} data-theme={theme} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}>
      <div className="noise-layer" aria-hidden="true" />
      <div className="grid-layer" aria-hidden="true" />
      <div className="city-layer" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={`tower-${index}`} />
        ))}
      </div>
      <div className="packet-layer" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <span key={`packet-${index}`} />
        ))}
      </div>
      <div className="mesh-layer" aria-hidden="true">
        {meshNodes.map((node, index) => (
          <span
            key={`${node.x}-${node.y}`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              animationDelay: `${index * 170}ms`
            }}
          />
        ))}
      </div>
      <div className="aim-cursor" style={{ left: cursorPosition.x, top: cursorPosition.y }} aria-hidden="true" />
      {impacts.map((impact) => (
        <span className="impact-burst" key={impact.id} style={{ left: impact.x, top: impact.y }} />
      ))}

      {viewMode === "viewer" && !bootComplete && (
        <section className="boot-screen" aria-label="Secure boot sequence">
          <div className="boot-terminal">
            <div className="terminal-chrome" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="boot-body">
              <p className="boot-title">SECURE_BOOT_SEQUENCE v4.3.0</p>
              {bootLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <div className="boot-progress">
                <span />
              </div>
              <button onClick={() => setBootComplete(true)} type="button">
                Bypass firewall
              </button>
            </div>
          </div>
        </section>
      )}

      {modeTransition && (
        <section className="mode-splash" aria-label={`Switching to ${modeTransition.label}`}>
          <div className="mode-splash__scanline" aria-hidden="true" />
          <div className="mode-splash__header">
            <div>
              <span>Master_Demon interface transfer</span>
              <strong>{modeTransition.label}</strong>
            </div>
            <div className="mode-splash__status">
              <span>{transitionContent.status}</span>
              <b>{modeTransitionProgress}%</b>
            </div>
          </div>
          <div className="hud-grid">
            <div className="hud-widget hud-widget--profile">
              <span className="hud-widget__kicker">Operator</span>
              <strong>Sanskar Jaiswal</strong>
              <p>{transitionContent.primary}</p>
              <div className="hud-route">
                {transitionContent.route.split(" -> ").map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="hud-widget hud-widget--bars" aria-label="Live signal histogram">
              {Array.from({ length: 42 }, (_, index) => (
                <span key={`bar-${index}`} style={{ animationDelay: `${index * 28}ms` }} />
              ))}
            </div>
            <div className="hud-widget hud-widget--rings">
              <span />
              <span />
              <span />
              <strong>{modeTransitionProgress}</strong>
              <small>sync</small>
            </div>
            <div className="hud-widget hud-widget--matrix" aria-label="Profile packet stream">
              {Array.from({ length: 48 }, (_, index) => (
                <span key={`dot-${index}`} style={{ animationDelay: `${index * 12}ms` }} />
              ))}
            </div>
            <div className="hud-widget hud-widget--line">
              <b>{modeTransition.target === "recruiter" ? "recruiter_path" : "viewer_path"}</b>
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="hud-widget hud-widget--radar">
              <span />
              <strong>{modeTransition.target === "recruiter" ? "HIRING" : "CYBER"}</strong>
            </div>
            <div className="hud-widget hud-widget--wave">
              <b>signal integrity</b>
              {Array.from({ length: 18 }, (_, index) => (
                <span key={`wave-${index}`} style={{ animationDelay: `${index * 40}ms` }} />
              ))}
            </div>
            <div className="hud-widget hud-widget--chips">
              {transitionContent.cards.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="hud-widget hud-widget--loader">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="mode-splash__footer">
            <span>Live transition engine</span>
            <span>{transitionContent.footer}</span>
          </div>
        </section>
      )}

      <header className="topbar">
        <a className="brand-mark" href="#top" aria-label="Go to top">
          <Binary size={18} />
          <span>Master_Demon</span>
        </a>
        <nav className="mini-nav" aria-label="Page navigation">
          {viewMode === "viewer" ? (
            <>
              <a href="#mission-map">Map</a>
              <a href="#intel">Intel</a>
              <a href="#cli">CLI</a>
              <a href="#intel" onClick={() => setActiveTab("projects")}>Projects</a>
              <a href="#intel" onClick={() => setActiveTab("skills")}>Skills</a>
              <a href="#contact">Contact</a>
            </>
          ) : (
            <>
              <a href="#recruiter-brief">Brief</a>
              <a href="#recruiter-skills">Skills</a>
              <a href="#recruiter-experience">Experience</a>
              <a href="#recruiter-projects">Projects</a>
              <a href="#contact">Contact</a>
            </>
          )}
        </nav>
        {viewMode === "viewer" && (
          <div className="music-top" onMouseLeave={() => setIsMusicOpen(false)}>
            <button
              className="music-trigger"
              aria-expanded={isMusicOpen}
              aria-label="Open music controls"
              onClick={() => setIsMusicOpen((current) => !current)}
              type="button"
            >
              {isMusicPlaying && !isMuted ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            {isMusicOpen && (
              <aside className="music-popover" aria-label="Music controls">
                <div>
                  <span>{activeTrack.title}</span>
                  <small>{activeTrack.mood}</small>
                </div>
                <div className="music-controls">
                  <button
                    aria-label="Previous track"
                    onClick={() => setTrackIndex((current) => (current === 0 ? musicTracks.length - 1 : current - 1))}
                    type="button"
                  >
                    <SkipBack size={16} />
                  </button>
                  <button
                    aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                    onClick={() => (isMusicPlaying ? stopMusic() : startMusic(activeTrack))}
                    type="button"
                  >
                    {isMusicPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    aria-label="Next track"
                    onClick={() => setTrackIndex((current) => (current + 1) % musicTracks.length)}
                    type="button"
                  >
                    <SkipForward size={16} />
                  </button>
                  <button aria-label={isMuted ? "Unmute music" : "Mute music"} onClick={() => setIsMuted((current) => !current)} type="button">
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
              </aside>
            )}
          </div>
        )}
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        <button
          className="mode-toggle"
          type="button"
          disabled={Boolean(modeTransition)}
          onClick={() => startModeTransition(viewMode === "viewer" ? "recruiter" : "viewer")}
          aria-label={`Switch to ${viewMode === "viewer" ? "recruiter" : "viewer"} mode`}
        >
          <ShieldCheck size={18} />
          <span>{viewMode === "viewer" ? "Recruiter" : "Viewer"}</span>
        </button>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="status-strip">
            <span className={`api-dot api-dot--${apiState}`} aria-hidden="true" />
            <span>{apiState === "live" ? "Java API online" : apiState === "fallback" ? "Fallback intel loaded" : "Syncing profile"}</span>
          </div>
          <p className="eyebrow core-badge">Secure intel core online</p>
          <h1 id="hero-title">{profile.name}</h1>
          <p className="hero-title">{profile.title}</p>
          <p className="hero-tagline">{profile.tagline}</p>
          <div className="contact-grid" aria-label="Contact details">
            <span>
              <MapPin size={16} />
              {profile.location}
            </span>
            <a href={`mailto:${profile.email}`}>
              <Mail size={16} />
              {profile.email}
            </a>
            <a href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}>
              <Phone size={16} />
              {profile.phone}
            </a>
          </div>
          <div className="hero-actions" aria-label="Profile links">
            {safeLinks.map((link) => {
              const ProfileLinkIcon = getProfileLinkIcon(link.label);
              return (
                <a className="primary-link" href={link.url} key={link.url} rel="noreferrer noopener" target="_blank">
                  <ProfileLinkIcon size={18} />
                  <span>{link.label}</span>
                  <ArrowUpRight size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {viewMode === "viewer" && (
        <aside className="scanner-panel shell-panel interactive-card" data-interactive="true" aria-label="Profile shell snapshot">
          <div className="scanner-line" aria-hidden="true" />
          <div className="signal-heading">
            <Radar size={20} />
            <span>SECURE_SHELL v2.7 // LIVE</span>
          </div>
          <figure className="profile-frame">
            <img src="/images/master-demon-profile.jpeg" alt="Master_Demon cyberpunk profile artwork" />
            <figcaption>Master_Demon // Purple Team Node</figcaption>
          </figure>
          <dl className="signal-list">
            <div>
              <dt>Status</dt>
              <dd>{profile.availability}</dd>
            </div>
            <div>
              <dt>Education</dt>
              <dd>{profile.education[0]?.specialization}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{profile.bulletin.updated}</dd>
            </div>
          </dl>
        </aside>
        )}
      </section>

      {viewMode === "recruiter" && (
        <section className="recruiter-band" id="recruiter-brief" aria-labelledby="recruiter-title">
          <div className="section-heading">
            <BriefcaseBusiness size={24} />
            <div>
              <p className="eyebrow">Recruiter brief</p>
              <h2 id="recruiter-title">Direct Profile View</h2>
            </div>
          </div>

          <div className="recruiter-layout">
            <article className="panel recruiter-summary">
              <h3>Summary</h3>
              {profile.summary.map((item) => (
                <p key={item}>{item}</p>
              ))}
              <div className="recruiter-actions">
                <a href={resumeArtifact.href} download={resumeArtifact.fileName}>
                  <Download size={18} />
                  Download Resume
                </a>
                <a href={`mailto:${profile.email}`}>
                  <Mail size={18} />
                  Email
                </a>
              </div>
            </article>

            <article className="panel recruiter-snapshot">
              <h3>Snapshot</h3>
              <dl className="recruiter-facts">
                <div>
                  <dt>Location</dt>
                  <dd>{profile.location}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{profile.availability}</dd>
                </div>
                <div>
                  <dt>Education</dt>
                  <dd>{profile.education[0]?.degree} / {profile.education[0]?.specialization}</dd>
                </div>
                <div>
                  <dt>Profiles</dt>
                  <dd>{safeLinks.map((link) => link.label).join(" / ")}</dd>
                </div>
              </dl>
            </article>

            <article className="panel span-2" id="recruiter-skills">
              <h3>Core Skills</h3>
              <div className="recruiter-skill-grid">
                {profile.skills.map((skill) => (
                  <span key={skill.name}>
                    <strong>{skill.name}</strong>
                    {skill.level}
                  </span>
                ))}
              </div>
            </article>

            <article className="panel span-2" id="recruiter-experience">
              <h3>Experience</h3>
              <div className="recruiter-list">
                {profile.experience.map((item) => (
                  <section key={`${item.organization}-${item.period}`}>
                    <p className="timeline-meta">{item.period} / {item.location}</p>
                    <h4>{item.role} / {item.organization}</h4>
                    <ul className="mini-list">
                      {item.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </article>

            <article className="panel span-2" id="recruiter-projects">
              <h3>Projects</h3>
              <div className="recruiter-list">
                {profile.projects.map((project) => (
                  <section key={project.name}>
                    <p className="timeline-meta">{project.period}</p>
                    <h4>{project.name}</h4>
                    <p>{project.description}</p>
                    <div className="chip-row" aria-label={`${project.name} stack`}>
                      {project.stack.map((tech) => (
                        <span className="chip" key={tech}>
                          {tech}
                        </span>
                      ))}
                    </div>
                    <ul className="mini-list">
                      {project.securityHighlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </article>

            <article className="panel">
              <h3>Achievements</h3>
              <div className="recruiter-list recruiter-list--compact">
                {profile.achievements.map((achievement) => (
                  <section key={achievement.name}>
                    <h4>{achievement.name}</h4>
                    <p>{achievement.issuer}</p>
                    <span>{achievement.detail}</span>
                  </section>
                ))}
              </div>
            </article>

            <article className="panel">
              <h3>Certifications</h3>
              <div className="recruiter-list recruiter-list--compact">
                {profile.certifications.map((certification) => (
                  <section key={`${certification.name}-${certification.issuer}`}>
                    <h4>{certification.name}</h4>
                    <p>{certification.issuer} / {certification.date}</p>
                  </section>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {viewMode === "viewer" && (
      <section className="mission-band" id="mission-map" aria-labelledby="mission-title">
        <div className="section-heading">
          <Network size={24} />
          <div>
            <p className="eyebrow">Mission map</p>
            <h2 id="mission-title">Choose Your Route</h2>
          </div>
        </div>
        <div className="mission-map" aria-label="Portfolio mission nodes">
          {missionNodes.map((node, index) => {
            const MissionIcon = node.icon;
            return (
              <a
                className="mission-node interactive-card"
                data-interactive="true"
                href={node.href}
                key={node.label}
                onClick={() => {
                  if (node.tab) {
                    setActiveTab(node.tab);
                  }
                }}
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className="mission-node__index">0{index + 1}</span>
                <MissionIcon size={22} />
                <strong>{node.label}</strong>
                <small>{node.level}</small>
                <p>{node.signal}</p>
              </a>
            );
          })}
        </div>
      </section>
      )}

      {viewMode === "viewer" && (
      <section className="badge-band" aria-labelledby="badge-title">
        <div className="section-heading">
          <ShieldCheck size={24} />
          <div>
            <p className="eyebrow">Earned controls</p>
            <h2 id="badge-title">Security Badges</h2>
          </div>
        </div>
        <div className="security-badge-grid" aria-label="Implemented security controls">
          {securityBadges.map((badge) => {
            const BadgeIcon = badge.icon;
            return (
              <article className="security-badge interactive-card" data-interactive="true" key={badge.label}>
                <BadgeIcon size={20} />
                <span>{badge.status}</span>
                <h3>{badge.label}</h3>
                <p>{badge.detail}</p>
              </article>
            );
          })}
        </div>
      </section>
      )}

      {viewMode === "viewer" && (
      <section className="resume-band" id="resume-vault" aria-labelledby="resume-title">
        <div className="section-heading">
          <FileText size={24} />
          <div>
            <p className="eyebrow">Verified artifact</p>
            <h2 id="resume-title">Resume Vault</h2>
          </div>
        </div>
        <article className="resume-vault interactive-card" data-interactive="true">
          <div>
            <span className="resume-kicker">Downloadable profile</span>
            <h3>{resumeArtifact.fileName}</h3>
            <p>Verify the file after download with the SHA-256 digest below.</p>
          </div>
          <code>{resumeArtifact.hash}</code>
          <div className="resume-actions">
            <a href={resumeArtifact.href} download={resumeArtifact.fileName}>
              <Download size={18} />
              Download
            </a>
            <span>Updated {resumeArtifact.updated}</span>
          </div>
        </article>
      </section>
      )}

      {viewMode === "viewer" && (
      <section className="cli-band" id="cli" aria-labelledby="cli-title">
        <div className="section-heading">
          <Terminal size={24} />
          <div>
            <p className="eyebrow">Interactive recon shell</p>
            <h2 id="cli-title">Portfolio CLI</h2>
          </div>
        </div>
        <article className="terminal-panel interactive-card" data-interactive="true" aria-label="Interactive portfolio command line">
          <div className="terminal-chrome" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="terminal-output" ref={terminalOutputRef}>
            {terminalLines.map((line) => (
              <pre className={`terminal-line terminal-line--${line.kind}`} key={line.id}>
                {line.text}
              </pre>
            ))}
          </div>
          <form className="terminal-form" onSubmit={submitTerminalCommand}>
            <label htmlFor="terminal-command">visitor@sanskar.dev:~$</label>
            <input
              autoComplete="off"
              id="terminal-command"
              maxLength={80}
              onChange={(event) => setTerminalInput(event.target.value)}
              onKeyDown={handleTerminalKeyDown}
              placeholder="awaiting input"
              spellCheck={false}
              value={terminalInput}
            />
            <button type="submit">Run</button>
          </form>
        </article>
      </section>
      )}

      {viewMode === "viewer" && (
      <section className="content-band" id="intel">
        <div className="section-heading">
          <Cpu size={24} />
          <div>
            <p className="eyebrow">Compiled resume intelligence</p>
            <h2>{profile.bulletin.headline}</h2>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Portfolio sections">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              className="tab-button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "intel" && (
          <div className="intel-layout" role="tabpanel">
            <article className="panel span-2 interactive-card" data-interactive="true">
              <h3>Operator Summary</h3>
              {profile.summary.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </article>
            <article className="panel interactive-card" data-interactive="true">
              <h3>Bulletin Feed</h3>
              <ul className="check-list bulletin-feed">
                {bulletinFeedItems.map((item) => (
                  <li key={item}>
                    <ShieldCheck size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="panel interactive-card" data-interactive="true">
              <h3>Education</h3>
              {profile.education.map((education) => (
                <div className="education-block" key={education.institution}>
                  <GraduationCap size={22} />
                  <div>
                    <h4>{education.institution}</h4>
                    <p>{education.degree}</p>
                    <p>{education.specialization}</p>
                    <span>
                      {education.period} / {education.location} / {education.score}
                    </span>
                  </div>
                </div>
              ))}
            </article>
          </div>
        )}

        {activeTab === "experience" && (
          <div className="timeline" role="tabpanel">
            {profile.experience.map((item) => (
              <article className="timeline-card interactive-card" data-interactive="true" key={`${item.organization}-${item.period}`}>
                <div className="timeline-icon">
                  <BriefcaseBusiness size={20} />
                </div>
                <div>
                  <p className="timeline-meta">
                    {item.period} / {item.location}
                  </p>
                  <h3>{item.role}</h3>
                  <h4>{item.organization}</h4>
                  <ul className="mini-list">
                    {item.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="project-grid" id="projects" role="tabpanel">
            {profile.projects.map((project) => (
              <article className="project-card interactive-card" data-interactive="true" key={project.name}>
                <div className="card-kicker">
                  <BrainCircuit size={18} />
                  <span>{project.period}</span>
                </div>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <div className="chip-row" aria-label={`${project.name} stack`}>
                  {project.stack.map((tech) => (
                    <span className="chip" key={tech}>
                      {tech}
                    </span>
                  ))}
                </div>
                <ul className="mini-list">
                  {project.securityHighlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="skills-layout skills-layout--tree" id="skills" role="tabpanel">
            <article className="panel arsenal-domain-panel interactive-card" data-interactive="true">
              <h3>Primary Domains</h3>
              <div className="arsenal-domain-list" aria-label="Arsenal domains">
                {arsenalDomains.map((domain) => {
                  const DomainIcon = domain.icon;
                  return (
                    <button
                      aria-pressed={selectedArsenalDomain.id === domain.id}
                      className="arsenal-domain-button"
                      key={domain.id}
                      onClick={() => selectArsenalDomain(domain)}
                      type="button"
                    >
                      <DomainIcon size={18} />
                      <span>{domain.label}</span>
                      <strong>{domain.nodes.length} nodes</strong>
                    </button>
                  );
                })}
              </div>
            </article>
            <article className="panel arsenal-tree-panel interactive-card" data-interactive="true">
              <div className="arsenal-tree-header">
                <div>
                  <p className="eyebrow">Expandable skill tree</p>
                  <h3>{selectedArsenalDomain.label}</h3>
                </div>
                <span>{selectedArsenalDomain.nodes.length} active branches</span>
              </div>
              <p>{selectedArsenalDomain.summary}</p>
              <div className="arsenal-root">
                <div className="arsenal-root-node">
                  <SelectedArsenalIcon size={18} />
                  <span>{selectedArsenalDomain.label} Core</span>
                </div>
                <div className="arsenal-tree" role="tree" aria-label={`${selectedArsenalDomain.label} skill tree`}>
                  {selectedArsenalDomain.nodes.map((node) => {
                    const isExpanded = expandedArsenalNodes.has(node.id);
                    return (
                      <div className="arsenal-branch" key={node.id}>
                        <button
                          aria-expanded={isExpanded}
                          className="arsenal-node"
                          onClick={() => toggleArsenalNode(node.id)}
                          role="treeitem"
                          type="button"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span>{node.label}</span>
                          <strong>{node.level}</strong>
                        </button>
                        {isExpanded && (
                          <div className="arsenal-node-detail">
                            <p>{node.signal}</p>
                            <div className="arsenal-tool-row" aria-label={`${node.label} tools`}>
                              {node.tools.map((tool) => (
                                <span key={tool}>{tool}</span>
                              ))}
                            </div>
                            <ul className="arsenal-leaf-list">
                              {node.branches.map((branch) => (
                                <li key={branch}>
                                  <Sparkles size={14} />
                                  <span>{branch}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          </div>
        )}

        {activeTab === "certs" && (
          <div className="proof-layout" role="tabpanel">
            <article className="panel interactive-card" data-interactive="true">
              <h3>Achievements</h3>
              <div className="proof-stack">
                {profile.achievements.map((achievement) => (
                  <div className="proof-item interactive-card" data-interactive="true" key={achievement.name}>
                    <Trophy size={20} />
                    <div>
                      <h4>{achievement.name}</h4>
                      <p>{achievement.issuer}</p>
                      <span>{achievement.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel interactive-card" data-interactive="true">
              <h3>Certifications</h3>
              <div className="cert-grid">
                {profile.certifications.map((certification) => (
                  <div className="cert-card interactive-card" data-interactive="true" key={`${certification.name}-${certification.issuer}`}>
                    <Award size={18} />
                    <h4>{certification.name}</h4>
                    <p>{certification.issuer}</p>
                    <span>
                      <CalendarDays size={14} />
                      {certification.date}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}
      </section>
      )}

      {viewMode === "viewer" && (
      <section className="focus-band" aria-labelledby="focus-title">
        <div className="section-heading">
          <Terminal size={24} />
          <div>
            <p className="eyebrow">Operating modes</p>
            <h2 id="focus-title">Cybersecurity Focus</h2>
          </div>
        </div>
        <div className="focus-grid">
          {profile.focusAreas.map((area) => (
            <article className="focus-card interactive-card" data-interactive="true" key={area.name}>
              <Sparkles size={20} />
              <h3>{area.name}</h3>
              <p>{area.description}</p>
            </article>
          ))}
        </div>
      </section>
      )}

      <section className="contact-band" id="contact" aria-labelledby="contact-title">
        <div className="section-heading">
          <Mail size={24} />
          <div>
            <p className="eyebrow">Secure handoff</p>
            <h2 id="contact-title">Contact Me</h2>
          </div>
        </div>
        <div className="contact-layout">
          <article className="panel contact-panel interactive-card" data-interactive="true">
            <h3>Send Intel</h3>
            <p>
              Fill the form and your email client will open a prepared message to {profile.email}. No keys, tokens, or hidden services are stored in the browser.
            </p>
            <form className="contact-form" onSubmit={submitContactForm}>
              <label htmlFor="contact-name">Name</label>
              <input
                autoComplete="name"
                id="contact-name"
                maxLength={80}
                onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                required
                value={contactForm.name}
              />
              <label htmlFor="contact-email">Email</label>
              <input
                autoComplete="email"
                id="contact-email"
                maxLength={120}
                onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                required
                type="email"
                value={contactForm.email}
              />
              <label htmlFor="contact-subject">Subject</label>
              <input
                id="contact-subject"
                maxLength={120}
                onChange={(event) => setContactForm((current) => ({ ...current, subject: event.target.value }))}
                required
                value={contactForm.subject}
              />
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                maxLength={1200}
                onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))}
                required
                rows={6}
                value={contactForm.message}
              />
              <button type="submit">
                <Mail size={18} />
                Open Email Draft
              </button>
              {contactStatus && <p className="contact-status">{contactStatus}</p>}
            </form>
          </article>
          <aside className="contact-aside scanner-panel interactive-card" data-interactive="true">
            <div className="signal-heading">
              <ShieldCheck size={20} />
              <span>CONTACT_CHANNELS</span>
            </div>
            <dl className="signal-list">
              <div>
                <dt>Email</dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{profile.phone}</dd>
              </div>
              <div>
                <dt>Profiles</dt>
                <dd>{safeLinks.map((link) => link.label).join(" / ")}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;
