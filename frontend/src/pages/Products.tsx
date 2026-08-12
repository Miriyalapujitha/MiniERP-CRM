import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, Pencil, Package } from "lucide-react";

export default function Products() {
const [products, setProducts] = useState([]);
const [search, setSearch] = useState("");

const [form, setForm] = useState({
name: "",
sku: "",
category: "",
unitPrice: 0,
currentStock: 0,
minimumStock: 5,
warehouse: "Warehouse A",
});

const [editingId, setEditingId] = useState<number | null>(null);

const loadProducts = async () => {
const res = await axios.get(
"http://localhost:5000/products?limit=100"
);


const filtered = res.data.filter((p: any) =>
  p.name.toLowerCase().includes(search.toLowerCase())
);

setProducts(filtered);


};

useEffect(() => {
loadProducts();
}, [search]);

const saveProduct = async () => {
if (editingId) {
await axios.put(
`http://localhost:5000/products/${editingId}`,
form
);
} else {
await axios.post(
"http://localhost:5000/products",
form,
{
headers: {
Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
},
}
);
}

setEditingId(null);

setForm({
  name: "",
  sku: "",
  category: "",
  unitPrice: 0,
  currentStock: 0,
  minimumStock: 5,
  warehouse: "Warehouse A",
});

loadProducts();


};

const editProduct = (p: any) => {
setEditingId(p.id);
setForm({
  name: p.name,
  sku: p.sku,
  category: p.category,
  unitPrice: p.unitPrice,
  currentStock: p.currentStock,
  minimumStock: p.minimumStock,
  warehouse: p.warehouse,
});
};

return ( <div className="space-y-6">
{/* Header */} <div className="flex items-center justify-between"> <div> <h1 className="text-3xl font-bold text-slate-800">
Product Inventory </h1> <p className="text-slate-500">
Manage products, stock, and warehouse inventory </p> </div>

    <button
      onClick={() => {
        setEditingId(null);
        setForm({
          name: "",
          sku: "",
          category: "",
          unitPrice: 0,
          currentStock: 0,
          minimumStock: 5,
          warehouse: "Warehouse A",
        });
      }}
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
    <h2 className="mb-4 text-xl font-semibold text-slate-800">
      {editingId ? "Edit Product" : "Create Product"}
    </h2>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input
        className="rounded-xl border p-3"
        placeholder="Product Name"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <input
        className="rounded-xl border p-3"
        placeholder="SKU / Code"
        value={form.sku}
        onChange={(e) =>
          setForm({ ...form, sku: e.target.value })
        }
      />

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

      <input
        className="rounded-xl border p-3"
        type="number"
        placeholder="Unit Price"
        value={form.unitPrice}
        onChange={(e) =>
          setForm({
            ...form,
            unitPrice: Number(e.target.value),
          })
        }
      />

      <input
        className="rounded-xl border p-3"
        type="number"
        placeholder="Current Stock"
        value={form.currentStock}
        onChange={(e) =>
          setForm({
            ...form,
            currentStock: Number(e.target.value),
          })
        }
      />

      <input
        className="rounded-xl border p-3"
        type="number"
        placeholder="Minimum Stock Alert"
        value={form.minimumStock}
        onChange={(e) =>
          setForm({
            ...form,
            minimumStock: Number(e.target.value),
          })
        }
      />

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
        <option>Warehouse A</option>
        <option>Warehouse B</option>
        <option>Warehouse C</option>
      </select>
    </div>

    <button
      onClick={saveProduct}
      className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
    >
      {editingId ? "Update Product" : "Save Product"}
    </button>
  </div>

  {/* Product Table */}
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table className="min-w-full text-left">
      <thead className="bg-slate-50 text-sm font-semibold text-slate-600">
        <tr>
          <th className="p-4">Product</th>
          <th className="p-4">SKU</th>
          <th className="p-4">Category</th>
          <th className="p-4">Price</th>
          <th className="p-4">Stock</th>
          <th className="p-4">Warehouse</th>
          <th className="p-4">Actions</th>
        </tr>
      </thead>

      <tbody>
        {products.map((p: any) => (
          <tr
            key={p.id}
            className="border-t border-slate-100 hover:bg-slate-50"
          >
            <td className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                  <Package size={18} />
                </div>

                <div>
                  <p className="font-semibold text-slate-800">
                    {p.name}
                  </p>
                </div>
              </div>
            </td>

            <td className="p-4 font-mono text-sm">
              {p.sku}
            </td>

            <td className="p-4">{p.category}</td>

            <td className="p-4 font-semibold text-slate-800">
              ₹{p.unitPrice}
            </td>

            <td className="p-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  p.currentStock <= p.minimumStock
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {p.currentStock}
              </span>
            </td>

            <td className="p-4">{p.warehouse}</td>

            <td className="p-4">
              <button
                onClick={() => editProduct(p)}
                className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
              >
                <Pencil size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
);
}
