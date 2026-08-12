import { Router } from "express";
import prisma from "../prisma";
import { body, validationResult } from "express-validator";

const router = Router();

// ================= GET ALL CUSTOMERS =================
router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "");

    const customers = await prisma.customer.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    });

    res.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      error: "Failed to fetch customers",
    });
  }
});

// ================= GET CUSTOMER BY ID =================
router.get("/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    res.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      error: "Failed to fetch customer",
    });
  }
});

// ================= ADD FOLLOW-UP NOTE =================
router.post("/:id/followups", async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        error: "Follow-up note is required",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    const followUp = await prisma.followUp.create({
      data: {
        note,
        customerId,
      },
    });

    res.status(201).json(followUp);
  } catch (error) {
    console.error("Add follow-up error:", error);

    res.status(500).json({
      error: "Failed to add follow-up",
    });
  }
});

// ================= CREATE CUSTOMER =================
router.post(
  "/",
  body("name")
    .notEmpty()
    .withMessage("Customer name is required"),

  body("email")
    .isEmail()
    .withMessage("Valid email is required"),

  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const customer = await prisma.customer.create({
        data: req.body,
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error("Create customer error:", error);

      res.status(500).json({
        error: "Failed to create customer",
      });
    }
  }
);

// ================= UPDATE CUSTOMER =================
router.put("/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: req.body,
    });

    res.json(customer);
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      error: "Failed to update customer",
    });
  }
});

export default router;