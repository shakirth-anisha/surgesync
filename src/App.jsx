import React, { useState } from "react";
import "./App.css";
import businesses from "./businesses.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [language, setLanguage] = useState("English"); // Default language

  const showToast = (name) => {
    toast.success(`Opening ${name} in Google Maps!`, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      className: "custom-toast",
    });
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowDropdown(false); // Hide dropdown after selection

    console.log(`You selected: ${language}`); // Log selected language
  };

  return (
    <div className="main">
      <div className="container">
        {/* Toast Container */}
        <ToastContainer className="toast-container" />

        {/* Header with SVGs */}
        <div className="header">
          <img src="/top.svg" alt="Top Logo" className="logo left" />
          <div className="globe-container">
            <div className="globe-icon" onClick={() => setShowDropdown(!showDropdown)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>

            {/* Language Dropdown */}
            {showDropdown && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={() => handleLanguageChange("English")}>
                  English
                </div>
                <div className="dropdown-item" onClick={() => handleLanguageChange("Kannada")}>
                  ಕನ್ನಡ
                </div>
                <div className="dropdown-item" onClick={() => handleLanguageChange("Hindi")}>
                  हिन्दी
                </div>
                <div className="dropdown-item" onClick={() => handleLanguageChange("Spanish")}>
                  Español
                </div>
                <div className="dropdown-item" onClick={() => handleLanguageChange("French")}>
                  Français
                </div>
                <div className="dropdown-item" onClick={() => handleLanguageChange("German")}>
                  Deutsch
                </div>
                <div className="dropdown-item" onClick={() => handleLanguageChange("Chinese")}>
                  中文
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="content-wrapper">
          {businesses.map((business, index) => (
            <div key={index} className="info-box">
              <h2 className="name">{business.name}</h2>
              <p className="address">{business.address}</p>
              <button
                className="map-button"
                onClick={() => {
                  showToast(business.name);
                  window.open(business.mapLink, "_blank");
                }}
              >
                <div className="map-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>{" "}
                  &nbsp;&nbsp; Open in Google Maps
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
