import React, { useEffect } from "react";
import { useGetWhatsappSessionStatusQuery } from "./api/whatsappSessionApi";
import { useWhatsappSocket } from "./hooks/useWhatsappSocket";
import Div from "../../shared/components/Div";
import { TbReload } from "react-icons/tb";
import { CgSpinnerTwo } from "react-icons/cg";
import { BsThreeDotsVertical } from "react-icons/bs";
import { GrSettingsOption } from "react-icons/gr";
import { FaLink } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { FaClock } from "react-icons/fa";

function LinkDevice() {
  const { data, isLoading, isError, refetch } =
    useGetWhatsappSessionStatusQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  const {
    status: socketStatus,
    qrCode,
    phoneNumber: socketPhoneNumber,
    error: socketError,
    isConnecting,
    startSession,
    checkStatus,
    connectSocket,
  } = useWhatsappSocket();

  // Use socket status if available, otherwise fall back to API data
  const currentStatus =
    socketStatus !== "disconnected"
      ? socketStatus
      : data?.status || "disconnected";
  const currentPhoneNumber = socketPhoneNumber || data?.phoneNumber;
  const currentName = data?.name;
  const currentError = socketError;

  // Auto-connect socket when component mounts
  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  // Check status when socket connects
  useEffect(() => {
    if (socketStatus === "pairing" && !isConnecting) {
      checkStatus();
    }
  }, [socketStatus, isConnecting, checkStatus]);

  // Refresh API data when socket status changes
  useEffect(() => {
    if (socketStatus === "connected" || socketStatus === "disconnected") {
      refetch();
    }
  }, [socketStatus, refetch]);

  const handleConnect = () => {
    startSession();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Div size="2xl" className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Connecting to WhatsApp
          </h2>
          <p className="text-gray-600">
            Please wait while we establish your connection...
          </p>
        </Div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Div size="2xl" className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Connection Failed
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't establish a connection to WhatsApp. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
          >
            Try Again
          </button>
        </Div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Error Display */}
        {currentError && (
          <Div size="lg" className="mb-8 bg-red-50 border-red-200">
            <div className="flex items-center space-x-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-red-800">Connection Error</h3>
                <p className="text-red-700 text-sm">{currentError}</p>
              </div>
            </div>
          </Div>
        )}

        {/* Main WhatsApp-Style Div */}
        {currentStatus === "connected" ? (
          <div className="flex flex-col items-stretch gap-8">
            <Div size="2xl" className="flex items-center gap-4">
              <div className="bg-wa-brand/10 rounded-full border border-wa-brand/50 p-4">
                <FaLink size={48} className="text- text-wa-brand" />
              </div>
              <div className="flex flex-col items-start">
                <h3 className="text-4xl font-semibold text-center text-wa-brand">
                  Connected
                </h3>
                <span className="text-gray-500 text-xl">
                  Your WhatsApp is securely linked to WAi Business.
                </span>
              </div>
            </Div>

            <div className="flex flex-row lg:flex-row items-center gap-8">
              <Div size="2xl" className="w-1/2">
                <div className="text-gray-700 flex items-center gap-4">
                  <div className="bg-wa-brand/10 p-4 rounded-full">
                    <FaPhone size={36} className="text-wa-brand" />
                  </div>
                  <div className="flex flex-col">
                    <span>Account</span>
                    <span className="text-xl font-semibold">
                      {currentPhoneNumber}
                    </span>
                    <span className="font-semibold">{currentName}</span>
                  </div>
                </div>
              </Div>
              <Div size="2xl" className="w-1/2">
                <div className="text-gray-700 flex items-center gap-4">
                  <div className="bg-wa-brand/10 p-4 rounded-full">
                    <FaClock size={36} className="text-wa-brand" />
                  </div>
                  <div className="flex flex-col">
                    <span>Connected On</span>
                    <span className="text-xl font-semibold">
                      {data?.lastConnected
                        ? new Date(data.lastConnected).toLocaleString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                    <span className="font-semibold">
                      {data?.lastConnected
                        ? new Date(data.lastConnected).toLocaleString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              </Div>
            </div>
          </div>
        ) : (
          <Div size="2xl" className="max-w-6xl mx-auto">
            <div className="flex flex-row lg:flex-row items-center justify-between">
              {/* Left Side - Steps to Login */}
              <div>
                <h3 className="text-4xl text-gray-800 mb-6">Steps to log in</h3>

                <div className="space-y-4 text-xl">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-700">Open WhatsApp</span>
                      <img
                        src="/wa-bg-logo.png"
                        alt="WhatsApp Logo"
                        className="w-6 h-6"
                      />
                      <span className="text-gray-700">on your phone</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-700">
                          On Android tap Menu
                        </span>
                        <span className="bg-gray-100 border py-1 rounded-lg text-gray-500">
                          <BsThreeDotsVertical size={20} />
                        </span>
                        <span className="text-gray-700">
                          . On iPhone tap Setting
                        </span>
                        <span className="bg-gray-100 border py-1 rounded-lg  text-gray-500 px-1">
                          <GrSettingsOption size={20} className="rotate-45" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <span className="text-gray-700">
                      Tap Linked devices, then Link device
                    </span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <span className="text-gray-700">
                      Scan the QR code to confirm
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - QR Code or Connect Button */}
              <div className="flex justify-center items-start">
                {currentStatus === "pairing" && qrCode ? (
                  /* QR Code Display */
                  <div className="relative">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64 rounded-lg"
                    />
                  </div>
                ) : (
                  /* Connect Button (Black Box) */
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-64 h-64 bg-gray-900 rounded-2xl border-2 border-gray-700 flex flex-col items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isConnecting ? (
                      <div className="text-center text-white flex flex-col items-center justify-center gap-2">
                        <CgSpinnerTwo size={72} className="animate-spin" />
                        <span className="text-white text-lg">
                          Connecting...
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-white">
                        <TbReload size={72} />
                        <span className="text-white text-lg">
                          Click to Connect
                        </span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </Div>
        )}
      </div>
    </div>
  );
}

export default LinkDevice;
