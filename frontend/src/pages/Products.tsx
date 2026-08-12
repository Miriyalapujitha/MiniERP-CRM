import { useEffect, useState } from "react";
import api from "../api";
import { Search, Plus, Pencil, Package } from "lucide-react";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
}

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unitPrice: 0,
  currentStock: 0,
  minimumStock: 5,
  warehouse: "Warehouse A",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const res = await api.get("/products?limit=100");

      const productData: Product[] = res.data;

      const filtered = productData.filter((product) =>
        product.name
          .toLowerCase()
          .includes(search.toLowerCase())
      );

      setProducts(filtered);
    } catch (error) {
      console.error("Failed to load products:", error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  const saveProduct = async () => {
    try {
      if (!form.name.trim()) {
        alert("Product name is required");
        return;
      }

      if (!form.sku.trim()) {
        alert("SKU is required");
        return;
      }

      if (!form.category.trim()) {
        alert("Category is required");
        return;
      }

      if (editingId !== null) {
        await api.put(`/products/${editingId}`, form);

        alert("Product updated successfully");
      } else {
        await api.post("/products", form);

        alert("Product created successfully");
      }

      setEditingId(null);
      setForm(emptyForm);

      await loadProducts();
    } catch (error: any) {
      console.error("Failed to save product:", error);

      alert(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to save product"
      );
    }
  };

  const editProduct = (product: Product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      unitPrice: product.unitPrice || 0,
      currentStock: product.currentStock || 0,
      minimumStock: product.minimumStock || 5,
      warehouse: product.warehouse || "Warehouse A",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Product Inventory
          </h1>

          <p className="text-slate-500">
            Manage products, stock, and warehouse inventory
          </p>
        </div>

        <button
          onClick={resetForm}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-4 top-3.5 text-slate-400"
          size={18}
        />

        <input
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Search product by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {editingId !== null
              ? "Edit Product"
              : "Create Product"}
          </h2>

          {editingId !== null && (
            <button
              onClick={resetForm}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600 hover:bg-slate-200"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Product Name */}
          <input
            className="rounded-xl border p-3"
            placeholder="Product Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          {/* SKU */}
          <input
            className="rounded-xl border p-3"
            placeholder="SKU / Code"
            value={form.sku}
            onChange={(e) =>
              setForm({
                ...form,
                sku: e.target.value,
              })
            }
          />

          {/* Category */}
          <input
            className="rounded-xl border p-3"
            placeholder="Category"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
          />

          {/* Unit Price */}
          <input
            className="rounded-xl border p-3"
            type="number"
            min="0"
            placeholder="Unit Price"
            value={form.unitPrice}
            onChange={(e) =>
              setForm({
                ...form,
                unitPrice: Number(e.target.value),
              })
            }
          />

          {/* Current Stock */}
          <input
            className="rounded-xl border p-3"
            type="number"
            min="0"
            placeholder="Current Stock"
            value={form.currentStock}
            onChange={(e) =>
              setForm({
                ...form,
                currentStock: Number(e.target.value),
              })
            }
          />

          {/* Minimum Stock */}
          <input
            className="rounded-xl border p-3"
            type="number"
            min="0"
            placeholder="Minimum Stock Alert"
            value={form.minimumStock}
            onChange={(e) =>
              setForm({
                ...form,
                minimumStock: Number(e.target.value),
              })
            }
          />

          {/* Warehouse */}
          <select
            className="rounded-xl border p-3 md:col-span-2"
            value={form.warehouse}
            onChange={(e) =>
              setForm({
                ...form,
                warehouse: e.target.value,
              })
            }
          >
            <option value="Warehouse A">
              Warehouse A
            </option>

            <option value="Warehouse B">
              Warehouse B
            </option>

            <option value="Warehouse C">
              Warehouse C
            </option>
          </select>
        </div>

        <div className="mt-5 flex gap-3">

          <button
            onClick={saveProduct}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            {editingId !== null
              ? "Update Product"
              : "Save Product"}
          </button>

          {editingId !== null && (
            <button
              onClick={resetForm}
              className="rounded-xl bg-slate-100 px-6 py-3 text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
          )}

        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full text-left">

            <thead className="bg-slate-50 text-sm font-semibold text-slate-600">
              <tr>
                <th className="p-4">
                  Product
                </th>

                <th className="p-4">
                  SKU
                </th>

                <th className="p-4">
                  Category
                </th>

                <th className="p-4">
                  Price
                </th>

                <th className="p-4">
                  Stock
                </th>

                <th className="p-4">
                  Warehouse
                </th>

                <th className="p-4">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >

                    {/* Product */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                          <Package size={18} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {product.name}
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* SKU */}
                    <td className="p-4 font-mono text-sm">
                      {product.sku}
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      {product.category}
                    </td>

                    {/* Price */}
                    <td className="p-4 font-semibold text-slate-800">
                      ₹
                      {Number(
                        product.unitPrice
                      ).toFixed(2)}
                    </td>

                    {/* Stock */}
                    <td className="p-4">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          product.currentStock <=
                          product.minimumStock
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {product.currentStock}
                      </span>

                    </td>

                    {/* Warehouse */}
                    <td className="p-4">
                      {product.warehouse}
                    </td>

                    {/* Actions */}
                    <td className="p-4">

                      <button
                        onClick={() =>
                          editProduct(product)
                        }
                        className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                        title="Edit Product"
                      >
                        <Pencil size={16} />
                      </button>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}
