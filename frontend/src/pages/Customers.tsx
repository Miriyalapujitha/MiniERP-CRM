import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, Eye, Pencil } from "lucide-react";

export default function Customers() {
const [customers, setCustomers] = useState([]);
const [search, setSearch] = useState("");

const [form, setForm] = useState({
name: "",
mobile: "",
email: "",
businessName: "",
gstNumber: "",
type: "RETAIL",
address: "",
status: "LEAD",
followUpDate: "",
notes: "",
});

const [editingId, setEditingId] = useState<number | null>(null);

const loadCustomers = async () => {
const res = await axios.get(
`http://localhost:5000/customers?search=${search}`
);
setCustomers(res.data);
};

useEffect(() => {
loadCustomers();
}, [search]);

const saveCustomer = async () => {
if (editingId) {
await axios.put(
`http://localhost:5000/customers/${editingId}`,
form
);
} else {
await axios.post("http://localhost:5000/customers", form);
}


setEditingId(null);
setForm({
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  type: "RETAIL",
  address: "",
  status: "LEAD",
  followUpDate: "",
  notes: "",
});

loadCustomers();


};

const editCustomer = (c: any) => {
setEditingId(c.id);

setForm({
  name: c.name,
  mobile: c.mobile,
  email: c.email,
  businessName: c.businessName,
  gstNumber: c.gstNumber || "",
  type: c.type,
  address: c.address,
  status: c.status,
  followUpDate: c.followUpDate
    ? c.followUpDate.substring(0, 10)
    : "",
  notes: c.notes || "",
});

};

const addFollowUp = async (id: number) => {
const note = prompt("Enter follow-up note");

if (!note) return;

await axios.post(
  `http://localhost:5000/customers/${id}/followups`,
  {
    note,
  }
);

alert("Follow-up added");

};

return ( <div className="space-y-6">
{/* Header */} <div className="flex items-center justify-between"> <div> <h1 className="text-3xl font-bold text-slate-800">
Customer CRM </h1> <p className="text-slate-500">
Manage leads, active customers, and follow-ups </p> </div>

    <button
      onClick={() => {
        setEditingId(null);
        setForm({
          name: "",
          mobile: "",
          email: "",
          businessName: "",
          gstNumber: "",
          type: "RETAIL",
          address: "",
          status: "LEAD",
          followUpDate: "",
          notes: "",
        });
      }}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
    >
      <Plus size={18} />
      Add Customer
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
      placeholder="Search customer by name..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  {/* Form */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-xl font-semibold text-slate-800">
      {editingId ? "Edit Customer" : "Create Customer"}
    </h2>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input
        className="rounded-xl border p-3"
        placeholder="Customer Name"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <input
        className="rounded-xl border p-3"
        placeholder="Mobile"
        value={form.mobile}
        onChange={(e) =>
          setForm({ ...form, mobile: e.target.value })
        }
      />

      <input
        className="rounded-xl border p-3"
        placeholder="Email"
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />

      <input
        className="rounded-xl border p-3"
        placeholder="Business Name"
        value={form.businessName}
        onChange={(e) =>
          setForm({
            ...form,
            businessName: e.target.value,
          })
        }
      />

      <input
        className="rounded-xl border p-3"
        placeholder="GST Number"
        value={form.gstNumber}
        onChange={(e) =>
          setForm({ ...form, gstNumber: e.target.value })
        }
      />

      <select
        className="rounded-xl border p-3"
        value={form.type}
        onChange={(e) =>
          setForm({ ...form, type: e.target.value })
        }
      >
        <option value="RETAIL">Retail</option>
        <option value="WHOLESALE">Wholesale</option>
        <option value="DISTRIBUTOR">Distributor</option>
      </select>

      <input
        className="rounded-xl border p-3 md:col-span-2"
        placeholder="Address"
        value={form.address}
        onChange={(e) =>
          setForm({ ...form, address: e.target.value })
        }
      />

      <select
        className="rounded-xl border p-3"
        value={form.status}
        onChange={(e) =>
          setForm({ ...form, status: e.target.value })
        }
      >
        <option value="LEAD">Lead</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      <input
        className="rounded-xl border p-3"
        type="date"
        value={form.followUpDate}
        onChange={(e) =>
          setForm({
            ...form,
            followUpDate: e.target.value,
          })
        }
      />

      <textarea
        className="rounded-xl border p-3 md:col-span-2"
        placeholder="Notes"
        value={form.notes}
        onChange={(e) =>
          setForm({ ...form, notes: e.target.value })
        }
      />
    </div>

    <button
      onClick={saveCustomer}
      className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
    >
      {editingId ? "Update Customer" : "Save Customer"}
    </button>
  </div>

  {/* Table */}
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table className="min-w-full text-left">
      <thead className="bg-slate-50 text-sm font-semibold text-slate-600">
        <tr>
          <th className="p-4">Customer</th>
          <th className="p-4">Business</th>
          <th className="p-4">Status</th>
          <th className="p-4">Type</th>
          <th className="p-4">Follow-up</th>
          <th className="p-4">Actions</th>
        </tr>
      </thead>

      <tbody>
        {customers.map((c: any) => (
          <tr
            key={c.id}
            className="border-t border-slate-100 hover:bg-slate-50"
          >
            <td className="p-4">
              <div>
                <p className="font-semibold text-slate-800">
                  {c.name}
                </p>
                <p className="text-sm text-slate-500">
                  {c.email}
                </p>
              </div>
            </td>

            <td className="p-4">
              {c.businessName}
            </td>

            <td className="p-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  c.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700"
                    : c.status === "LEAD"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {c.status}
              </span>
            </td>

            <td className="p-4">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {c.type}
              </span>
            </td>

            <td className="p-4 text-sm text-slate-600">
              {c.followUpDate
                ? new Date(c.followUpDate).toLocaleDateString()
                : "Not Scheduled"}
            </td>

            <td className="p-4">
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    alert(
                      `${c.name}\n\nMobile: ${c.mobile}\nEmail: ${c.email}\nBusiness: ${c.businessName}\nAddress: ${c.address}\nNotes: ${
                        c.notes || "No notes"
                      }`
                    )
                  }
                  className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"
                >
                  <Eye size={16} />
                </button>

                <button
                  onClick={() => editCustomer(c)}
                  className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => addFollowUp(c.id)}
                  className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-200"
                >
                  Follow-up
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

);
}
