import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";

export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const navigate = useNavigate();

const login = async () => {
try {
setLoading(true);

  const res = await axios.post(
    "http://localhost:5000/auth/login",
    {
      email,
      password,
    }
  );

  localStorage.setItem("token", res.data.token);
  localStorage.setItem("role", res.data.user.role);
  localStorage.setItem(
    "userName",
    res.data.user.name
  );

  window.dispatchEvent(new Event("storage"));

  navigate("/dashboard");
} catch (err: any) {
  alert(
    err.response?.data?.error || "Login failed"
  );
} finally {
  setLoading(false);
}

};

return ( <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"> <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"> <div className="mb-8 text-center"> <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white"> <Shield size={32} /> </div>

      <h1 className="text-3xl font-bold text-slate-800">
        Mini ERP
      </h1>

      <p className="mt-2 text-slate-500">
        CRM & Inventory Management System
      </p>
    </div>

    <div className="space-y-4">
      <input
        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={login}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        <Lock size={18} />
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </div>

    <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
      <p className="font-semibold mb-2">
        Demo Accounts
      </p>
      <p>Admin: admin@example.com / admin123</p>
      <p>Sales: sales1@example.com / sales123</p>
      <p>Warehouse: warehouse2@example.com / warehouse123</p>
      <p>Accounts: accounts2@example.com / accounts123</p>
    </div>
  </div>
</div>


);
}
