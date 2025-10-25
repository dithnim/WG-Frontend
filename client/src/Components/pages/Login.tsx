import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
import Otpinput from "../Otpinput";
import Progressmenu from "../Progressmenu";
import { useAuth } from "../../contexts/AuthContext";

interface FormData {
  username: string;
  password: string;
  email: string;
  otp: string;
  newPassword: string;
}

interface Errors {
  [key: string]: string;
}

interface LoginProps {
  onLogin: (token: string) => void;
}

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password: string): boolean =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
    password
  );

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    email: "",
    otp: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [otpAttempts, setOtpAttempts] = useState<number>(0);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const { login } = useAuth();

  useEffect(() => {
    // Check for existing token and validate it
    const validateExistingToken = async () => {
      const token = sessionStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");

      if (token) {
        try {
          // Validate token by making a test request
          await apiService.get("/validate-token");
          navigate("/");
        } catch (error) {
          // If token is invalid, remove it
          sessionStorage.removeItem("token");
          // If refresh token exists, try to get a new token
          if (refreshToken) {
            try {
              const response = await apiService.post("/refresh-token", {
                refreshToken,
              });
              if (response.token) {
                sessionStorage.setItem("token", response.token);
                navigate("/");
              }
            } catch (refreshError) {
              localStorage.removeItem("refreshToken");
            }
          }
        }
      }
    };
    validateExistingToken();
  }, [navigate]);

  useEffect(() => {
    if (!isForgotMode) {
      setFormData((prev) => ({ ...prev, email: "", otp: "", newPassword: "" }));
      setOtpSent(false);
      setOtpVerified(false);
    }
  }, [isForgotMode]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    },
    []
  );

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const newErrors = { ...errors };

      if (name === "email" && value && !validateEmail(value)) {
        newErrors.email = "Invalid email format";
      } else if (name === "newPassword" && value && !validatePassword(value)) {
        newErrors.newPassword =
          "Password must be at least 8 characters with one uppercase, one lowercase, one number, and one special character";
      } else {
        delete newErrors[name];
      }

      setErrors(newErrors);
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors: Errors = {};

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
        newErrors.newPassword =
          "Password must be at least 8 characters with one uppercase, one lowercase, one number, and one special character";
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
  }, [formData, isForgotMode, otpSent, otpVerified]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isLocked) {
      setErrors({
        server: `Account is locked. Please try again in ${lockoutTimer} seconds.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.post("/login", {
        username: formData.username.trim(),
        password: formData.password,
      });
      login(data);
      if (data.token) {
        sessionStorage.setItem("token", data.token);
        if (rememberMe && data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        } else {
          localStorage.removeItem("refreshToken");
        }
        setLoginAttempts(0);
        onLogin(data.token);
        navigate("/");
      } else {
        setErrors({ server: "Invalid response from server" });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginAttempts((prev) => {
        const newAttempts = prev + 1;
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockoutTimer(300); // 5 minutes lockout
          const timer = setInterval(() => {
            setLockoutTimer((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                setIsLocked(false);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
        return newAttempts;
      });

      setErrors({
        server:
          error.response?.data?.message ||
          error.message ||
          "An error occurred during login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await apiService.post("/request-otp", {
        email: formData.email.trim(),
      });

      if (response.success) {
        setOtpSent(true);
        setErrors({}); // Clear any existing errors
        // Start OTP expiration timer
        setTimeout(
          () => {
            if (!otpVerified) {
              setOtpSent(false);
              setErrors({
                server: "OTP has expired. Please request a new one.",
              });
            }
          },
          5 * 60 * 1000
        ); // 5 minutes expiration
      }
    } catch (error: any) {
      console.error("OTP request error:", error);
      setErrors({
        server:
          error.response?.data?.message ||
          "Error sending OTP. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateForm()) return;
    if (otpAttempts >= 3) {
      setErrors({ server: "Too many attempts. Please request a new OTP." });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.post("/verify-otp", {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
      });

      if (data.success) {
        setOtpVerified(true);
        setErrors({}); // Clear any existing errors
      } else {
        setOtpAttempts((prev) => prev + 1);
        setErrors({
          server: "Invalid OTP. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      setOtpAttempts((prev) => prev + 1);
      setErrors({
        server:
          error.response?.data?.message || "Invalid OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await apiService.post("/reset-password", {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword,
      });

      if (response.success) {
        // Clear all form data and states
        setFormData({
          username: "",
          password: "",
          email: "",
          otp: "",
          newPassword: "",
        });
        setOtpSent(false);
        setOtpVerified(false);
        setOtpAttempts(0);
        setIsForgotMode(false);
        setErrors({});

        // Show success message
        alert(
          "Password reset successfully! Please log in with your new password."
        );
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      setErrors({
        server:
          error.response?.data?.message ||
          "Error resetting password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center xl:justify-between bg-[#0f0f0f] w-screen h-screen xl:p-20 lg:p-10 md:p-8 sm:p-5 p-10 relative">
      {isLoading && <Progressmenu message="Processing your request..." />}
      {isForgotMode ? (
        <>
          <div className="rounded-full xl:w-40 xl:h-40 lg:w-30 lg:h-30 w-20 h-20 absolute top-[70vh] right-2 z-0 login-circle3"></div>
          <div className="rounded-full xl:w-60 xl:h-60 lg:w-50 lg:h-50 w-40 h-40 absolute top-[10vh] right-[20vw] z-0 login-circle4"></div>
        </>
      ) : (
        <>
          <div className="rounded-full xl:w-40 xl:h-40 lg:w-30 lg:h-30 w-20 h-20 absolute top-[70vh] right-2 z-0 login-circle1"></div>
          <div className="rounded-full xl:w-60 xl:h-60 lg:w-50 lg:h-50 w-40 h-40 absolute top-[10vh] right-[20vw] z-0 login-circle2"></div>
        </>
      )}

      <div className="text-white w-full sm:w-[65%] xl:block lg:block md:block sm:hidden hidden">
        <h1 className="xl:text-6xl lg:text-5xl md:text-4xl sm:text-3xl text-2xl font-bold mb-4">
          Welcome Back..!
        </h1>
        <div className="flex items-center">
          <h3 className="xl:text-2xl lg:text-xl md:text-lg sm:text-base text-sm font-bold border w-[250px] flex items-center justify-center py-1">
            Wijesinghe Genuine
          </h3>
          <div className="bg-white xl:w-[400px] lg:w-[300px] md:w-[150px] sm:w-[100px] w-[80px] h-[1px] ms-2"></div>
          <i
            className="bx bxs-chevron-right xl:text-4xl lg:text-3xl md:text-2xl sm:text-xl text-lg"
            aria-label="Arrow right"
          ></i>
        </div>
      </div>
      {isForgotMode ? (
        <div className="w-full max-w-md py-10 px-7 rounded shadow-md login-card z-10 flex flex-col justify-center">
          {errors.server && (
            <p className="text-red-500 text-sm mb-2">{errors.server}</p>
          )}
          {!otpSent ? (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">
                Forgot Password?
              </h2>
              <h2 className="text-xs font-semibold text-white mb-4">
                No need to worry..!
              </h2>
              <label htmlFor="email" className="text-white text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
                placeholder="Email"
                required
                aria-required="true"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mb-2">{errors.email}</p>
              )}
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
              <h2 className="text-2xl font-semibold text-white mb-4">
                Verify OTP
              </h2>
              <Otpinput value={formData.otp} onChange={handleInputChange} />
              {errors.otp && (
                <p className="text-red-500 text-sm mb-2">{errors.otp}</p>
              )}
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
              <h2 className="text-2xl font-semibold text-white mb-4">
                Reset Password
              </h2>
              <label htmlFor="newPassword" className="text-white text-sm">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="New Password"
                  className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-[#ff6300] focus:border-[#ff6300] block w-full p-2.5 pr-10 mb-4"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#ff6300] transition-colors mb-4"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  <i
                    className={`bx ${showNewPassword ? "bx-hide" : "bx-show"} text-lg`}
                  ></i>
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm mb-2">
                  {errors.newPassword}
                </p>
              )}
              <button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="verify-btn text-white p-2 rounded w-full disabled:opacity-50"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          )}
          <p
            className="text-center text-gray-200 text-xs mt-2 cursor-pointer"
            onClick={() => setIsForgotMode(false)}
          >
            <i className="bx bx-left-arrow-alt" aria-label="Go back"></i> Go
            back
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md xl:h-[80vh] lg:h-[70vh] md:h-[70vh] sm:h-[60vh] h-[60vh] py-10 px-7 rounded shadow-md login-card z-10 flex flex-col justify-center"
        >
          <h2 className="text-2xl font-semibold text-white mb-1">Login</h2>
          <h2 className="text-xs font-semibold text-white mb-4">
            Glad you're back..!
          </h2>
          {errors.server && (
            <p className="text-red-500 text-sm mb-2">{errors.server}</p>
          )}
          <label htmlFor="username" className="text-white text-sm">
            Username/Email
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
            placeholder="Username"
            required
            aria-required="true"
          />
          {errors.username && (
            <p className="text-red-500 text-sm mb-2">{errors.username}</p>
          )}
          <label htmlFor="password" className="text-white text-sm">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-[#ff6300] focus:border-[#ff6300] block w-full p-2.5 pr-10 mb-3"
              placeholder="Password"
              required
              aria-required="true"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#ff6300] transition-colors mb-3"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i
                className={`bx ${showPassword ? "bx-hide" : "bx-show"} text-lg`}
              ></i>
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mb-2">{errors.password}</p>
          )}
          <div className="flex items-center mb-3 text-white text-xs">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe" className="ms-1">
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
            Forgot password?
          </p>
        </form>
      )}
    </div>
  );
};

export default Login;
