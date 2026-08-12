import { useEffect, useState } from "react";
import api from "../api";
import {
  Users,
  Package,
  Receipt,
  IndianRupee,
  TrendingUp,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    challans: 0,
    revenue: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [customers, products, challans] = await Promise.all([
          api.get("/customers"),
          api.get("/products?limit=100"),
          api.get("/challans"),
        ]);

        const confirmedChallans = challans.data.filter(
          (challan: { status: string }) => challan.status === "CONFIRMED"
        );
        const revenue = confirmedChallans.reduce(
          (total: number, challan: { items?: { productPrice: number; quantity: number }[] }) =>
            total + (challan.items ?? []).reduce(
              (itemTotal, item) => itemTotal + item.productPrice * item.quantity,
              0
            ),
          0
        );

        setStats({
          customers: customers.data.length,
          products: products.data.length,
          challans: confirmedChallans.length,
          revenue,
        });
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  const cards = [
    {
      title: "Total Customers",
      value: stats.customers,
      icon: Users,
      bg: "from-blue-500 to-blue-700",
    },
    {
      title: "Inventory Products",
      value: stats.products,
      icon: Package,
      bg: "from-emerald-500 to-emerald-700",
    },
    {
      title: "Sales Challans",
      value: stats.challans,
      icon: Receipt,
      bg: "from-purple-500 to-purple-700",
    },
    {
      title: "Revenue Estimate",
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: IndianRupee,
      bg: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            ERP Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Welcome back! Here's your business overview.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">System Status</p>
          <p className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <TrendingUp size={18} />
            Online
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-3xl bg-gradient-to-br ${card.bg} p-6 text-white shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">{card.title}</p>
                <h2 className="text-4xl font-bold mt-2">
                  {card.value}
                </h2>
              </div>

              <div className="rounded-2xl bg-white/20 p-3">
                <card.icon size={28} />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
              <TrendingUp size={16} />
              +12% from last month
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="text-blue-600" />
            Recent Activity
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-800">
                  Customer registered
                </p>
                <p className="text-slate-500 text-sm">
                  New customer added to CRM
                </p>
              </div>
              <span className="text-xs text-slate-400">2 min ago</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-800">
                  Product inventory updated
                </p>
                <p className="text-slate-500 text-sm">
                  Stock movement recorded successfully
                </p>
              </div>
              <span className="text-xs text-slate-400">15 min ago</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-800">
                  Sales challan generated
                </p>
                <p className="text-slate-500 text-sm">
                  Inventory reduced automatically
                </p>
              </div>
              <span className="text-xs text-slate-400">1 hour ago</span>
            </div>
          </div>
        </div>

        {/* Business Summary */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Business Summary
          </h2>

          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-blue-700">Active Customers</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">
                {stats.customers}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <p className="text-emerald-700">Products in Stock</p>
              <p className="text-4xl font-bold text-emerald-900 mt-2">
                {stats.products}
              </p>
            </div>

            <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4">
              <p className="text-purple-700">Confirmed Challans</p>
              <p className="text-4xl font-bold text-purple-900 mt-2">
                {stats.challans}
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
              <p className="text-red-700 flex items-center gap-2">
                <AlertTriangle size={18} />
                Low Stock Alerts
              </p>
              <p className="text-4xl font-bold text-red-900 mt-2">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

