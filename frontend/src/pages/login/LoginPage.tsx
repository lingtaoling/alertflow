import { useState } from "react";
import LoginBgCanvas from "./components/LoginBgCanvas";
import LoginForm from "./components/LoginForm";
import logoIcon from "../../assets/images/alertflow-icon1.svg";

export default function LoginPage() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <LoginBgCanvas />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src={logoIcon} alt="" className="h-14 w-auto" />
            <span className="text-2xl font-logo font-bold text-ink-700 tracking-tight">
              AlertFlow
            </span>
          </div>
          <p className="text-ink-600 text-sm">Sign in to your account</p>
        </div>

        <div className="gradient-border rounded-2xl p-6 bg-white shadow-xl shadow-ink-700/20">
          <LoginForm />
        </div>

        <p className="text-center text-ink-500 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <span className="relative inline-block">
            <button
              type="button"
              onClick={() => {
                setShowTooltip(true);
                setTimeout(() => setShowTooltip(false), 2000);
              }}
              className="text-signal-orange font-medium hover:underline cursor-pointer"
            >
              Create account
            </button>
            {showTooltip && (
              <span
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 text-xs font-medium text-white bg-ink-700 rounded-lg whitespace-nowrap shadow-lg"
                role="tooltip"
              >
                Under construction
              </span>
            )}
          </span>
        </p>
        <p className="text-center text-ink-500 text-xs mt-6">
          admin@alertflow.com All access
          <br />
          user1@alertflow.com Tenant 1
          <br />
          user2@alertflow.com Tenant 2
          <br />
          password: Demouser123
        </p>
      </div>
    </div>
  );
}
