import { useEffect, useState } from "react";
import api from "../api";
import { Plus, Trash2, Receipt } from "lucide-react";

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  currentStock: number;
  unitPrice: number;
}

interface Challan {
  id: number;
  challanNumber: string;
  totalQuantity: number;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
  };
}

interface ChallanItem {
  productId: string;
  quantity: number;
}

export default function Challans() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("DRAFT");

  const [items, setItems] = useState<ChallanItem[]>([
    {
      productId: "",
      quantity: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // ================= LOAD DATA =================
  const loadData = async () => {
    try {
      setLoading(true);

      console.log("Loading challan data...");
      const [customersResponse, productsResponse, challansResponse] =
        await Promise.all([
          api.get("/customers"),
          api.get("/products?limit=100"),
          api.get("/challans"),
        ]);

      console.log("Customers:", customersResponse.data);
      console.log("Products:", productsResponse.data);
      console.log("Challans:", challansResponse.data);

      setCustomers(customersResponse.data);
      setProducts(productsResponse.data);
      setChallans(challansResponse.data);
    } catch (error: any) {
      console.error("Failed to load challan data");
      console.error(error);
      console.error("Response:", error?.response);
      console.error("Response data:", error?.response?.data);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.data?.details ||
        error?.message ||
        "Failed to load challan data";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= ADD PRODUCT ROW =================
  const addRow = () => {
    setItems([
      ...items,
      {
        productId: "",
        quantity: 1,
      },
    ]);
  };

  // ================= REMOVE PRODUCT ROW =================
  const removeRow = (index: number) => {
    if (items.length === 1) {
      setItems([
        {
          productId: "",
          quantity: 1,
        },
      ]);

      return;
    }

    setItems(items.filter((_, i) => i !== index));
  };

  // ================= UPDATE ITEM =================
  const updateItem = (
    index: number,
    field: keyof ChallanItem,
    value: string | number
  ) => {
    const copy = [...items];

    copy[index] = {
      ...copy[index],
      [field]: value,
    };

    setItems(copy);
  };

  // ================= TOTAL QUANTITY =================
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  // ================= CREATE CHALLAN =================
  const createChallan = async () => {
    try {
      // Validate customer
      if (!customerId) {
        alert("Please select a customer");
        return;
      }

      // Validate products
      const invalidItem = items.find(
        (item) =>
          !item.productId ||
          Number(item.productId) <= 0 ||
          Number(item.quantity) <= 0
      );

      if (invalidItem) {
        alert("Please select a product and enter a valid quantity");
        return;
      }

      // Check duplicate products
      const productIds = items.map((item) =>
        Number(item.productId)
      );

      const hasDuplicates =
        new Set(productIds).size !== productIds.length;

      if (hasDuplicates) {
        alert(
          "The same product cannot be added twice. Please combine the quantities."
        );
        return;
      }

      // Check stock
      for (const item of items) {
        const product = products.find(
          (p) => p.id === Number(item.productId)
        );

        if (!product) {
          alert("Selected product was not found");
          return;
        }

        if (Number(item.quantity) > product.currentStock) {
          alert(
            `${product.name} has only ${product.currentStock} in stock.`
          );
          return;
        }
      }

      setCreating(true);

      const payload = {
        customerId: Number(customerId),

        status: status.toUpperCase(),

        products: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      };

      console.log("================================");
      console.log("Creating challan");
      console.log("Payload:", payload);
      console.log("================================");

      const response = await api.post("/challans", payload);

      console.log("Challan created:", response.data);

      alert("Challan created successfully!");

      // Reset form
      setCustomerId("");
      setStatus("DRAFT");
      setItems([
        {
          productId: "",
          quantity: 1,
        },
      ]);

      // Reload data
      await loadData();
    } catch (error: any) {
      console.error("================================");
      console.error("FAILED TO CREATE CHALLAN");
      console.error("Error:", error);
      console.error("Message:", error?.message);
      console.error("Status:", error?.response?.status);
      console.error("Response:", error?.response);
      console.error("Response data:", error?.response?.data);
      console.error("================================");

      const responseData = error?.response?.data;

      const message =
        responseData?.error ||
        responseData?.message ||
        responseData?.details ||
        error?.message ||
        "Failed to create challan";

      alert(`Failed to create challan:\n\n${message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Sales Challans
          </h1>

          <p className="text-slate-500">
            Create draft or confirmed challans with stock tracking
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Quantity
          </p>

          <p className="text-2xl font-bold text-blue-700">
            {totalQuantity}
          </p>
        </div>
      </div>

      {/* ================= CREATE CHALLAN ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Customer */}
          <select
            className="rounded-xl border p-3"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={creating}
          >
            <option value="">Select Customer</option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            className="rounded-xl border p-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={creating}
          >
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* ================= PRODUCTS ================= */}
        <div className="mt-6 space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 items-center gap-3"
            >
              {/* Product */}
              <select
                className="col-span-7 rounded-xl border p-3"
                value={item.productId}
                onChange={(e) =>
                  updateItem(
                    index,
                    "productId",
                    e.target.value
                  )
                }
                disabled={creating}
              >
                <option value="">
                  Select Product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} ({product.currentStock})
                  </option>
                ))}
              </select>

              {/* Quantity */}
              <input
                className="col-span-3 rounded-xl border p-3"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(
                    index,
                    "quantity",
                    Number(e.target.value)
                  )
                }
                disabled={creating}
              />

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={creating}
                className="col-span-2 rounded-xl bg-red-100 p-3 text-red-700 hover:bg-red-200 disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* ================= BUTTONS ================= */}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={addRow}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-3 hover:bg-slate-300 disabled:opacity-50"
          >
            <Plus size={18} />
            Add Product
          </button>

          <button
            type="button"
            onClick={createChallan}
            disabled={creating}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating
              ? "Creating..."
              : "Create Challan"}
          </button>
        </div>
      </div>

      {/* ================= RECENT CHALLANS ================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-semibold text-slate-800">
            Recent Challans
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading challans...
          </div>
        ) : challans.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No challans found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-sm font-semibold text-slate-600">
                <tr>
                  <th className="p-4">
                    Challan No
                  </th>

                  <th className="p-4">
                    Customer
                  </th>

                  <th className="p-4">
                    Qty
                  </th>

                  <th className="p-4">
                    Status
                  </th>

                  <th className="p-4">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {challans.map((challan) => (
                  <tr
                    key={challan.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    {/* Challan Number */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <Receipt size={16} />
                        {challan.challanNumber}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      {challan.customer?.name ||
                        "Unknown Customer"}
                    </td>

                    {/* Quantity */}
                    <td className="p-4">
                      {challan.totalQuantity}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          challan.status ===
                          "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-700"
                            : challan.status ===
                              "DRAFT"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {challan.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(
                        challan.createdAt
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
