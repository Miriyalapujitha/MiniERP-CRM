import { Router } from "express";
import { ChallanStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import prisma from "../prisma";
import { allowRoles, AuthRequest, verifyToken } from "../middleware/auth";

const router = Router();

type ProductLine = {
  productId: number;
  quantity: number;
};

// ================= GET ALL CHALLANS =================
router.get("/", verifyToken, async (req, res) => {
  try {
    const challans = await prisma.challan.findMany({
      include: {
        customer: true,
        user: true,
        items: true,
      },
    });

    res.json(challans);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch challans",
    });
  }
});

// ================= CREATE CHALLAN =================
router.post("/", verifyToken, allowRoles("ADMIN", "SALES", "ACCOUNTS"), async (req: AuthRequest, res) => {
  try {
    const { customerId, products, status = ChallanStatus.DRAFT } = req.body;
    const userId = req.user!.id;

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({ error: "A valid customerId is required" });
    }

    if (!Object.values(ChallanStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid challan status" });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products are required" });
    }

    // Combine duplicate product lines before checking stock or creating items.
    const quantitiesByProduct = new Map<number, number>();
    for (const item of products as ProductLine[]) {
      if (!Number.isInteger(item?.productId) || !Number.isInteger(item?.quantity)) {
        return res.status(400).json({ error: "Product ID and quantity must be integers" });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than 0" });
      }

      quantitiesByProduct.set(
        item.productId,
        (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity
      );
    }

    const productLines = Array.from(quantitiesByProduct, ([productId, quantity]) => ({
      productId,
      quantity,
    }));
    const totalQuantity = productLines.reduce((total, item) => total + item.quantity, 0);
    const challanNumber = `CH-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const challan = await prisma.$transaction(async (tx) => {
      const [customer, user, foundProducts] = await Promise.all([
        tx.customer.findUnique({ where: { id: customerId } }),
        tx.user.findUnique({ where: { id: userId } }),
        tx.product.findMany({ where: { id: { in: productLines.map((item) => item.productId) } } }),
      ]);

      if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
      if (!user) throw new Error("USER_NOT_FOUND");

      const productById = new Map(foundProducts.map((product) => [product.id, product]));
      for (const item of productLines) {
        const product = productById.get(item.productId);
        if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
        if (status === ChallanStatus.CONFIRMED && product.currentStock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }
      }

      if (status === ChallanStatus.CONFIRMED) {
        for (const item of productLines) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, currentStock: { gte: item.quantity } },
            data: { currentStock: { decrement: item.quantity } },
          });

          if (updated.count !== 1) throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const createdChallan = await tx.challan.create({
        data: {
          challanNumber,
          totalQuantity,
          status,
          customerId,
          userId,
          items: {
            create: productLines.map((item) => {
              const product = productById.get(item.productId)!;
              return {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                productPrice: product.unitPrice,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true, customer: true, user: true },
      });

      if (status === ChallanStatus.CONFIRMED) {
        await tx.stockMovement.createMany({
          data: productLines.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            type: "OUT",
            reason: `Sales Challan ${createdChallan.challanNumber}`,
            createdBy: "SYSTEM",
          })),
        });
      }

      return createdChallan;
    });

    res.status(201).json(challan);
  } catch (error) {
    console.error("Create challan error:", error);

    const message = error instanceof Error ? error.message : "";
    if (message === "CUSTOMER_NOT_FOUND") {
      return res.status(404).json({ error: "Customer not found" });
    }
    if (message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    if (message.startsWith("PRODUCT_NOT_FOUND:")) {
      return res.status(404).json({ error: `Product ${message.split(":")[1]} not found` });
    }
    if (message.startsWith("INSUFFICIENT_STOCK")) {
      return res.status(400).json({ error: "Insufficient stock for one or more products" });
    }

    res.status(500).json({
      error: "Failed to create challan",
    });
  }
});

export default router;
