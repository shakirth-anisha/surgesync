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



const App = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [language, setLanguage] = useState("English");

  let businessList = [
      {
        name: "KSIT",
        address: "14, Kanakapura Main Rd, Raghuvanahalli, Bangalore City Municipal Corporation Layout, Bengaluru, Karnataka 560109",
        mapLink: "https://maps.app.goo.gl/NYdxw365JrCfCECP7",
        lat: 12.8793812,
        lon: 77.5417201,
        distance: 0
      },
    {
      name: "PES University",
      address: "100 Feet Ring Road, Banashankari Stage III, Dwaraka Nagar, Banashankari, Bengaluru, Karnataka 560085",
      mapLink: "https://maps.app.goo.gl/h3aMipore3qmLaUw5",
      lat: 12.9350869,
      lon: 77.5311698,
      distance: 13.5
    },
    {
      name: "R. V. College of Engineering",
      address: "Mysore Rd, RV Vidyaniketan, Post, Bengaluru, Karnataka 560059",
      mapLink: "https://maps.app.goo.gl/4AneBs9Jaks6rNgt6bG5k",
      lat: 12.9237583,
      lon: 77.4965718,
      distance: 15.5
    },
    {
        name: "REVA University",
        address: "Rukmini Knowledge Park, Yelahanka, Kattigenahalli, Bengaluru, Sathanur, Karnataka 560064",
        mapLink: "https://maps.app.goo.gl/p6z92eFg8Q3ev92B7",
        lat: 13.1168797,
        lon: 77.6297409,
        distance: 25.5
    },
    {
      name: "JSS Academy Of Technical Education",
      address: "Uttarahalli-Kengeri Main Road, JSS Campus Rd, Srinivaspura, Bengaluru",
      mapLink: "https://maps.app.goo.gl/EAUYpxKQCnxVgZSz5",
      lat: 12.9030349,
      lon: 77.5021693,
      distance: 10.5
    }
  ]

  const [businesses, setBusinesses] = useState([]);

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
              console.log("Updated Response:", updatedResponse);

              setBusinesses(updatedResponse);
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
