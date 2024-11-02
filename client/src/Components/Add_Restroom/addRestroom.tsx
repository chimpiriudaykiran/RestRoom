import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTextSize } from '../../TextSizeContext.js';
import { db } from "../../firebase.ts";
import {collection, addDoc, serverTimestamp, } from 'firebase/firestore'

import './addRestroom.css';

function AddRestroom() {
    let navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    country: '',
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

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formState);
    try {
      const { street, city, state, country } = formState;
      const address = `${street}, ${city}, ${state}, ${country}`;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyDLRmzWGSVuOYRHHFJ0vrEApxLuSVVgf1o`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const latitude = location.lat;
        const longitude = location.lng;
        const timestamp = serverTimestamp();
        const formDataWithTimestamp = { ...formState, latitude, longitude, created_at: timestamp }
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

  const {t} = useTranslation();

  const { scaleFactor } = useTextSize();
  return (
    <div className='pageAdd'>
    <div className="add-restroom-container">
    <form onSubmit={handleSubmit} className="add-restroom-form">
      <h2 style={{ fontSize: `${24 * scaleFactor}px` }}>{t("global.addrestroom.title")}</h2>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addrestroom.name")}<input type="text" name="name" value={formState.name} onChange={handleChange} required /></label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addrestroom.street")}<input type="text" name="street" value={formState.street} onChange={handleChange} required /></label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addrestroom.city")}<input type="text" name="city" value={formState.city} onChange={handleChange} required /></label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addrestroom.state")}<input type="text" name="state" value={formState.state} onChange={handleChange} required /></label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addrestroom.country")}<input type="text" name="country" value={formState.country} onChange={handleChange} required /></label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addrestroom.accessible")}<select style={{ fontSize: `${13 * scaleFactor}px` }} name="accessible" value={formState.accessible} onChange={handleChange} required>
      <option value="">{t("global.addrestroom.option")}</option>
          <option style={{ fontSize: `${13 * scaleFactor}px` }} value="Yes">{t("global.addrestroom.yes")}</option>
          <option style={{ fontSize: `${13 * scaleFactor}px` }} value="No">{t("global.addrestroom.no")}</option>
      </select></label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addrestroom.unisex")}<select style={{ fontSize: `${13 * scaleFactor}px` }} name="unisex" value={formState.unisex} onChange={handleChange} required>
      <option style={{ fontSize: `${13 * scaleFactor}px` }} value="">{t("global.addrestroom.option")}</option>
          <option style={{ fontSize: `${13 * scaleFactor}px` }} value="Yes">{t("global.addrestroom.yes")}</option>
          <option style={{ fontSize: `${13 * scaleFactor}px` }} value="No">{t("global.addrestroom.no")}</option>
      </select></label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addrestroom.changetable")}<select style={{ fontSize: `${13 * scaleFactor}px` }} name="changingTable" value={formState.changingTable} onChange={handleChange} required>
          <option style={{ fontSize: `${13 * scaleFactor}px` }} value="">{t("global.addrestroom.option")}</option>
          <option style={{ fontSize: `${13 * scaleFactor}px` }} value="Yes">{t("global.addrestroom.yes")}</option>
          <option style={{ fontSize: `${13 * scaleFactor}px` }} value="No">{t("global.addrestroom.no")}</option>
      </select></label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>
      {t("global.addrestroom.directions")}
      <textarea style={{ fontSize: `${13 * scaleFactor}px` }} name="directions" placeholder={t("global.addrestroom.dirdesc")} onChange={handleChange}></textarea>
      </label>
      <label style={{ fontSize: `${16 * scaleFactor}px` }}>
      {t("global.addrestroom.comment")}
      <textarea style={{ fontSize: `${13 * scaleFactor}px` }} name="comments" placeholder={t("global.addrestroom.commdesc")} onChange={handleChange}></textarea>
      </label>
        <div className="form-actions">
          <button style={{ fontSize: `${13 * scaleFactor}px` }} type="submit">{t("global.addrestroom.submitbtn")}</button>
          <button style={{ fontSize: `${13 * scaleFactor}px` }} type="button" onClick={() => navigate('/dashboard')}>{t("global.addrestroom.cancel")}</button>


        </div>
      </form>
    </div>
    </div>
  );
};

export default AddRestroom;
