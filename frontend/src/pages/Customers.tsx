import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, Eye, Pencil } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  type: string;
  address: string;
  status: string;
  followUpDate?: string | null;
  notes?: string | null;
}

interface CustomerForm {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string;
  type: string;
  address: string;
  status: string;
  followUpDate: string;
  notes: string;
}

const emptyForm: CustomerForm = {
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
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [loading, setLoading] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_URL}/customers?search=${encodeURIComponent(search)}`
      );

      setCustomers(res.data);
    } catch (error) {
      console.error("Failed to load customers:", error);
      alert("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const saveCustomer = async () => {
    try {
      if (!form.name.trim()) {
        alert("Customer name is required");
        return;
      }

      if (!form.mobile.trim()) {
        alert("Mobile number is required");
        return;
      }

      if (editingId !== null) {
        await axios.put(
          `${API_URL}/customers/${editingId}`,
          form
        );

        alert("Customer updated successfully");
      } else {
        await axios.post(
          `${API_URL}/customers`,
          form
        );

        alert("Customer created successfully");
      }

      setEditingId(null);
      setForm(emptyForm);

      await loadCustomers();
    } catch (error: any) {
      console.error("Failed to save customer:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to save customer"
      );
    }
  };

  const editCustomer = (customer: Customer) => {
    setEditingId(customer.id);

    setForm({
      name: customer.name || "",
      mobile: customer.mobile || "",
      email: customer.email || "",
      businessName: customer.businessName || "",
      gstNumber: customer.gstNumber || "",
      type: customer.type || "RETAIL",
      address: customer.address || "",
      status: customer.status || "LEAD",
      followUpDate: customer.followUpDate
        ? customer.followUpDate.substring(0, 10)
        : "",
      notes: customer.notes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const addFollowUp = async (id: number) => {
    const note = prompt("Enter follow-up note");

    if (!note || !note.trim()) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/customers/${id}/followups`,
        {
          note: note.trim(),
        }
      );

      alert("Follow-up added successfully");

      await loadCustomers();
    } catch (error: any) {
      console.error("Failed to add follow-up:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to add follow-up"
      );
    }
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
            Customer CRM
          </h1>

          <p className="text-slate-500">
            Manage leads, active customers, and follow-ups
          </p>
        </div>

        <button
          onClick={resetForm}
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

      {/* Customer Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {editingId !== null
              ? "Edit Customer"
              : "Create Customer"}
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

          {/* Name */}
          <input
            className="rounded-xl border p-3"
            placeholder="Customer Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          {/* Mobile */}
          <input
            className="rounded-xl border p-3"
            placeholder="Mobile"
            value={form.mobile}
            onChange={(e) =>
              setForm({
                ...form,
                mobile: e.target.value,
              })
            }
          />

          {/* Email */}
          <input
            className="rounded-xl border p-3"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          {/* Business */}
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

          {/* GST */}
          <input
            className="rounded-xl border p-3"
            placeholder="GST Number"
            value={form.gstNumber}
            onChange={(e) =>
              setForm({
                ...form,
                gstNumber: e.target.value,
              })
            }
          />

          {/* Customer Type */}
          <select
            className="rounded-xl border p-3"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value,
              })
            }
          >
            <option value="RETAIL">
              Retail
            </option>

            <option value="WHOLESALE">
              Wholesale
            </option>

            <option value="DISTRIBUTOR">
              Distributor
            </option>
          </select>

          {/* Address */}
          <input
            className="rounded-xl border p-3 md:col-span-2"
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
          />

          {/* Status */}
          <select
            className="rounded-xl border p-3"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
          >
            <option value="LEAD">
              Lead
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>

          {/* Follow-up */}
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

          {/* Notes */}
          <textarea
            className="rounded-xl border p-3 md:col-span-2"
            placeholder="Notes"
            rows={4}
            value={form.notes}
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value,
              })
            }
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={saveCustomer}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            {editingId !== null
              ? "Update Customer"
              : "Save Customer"}
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

      {/* Customer Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">

            <thead className="bg-slate-50 text-sm font-semibold text-slate-600">
              <tr>
                <th className="p-4">
                  Customer
                </th>

                <th className="p-4">
                  Business
                </th>

                <th className="p-4">
                  Status
                </th>

                <th className="p-4">
                  Type
                </th>

                <th className="p-4">
                  Follow-up
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
                    colSpan={6}
                    className="p-8 text-center text-slate-500"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >

                    {/* Customer */}
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {customer.name}
                        </p>

                        <p className="text-sm text-slate-500">
                          {customer.email}
                        </p>

                        <p className="text-sm text-slate-500">
                          {customer.mobile}
                        </p>
                      </div>
                    </td>

                    {/* Business */}
                    <td className="p-4">
                      {customer.businessName}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          customer.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : customer.status === "LEAD"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="p-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {customer.type}
                      </span>
                    </td>

                    {/* Follow-up */}
                    <td className="p-4 text-sm text-slate-600">
                      {customer.followUpDate
                        ? new Date(
                            customer.followUpDate
                          ).toLocaleDateString()
                        : "Not Scheduled"}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex gap-2">

                        {/* View */}
                        <button
                          onClick={() =>
                            alert(
                              `${customer.name}

Mobile: ${customer.mobile}
Email: ${customer.email}
Business: ${customer.businessName}
GST: ${customer.gstNumber || "Not provided"}
Type: ${customer.type}
Status: ${customer.status}
Address: ${customer.address}
Notes: ${customer.notes || "No notes"}`
                            )
                          }
                          className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"
                          title="View Customer"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() =>
                            editCustomer(customer)
                          }
                          className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                          title="Edit Customer"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Follow-up */}
                        <button
                          onClick={() =>
                            addFollowUp(customer.id)
                          }
                          className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-200"
                        >
                          Follow-up
                        </button>

                      </div>
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