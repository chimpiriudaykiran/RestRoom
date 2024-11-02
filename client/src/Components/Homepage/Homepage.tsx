import React, { useState, useRef, useEffect } from "react";
import "./Homepage.css"; // Import your CSS file here
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // Make sure i18next is initialized in your project
import LanguageSelector from "../../Translations/language-selector"; // Adjust the path as needed
import { Loader } from '@googlemaps/js-api-loader';

function Homepage() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) { // Ensure the query is not empty
      console.log("Search query:", searchQuery); // For debugging
        navigate(`/dashboard?address=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleEnterKey = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearchByLocation = () => {
    console.log("Search by location clicked");
    navigate("/dashboard?useLocation=true");
  };

  const handleAddRestroom = () => {
    // Implementation needed
    navigate("/add-restroom");
  };

  useEffect(() => {
    const loader = new Loader({
      apiKey: 'AIzaSyDaTix-YpKD6GHuumhE0s-XXkzOgKQpC5U',
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    let autocomplete;

    const handleAutocompleteSelect = (selectedAddress) => {
      console.log("Selected address:", selectedAddress); // For debugging
      navigate(`/dashboard?address=${encodeURIComponent(selectedAddress)}`);
    };
    
    loader.load().then(() => {
      if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            handleAutocompleteSelect(place.formatted_address);
          }
        });
      }
    });
  
    // Clean up function to remove the autocomplete listener
    return () => {
      if (autocomplete) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this effect will only run once when the component mounts
  

  return (
    <div className="page">
      <LanguageSelector />
      <div className="title"><h1>{t("global.landing.title")}</h1>
        <h1 style={{marginTop:'-15px'}}>{t("global.landing.description")}</h1></div>
      <div className="welcome-container">
        
        <div className="search-bar-container">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t("global.landing.searchbar")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleEnterKey}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            <FontAwesomeIcon icon={faSearch} />
          </button>
          <button onClick={handleSearchByLocation} className="location-button">
            <FontAwesomeIcon icon={faCrosshairs} />
          </button>
        </div>
      <button onClick={handleAddRestroom} className="add-restroom-button">
        {t("global.landing.addrestroom")}
      </button>
      <div className="restroom-image">
        <img
          src="/assets/testing.png"  // Updated path to the new image
          alt={t("global.restroomSignAlt")} // Make sure this text is appropriate for the new image
          className="restroom-image"
        />
      </div>
    </div>
    <footer className="footer">Made with ❤️ by Team Hex</footer>
  </div>
  );
}

export default Homepage;
