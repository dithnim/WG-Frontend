import React, { useState } from "react";
import axios from "axios";

import Otpinput from "../Otpinput";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  //reset states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [isForgotMode, setIsForgotMode] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/login", {
        username,
        password,
      });
      onLogin(res.data.token);
    } catch {
      setError("Invalid username or password");
    }
  };

  const handleForgotPassword = () => {
    setIsForgotMode(true);
  };

  const handleRequestOtp = async () => {
    try {
      const response = axios.post("http://localhost:3000/request-otp", {
        email,
      });
      setOtpSent(true);
      setOtp((await response).data.otp);
      alert("OTP sent successfully");
    } catch (error) {
      console.error(error);
      alert("Error sending OTP");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post("http://localhost:3000/verify-otp", {
        email,
        otp,
      });
      if (response.data.success) {
        setOtpVerified(true);
        alert("OTP verified");
      }
    } catch (error) {
      console.error(error);
      alert("Invalid OTP");
    }
  };

  const handleResetPassword = async () => {
    try {
      await axios.post(
        "http://localhost:3000/reset-password",
        { email, otp, newPassword }
      );
      alert("Password reset successful");
      setIsForgotMode(false);
    } catch (error) {
      console.error(error);
      alert("Error resetting password");
    }
  };

  return (
    <div className="flex items-center justify-between bg-[#0f0f0f] w-screen h-screen px-20 ">
      {isForgotMode ? (
        <>
          <div className="rounded-full w-40 h-40 absolute top-[70vh] right-2 z-0 login-circle3"></div>
          <div className="rounded-full w-60 h-60 absolute top-[10vh] right-[20vw] z-0 login-circle4"></div>
        </>
      ) : (
        <>
          <div className="rounded-full w-40 h-40 absolute top-[70vh] right-2 z-0 login-circle1"></div>
          <div className="rounded-full w-60 h-60 absolute top-[10vh] right-[20vw] z-0 login-circle2"></div>
        </>
      )}

      <div className="text-white">
        <h1 className="text-6xl font-bold mb-4">Welcome Back..!</h1>
        <div className="flex items-center">
          <h3 className="text-2xl font-bold border w-[250px] flex items-center justify-center py-1">
            Wijesinghe Genuine
          </h3>
          <div className="bg-white w-[400px] h-[1px] ms-2"></div>
          <i className="bx bxs-chevron-right text-4xl"></i>
        </div>
      </div>
      {isForgotMode ? (
        <>
          <div className="w-[350px] h-[80vh] py-10 px-7 rounded shadow-md login-card z-10 flex flex-col justify-center">
            {!otpSent ? (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-1">
                  Forgot Password ?
                </h2>
                <h2 className="text-xs font-semibold text-white mb-4">
                  No need to worry..!
                </h2>
                <input
                  type="email"
                  id="email"
                  class="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
                  placeholder="Email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <button
                  onClick={handleRequestOtp}
                  className="w-full reset-btn text-white p-2 rounded"
                >
                  Reset password
                </button>
              </div>
            ) : otpSent && !otpVerified ? (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Verify OTP
                </h2>
                <Otpinput />
                <button
                  onClick={handleVerifyOtp}
                  className="verify-btn text-white p-2 rounded w-full mt-4"
                >
                  Verify
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Reset Password
                </h2>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
                />
                <button
                  onClick={handleResetPassword}
                  className="verify-btn text-white p-2 rounded w-full"
                >
                  Reset Password
                </button>
              </div>
            )}

            {/* <h2 className="text-2xl font-semibold text-white mb-1">
              Forgot Password ?
            </h2>
            <h2 className="text-xs font-semibold text-white mb-4">
              No need to worry..!
            </h2>
            <input
              type="email"
              id="email"
              class="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full reset-btn text-white p-2 rounded"
            >
              Reset password
            </button> */}
            <p
              className="text-center text-gray-200 text-xs mt-2 cursor-pointer"
              onClick={() => setIsForgotMode(false)}
            >
              <i className="bx bx-left-arrow-alt"></i> Go back
            </p>
          </div>
        </>
      ) : (
        <>
          <form
            onSubmit={handleLogin}
            className="w-[350px] h-[80vh] py-10 px-7 rounded shadow-md login-card z-10 flex flex-col justify-center"
          >
            <h2 className="text-2xl font-semibold text-white mb-1">Login</h2>
            <h2 className="text-xs font-semibold text-white mb-4">
              Glad you're back..!
            </h2>
            {error && <p className="text-red-500">{error}</p>}
            <input
              type="text"
              id="username"
              class="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="password"
              id="password"
              class="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-3"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex items-center mb-3 text-white text-xs">
              <input type="checkbox" />
              <label htmlFor="checkbox" className="ms-1">
                Remember me
              </label>
            </div>
            <button
              type="submit"
              className="w-full login-btn text-white p-2 rounded"
            >
              Login
            </button>
            <p
              className="text-center text-gray-200 text-xs mt-2 cursor-pointer"
              onClick={handleForgotPassword}
            >
              forgot password ?
            </p>
          </form>
        </>
      )}
    </div>
  );
};

export default Login;
