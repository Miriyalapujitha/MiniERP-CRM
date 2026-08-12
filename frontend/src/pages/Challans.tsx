import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Receipt } from "lucide-react";

export default function Challans() {
const [customers, setCustomers] = useState([]);
const [products, setProducts] = useState([]);
const [challans, setChallans] = useState([]);

const [customerId, setCustomerId] = useState("");
const [status, setStatus] = useState("DRAFT");

const [items, setItems] = useState([
{ productId: "", quantity: 1 },
]);

const loadData = async () => {
const [c, p, ch] = await Promise.all([
axios.get("http://localhost:5000/customers"),
axios.get("http://localhost:5000/products?limit=100"),
axios.get("http://localhost:5000/challans"),
]);

setCustomers(c.data);
setProducts(p.data);
setChallans(ch.data);

};

useEffect(() => {
loadData();
}, []);

const addRow = () => {
setItems([
...items,
{ productId: "", quantity: 1 },
]);
};

const removeRow = (index: number) => {
setItems(items.filter((_, i) => i !== index));
};

const updateItem = (
index: number,
field: string,
value: any
) => {
const copy = [...items];
copy[index] = { ...copy[index], [field]: value };
setItems(copy);
};

const totalQuantity = items.reduce(
(sum, item) => sum + Number(item.quantity || 0),
0
);

const createChallan = async () => {
try {
await axios.post("http://localhost:5000/challans", {
customerId: Number(customerId),
userId: 1,
status,
products: items.map((i) => ({
productId: Number(i.productId),
quantity: Number(i.quantity),
})),
});

  alert("Challan created successfully!");

  setCustomerId("");
  setStatus("DRAFT");
  setItems([{ productId: "", quantity: 1 }]);

  loadData();
} catch (err: any) {
  console.error(err.response?.data || err);
  alert(
    err.response?.data?.error ||
      "Failed to create challan"
  );
}

};

return ( <div className="space-y-6"> <div className="flex items-center justify-between"> <div> <h1 className="text-3xl font-bold text-slate-800">
Sales Challans </h1> <p className="text-slate-500">
Create draft or confirmed challans with stock tracking </p> </div>

    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-500">
        Total Quantity
      </p>
      <p className="text-2xl font-bold text-blue-700">
        {totalQuantity}
      </p>
    </div>
  </div>

  {/* Create challan card */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <select
        className="rounded-xl border p-3"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      >
        <option value="">Select Customer</option>
        {customers.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className="rounded-xl border p-3"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="DRAFT">Draft</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </div>

    <div className="mt-6 space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-12 gap-3 items-center"
        >
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
          >
            <option value="">Select Product</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.currentStock})
              </option>
            ))}
          </select>

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
          />

          <button
            onClick={() => removeRow(index)}
            className="col-span-2 rounded-xl bg-red-100 p-3 text-red-700 hover:bg-red-200"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>

    <div className="mt-4 flex gap-3">
      <button
        onClick={addRow}
        className="flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-3 hover:bg-slate-300"
      >
        <Plus size={18} />
        Add Product
      </button>

      <button
        onClick={createChallan}
        className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Create Challan
      </button>
    </div>
  </div>

  {/* Recent challans */}
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="border-b border-slate-200 p-5">
      <h2 className="text-xl font-semibold text-slate-800">
        Recent Challans
      </h2>
    </div>

    <table className="min-w-full text-left">
      <thead className="bg-slate-50 text-sm font-semibold text-slate-600">
        <tr>
          <th className="p-4">Challan No</th>
          <th className="p-4">Customer</th>
          <th className="p-4">Qty</th>
          <th className="p-4">Status</th>
          <th className="p-4">Date</th>
        </tr>
      </thead>

      <tbody>
        {challans.map((c: any) => (
          <tr
            key={c.id}
            className="border-t border-slate-100 hover:bg-slate-50"
          >
            <td className="p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Receipt size={16} />
                {c.challanNumber}
              </div>
            </td>

            <td className="p-4">
              {c.customer?.name}
            </td>

            <td className="p-4">
              {c.totalQuantity}
            </td>

            <td className="p-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  c.status === "CONFIRMED"
                    ? "bg-emerald-100 text-emerald-700"
                    : c.status === "DRAFT"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {c.status}
              </span>
            </td>

            <td className="p-4 text-sm text-slate-500">
              {new Date(c.createdAt).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

);
}
