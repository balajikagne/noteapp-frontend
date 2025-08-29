import React, { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import "./VerifyOtp.css";

interface VerifyOtpProps {
  onLogin: (token: string, userData: any) => void;
}

export default function VerifyOtp({ onLogin }: VerifyOtpProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Check if there's a pending email from localStorage
  useEffect(() => {
    const pendingEmail = localStorage.getItem("pendingEmail");
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, []);

  // Handle countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setMsg("Enter a valid email");
    }
    
    setLoading(true);
    try {
      const res = await API.post("/auth/request-otp", { email });
      setMsg(res.data.message || "OTP sent successfully");
      setOtpSent(true);
      setCountdown(60); // 60 seconds countdown
      localStorage.setItem("pendingEmail", email);
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
        email: localStorage.getItem("pendingEmail") || email, 
        code: otp 
      });
      
      const { token, user } = res.data;
      
      if (token) {
        // Call the onLogin callback with token and user data
        onLogin(token, {
          email: email,
          ...user // Include any additional user data from the response
        });
        
        setMsg("Verification successful! Redirecting...");
        // Clean up
        localStorage.removeItem("pendingEmail");
      } else {
        setMsg("Verification failed: No token received");
      }
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendOtp() {
    setMsg("");
    setLoading(true);
    try {
      const res = await API.post("/auth/request-otp", { email });
      setMsg("OTP resent successfully");
      setCountdown(60); // Reset countdown
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Resend failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="verify-container">
      <div className="verify-card">
        <div className="verify-header">
          <h1>Verify Your Email</h1>
          <p>Enter your email address and we'll send you a verification code</p>
        </div>
        
        <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="verify-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={otpSent || loading}
            />
          </div>
          
          {otpSent && (
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                pattern="\d{6}"
                required
                autoFocus
              />
              <div className="otp-actions">
                <p className="otp-note">Check your email for the verification code</p>
                {countdown > 0 ? (
                  <span className="countdown">Resend in {countdown}s</span>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    className="resend-btn"
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          )}
          
          <button 
            type="submit" 
            className="verify-button"
            disabled={loading || verifying || (otpSent && otp.length !== 6)}
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
              "Verify Code"
            ) : (
              "Send Verification Code"
            )}
          </button>
        </form>
        
        {msg && (
          <div className={`message ${msg.includes("failed") || msg.includes("invalid") || msg.includes("error") ? "error" : "success"}`}>
            {msg}
          </div>
        )}
        
        <div className="verify-footer">
          <p>Need an account ?
            <a 
             
              href="/signup"
              className="back-btn"
              style={{fontFamily:"initial"}}
            >
            Create One
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}