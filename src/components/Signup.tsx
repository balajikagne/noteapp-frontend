import React, { useState } from "react";
import API from "../api/api";
import "./Signup.css";
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
interface SignupProps {
  onLogin: (token: string, userData: any) => void;
}

export default function Signup({ onLogin }: SignupProps) {
  const [formData, setFormData] = useState({
    name: "Jonas Kharmadi",
    dob: "11 December 1927",
    email: "jonas.kharmadi@gmail.com",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      return setMsg("Enter a valid email");
    }
    
    setLoading(true);
    try {
      const res = await API.post("/auth/request-otp", { 
        email: formData.email,
        name: formData.name,
        dob: formData.dob
      });
      setMsg(res.data.message || "OTP sent successfully");
      setOtpSent(true);
      localStorage.setItem("pendingEmail", formData.email);
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    
    if (otp.length !== 6) {
      return setMsg("Please enter a valid 6-digit OTP");
    }
    
    setVerifying(true);
    try {
      const res = await API.post("/auth/verify-otp", { 
        email: localStorage.getItem("pendingEmail") || formData.email, 
        code: otp 
      });
      
      // Extract token from response
      const { token } = res.data;
      
      if (token) {
        // Decode token to get user info
        const decodedToken: any = jwtDecode(token);
        
        // Prepare user data for storage
        const userData = {
          name: decodedToken.name || formData.name,
          email: decodedToken.email || formData.email,
          dob: decodedToken.dob || formData.dob,
          userId: decodedToken.userId || decodedToken.sub
        };
        
        // Call the onLogin callback from props
        onLogin(token, userData);
        
        setMsg("Verification successful! Redirecting...");
        navigate("/"); // Redirect to home page
      } else {
        setMsg("Verification failed: No token received");
      }
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Sign up</h1>
          <p>Sign up to enjoy the feature of HD</p>
        </div>
        
        <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">Text Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              disabled={otpSent}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              name="dob"
              type="text"
              value={formData.dob}
              onChange={handleInputChange}
              placeholder="DD Month YYYY"
              disabled={otpSent}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email for OTP</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email for OTP verification"
              required
              disabled={otpSent}
            />
          </div>
          
          {otpSent && (
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                pattern="\d{6}"
                required
                autoFocus
              />
              <p className="otp-note">Check your email for the verification code</p>
            </div>
          )}
          
          <button 
            type="submit" 
            className="signup-button"
            disabled={loading || verifying}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Sending OTP...
              </>
            ) : verifying ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : otpSent ? (
              "Verify OTP"
            ) : (
              "Send OTP"
            )}
          </button>
        </form>
       <div
  style={{
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  }}
>
  Already have an account?{" "}
  <Link
    to="/verify"
    style={{
      color: "#4299e1",
      fontWeight: "500",
      fontFamily: "initial",
      textDecoration: "none",
    }}
    className="privacy-link"
  >
    Sign In
  </Link>
</div>

        
        {msg && (
          <div className={`message ${msg.includes("failed") || msg.includes("invalid") || msg.includes("error") ? "error" : "success"}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
