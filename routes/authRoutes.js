const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

const router = express.Router();

const DEFAULT_PASSWORD = "123";
const OTP_TTL_MINUTES = 10;
const ALLOWED_USERS = [
  { email: "apai@mc.vjti.ac.in", name: "Prof. Archana Pai", role: "hod" },
  { email: "sajankar@mc.vjti.ac.in", name: "Prof. Sonali Ajankar", role: "exam_committee" },
  { email: "bzolage@mc.vjti.ac.in", name: "Dr. Bhakti Zolage", role: "Guide"},  
  { email: "bppawar_mc24@mc.vjti.ac.in", name: "Admin", role: "admin" },
  { email: "pawarbhupendra189@gmail.com", name: "Admin", role: "admin" }
];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isAllowedEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return ALLOWED_USERS.some((account) => account.email === normalizedEmail);
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

async function ensureAllowedUsers() {
  const defaultPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await Promise.all(ALLOWED_USERS.map(async (account) => {
    const existing = await User.findOne({ email: account.email });
    const passwordHash = account.password
      ? await bcrypt.hash(account.password, 10)
      : defaultPasswordHash;

    if (!existing) {
      await User.create({
        ...account,
        password: passwordHash,
        mustChangePassword: account.mustChangePassword ?? true,
      });
      return;
    }

    const updates = {
      name: account.name,
      role: account.role,
    };

    if (account.password) {
      updates.password = passwordHash;
      updates.mustChangePassword = account.mustChangePassword ?? false;
    }

    if (existing.mustChangePassword !== false || !existing.password || !existing.password.startsWith("$2")) {
      updates.password = updates.password || defaultPasswordHash;
      updates.mustChangePassword = updates.mustChangePassword ?? true;
    }

    await User.updateOne({ _id: existing._id }, { $set: updates });
  }));
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email, otp) {
  if (process.env.BREVO_API_KEY) {
    await sendOtpWithBrevo(email, otp);
    return;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.log(`Password change OTP for ${email}: ${otp}`);
    return;
  }

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch {
    console.log(`Install nodemailer to send email. Password change OTP for ${email}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: "VJTI MCA Portal password change OTP",
    text: `Your OTP for changing your VJTI MCA Portal password is ${otp}. It is valid for ${OTP_TTL_MINUTES} minutes.`,
  });
}

async function sendOtpWithBrevo(email, otp) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  const senderName = process.env.BREVO_SENDER_NAME || "VJTI MCA Portal";

  if (!senderEmail) {
    throw new Error("Set BREVO_SENDER_EMAIL to a verified Brevo sender email");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email }],
      subject: "VJTI MCA Portal password change OTP",
      textContent: `Your OTP for changing your VJTI MCA Portal password is ${otp}. It is valid for ${OTP_TTL_MINUTES} minutes.`,
      htmlContent: `
        <html>
          <body>
            <p>Your OTP for changing your VJTI MCA Portal password is:</p>
            <h2>${otp}</h2>
            <p>This OTP is valid for ${OTP_TTL_MINUTES} minutes.</p>
          </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo email failed (${response.status}): ${errorBody}`);
  }
}

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!isAllowedEmail(email)) {
      return res.status(401).json({ message: "This email is not authorized for login" });
    }

    await ensureAllowedUsers();

    const user = await User.findOne({ email });
    const passwordMatches = user && await bcrypt.compare(password, user.password || "");

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ user: publicUser(user) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/request-password-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!isAllowedEmail(email)) {
      return res.status(401).json({ message: "This email is not authorized" });
    }

    await ensureAllowedUsers();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
    user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    user.passwordResetOtpVerified = false;
    await user.save();

    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
      user.passwordResetOtpVerified = false;
      await user.save();
      console.log("OTP email failed:", mailErr);
      return res.status(502).json({ message: "Unable to send OTP email. Check Brevo API settings." });
    }

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to send OTP" });
  }
});

router.post("/verify-password-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "");
    const user = await User.findOne({ email });

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ message: "Please request an OTP first" });
    }

    if (user.passwordResetOtpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new OTP" });
    }

    const matches = await bcrypt.compare(otp, user.passwordResetOtpHash);
    if (!matches) return res.status(400).json({ message: "Invalid OTP" });

    user.passwordResetOtpVerified = true;
    await user.save();

    res.json({ message: "OTP verified" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to verify OTP" });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const newPassword = String(req.body.newPassword || "");
    const user = await User.findOne({ email });

    if (!user || !user.passwordResetOtpVerified || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ message: "Verify OTP before changing password" });
    }

    if (user.passwordResetOtpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new OTP" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpVerified = false;
    await user.save();

    res.json({ user: publicUser(user), message: "Password changed successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to change password" });
  }
});

module.exports = router;
