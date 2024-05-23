import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";

const TOKEN_VALIDATE_URL = "http://127.0.0.1:8000/auth/verify-token";

const PrivateRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const fetchAuthStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
              throw new Error('No token found');
            }
            const response = await fetch(TOKEN_VALIDATE_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ token })
            });
            const responseData = await response.json();
            console.log(responseData); // Log the raw response data for debugging
            if (responseData === "Token verified successfully") {
              setIsAuthenticated(true);
            } else {
              throw new Error('Failed to validate token');
            }
          } catch (error) {
            console.log("Error...", error);
            setIsAuthenticated(false);
          }
    };

    fetchAuthStatus();

    // Start polling for token validity
    const pollTokenValidity = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          clearInterval(pollTokenValidity);
          setIsAuthenticated(false);
          return;
        }
        const response = await fetch(TOKEN_VALIDATE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        const isValid = await response.ok;
        if (!isValid) {
          clearInterval(pollTokenValidity);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error polling token validity:", error);
        clearInterval(pollTokenValidity);
        setIsAuthenticated(false);
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup function to clear interval on component unmount
    return () => clearInterval(pollTokenValidity);
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoutes;
