const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body); // 🔥 DEBUG

    const { email, password } = req.body;

   const user = await User.findOne({ email });

   console.log("FOUND USER:", user);

   if (!user) {
     return res.status(401).json({ message: "User not found" });
   }

   if (user.password !== password) {
     return res.status(401).json({ message: "Wrong password" });
   }

    console.log("USER FOUND:", user); // 🔥 DEBUG

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;