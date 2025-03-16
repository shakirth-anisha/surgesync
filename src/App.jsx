import { useState, useEffect } from "react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import $ from 'jquery';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


function translateTextTo(text, fromLanguage, toLanguage) {
  if (fromLanguage === toLanguage) {
    return text;
  }
  const options = {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": "8c0a77b2-0670-4150-aaed-8072b1fbe7dc"
    },
    body: JSON.stringify({
      "input": text,
      "source_language_code": fromLanguage,
      "target_language_code": toLanguage,
      "speaker_gender": "Male",
      "mode": "formal",
      "model": "mayura:v1",
      "enable_preprocessing": false,
      "output_script": "fully-native",
      "numerals_format": "international"
    })
  };

  return fetch('https://api.sarvam.ai/translate', options)
    .then(response => response.json())
    .then(response => {
      if (response && response.translated_text) {
        return response.translated_text;
      } else {
        console.error("Unexpected response format:", response);
        return null;
      }
    })
    .catch(err => {
      console.error(err);
      return null;
    });
}


const App = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [language, setLanguage] = useState("English");

  const [businesses, setBusinesses] = useState([]);
  const [untranslatedBusinesses, setUntranslatedBusinesses] = useState([]);
  const [mapOpen, setMapOpen] = useState("Open in Google Maps");

  $.ajax({
    url: "http://141.148.195.240:5000/list",
    method: "GET",
    success: (response) => {
      if (Array.isArray(response)) {
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLat = position.coords.latitude;
              const userLon = position.coords.longitude;

              let updatedResponse = response.map((business) => {
                const distance = getDistanceFromLatLonInKm(
                  userLat,
                  userLon,
                  business.lat,
                  business.lon
                );
                return {
                  ...business,
                  distance: distance.toFixed(2),
                };
              }
              );
              updatedResponse.sort((a, b) => a.distance - b.distance);
              if (updatedResponse!=untranslatedBusinesses) {
                setUntranslatedBusinesses(updatedResponse);
                updatedResponse.forEach((business) => {
                  business.name = translateTextTo(business.name, "en-IN", languages[language])
                  business.address = translateTextTo(business.address, "en-IN", languages[language])
                }
                );
                setBusinesses(updatedResponse);
              }
            },
            (error) => {
              console.error("Error getting user location:", error);
            }
          );
        } else {
          console.error("Geolocation is not supported by this browser.");
        }
      } else {
        console.error("Unexpected response format:", response);
      }
    },
    error: (error) => {
      console.error("Error fetching business list:", error);
    },
  });

  let languages = {
    English: "en-IN",
    हिंदी: "hi-IN",
    বাংলা: "bn-IN",
    తెలుగు: "te-IN",
    தமிழ்: "ta-IN",
    ಕನ್ನಡ: "kn-IN",
    മലയാളം: "ml-IN",
    मराठी: "mr-IN",
    ગુજરાતી: "gu-IN",
    ਪੰਜਾਬੀ: "pa-IN",
  }

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
    let oldLanguage = language;
    let newLanguage = lang;
    let newBusinesses = [...untranslatedBusinesses]; 
    newBusinesses.forEach((business) => {
      translateTextTo(business.name, languages[oldLanguage], languages[newLanguage])
        .then((translatedName) => {
          if (translatedName) {
            console.log(translatedName);
            business.name = translatedName;
          }
        });
      translateTextTo(business.address, languages[oldLanguage], languages[newLanguage])
        .then((translatedAddress) => {
          if (translatedAddress) {
            console.log(translatedAddress);
            business.address = translatedAddress;
          }
        });
    });

    setMapOpen(translateTextTo("Open in Google Maps", languages[oldLanguage], languages[newLanguage]));
    console.log(newBusinesses);
    setBusinesses(newBusinesses);
    setLanguage(lang);
    setShowDropdown(false); // Hide dropdown after selection

    console.log(`You selected: ${language}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".globe-container")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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

            {showDropdown && (
              <div className="dropdown">
                {Object.keys(languages).map((lang) => (
                  <div
                    key={lang}
                    className="dropdown-item"
                    onClick={() => handleLanguageChange(lang)}
                  >
                    {lang}
                  </div>
                ))}
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
              <p className="distance">Distance: {business.distance} km</p>
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
                  &nbsp;&nbsp; {mapOpen}
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
