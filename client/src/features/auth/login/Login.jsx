import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginMutation } from "../api/authApi";
import { Eye, EyeOff } from "lucide-react";

// Zod validation schema
const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone is required")
    .min(2, "Phone must be at least 2 characters")
    .max(50, "Phone must be less than 50 characters"),
  password: z.string().min(8, "Incorrect password"),
});

function Login() {
  const [login, { isLoading, isError, error, isSuccess }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      const userData = data;
      const result = await login(userData).unwrap();
      console.log("Login successful:", result);
      reset();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-wa-bg-app-light via-wa-bg-panel-light to-wa-bg-chat-light dark:from-wa-bg-app-dark dark:via-wa-bg-panel-dark dark:to-wa-bg-chat-dark">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2325D366' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        ></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-wa-brand/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-wa-brandDark/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-wa-link-light/10 rounded-full blur-xl animate-pulse delay-2000"></div>
      <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-wa-brand/10 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Login Form Card */}
          <div className="bg-white/80 dark:bg-wa-bg-panel-dark/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-400 dark:border-wa-border-dark/20 p-8 relative overflow-hidden">
            {/* Card Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-wa-brand/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-wa-brandDark/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative z-10">
              {/* Header inside form */}
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-wa-brand to-wa-brandDark rounded-2xl shadow-2xl transform rotate-3"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-wa-brand to-wa-brandDark rounded-2xl shadow-lg flex items-center justify-center transform -rotate-3">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-wa-text-primary-light to-wa-text-secondary-light dark:from-wa-text-primary-dark dark:to-wa-text-secondary-dark bg-clip-text text-transparent mb-2">
                  WAi Business
                </h1>
                <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-base">
                  Welcome back! Sign in to continue
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Success Message */}
                {isSuccess && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Login successful! Welcome to WAiBusiness.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {isError && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          {error?.data?.error ||
                            error?.error ||
                            "Login failed. Please try again."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Phone Number Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-wa-text-secondary-light dark:text-wa-text-secondary-dark"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        {...registerField("phone")}
                        className={`block w-full pl-12 pr-4 py-4 bg-wa-bg-panel-light/50 dark:bg-wa-bg-panel-dark/50 border-2 rounded-2xl text-wa-text-primary-light dark:text-wa-text-primary-dark placeholder-wa-text-secondary-light dark:placeholder-wa-text-secondary-dark focus:outline-none focus:ring-0 transition-all duration-200 ${
                          errors.phone
                            ? "border-red-400 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                            : "border-wa-border-light dark:border-wa-border-dark focus:border-wa-brand focus:ring-4 focus:ring-wa-brand/10 dark:focus:ring-wa-brand/20"
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500 dark:text-red-400 animate-in slide-in-from-top-1 duration-200">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-wa-text-primary-light dark:text-wa-text-primary-dark"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-wa-text-secondary-light dark:text-wa-text-secondary-dark"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...registerField("password")}
                        className={`block w-full pl-12 pr-12 py-4 bg-wa-bg-panel-light/50 dark:bg-wa-bg-panel-dark/50 border-2 rounded-2xl text-wa-text-primary-light dark:text-wa-text-primary-dark placeholder-wa-text-secondary-light dark:placeholder-wa-text-secondary-dark focus:outline-none focus:ring-0 transition-all duration-200 ${
                          errors.password
                            ? "border-red-400 focus:border-red-500 dark:border-red-600 dark:focus:border-red-500"
                            : "border-wa-border-light dark:border-wa-border-dark focus:border-wa-brand focus:ring-4 focus:ring-wa-brand/10 dark:focus:ring-wa-brand/20"
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:text-wa-brand transition-colors duration-200" />
                        ) : (
                          <Eye className="w-5 h-5 text-wa-text-secondary-light dark:text-wa-text-secondary-dark hover:text-wa-brand transition-colors duration-200" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 dark:text-red-400 animate-in slide-in-from-top-1 duration-200">
                        {errors.password.message}
                      </p>
                    )}
                    <p className="text-xs text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
                      Password must be at least 8 characters
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="group relative w-full flex justify-center items-center py-4 px-6 
                    bg-wa-brand text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform  focus:outline-none focus:ring-4 focus:ring-wa-brand/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                  >
                    {isSubmitting || isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Sign in to WAi Business</span>
                        <svg
                          className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-wa-text-secondary-light dark:text-wa-text-secondary-dark">
              © {new Date().getFullYear()} WAi Business. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
