import { Router } from "express";
import prisma from "../prisma";
import { body, validationResult } from "express-validator";
import { Prisma } from "@prisma/client";

const router = Router();

// ================= GET ALL CUSTOMERS =================
router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    const customers = await prisma.customer.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: {
        id: "desc",
      },
    });

    res.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      error: "Failed to fetch customers",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ================= GET CUSTOMER BY ID =================
router.get("/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (Number.isNaN(customerId)) {
      return res.status(400).json({
        error: "Invalid customer ID",
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

    res.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      error: "Failed to fetch customer",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ================= ADD FOLLOW-UP NOTE =================
router.post("/:id/followups", async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const note = String(req.body.note || "").trim();

    if (Number.isNaN(customerId)) {
      return res.status(400).json({
        error: "Invalid customer ID",
      });
    }

    if (!note) {
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
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ================= CREATE CUSTOMER =================
router.post(
  "/",
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),

  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        type,
        address,
        status,
        followUpDate,
        notes,
      } = req.body;

      // ================= NORMALIZE VALUES =================
      const customerName = String(name || "").trim();
      const customerMobile = String(mobile || "").trim();
      const customerEmail = String(email || "").trim();
      const customerBusinessName = String(businessName || "").trim();
      const customerGstNumber = String(gstNumber || "").trim();
      const customerAddress = String(address || "").trim();
      const customerNotes = String(notes || "").trim();

      // Convert:
      // Retail -> RETAIL
      // Wholesale -> WHOLESALE
      // Distributor -> DISTRIBUTOR
      const customerType = String(type || "RETAIL")
        .trim()
        .toUpperCase();

      // Convert:
      // Lead -> LEAD
      // Active -> ACTIVE
      // Inactive -> INACTIVE
      const customerStatus = String(status || "LEAD")
        .trim()
        .toUpperCase();

      // ================= VALIDATE ENUMS =================
      const validTypes = [
        "RETAIL",
        "WHOLESALE",
        "DISTRIBUTOR",
      ];

      const validStatuses = [
        "LEAD",
        "ACTIVE",
        "INACTIVE",
      ];

      if (!validTypes.includes(customerType)) {
        return res.status(400).json({
          error: `Invalid customer type: ${customerType}`,
        });
      }

      if (!validStatuses.includes(customerStatus)) {
        return res.status(400).json({
          error: `Invalid customer status: ${customerStatus}`,
        });
      }

      // ================= HANDLE FOLLOW-UP DATE =================
      let parsedFollowUpDate: Date | null = null;

      if (
        followUpDate !== undefined &&
        followUpDate !== null &&
        String(followUpDate).trim() !== ""
      ) {
        parsedFollowUpDate = new Date(String(followUpDate));

        if (Number.isNaN(parsedFollowUpDate.getTime())) {
          return res.status(400).json({
            error: "Invalid follow-up date",
          });
        }
      }

      // ================= CREATE CUSTOMER =================
      const customer = await prisma.customer.create({
        data: {
          name: customerName,

          // Prisma schema requires String,
          // so empty string is used if field is blank.
          mobile: customerMobile,

          email: customerEmail,

          businessName: customerBusinessName,

          gstNumber: customerGstNumber || null,

          type: customerType as Prisma.CustomerType,

          address: customerAddress,

          status: customerStatus as Prisma.CustomerStatus,

          followUpDate: parsedFollowUpDate,

          notes: customerNotes || null,
        },
      });

      console.log("Customer created successfully:", customer.id);

      return res.status(201).json(customer);
    } catch (error) {
      console.error("Create customer error:", error);

      return res.status(500).json({
        error: "Failed to create customer",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }
);

// ================= UPDATE CUSTOMER =================
router.put("/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (Number.isNaN(customerId)) {
      return res.status(400).json({
        error: "Invalid customer ID",
      });
    }

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

    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      type,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    // ================= NORMALIZE VALUES =================
    const customerName = String(name || "").trim();
    const customerMobile = String(mobile || "").trim();
    const customerEmail = String(email || "").trim();
    const customerBusinessName = String(
      businessName || ""
    ).trim();
    const customerGstNumber = String(
      gstNumber || ""
    ).trim();
    const customerAddress = String(address || "").trim();
    const customerNotes = String(notes || "").trim();

    const customerType = String(type || "RETAIL")
      .trim()
      .toUpperCase();

    const customerStatus = String(status || "LEAD")
      .trim()
      .toUpperCase();

    // ================= VALIDATE ENUMS =================
    const validTypes = [
      "RETAIL",
      "WHOLESALE",
      "DISTRIBUTOR",
    ];

    const validStatuses = [
      "LEAD",
      "ACTIVE",
      "INACTIVE",
    ];

    if (!validTypes.includes(customerType)) {
      return res.status(400).json({
        error: `Invalid customer type: ${customerType}`,
      });
    }

    if (!validStatuses.includes(customerStatus)) {
      return res.status(400).json({
        error: `Invalid customer status: ${customerStatus}`,
      });
    }

    // ================= HANDLE FOLLOW-UP DATE =================
    let parsedFollowUpDate: Date | null = null;

    if (
      followUpDate !== undefined &&
      followUpDate !== null &&
      String(followUpDate).trim() !== ""
    ) {
      parsedFollowUpDate = new Date(String(followUpDate));

      if (Number.isNaN(parsedFollowUpDate.getTime())) {
        return res.status(400).json({
          error: "Invalid follow-up date",
        });
      }
    }

    // ================= UPDATE CUSTOMER =================
    const customer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        name: customerName,
        mobile: customerMobile,
        email: customerEmail,
        businessName: customerBusinessName,
        gstNumber: customerGstNumber || null,

        type: customerType as Prisma.CustomerType,

        address: customerAddress,

        status: customerStatus as Prisma.CustomerStatus,

        followUpDate: parsedFollowUpDate,

        notes: customerNotes || null,
      },
    });

    return res.json(customer);
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      error: "Failed to update customer",
      details:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

// ================= EXPORT ROUTER =================
export default router;