import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
import Otpinput from "../Otpinput";
import Progressmenu from "../Progressmenu";

// API base URL configuration

// Input validation utilities
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password);
};

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    otp: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      console.log('User already has token, redirecting to home');
      navigate("/");
    }
  }, [navigate]);

  // Clear form data when switching modes
  useEffect(() => {
    if (!isForgotMode) {
      setFormData(prev => ({ ...prev, email: "", otp: "", newPassword: "" }));
      setOtpSent(false);
      setOtpVerified(false);
    }
  }, [isForgotMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (isForgotMode) {
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      
      if (otpSent && !otpVerified && !formData.otp) {
        newErrors.otp = "OTP is required";
      }
      
      if (otpVerified && !formData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (otpVerified && !validatePassword(formData.newPassword)) {
        newErrors.newPassword = "Password must be at least 8 characters with one uppercase, one lowercase, and one number";
      }
    } else {
      if (!formData.username) {
        newErrors.username = "Username is required";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Add additional validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setErrors({
        general: "Username and password are required"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Login attempt with:', { username: formData.username, password: '***' });
      const data = await apiService.post('/login', {
        username: formData.username.trim(),
        password: formData.password.trim(),
      });
      
      console.log('Login response:', data);
      
      if (data.token) {
        console.log('Login successful, setting token');
        // Store token in sessionStorage
        sessionStorage.setItem('token', data.token);
        // Call onLogin to update app state
        onLogin(data.token);
        // Navigate to home
        navigate("/");
      } else {
        console.error('No token in response');
        setErrors({
          general: "Invalid response from server"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.response?.data?.message || "Invalid username or password"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const data = await apiService.post('/request-otp', {
        email: formData.email,
      });
      setOtpSent(true);
      setFormData(prev => ({ ...prev, otp: data.otp }));
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || "Error sending OTP"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const data = await apiService.post('/verify-otp', {
        email: formData.email,
        otp: formData.otp,
      });
      if (data.success) {
        setOtpVerified(true);
      }
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || "Invalid OTP"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await apiService.post('/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      setIsForgotMode(false);
      setFormData(prev => ({ ...prev, email: "", otp: "", newPassword: "" }));
      setOtpSent(false);
      setOtpVerified(false);
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || "Error resetting password"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showProgressMenu = (message) => {
    return <Progressmenu message={message} />;
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

      <div className="text-white w-[65%]">
        <h1 className="xl:text-6xl lg:text-5xl md:text-4xl sm:text-3xl font-bold mb-4">Welcome Back..!</h1>
        <div className="flex items-center">
          <h3 className="xl:text-2xl lg:text-xl md:text-lg sm:text-base text-sm font-bold border w-[250px] flex items-center justify-center py-1">
            Wijesinghe Genuine
          </h3>
          <div className="bg-white xl:w-[400px] lg:w-[300px] md:w-[150px] sm:w-[100px] w-[100px] h-[1px] ms-2"></div>
          <i className="bx bxs-chevron-right xl:text-4xl lg:text-3xl md:text-2xl sm:text-xl text-lg"></i>
        </div>
      </div>
      {isForgotMode ? (
        <div className="w-[350px] h-[80vh] py-10 px-7 rounded shadow-md login-card z-10 flex flex-col justify-center">
          {!otpSent ? (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Forgot Password ?</h2>
              <h2 className="text-xs font-semibold text-white mb-4">No need to worry..!</h2>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
                placeholder="Email"
                required
              />
              {errors.email && <p className="text-red-500 text-sm mb-2">{errors.email}</p>}
              <button
                onClick={handleRequestOtp}
                disabled={isLoading}
                className="w-full reset-btn text-white p-2 rounded disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Reset password"}
              </button>
            </div>
          ) : otpSent && !otpVerified ? (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">Verify OTP</h2>
              <Otpinput value={formData.otp} onChange={handleInputChange} />
              {errors.otp && <p className="text-red-500 text-sm mb-2">{errors.otp}</p>}
              <button
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="verify-btn text-white p-2 rounded w-full mt-4 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">Reset Password</h2>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="New Password"
                className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
              />
              {errors.newPassword && <p className="text-red-500 text-sm mb-2">{errors.newPassword}</p>}
              <button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="verify-btn text-white p-2 rounded w-full disabled:opacity-50"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          )}
          {errors.general && <p className="text-red-500 text-sm mt-2">{errors.general}</p>}
          <p
            className="text-center text-gray-200 text-xs mt-2 cursor-pointer"
            onClick={() => setIsForgotMode(false)}
          >
            <i className="bx bx-left-arrow-alt"></i> Go back
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleLogin}
          className="w-[30%] h-[80vh] py-10 px-7 rounded shadow-md login-card z-10 flex flex-col justify-center"
        >
          <h2 className="text-2xl font-semibold text-white mb-1">Login</h2>
          <h2 className="text-xs font-semibold text-white mb-4">Glad you're back..!</h2>
          {errors.general && <p className="text-red-500 text-sm mb-2">{errors.general}</p>}
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
            placeholder="Username"
            required
          />
          {errors.username && <p className="text-red-500 text-sm mb-2">{errors.username}</p>}
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-3"
            placeholder="Password"
            required
          />
          {errors.password && <p className="text-red-500 text-sm mb-2">{errors.password}</p>}
          <div className="flex items-center mb-3 text-white text-xs">
            <input type="checkbox" />
            <label htmlFor="checkbox" className="ms-1">
              Remember me
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full login-btn text-white p-2 rounded disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <p
            className="text-center text-gray-200 text-xs mt-2 cursor-pointer"
            onClick={() => setIsForgotMode(true)}
          >
            forgot password ?
          </p>
        </form>
      )}
    </div>
  );
};

export default Login;
