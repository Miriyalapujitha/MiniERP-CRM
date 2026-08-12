import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import prisma from "../prisma";
import { allowRoles, verifyToken } from "../middleware/auth";

const router = Router();

// ================= REGISTER =================
router.post("/register", verifyToken, allowRoles("ADMIN"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({ error: "A valid role is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashed,
        role,
      },
    });

    // Remove password from response
    const { password: _, ...safeUser } = user;

    return res.status(201).json({
      message: "Registration successful",
      user: safeUser,
    });
  } catch (err) {
    console.error("Registration error:", err);

    return res.status(400).json({
      error: "Registration failed",
    });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log("Login attempt:", normalizedEmail);

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      console.log("User not found:", normalizedEmail);

      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Compare password
    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      console.log("Incorrect password:", normalizedEmail);

      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    // Remove password from response
    const { password: _, ...safeUser } = user;

    console.log("Login successful:", normalizedEmail);

    return res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      error: "Login failed",
    });
  }
});

export default router;
