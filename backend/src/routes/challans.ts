import { Router } from "express";
import prisma from "../prisma";

const router = Router();

// ================= GET ALL CHALLANS =================
router.get("/", async (req, res) => {
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
router.post("/", async (req, res) => {
  try {
    const { customerId, userId, products, status } = req.body;

    // Validate products
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: "Products are required",
      });
    }

    // Generate challan number
    const count = await prisma.challan.count();
    const challanNumber = `CH-${1001 + count}`;

    let totalQuantity = 0;

    // Validate products and stock
    for (const item of products) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        return res.status(404).json({
          error: `Product ${item.productId} not found`,
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          error: "Quantity must be greater than 0",
        });
      }

      if (
        status === "CONFIRMED" &&
        product.currentStock < item.quantity
      ) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}`,
        });
      }

      totalQuantity += item.quantity;
    }

    // Create challan
    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        totalQuantity,
        status,
        customerId,
        userId,

        items: {
          create: await Promise.all(
            products.map(async (item: any) => {
              const product = await prisma.product.findUnique({
                where: {
                  id: item.productId,
                },
              });

              return {
                productId: product!.id,
                productName: product!.name,
                productSku: product!.sku,
                productPrice: product!.unitPrice,
                quantity: item.quantity,
              };
            })
          ),
        },
      },

      include: {
        items: true,
        customer: true,
      },
    });

    // Update stock if challan is confirmed
    if (status === "CONFIRMED") {
      for (const item of products) {
        await prisma.product.update({
          where: {
            id: item.productId,
          },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        // Create stock movement
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: "OUT",
            reason: `Sales Challan ${challan.challanNumber}`,
            createdBy: "SYSTEM",
          },
        });
      }
    }

    res.status(201).json(challan);
  } catch (error) {
    console.error("Create challan error:", error);

    res.status(500).json({
      error: "Failed to create challan",
    });
  }
});

export default router;