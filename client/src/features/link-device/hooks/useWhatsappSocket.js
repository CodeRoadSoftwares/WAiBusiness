import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

export function useWhatsappSocket() {
  const [status, setStatus] = useState("disconnected");
  const [qrCode, setQrCode] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(null);

  const socketRef = useRef(null);
  const qrTimerRef = useRef(null);
  const expiryTimerRef = useRef(null);

  // Cleanup timers
  const clearTimers = useCallback(() => {
    if (qrTimerRef.current) {
      clearInterval(qrTimerRef.current);
      qrTimerRef.current = null;
    }
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  // Connect to WebSocket - cookies will be sent automatically
  const connectSocket = useCallback(() => {
    try {
      // Socket.IO should connect to the server root, not the API path
      // Extract the base URL without the /api part
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const socketUrl = apiUrl.replace(/\/api$/, ""); // Remove /api if present

      console.log("API Base URL:", apiUrl);
      console.log("pairing to Socket.IO server:", socketUrl);

      // Try pairing to the root namespace explicitly
      const socket = io(socketUrl, {
        // Remove the trailing slash
        withCredentials: true, // This ensures cookies are sent
        transports: ["websocket", "polling"],
        forceNew: true,
        timeout: 20000,
        autoConnect: true,
      });

      // Add connection state logging
      socket.on("pairing", () => {
        console.log("Socket pairing...");
      });

      socket.on("connect", () => {
        console.log("WebSocket connected successfully");
        setError(null);
      });

      socket.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason);
        setStatus("disconnected");
        setIsConnecting(false);
        clearTimers();
      });

      socket.on("connect_error", (err) => {
        console.error("WebSocket connection error:", err);
        console.error("Error details:", {
          message: err.message,
          description: err.description,
          context: err.context,
          type: err.type,
        });

        if (err.message === "Unauthorized") {
          setError("Authentication failed. Please login again.");
        } else if (err.message === "Invalid namespace") {
          setError("Server configuration error. Please try again later.");
        } else {
          setError(`Failed to connect to server: ${err.message}`);
        }
        setIsConnecting(false);
      });

      socket.on("whatsapp-session-update", (update) => {
        console.log("WhatsApp session update:", update);

        switch (update.status) {
          case "pairing":
            setStatus("pairing");
            setIsConnecting(true);
            setError(null);
            setQrCode(null);
            setQrExpiry(null);
            clearTimers();
            break;

          case "connected":
            setStatus("connected");
            setIsConnecting(false);
            setQrCode(null);
            setQrExpiry(null);
            setPhoneNumber(update.phoneNumber);
            setError(null);
            clearTimers();
            break;

          case "disconnected":
            setStatus("disconnected");
            setIsConnecting(false);
            setQrCode(null);
            setQrExpiry(null);
            setPhoneNumber(null);
            setError(null);
            clearTimers();
            break;

          case "timeout":
            setStatus("timeout");
            setIsConnecting(false);
            setQrCode(null);
            setQrExpiry(null);
            setError("QR code expired. Please try again.");
            clearTimers();
            break;

          case "error":
            setStatus("error");
            setIsConnecting(false);
            setQrCode(null);
            setQrExpiry(null);
            setError(update.message || "An error occurred");
            clearTimers();
            break;

          case "unauthorized":
            setStatus("unauthorized");
            setIsConnecting(false);
            setQrCode(null);
            setQrExpiry(null);
            setError("Unauthorized. Please login again.");
            clearTimers();
            break;

          default:
            break;
        }

        // Handle QR code with expiry
        if (update.qr) {
          setQrCode(update.qr);
          setQrExpiry(Date.now() + 120000); // 2 minutes from now

          // Start countdown timer
          if (qrTimerRef.current) clearInterval(qrTimerRef.current);
          qrTimerRef.current = setInterval(() => {
            setQrExpiry((prev) => {
              if (prev && prev <= Date.now()) {
                clearTimers();
                return null;
              }
              return prev;
            });
          }, 1000);
        }
      });

      socketRef.current = socket;
      return true;
    } catch (err) {
      console.error("Failed to create socket:", err);
      setError("Failed to create connection");
      return false;
    }
  }, [clearTimers]);

  // Start WhatsApp session
  const startSession = useCallback(() => {
    if (!socketRef.current) {
      if (!connectSocket()) return;
    }

    setIsConnecting(true);
    setError(null);
    socketRef.current.emit("start-whatsapp-session");
  }, [connectSocket]);

  // Stop WhatsApp session
  const stopSession = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("stop-whatsapp-session");
    }
    setStatus("disconnected");
    setIsConnecting(false);
    setQrCode(null);
    setQrExpiry(null);
    setPhoneNumber(null);
    setError(null);
    clearTimers();
  }, [clearTimers]);

  // Check current status
  const checkStatus = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("check-whatsapp-status");
    }
  }, []);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    clearTimers();
  }, [clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
      clearTimers();
    };
  }, [disconnectSocket, clearTimers]);

  // Calculate remaining time for QR expiry
  const qrTimeRemaining = qrExpiry
    ? Math.max(0, Math.ceil((qrExpiry - Date.now()) / 1000))
    : null;

  return {
    status,
    qrCode,
    phoneNumber,
    error,
    isConnecting,
    qrTimeRemaining,
    startSession,
    stopSession,
    checkStatus,
    connectSocket,
    disconnectSocket,
  };
}
