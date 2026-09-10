// Customer login / register: phone -> on-screen OTP -> verify. New customers then fill
// Name / Email / Address (Google autocomplete + "Detect my location"). Left side shows
// the login-security animation.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSmartphone, FiMapPin, FiLock, FiUser, FiMail } from "react-icons/fi";
import { useCustomerAuth } from "../store/CustomerAuthProvider";
import { useGooglePlaces } from "../hooks/useGooglePlaces";
import securityGif from "../../../assets/login-security.1aafb2df0d0f1db5a6f0.gif";
import "../components/storefront.css";

const STEP = { PHONE: "phone", OTP: "otp", PROFILE: "profile" };

export function AccountAuthPage() {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp, completeProfile } = useCustomerAuth();
  const { ready, hasKey, attachAutocomplete, detectLocation } = useGooglePlaces();

  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(STEP.PHONE);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [shownOtp, setShownOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [profile, setProfile] = useState({
    name: "", email: "", address: "", city: "", state: "", pincode: "", lat: null, lng: null,
  });
  const addressRef = useRef(null);

  // Wire Google autocomplete to the address field once we're on the profile step.
  useEffect(() => {
    if (step === STEP.PROFILE && ready && addressRef.current) {
      attachAutocomplete(addressRef.current, (place) =>
        setProfile((p) => ({ ...p, ...place }))
      );
    }
  }, [step, ready, attachAutocomplete]);

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(mobile.trim())) return setError("Enter a valid 10-digit mobile number.");
    setBusy(true);
    try {
      const data = await requestOtp(mobile.trim());
      setShownOtp(data.otp || "");
      setStep(STEP.OTP);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await verifyOtp(mobile.trim(), otp.trim());
      // Show the profile screen for new customers, or whenever the user is registering.
      if (data.isNew || mode === "register") {
        setProfile((p) => ({
          ...p,
          ...data.customer,
          name: data.customer.name === "Guest" ? "" : data.customer.name,
        }));
        setStep(STEP.PROFILE);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDetect() {
    setError("");
    try {
      const place = await detectLocation();
      setProfile((p) => ({ ...p, ...place }));
    } catch {
      setError("Couldn't detect your location. Please type your address.");
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setError("");
    if (!profile.name.trim()) return setError("Please enter your name.");
    setBusy(true);
    try {
      await completeProfile(profile);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your details.");
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });

  return (
    <div className="sf-auth">
      <div className="sf-auth__art">
        <img src={securityGif} alt="Secure login" />
      </div>

      <div className="sf-auth__panel">
        {step === STEP.PHONE && (
          <form className="sf-auth__form" onSubmit={handleSendOtp}>
            <h1 className="sf-auth__title">
              {mode === "register" ? "Create your account" : "Log in!"}
            </h1>
            <p className="sf-auth__sub">
              {mode === "register"
                ? "Verify your mobile with an OTP, then add your details."
                : "Explore, shop, and enjoy a seamless experience, let's begin!"}
            </p>

            <label>Mobile Number</label>
            <div className="sf-auth__field">
              <FiSmartphone className="sf-auth__field-icon" />
              <span className="sf-auth__prefix">+91</span>
              <input
                id="sf-auth-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter your mobile number"
                inputMode="numeric"
              />
            </div>

            {error && <p className="sf-auth__error">{error}</p>}
            <button className="sf-authbtn" type="submit" disabled={busy}>
              {busy ? "Sending..." : mode === "register" ? "Register with OTP" : "Send OTP"}
            </button>

            {mode === "login" ? (
              <div className="sf-auth__switch">
                <span>New to Garuda?</span>
                <button
                  type="button"
                  className="sf-auth__register"
                  onClick={() => {
                    setMode("register");
                    setError("");
                    document.getElementById("sf-auth-mobile")?.focus();
                  }}
                >
                  Create an account
                </button>
              </div>
            ) : (
              <div className="sf-auth__switch">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="sf-auth__register"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Log in
                </button>
              </div>
            )}
          </form>
        )}

        {step === STEP.OTP && (
          <form className="sf-auth__form" onSubmit={handleVerify}>
            <h1 className="sf-auth__title">Verify OTP</h1>
            <p className="sf-auth__sub">Enter the code we generated for +91 {mobile}.</p>

            {shownOtp && (
              <div className="sf-auth__otpbox">
                Your OTP is <strong>{shownOtp}</strong>
                <span> (shown on screen for now)</span>
              </div>
            )}

            <label>One-Time Password</label>
            <div className="sf-auth__field">
              <FiLock className="sf-auth__field-icon" />
              <input
                className="sf-auth__otpinput"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                inputMode="numeric"
              />
            </div>

            {error && <p className="sf-auth__error">{error}</p>}
            <button className="sf-authbtn" type="submit" disabled={busy}>
              {busy ? "Verifying..." : "Verify & Continue"}
            </button>
            <button type="button" className="sf-auth__link" onClick={() => setStep(STEP.PHONE)}>
              Change number
            </button>
          </form>
        )}

        {step === STEP.PROFILE && (
          <form className="sf-auth__form" onSubmit={handleSaveProfile}>
            <h1 className="sf-auth__title">Almost there!</h1>
            <p className="sf-auth__sub">Add a few details to finish setting up your account.</p>

            <label>Name *</label>
            <div className="sf-auth__field">
              <FiUser className="sf-auth__field-icon" />
              <input value={profile.name} onChange={set("name")} placeholder="Enter your name" required />
            </div>

            <label>Email</label>
            <div className="sf-auth__field">
              <FiMail className="sf-auth__field-icon" />
              <input type="email" value={profile.email} onChange={set("email")} placeholder="Enter your email" />
            </div>

            <div className="sf-auth__addrhead">
              <label>Address</label>
              {hasKey && (
                <button type="button" className="sf-auth__detect" onClick={handleDetect}>
                  <FiMapPin /> Detect my location
                </button>
              )}
            </div>
            <div className="sf-auth__field">
              <FiMapPin className="sf-auth__field-icon" />
              <input
                ref={addressRef}
                value={profile.address}
                onChange={set("address")}
                placeholder={hasKey ? "Start typing your address..." : "Enter your address"}
              />
            </div>

            <div className="sf-auth__row">
              <input value={profile.city} onChange={set("city")} placeholder="City" />
              <input value={profile.state} onChange={set("state")} placeholder="State" />
              <input value={profile.pincode} onChange={set("pincode")} placeholder="Pincode" />
            </div>

            {error && <p className="sf-auth__error">{error}</p>}
            <button className="sf-authbtn" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AccountAuthPage;
