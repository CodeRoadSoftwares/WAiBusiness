import React, { useEffect } from "react";
import { useGetWhatsappSessionStatusQuery } from "./api/whatsappSessionApi";
import { useWhatsappSocket } from "./hooks/useWhatsappSocket";
import StatusDisplay from "./components/StatusDisplay";
import QRCode from "./components/QRCode";

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
    qrTimeRemaining,
    startSession,
    stopSession,
    checkStatus,
    connectSocket,
  } = useWhatsappSocket();

  // Use socket status if available, otherwise fall back to API data
  const currentStatus =
    socketStatus !== "disconnected"
      ? socketStatus
      : data?.status || "disconnected";
  const currentPhoneNumber = socketPhoneNumber || data?.phoneNumber;
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

  const handleDisconnect = () => {
    stopSession();
  };

  const handleRefreshQR = () => {
    startSession();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 border border-gray-100">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Connecting to WhatsApp
          </h2>
          <p className="text-gray-600 text-lg">
            Please wait while we establish your connection...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 border border-gray-100 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
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
            className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full shadow-2xl mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Link WhatsApp Device
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Connect your WhatsApp account to start managing messages and
            campaigns with our professional platform
          </p>
        </div>

        {/* Error Display */}
        {currentError && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Connection Error
                </h3>
                <p className="text-red-700">{currentError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Status Display */}
          <div className="order-2 xl:order-1">
            <StatusDisplay
              status={currentStatus}
              phoneNumber={currentPhoneNumber}
              lastConnected={data?.lastConnected}
              isActive={data?.isActive}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnecting={isConnecting}
            />
          </div>

          {/* QR Code or Connection Info */}
          <div className="order-1 xl:order-2">
            {currentStatus === "pairing" && qrCode && (
              <QRCode
                qrCode={qrCode}
                timeRemaining={qrTimeRemaining}
                onRefresh={handleRefreshQR}
              />
            )}

            {currentStatus === "pairing" && !qrCode && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                  <div className="absolute inset-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Preparing QR Code
                </h3>
                <p className="text-gray-600 text-lg">
                  Please wait while we generate your WhatsApp QR code...
                </p>
              </div>
            )}

            {currentStatus === "connected" && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  WhatsApp Connected!
                </h3>
                <p className="text-gray-600 mb-4 text-lg">
                  Your WhatsApp account is now linked and ready to use.
                </p>
                {currentPhoneNumber && (
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-full">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      {currentPhoneNumber}
                    </span>
                  </div>
                )}
              </div>
            )}

            {currentStatus === "disconnected" && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Ready to Connect
                </h3>
                <p className="text-gray-600 text-lg">
                  Click the "Connect WhatsApp" button to start linking your
                  device.
                </p>
              </div>
            )}

            {currentStatus === "timeout" && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-orange-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  QR Code Expired
                </h3>
                <p className="text-gray-600 mb-4 text-lg">
                  The QR code has expired. Click "Try Again" to generate a new
                  one.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* How it Works Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Generate QR Code
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Click connect to generate a unique QR code for your WhatsApp
                account
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Scan with Phone
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Open WhatsApp on your phone and scan the QR code to link your
                account
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Start Managing
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Once connected, you can manage messages and campaigns from your
                dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LinkDevice;
