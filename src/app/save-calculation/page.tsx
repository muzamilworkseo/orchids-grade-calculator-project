"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SavedCalculation {
  id: string;
  type: "grade" | "final";
  name: string;
  description: string;
  data: unknown;
  createdAt: string;
}

interface User {
  email: string;
  name: string;
}

export default function SaveCalculation() {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  const [calcName, setCalcName] = useState("");
  const [calcDescription, setCalcDescription] = useState("");
  const [pendingData, setPendingData] = useState<{ type: string; data: unknown } | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }

    const pending = localStorage.getItem("pendingSave");
    if (pending) {
      setPendingData(JSON.parse(pending));
    }
  }, []);

  const handleSignIn = () => {
    setError("");

    if (!signInEmail || !signInPassword) {
      setError("Please fill in all fields.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u: User & { password: string }) => u.email === signInEmail && u.password === signInPassword);

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    setCurrentUser({ email: user.email, name: user.name });
    setIsLoggedIn(true);
    localStorage.setItem("currentUser", JSON.stringify({ email: user.email, name: user.name }));
  };

  const handleSignUp = () => {
    setError("");

    if (!signUpName || !signUpEmail || !signUpPassword || !signUpPasswordConfirm) {
      setError("Please fill in all required fields.");
      return;
    }

    if (signUpPassword.length < 8 || signUpPassword.length > 100) {
      setError("Password must be between 8 and 100 characters.");
      return;
    }

    if (signUpPassword !== signUpPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeToTerms) {
      setError("You must agree to the Terms of Use.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u: User) => u.email === signUpEmail)) {
      setError("An account with this email already exists.");
      return;
    }

    const newUser = { name: signUpName, email: signUpEmail, password: signUpPassword };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    setCurrentUser({ email: signUpEmail, name: signUpName });
    setIsLoggedIn(true);
    localStorage.setItem("currentUser", JSON.stringify({ email: signUpEmail, name: signUpName }));
  };

  const handleSave = () => {
    setError("");
    setSuccess("");

    if (!isLoggedIn || !currentUser) {
      setError("Please sign in to save your calculation.");
      return;
    }

    if (!pendingData) {
      setError("No calculation data to save.");
      return;
    }

    const savedCalcs: SavedCalculation[] = JSON.parse(localStorage.getItem(`calculations_${currentUser.email}`) || "[]");

    if (savedCalcs.length >= 100) {
      setError("You have reached the maximum of 100 saved calculations.");
      return;
    }

    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      type: pendingData.type as "grade" | "final",
      name: calcName || `Calculation ${savedCalcs.length + 1}`,
      description: calcDescription,
      data: pendingData.data,
      createdAt: new Date().toISOString(),
    };

    savedCalcs.push(newCalc);
    localStorage.setItem(`calculations_${currentUser.email}`, JSON.stringify(savedCalcs));
    localStorage.removeItem("pendingSave");

    setSuccess("Calculation saved successfully!");
    setCalcName("");
    setCalcDescription("");
    setPendingData(null);
  };

  const handleReset = () => {
    setCalcName("");
    setCalcDescription("");
    setSignInEmail("");
    setSignInPassword("");
    setSignUpName("");
    setSignUpEmail("");
    setSignUpPassword("");
    setSignUpPasswordConfirm("");
    setConfirmationCode("");
    setAgreeToTerms(false);
    setError("");
    setSuccess("");
  };

  const getCalculatorType = () => {
    if (!pendingData) return "Grade Calculator";
    return pendingData.type === "final" ? "Final Grade Calculator" : "Grade Calculator";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="p-6 md:p-10">
        <div className="max-w-[580px]">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Calculator
          </Link>

          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h1 className="text-xl font-bold text-slate-800">Save Calculation</h1>
              <p className="text-sm text-slate-500 mt-1">Calculator: {getCalculatorType()}</p>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6">
                Please provide a name for the calculation and save it to your account.
                Each account can save up to 100 calculations.
              </p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Name (optional)</label>
                  <input
                    type="text"
                    value={calcName}
                    onChange={(e) => setCalcName(e.target.value)}
                    placeholder="e.g. Fall 2024 Math Grade"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Description (optional)</label>
                  <textarea
                    value={calcDescription}
                    onChange={(e) => setCalcDescription(e.target.value)}
                    placeholder="Add any notes about this calculation..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {!isLoggedIn ? (
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="space-y-3 mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="authMode"
                            checked={authMode === "signin"}
                            onChange={() => setAuthMode("signin")}
                            className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Sign in to my account</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="authMode"
                            checked={authMode === "signup"}
                            onChange={() => setAuthMode("signup")}
                            className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Create a new account</span>
                        </label>
                      </div>

                      {authMode === "signin" ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                            <input
                              type="email"
                              value={signInEmail}
                              onChange={(e) => setSignInEmail(e.target.value)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Password</label>
                            <input
                              type="password"
                              value={signInPassword}
                              onChange={(e) => setSignInPassword(e.target.value)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={staySignedIn}
                              onChange={(e) => setStaySignedIn(e.target.checked)}
                              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 rounded"
                            />
                            <span className="text-xs text-slate-600">Stay signed in</span>
                          </label>
                          <button className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors">
                            Forgot password?
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Name</label>
                            <input
                              type="text"
                              value={signUpName}
                              onChange={(e) => setSignUpName(e.target.value)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Email (Username)</label>
                            <input
                              type="email"
                              value={signUpEmail}
                              onChange={(e) => setSignUpEmail(e.target.value)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Password</label>
                            <input
                              type="password"
                              value={signUpPassword}
                              onChange={(e) => setSignUpPassword(e.target.value)}
                              onFocus={() => setShowPasswordHint(true)}
                              onBlur={() => setShowPasswordHint(false)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            {showPasswordHint && (
                              <p className="text-xs text-slate-500 mt-1">Min 8, Max 100 characters</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Retype Password</label>
                            <input
                              type="password"
                              value={signUpPasswordConfirm}
                              onChange={(e) => setSignUpPasswordConfirm(e.target.value)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Confirmation Code</label>
                            <input
                              type="text"
                              value={confirmationCode}
                              onChange={(e) => setConfirmationCode(e.target.value)}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="p-3 bg-emerald-100 rounded-lg text-center">
                            <span className="text-emerald-700 font-mono text-lg tracking-widest">X7K9P</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Please type in the characters in the green image.
                          </p>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={agreeToTerms}
                              onChange={(e) => setAgreeToTerms(e.target.checked)}
                              className="w-4 h-4 mt-0.5 text-emerald-500 focus:ring-emerald-500 rounded"
                            />
                            <span className="text-xs text-slate-600">
                              I agree to the <span className="text-emerald-600 hover:underline cursor-pointer">Terms of Use</span>
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col items-center justify-center gap-4 lg:gap-6 shrink-0">
                      <span className="text-slate-400 text-sm font-medium">OR</span>
                      <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={authMode === "signin" ? handleSignIn : handleSignUp}
                      className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
                    >
                      {authMode === "signin" ? "Sign In & Save" : "Create Account & Save"}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-semibold text-sm">
                        {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{currentUser?.name}</p>
                      <p className="text-xs text-slate-500">{currentUser?.email}</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-sm">
                      {success}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-slate-400 text-xs mt-8">
            Built for students. Simple, accurate, and easy to use.
          </p>
        </div>
      </div>
    </div>
  );
}
