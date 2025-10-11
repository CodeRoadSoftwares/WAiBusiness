import React from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import openapiSpec from "../api/openapi.json";
import { Link } from "react-router-dom";
import Div from "@/shared/components/Div";

const ApiDocumentation = () => {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Div size="xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              WhatsApp Business API Documentation
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Use this API to send WhatsApp messages from your applications. Get
              your API key from your{" "}
              <Link
                to="/profile"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                profile
              </Link>
              .
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Important Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        All endpoints require authentication via{" "}
                        <code className="bg-blue-100 px-1 rounded">
                          X-API-Key
                        </code>{" "}
                        header
                      </li>
                      <li>Rate limit: 100 requests per minute per API key</li>
                      <li>
                        All endpoints are prefixed with{" "}
                        <code className="bg-blue-100 px-1 rounded">
                          /messages
                        </code>
                      </li>
                      <li>
                        Phone numbers can be provided with or without a country code. If no country code is specified, Indian (+91) numbers will be assumed by default.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="swagger-ui-container">
            <SwaggerUI
              spec={openapiSpec}
              deepLinking={true}
              displayOperationId={false}
              defaultModelsExpandDepth={1}
              defaultModelExpandDepth={1}
              docExpansion="list"
              supportedSubmitMethods={["get", "post", "put", "delete", "patch"]}
              tryItOutEnabled={true}
              requestInterceptor={(request) => {
                // Add any custom request interceptor logic here if needed
                return request;
              }}
              responseInterceptor={(response) => {
                // Add any custom response interceptor logic here if needed
                return response;
              }}
            />
          </div>
        </Div>
      </div>
    </div>
  );
};

export default ApiDocumentation;
