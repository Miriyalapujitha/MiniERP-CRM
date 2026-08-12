import { Router } from "express";
import prisma from "../prisma";
import { verifyToken, allowRoles, AuthRequest } from "../middleware/auth";

const router = Router();

function productInput(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const sku = String(body.sku ?? "").trim();
  const category = String(body.category ?? "").trim();
  const warehouse = String(body.warehouse ?? "").trim();
  const unitPrice = Number(body.unitPrice);
  const minimumStock = Number(body.minimumStock);

  if (!name || !sku || !category || !warehouse) {
    throw new Error("Product name, SKU, category and warehouse are required");
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error("Unit price must be a non-negative number");
  }
  if (!Number.isInteger(minimumStock) || minimumStock < 0) {
    throw new Error("Minimum stock must be a non-negative integer");
  }

  return { name, sku, category, warehouse, unitPrice, minimumStock };
}

// ================= GET ALL PRODUCTS =================
router.get("/", verifyToken, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ error: "page must be positive and limit must be between 1 and 100" });
    }

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
router.get("/:id", verifyToken, async (req, res) => {
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
  async (req: AuthRequest, res) => {
    try {
      const input = productInput(req.body);
      const currentStock = Number(req.body.currentStock);
      if (!Number.isInteger(currentStock) || currentStock < 0) {
        return res.status(400).json({ error: "Current stock must be a non-negative integer" });
      }

      const product = await prisma.product.create({
        data: { ...input, currentStock },
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

      const input = productInput(req.body);
      const product = await prisma.product.update({
        where: {
          id: productId,
        },
        // Stock can only change through the movement endpoint so it remains auditable.
        data: input,
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
  async (req: AuthRequest, res) => {
    try {
      const {
        productId,
        quantity,
        type,
        reason,
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

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || !String(reason ?? "").trim()) {
        return res.status(400).json({ error: "Product ID, integer quantity, and reason are required" });
      }

      const updatedProduct = await prisma.$transaction(async (tx) => {
        if (type === "OUT") {
          const result = await tx.product.updateMany({
            where: { id: productId, currentStock: { gte: quantity } },
            data: { currentStock: { decrement: quantity } },
          });
          if (result.count === 0) throw new Error("INSUFFICIENT_STOCK");
        } else {
          const result = await tx.product.updateMany({
            where: { id: productId },
            data: { currentStock: { increment: quantity } },
          });
          if (result.count === 0) throw new Error("PRODUCT_NOT_FOUND");
        }

        const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
        await tx.stockMovement.create({
          data: { productId, quantity, type, reason: String(reason).trim(), createdBy: String(req.user?.id ?? "SYSTEM") },
        });
        return product;
      });

      res.json({
        message: "Stock updated successfully",
        newStock: updatedProduct.currentStock,
      });
    } catch (error) {
      console.error("Stock movement error:", error);

      if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
        return res.status(404).json({ error: "Product not found" });
      }

      res.status(500).json({
        error: "Failed to update stock",
      });
    }
  }
);

export default router;
