const express = require("express");
const prisma = require("../lib/prisma");
const authRoutes = require("./authRoutes");
const exerciseRoutes = require("./exerciseRoutes");
const templateRoutes = require("./templateRoutes");
const blockTemplateRoutes = require("./blockTemplateRoutes");
const blockRunRoutes = require("./blockRunRoutes");
const sessionRoutes = require("./sessionRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const aiRoutes = require("./aiRoutes");
const coachRoutes = require("./coachRoutes");
const {
  buildProtectedResourceMetadata,
} = require("../ai/protectedResource");

const router = express.Router();

function getMcpResourceUrl() {
  return process.env.MCP_RESOURCE_URL || "http://localhost:3000/mcp";
}

function getAuthorizationServers() {
  const issuer = process.env.MCP_AUTHORIZATION_SERVER;
  if (!issuer || typeof issuer !== "string" || !issuer.trim()) {
    return [];
  }
  return [issuer.trim()];
}

function protectedResourceHandler(req, res) {
  const doc = buildProtectedResourceMetadata({
    resourceUrl: getMcpResourceUrl(),
    authorizationServers: getAuthorizationServers(),
  });
  res.status(200).type("application/json").json(doc);
}

router.get("/", (req, res) => {
  res.json({ message: "WorkoutDB API running" });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Warm-up ping (Nov 17): the boot loader calls this while the crown spins, so
// a cold prod wakes its database there instead of on the sign-in button.
// /auth/me with no session answers 401 without a query, which left Neon
// asleep until login. Public, one trivial query, no data out.
router.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.set("Cache-Control", "no-store");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

// RFC 9728 Protected Resource Metadata - public; both path forms (clients differ).
router.get("/.well-known/oauth-protected-resource", protectedResourceHandler);
router.get(
  "/.well-known/oauth-protected-resource/mcp",
  protectedResourceHandler
);

router.use("/auth", authRoutes);
router.use("/exercises", exerciseRoutes);
router.use("/templates", templateRoutes);
router.use("/block-templates", blockTemplateRoutes);
router.use("/block-runs", blockRunRoutes);
router.use("/sessions", sessionRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/ai", aiRoutes);
router.use("/coach", coachRoutes);

module.exports = router;