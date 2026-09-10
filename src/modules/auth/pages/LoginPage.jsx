// Login page. Cream form panel on the left (small logo + gold rule, serif
// "Welcome back", underlined fields, ink "Sign in" button) and a deep-ink
// panel on the right holding a headline and the framed CRM illustration.
// Framer Motion animates the entrance with a subtle stagger.
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../../../app/store/authStore";
import illustration from "../../../assets/login-illustration.png";
import logo from "../../../assets/logo.png";
import "./LoginPage.css";

// Container staggers its children; each child fades + slides up.
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      {/* Left: form */}
      <div className="login__left">
        <motion.form
          className="login__form"
          onSubmit={handleSubmit}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div className="login__brand" variants={item}>
            <img className="login__logo" src={logo} alt="Garuda International" />
          </motion.div>

          <motion.h1 className="login__title" variants={item}>
            Welcome back
          </motion.h1>
          <motion.p className="login__subtitle" variants={item}>
            Manage leads, track customer interactions, and close more deals with ease.
          </motion.p>

          <motion.label className="login__label" htmlFor="email" variants={item}>
            Email
          </motion.label>
          <motion.div className="login__field" variants={item}>
            <FiMail className="login__field-icon" aria-hidden="true" />
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </motion.div>

          <motion.label className="login__label" htmlFor="password" variants={item}>
            Password
          </motion.label>
          <motion.div className="login__field" variants={item}>
            <FiLock className="login__field-icon" aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="login__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </motion.div>

          <motion.div className="login__row" variants={item}>
            <label className="login__remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
          </motion.div>

          {error && <div className="login__error">{error}</div>}

          <motion.button
            className="login__submit"
            type="submit"
            disabled={submitting}
            variants={item}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </motion.button>
        </motion.form>
      </div>

      {/* Right: ink panel with headline + framed illustration */}
      {/* <div className="login__right">
        <motion.div
          className="login__right-content"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <div className="login__eyebrow-rule" />
          <h2 className="login__right-heading">
            Every relationship, tracked with the same care you give it in person.
          </h2>
          <p className="login__right-copy">
            One place for leads, conversations, and next steps — so nothing
            you've built with a customer gets lost between meetings.
          </p>

          <div className="login__frame">
            <span className="login__corner login__corner--tl" />
            <span className="login__corner login__corner--br" />
            <img className="login__illustration" src={illustration} alt="Garuda CRM" />
          </div>
        </motion.div>
      </div> */}
    </div>
  );
}

export default LoginPage;