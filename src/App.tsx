import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Signup from "./components/Signup";
import VerifyOtp from "./components/VerifyOtp";
import NotesPage from "./components/NotesPage";
import { setAuthToken } from "./api/api";
import Cookies from "js-cookie";

export default function App() {
  const [token, setToken] = useState<string | null>(() => Cookies.get("authToken") || null);
  const [userData, setUserData] = useState(() => {
    const storedData = Cookies.get("userData");
    return storedData ? JSON.parse(storedData) : null;
  });

  useEffect(() => {
    setAuthToken(token ?? undefined);
  }, [token]);

  function handleLogin(token: string, userData: any) {
    setToken(token);
    setUserData(userData);
    
    // Store token and user data in cookies with expiration
    Cookies.set("authToken", token, { expires: 7 }); // Expires in 7 days
    Cookies.set("userData", JSON.stringify(userData), { expires: 7 });
  }

  function handleLogout() {
    setToken(null);
    setUserData(null);
    
    // Remove all auth-related cookies
    Cookies.remove("authToken");
    Cookies.remove("userData");
    Cookies.remove("pendingEmail");
    
    setAuthToken(undefined);
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <Link to="/">
            <h1>NoteApp</h1>
          </Link>
          <nav>
            {token ? (
              <div className="user-info">
                <button onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <Link to="/signup">Signup / Login</Link>
            )}
          </nav>
        </header>

        <main>
          <Routes>
            <Route 
              path="/" 
              element={token ? <NotesPage userData={userData} onLogout={handleLogout} /> : <Navigate to="/signup" />} 
            />
            <Route 
              path="/signup" 
              element={token ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />} 
            />
            <Route 
              path="/verify" 
              element={token ? <Navigate to="/" /> : <VerifyOtp onLogin={handleLogin} />} 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
