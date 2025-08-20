import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginMutation } from "../api/authApi";

// Zod validation schema
const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone is required")
    .min(2, "Phone must be at least 2 characters")
    .max(50, "Phone must be less than 50 characters"),
  password: z.string().min(8, "Incorrect password"),
});

// TypeScript-like type inference (even in JS)
// type RegisterFormData = z.infer<typeof registerSchema>;

function Login() {
  const [login, { isLoading, isError, error, isSuccess }] = useLoginMutation();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    // Removed: watch, // Fixed: removed unused variable
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange", // Validate on change for better UX
  });

  const onSubmit = async (data) => {
    try {
      const userData = data;

      const result = await login(userData).unwrap();
      console.log("Login successful:", result);

      // Clear form on success
      reset();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in to WAi Business
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join WAiBusiness today
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Success Message */}
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Login successful! Welcome to WAiBusiness.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {error?.data?.error ||
                      error?.error ||
                      "Registration failed. Please try again."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                {...registerField("phone")}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.phone ? "border-red-300" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password *
              </label>
              <input
                id="password"
                type="password"
                {...registerField("password")}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.password ? "border-red-300" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password Cannot be empty
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <span>Signing in...</span>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
