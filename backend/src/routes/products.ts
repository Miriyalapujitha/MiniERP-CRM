import { Router } from "express";
import prisma from "../prisma";
import { verifyToken, allowRoles } from "../middleware/auth";

const router = Router();

// ================= GET ALL PRODUCTS =================
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      skip,
      take: limit,
    });

    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});

// ================= GET SINGLE PRODUCT =================
router.get("/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      error: "Failed to fetch product",
    });
  }
});

// ================= CREATE PRODUCT =================
// Admin and Warehouse only
router.post(
  "/",
  verifyToken,
  allowRoles("ADMIN", "WAREHOUSE"),
  async (req, res) => {
    try {
      const product = await prisma.product.create({
        data: req.body,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);

      res.status(500).json({
        error: "Failed to create product",
      });
    }
  }
);

// ================= UPDATE PRODUCT =================
router.put(
  "/:id",
  verifyToken,
  allowRoles("ADMIN", "WAREHOUSE"),
  async (req, res) => {
    try {
      const productId = Number(req.params.id);

      const existingProduct = await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({
          error: "Product not found",
        });
      }

      const product = await prisma.product.update({
        where: {
          id: productId,
        },
        data: req.body,
      });

      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);

      res.status(500).json({
        error: "Failed to update product",
      });
    }
  }
);

// ================= STOCK MOVEMENT =================
// IN / OUT
router.post(
  "/movement",
  verifyToken,
  allowRoles("ADMIN", "WAREHOUSE"),
  async (req, res) => {
    try {
      const {
        productId,
        quantity,
        type,
        reason,
        createdBy,
      } = req.body;

      // Validate type
      if (type !== "IN" && type !== "OUT") {
        return res.status(400).json({
          error: "Stock movement type must be IN or OUT",
        });
      }

      // Validate quantity
      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          error: "Quantity must be greater than 0",
        });
      }

      // Find product
      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        return res.status(404).json({
          error: "Product not found",
        });
      }

      // Calculate new stock
      const newStock =
        type === "IN"
          ? product.currentStock + quantity
          : product.currentStock - quantity;

      // Prevent negative stock
      if (newStock < 0) {
        return res.status(400).json({
          error: "Insufficient stock",
        });
      }

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId,
          quantity,
          type,
          reason,
          createdBy: createdBy || "SYSTEM",
        },
      });

      // Update product stock
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          currentStock: newStock,
        },
      });

      res.json({
        message: "Stock updated successfully",
        newStock,
      });
    } catch (error) {
      console.error("Stock movement error:", error);

      res.status(500).json({
        error: "Failed to update stock",
      });
    }
  }
);

export default router;