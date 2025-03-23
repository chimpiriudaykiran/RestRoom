import React, { useState, useRef, useEffect } from "react";
import "./Homepage.css"; // Import your CSS file here
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // Make sure i18next is initialized in your project
import LanguageSelector from "../../Translations/language-selector"; // Adjust the path as needed
import { Loader } from '@googlemaps/js-api-loader';
import { Form, Button, InputGroup, Container, Row, Col } from 'react-bootstrap';
import { useTextSize } from '../../TextSizeContext.js';

function Homepage() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { scaleFactor } = useTextSize();

  const handleSearch = () => {
    if (searchQuery.trim()) { // Ensure the query is not empty
        navigate(`/dashboard?address=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleEnterKey = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearchByLocation = () => {
    navigate("/dashboard?useLocation=true");
  };

  const handleAddRestroom = () => {
    navigate("/add-restroom");
  };

  useEffect(() => {
    const loader = new Loader({
      apiKey: 'AIzaSyBl4DjPd_GM9redJ-bjzPWEGJOtcPKVjrM',
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
  }, []); // Empty dependency array means this effect will only run once when the component mounts

  return (
    <Container className="page">
      <div style={{display: 'flex', flexDirection: 'row-reverse', padding: '5px 0px'}}><LanguageSelector /></div>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
                    padding: '7px',
                    height: '50px', position: 'fixed', left: '0px'}}>
              <img
                src="/assets/Main Logo.PNG"
                className="logo"
                alt="logo"
                style={{cursor: 'pointer', 
                  height: '36px'}}
                onClick={() => window.location.href = '/'}
              />
          <div style={{cursor: 'pointer', display: "flex", fontSize: `${30 * scaleFactor}px`, color: 'white',justifyContent:'center', flexDirection:'column'}}
            onClick={() => window.location.href = '/'}>
              {t("global.header.name")}
            </div>
     </div>
      <Row className="welcome-container text-center">
        <Col>
          <h1>{t("global.landing.title")}</h1>
          <h2>{t("global.landing.description")}</h2>
          <InputGroup className="mb-3 search-bar-container">
            <Form.Control
              ref={searchInputRef}
              type="text"
              placeholder={t("global.landing.searchbar")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleEnterKey}
              className="search-input"
            />
            <Button variant="primary" onClick={handleSearch} className="search-button">
              <FontAwesomeIcon icon={faSearch} />
            </Button>
            <Button variant="secondary" onClick={handleSearchByLocation} className="location-button">
              <FontAwesomeIcon icon={faCrosshairs} />
            </Button>
          </InputGroup>
          <Button variant="success" onClick={handleAddRestroom} className="add-restroom-button">
            {t("global.landing.addrestroom")}
          </Button>
        </Col>
      </Row>
      <hr style={{ color: "white" }} />
      <footer className="footer text-center">Made with ❤️ by Team Hex</footer>
    </Container>
  );
}

export default Homepage;
