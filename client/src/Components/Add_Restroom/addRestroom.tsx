import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTextSize } from '../../TextSizeContext.js';
import { db } from "../../firebase.ts";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Button } from 'react-bootstrap';
import './addRestroom.css';
import LanguageSelector from "../../Translations/language-selector";

function AddRestroom() {
  let navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [formState, setFormState] = useState({
    name: '',
    address: '',
    accessible: '',
    unisex: '',
    changingTable: '',
    directions: '',
    comments: '',
    created_at: '',
    latitude: '',
    longitude: '',
    thumbs_up: 0,
    thumbs_down: 0
  });

  const [states, setStates] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    // Fetch US states
    axios.get('https://api.sampleapis.com/addresses/states')
      .then(response => setStates(response.data))
      .catch(error => console.error('Error fetching states:', error));

    // Fetch countries
    axios.get('https://restcountries.com/v3.1/all')
      .then(response => {
        const countryList = response.data.map(country => country.name.common).sort();
        setCountries(countryList);
      })
      .catch(error => console.error('Error fetching countries:', error));
  }, []);

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { address } = formState;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyCIkDyu_9cY97ciYB5H6tdjOTPwpNMec90`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const latitude = location.lat;
        const longitude = location.lng;
        const timestamp = serverTimestamp();
        const formDataWithTimestamp = { ...formState, latitude, longitude, created_at: timestamp };
        const docRef = await addDoc(collection(db, 'restrooms'), formDataWithTimestamp);
        console.log("Document written with ID: ", docRef.id);
        navigate('/dashboard');
      } else {
        console.error("Error geocoding address: Address not found");
      }
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const { t } = useTranslation();
  const { scaleFactor } = useTextSize();

  useEffect(() => {
    const loader = new Loader({
      apiKey: 'AIzaSyCIkDyu_9cY97ciYB5H6tdjOTPwpNMec90',
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader.load().then(() => {
      if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          setFormState(prevState => ({
            ...prevState,
            address: place.formatted_address || place.name // Update address in formState
          }));
        });
      }
    });

    // Cleanup function to remove the autocomplete listener
    return () => {
      if (window.google && window.google.maps && window.google.maps.event && searchInputRef.current) {
        window.google.maps.event.clearInstanceListeners(searchInputRef.current);
      }
    };
  }, []); // Empty dependency array means this effect will only run once when the component mounts

  
  return (
    <div
    className="dashboard"
    style={{
      overflow: "hidden",
      position: "absolute",
      width: "100%",
      height: "100%",
    }}
  >
    <div className="topbar">
        <img
          src="/assets/Main Logo.PNG"
          className="logo"
          alt="logo"
          style={{ cursor: "pointer" }}
          onClick={() => (window.location.href = "/")}
        />
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            fontSize: `${30 * scaleFactor}px`,
            color: "white",
            justifyContent: "center",
            flexDirection: "column",
          }}
          onClick={() => (window.location.href = "/")}
        >
          {t("global.header.name")}
        </div>
        <div style={{display: 'flex', flexDirection: 'row-reverse', flex: 1, padding: '0px 37px'}}><LanguageSelector /></div>
      </div>
    <div className="d-flex justify-content-center" style={{ width: '100%' }}>
      
      {/* <div className="card" style={{ backgroundColor: 'white', width: '100%', height:'100%', display: 'block', position: 'absolute' }}> */}
        <form onSubmit={handleSubmit} className="add-restroom-form" style={{ backgroundColor: 'white'}}>
          <h2 style={{ fontSize: `${24 * scaleFactor}px` }}>{t("global.addrestroom.title")}</h2>

          <div className="mb-2">
            <label className="form-label" style={{ fontSize: `${16 * scaleFactor}px` }}>
              {t("global.addrestroom.name")}
            </label>
            <input 
              type="text" 
              name="name" 
              value={formState.name} 
              onChange={handleChange} 
              className="form-control" 
              required 
            />
          </div>

          <div className="mb-2">
            <label className="form-label" style={{ fontSize: `${16 * scaleFactor}px` }}>
              {t("global.addrestroom.address")}
            </label>
            <input
              ref={searchInputRef}
              type="text"
              name="address"
              placeholder={t("global.landing.searchbar")}
              value={formState.address}
              onChange={handleChange}
              className="form-control"
              required 
            />
          </div>

          <div className="row mb-2">
            <div className="col">
              <label className="form-label" style={{ fontSize: `${16 * scaleFactor}px` }}>
                {t("global.addrestroom.accessible")}
              </label>
              <select 
                name="accessible" 
                value={formState.accessible} 
                onChange={handleChange} 
                className="form-select" 
                required
              >
                <option value="">{t("global.addrestroom.option")}</option>
                <option value="Yes">{t("global.addrestroom.yes")}</option>
                <option value="No">{t("global.addrestroom.no")}</option>
              </select>
            </div>

            <div className="col">
              <label className="form-label" style={{ fontSize: `${16 * scaleFactor}px` }}>
                {t("global.addrestroom.unisex")}
              </label>
              <select 
                name="unisex" 
                value={formState.unisex} 
                onChange={handleChange} 
                className="form-select" 
                required
              >
                <option value="">{t("global.addrestroom.option")}</option>
                <option value="Yes">{t("global.addrestroom.yes")}</option>
                <option value="No">{t("global.addrestroom.no")}</option>
              </select>
            </div>

            <div className="col">
              <label className="form-label" style={{ fontSize: `${16 * scaleFactor}px` }}>
                {t("global.addrestroom.changetable")}
              </label>
              <select 
                name="changingTable" 
                value={formState.changingTable} 
                onChange={handleChange} 
                className="form-select" 
                required
              >
                <option value="">{t("global.addrestroom.option")}</option>
                <option value="Yes">{t("global.addrestroom.yes")}</option>
                <option value="No">{t("global.addrestroom.no")}</option>
              </select>
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label" style={{ fontSize: `${16 * scaleFactor}px` }}>
              {t("global.addrestroom.directions")}
            </label>
            <textarea 
              name="directions" 
              placeholder={t("global.addrestroom.dirdesc")} 
              value={formState.directions}
              onChange={handleChange} 
              className="form-control" 
              style={{ fontSize: `${13 * scaleFactor}px` }} 
            />
          </div>

          <div className="mb-2">
            <label className="form-label" style={{ fontSize: `${16 * scaleFactor}px` }}>
              {t("global.addrestroom.comment")}
            </label>
            <textarea 
              name="comments" 
              placeholder={t("global.addrestroom.commdesc")} 
              value={formState.comments}
              onChange={handleChange} 
              className="form-control" 
              style={{ fontSize: `${13 * scaleFactor}px` }} 
            />
          </div>
          <br></br>
          <div className="d-flex">
            <button type="submit" className="btn btn-primary" style={{ fontSize: `${13 * scaleFactor}px` }}>
              {t("global.addrestroom.submitbtn")}
            </button>
            <button type="button" className="btn btn-danger" onClick={() => navigate('/')} style={{ fontSize: `${13 * scaleFactor}px` }}>
              {t("global.addrestroom.cancel")}
            </button>
          </div>
        </form>
      </div>
    {/* </div> */}
    </div>
  );
}

export default AddRestroom;
