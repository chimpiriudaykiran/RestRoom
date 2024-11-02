import React, { useState, useEffect, useRef } from "react";
import { Loader } from '@googlemaps/js-api-loader';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import "./dashboard.css"; 
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../Translations/language-selector';
import { useTextSize } from '../../TextSizeContext.js';

import { db } from "../../firebase.ts";
import {collection, getDocs, } from 'firebase/firestore';



//store all essential info for nearby locations
let nearbyLocations=[] as {id : string, name: string, address: string, distance: number, latS: number, lngS: number, rating: number, color: string}[];
interface MarkerWithInfoWindow extends google.maps.Marker {
  infoWindow: google.maps.InfoWindow;
}

let locationMarkers: MarkerWithInfoWindow[] = []; //store location markers and info windows
let globalDistance = .5;  //store radius distance
let globalLocation: string; //store user location input

//deal with the search bar, map api, and search functions
function SearchLocation(){
  const navigate = useNavigate();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [location, setLocation] = useState(''); //location in search bar
  const [opened, setOpen] = useState(false);  //to activate circle radius on map
  const [userPosition, setUserPosition] = useState({ lat: 33.253946, lng: -97.152896 });  //auto set users position
  const [map, setMap] = useState<google.maps.Map | null>(null); //google map api
  const [distance, setDistance] = useState(globalDistance); //within radius of global distance
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);  //area for restrooms
  const currentLocation = useLocation();  //to get parameters
  const [sortByRatings, setSortByRatings] = useState(false); //if to sort by ratings 
  const [showMap, setShowMap] = useState(false);  //show the map for the narrower view of webpage
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);  //track window width
  const [wideDisplay, setWideDisplay] = useState(false);  
  const [sidebarUpdate, setSidebarUpdate] = useState(false);
  const modifyDisplay = !showMap ? '' : 'modified'; 

  //to change display based on users device width
  useEffect(() =>
  {
    if(windowWidth > 900)
    {
      if(!wideDisplay){
        setWideDisplay(true);
      }
    }
    else
    {
      if(wideDisplay)
      {
        setWideDisplay(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth]);

  //track window width
  useEffect(() => {
      const handleResize = () => {
          setWindowWidth(window.innerWidth);
      };

      window.addEventListener('resize', handleResize);

      return () => {
          window.removeEventListener('resize', handleResize);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let routeIndex: number | null = null; //to tie user selected marker and sidebar locations

  //navigate to review page and pass id and lat and lng from user entered position
  const navigateToReviewPage = (index : number) =>{
    routeIndex = index;
    const positionString = `${userPosition.lat},${userPosition.lng}`; //user entered lat and lng

    if(routeIndex || routeIndex === 0)  //if routeindex is not null or is 0
      navigate(`/reviewpage/${nearbyLocations[routeIndex].id}/${positionString}`);  //navigate to reviewpage
  }

  //find locations within certain radius and create markers, store data, signal for sidebar to rerender
  const findTheWay = async (distance, map, userPosition, sortByRatings) => {
    nearbyLocations = []; //reset nearby locations to empty

    //remove all markers from map
    if(locationMarkers.length !== 0)
    {
      locationMarkers.forEach(marker => {
      (marker as google.maps.Marker).setMap(null);
    });
    //Empty the locationMarkers array
      locationMarkers = [];
    }

    try {
      // Perform geocoding to convert address to coordinates using a geocoding service
      const restroomSnap = await getDocs(collection(db, "restrooms"));
      await Promise.all(restroomSnap.docs.map(async (doc) => {
        const data = doc.data();
        const street = data.street;
        const city = data.city;
        const state = data.state;
        const country = data.country;
        const name = data.name;
        const positive = data.thumbs_up as number;
        const negative =  data.thumbs_down as number;
        const total = positive + negative;

        let color = ""; //color based on rating
        let overallRating = positive / total * 100; //calc rating
        

        if(total === 0) //if no ratings
        {
          overallRating = 0;
          color = "rgb(40, 40, 135)"; //default color
        }
        else if(overallRating  < 70 && overallRating >= 40) //if ratings between 40% and 69%
        {
          color = "rgb(249, 127, 14)";  //color is orange - ok
        }
        else if(overallRating < 40) //if ratings less than 40%
        {
          color = "red";  //bad
        }
        else
        {
          color = "green";  //good
        }
        overallRating /= 20;  //convert ratings to out of 5 stars
  
        // Concatenate street, city, state, and country to form complete address
        const address = `${street}, ${city}, ${state}, ${country}`;

  
        // Perform geocoding to convert address to coordinates
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyDaTix-YpKD6GHuumhE0s-XXkzOgKQpC5U`
        );
  
        if (response.ok) {
          const geoData = await response.json();
          //console.log("Geocoding response:", geoData); // Log the response from geocoding API
          if (geoData.results && geoData.results[0] && geoData.results[0].geometry) {
            const { lat, lng } = geoData.results[0].geometry.location;
  
            // Calculate distance between the location and user's position
            const distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(lat, lng),
              new google.maps.LatLng(userPosition.lat, userPosition.lng)
            );
  
            // Check if the location is within the selected radius
            if (distanceBetween <= (distance * 1609.34) ) {
              //round distance to 2 decimal places
              const distanceInMiles = parseFloat((distanceBetween / 1609.34).toFixed(2));
              //push to nearby lcoations
              nearbyLocations.push({ id: doc.id, name, address, distance: distanceInMiles, latS: lat, lngS: lng, rating: overallRating, color});
            }
          } else {
            console.error("Invalid location:", address); //print error
          }
        } else {
          console.error("Geocoding request failed");//print error
        }
      }));

      // Sort nearby locations by distance or rating
      if(sortByRatings)
        nearbyLocations.sort((a, b) => b.rating - a.rating);
      else
        nearbyLocations.sort((a, b) => a.distance - b.distance);

      //create markers relative to nearby locations as well as info boxes to associate with them when hovering
      nearbyLocations.forEach( (location, index) => {
        const marker = new google.maps.Marker({
          position: { lat:location.latS, lng: location.lngS },
          map,
          title: location.name,
          icon: {
            url: "/assets/blueMarker.PNG",
            scaledSize: new google.maps.Size(40, 50)
          },
          animation: google.maps.Animation.DROP
        })as MarkerWithInfoWindow;
        //info to display when marker selected

        let infoWindow;
        if(location.rating === 0)  //if no ratings
        {
          infoWindow = new google.maps.InfoWindow({
            content: `
              <div>${location.address}</div>
              <div style="margin-bottom: 4px;">Distance: ${location.distance} mi / ${(location.distance * 1.60934).toFixed(3)} km</div>
              <div style="border-radius: 3px; margin-bottom: 4px; text-align: center; color: white; padding: 4px; background: ${location.color}">No ratings</div>
              <button class="navigate-button" id="navigateButton-${index}" style="border-radius: 3px; margin-bottom: 4px;">View more information</button>`,
        });
        }
        else  //if there are ratings
        {
          infoWindow = new google.maps.InfoWindow({
            content: `
              <div>${location.address}</div>
              <div style="margin-bottom: 4px;">Distance: ${location.distance} mi / ${(location.distance* 1.60934).toFixed(3)} km</div>
              <div style="background: ${location.color}; border-radius: 3px; margin-bottom: 4px; text-align: center; color: white; padding: 4px;">${(location.rating).toFixed(1)} / 5.0 ★</div>
              <button class="navigate-button" id="navigateButton-${index}" style="border-radius: 3px; margin-bottom: 4px;">View more information</button>`
          });
        }

        //button to navigate to review page
        google.maps.event.addListener(infoWindow, 'domready', () => {
          const navigateButton = document.getElementById(`navigateButton-${index}`);
          if (navigateButton) {
            navigateButton.addEventListener('click', () => {
              navigateToReviewPage(index); // Call your function here
            });
          }
        });

        //open info window when user clicks
        google.maps.event.addListener(marker, 'click', () => {
          infoWindow.open(map, marker);
      });  
        locationMarkers.push(marker);
    });
    setDataLoaded(true);  //to initiate sidebar update

    if(dataLoaded){
      console.log("data loaded");
    }
  
    } catch (error) {
      console.error("Error fetching restroom data:", error);  //print error
    }
  };

  useEffect(() => { 
    //load map
    const loader = new Loader({
      apiKey: 'AIzaSyDaTix-YpKD6GHuumhE0s-XXkzOgKQpC5U',
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader.load().then(() => {
      const mapElement = document.getElementById('map');
      const inputElement = document.getElementById('locationInput') as HTMLInputElement;

      const mapStyles = [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [
            { visibility: 'on' } //extra area markers
          ]
        }
      ];

      if(!inputElement || !userPosition) return; 
      const searchBox = new window.google.maps.places.SearchBox(inputElement);  //suggest locations based on user input

      searchBox.addListener('places_changed', selectionSearch);  //handle search for whichever location user selects

      function selectionSearch() { //search based on user selection
        const places = searchBox.getPlaces(); 

        if (!places || places.length === 0) { //if places not loaded or no places shown
          return;
        }

        const place = places[0];  //store place user selected
        if (place.geometry && place.geometry.location) {  //check if location is valid
          setOpen(true);  //allow circle radius to appear
          setLocation(place.formatted_address ?? ''); //store the selected location in user input bar
          //store lat and lng of selected place as users location
          const { lat, lng } = place.geometry.location; 
          setUserPosition({
            lat: lat(),
            lng: lng()
        });
          //zoom in to users new position
        }
      }

      if (!mapElement) { //if map isnt loaded or input is empty
        if(!wideDisplay)  //if window display is narrow
        {
          setSidebarUpdate(!sidebarUpdate);
        }  
        return;
      }

      if(wideDisplay) //if window display is wide
      {
        if(showMap) //reset showMap
        {
          setShowMap(false);
          return;
        }
      }

      //setting map info
      let mapInstance;
      
        mapInstance = new window.google.maps.Map(mapElement, { 
          center: userPosition,
          zoom: userPosition ? 17 : 1,
          styles: mapStyles
        });
      

      setMap(mapInstance);  //store map info

    }).catch(error => { //if map failed to load
      console.error('Error loading Google Maps API:', error);
    });
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition, distance, showMap, wideDisplay]); //depends on if userPosition changes

      
  //add markers to map and create circle radius
  useEffect(() => {
    if(!userPosition || !opened) return;

    findTheWay(distance, map, userPosition, sortByRatings); 

    if (!map) return;  //if map failed to load or user position undefined
  
    //allow marker for user position after first valid address 
    if(opened){
    map.panTo(userPosition);
    const marker = new google.maps.Marker({
      position: userPosition,
      map: map,
      title: 'Your Location',
      icon: {
        url: "/assets/userMarker.PNG",
        scaledSize: new google.maps.Size(30, 50)
      },
      animation: google.maps.Animation.DROP
    });
    
    //remove any existing circles off map
    if (circle) {
      circle.setMap(null);
    }

    // Create new circle
    const newCircle = new google.maps.Circle({
      map,
      center: userPosition,
      radius: distance * 1609.34, // Convert miles to meters
      fillColor: '#4285F4',
      fillOpacity: 0.15,
      strokeColor: '#1f61cf',
      strokeOpacity: 0.5,
      strokeWeight: 4
    });

    // Set the new circle instance
    setCircle(newCircle);
       
    // Adjust the map bounds to include the marker and circle
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(marker.getPosition()!);
    bounds.union(newCircle.getBounds()!);
    map.fitBounds(bounds); 
    }
  
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, sortByRatings, sidebarUpdate]);  // map changes
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (globalLocation && globalLocation.trim() !== '') {
        if (globalLocation === 'Your Location') {
          handleCurrentLocation();
        } else {
          setLocation(globalLocation);
          handleSearch();
        }
      }
    }, 1000); // Wait for 1 second to fully load
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  //to reset dataloaded to prepare for next sidebar update
  useEffect(() => {
    //reset dataloaded on sidebar
    if (dataLoaded) {
      setDataLoaded(false);
    }

    if(location.trim() !== '') //set globallocation
      globalLocation = location;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded]);

  //another handle search function using 'enter' and search button
  const handleSearch = async () => {
    if (location.trim() !== '' || globalLocation !== '') { //if location input isnt empty

      //request geocode for location
      try {
        let response;
        if(globalLocation !== '')
        {
          response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(globalLocation)}&key=AIzaSyDaTix-YpKD6GHuumhE0s-XXkzOgKQpC5U`
          );
        }
        else
        {
          response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=AIzaSyDaTix-YpKD6GHuumhE0s-XXkzOgKQpC5U`
          );
        }
        
        //if gets response, update user position with data recieved 
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results[0] && data.results[0].geometry) {
            const { lat, lng } = data.results[0].geometry.location;
            setOpen(true);
            setUserPosition({ lat, lng });
          } else {
            //console.log(data);
          }
        } else {  //if no response
          console.error("Geocoding request failed");
        }
      } catch (error) { //if error in connecting to googleapis
        console.error("Error during geocoding:", error);
      }
    }
  };

  //handle current location 
  const handleCurrentLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setUserPosition({
              lat: position.coords.latitude,
              lng: position.coords.longitude
          });
            setOpen(true);
           // //console.log("User position updated successfully:", newPosition);
          },
          (error) => {
            console.error('Error getting user location:', error);
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };


   useEffect(() => {
    //reset nearbylocations array
    nearbyLocations = [];
    //get location instructions from URL
    const searchParams = new URLSearchParams(currentLocation.search);
    const address = searchParams.get('address');

    if (searchParams.get('useLocation') === 'true') {
      setLocation('Your Location');
      handleCurrentLocation();
    }
    else if(address !== null){
      globalLocation = address;
      setLocation(address);
    }
   // eslint-disable-next-line
   }, []);

   //sort by ratings
  const handleSortByRatingsChange = async () =>{
    setSortByRatings(!sortByRatings);
  };

  //show map for narrow view
  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const {t} = useTranslation();

  function Sidebar({ update }) {
    const [dropdownOpenB, setdropdownOpenB] = useState(false);
    const {t} = useTranslation();
  
    //toggle radius distance dropdown
    const handleDistanceDropdown = () => {
      const img = document.querySelector('.open-dropdown') as HTMLImageElement;
      setdropdownOpenB(!dropdownOpenB);    
      if (img) {
        // Toggle the rotation by checking if the current rotation is 0 degrees
        if (img.style.transform === '' || img.style.transform === 'none') {
          img.style.transform = 'rotate(180deg)';
        } else {
          img.style.transform = 'none'; // Reset rotation to its original position
        }
      }     
    };

    
    //update radius distance
    const handleDistanceChange = (newDistance) =>{
      setDistance(newDistance);
      globalDistance = newDistance;
    };

    //highlight marker thats relative to list item hovered on sidebar
    const highlightMarker = async (index: number) => {
      if (locationMarkers[index]) {
        await resetMarker();  //reset marker image and zindex
        const newIcon = {
          url: "/assets/purpleMarker.PNG",
                scaledSize: new google.maps.Size(40, 50)
        };

        (locationMarkers[index] as google.maps.Marker).setIcon(newIcon);
        (locationMarkers[index] as google.maps.Marker).setAnimation(google.maps.Animation.BOUNCE);
        (locationMarkers[index] as google.maps.Marker).setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
      }
    };
    
    //resets all markers zindex and image
    const resetMarker = () => {
      return new Promise<void>((resolve) => {
        const resetIcon = {
            url: "/assets/blueMarker.PNG",
            scaledSize: new google.maps.Size(40, 50)
        };

        locationMarkers.forEach((marker, index) => {
          (marker as google.maps.Marker).setIcon(resetIcon);
          (marker as google.maps.Marker).setAnimation(null);
          (marker as google.maps.Marker).setZIndex(index);
        });
          resolve(); // Resolve the Promise after resetting all markers
      });
    };

    const handleListItemClick = (index: number) => {
      (locationMarkers[index] as google.maps.Marker).setAnimation(null);
    };

    return (
      <div className="saved">
        <div className="sidebar-container" style={!wideDisplay ? { top: `${18 * scaleFactor}px` } : { height: `calc(78vh * ${scaleFactor}) `, maxHeight:'670px' }}>
          <div className={`sidebar ${modifyDisplay}`} 
               style={
                
                modifyDisplay !== ''
                    ? { height: `calc(160% - ${(450 * (scaleFactor - 1))}px` } // modifyDisplay is not empty
                    : { height: `calc(100vh - ${100 - (50 * (scaleFactor - 1))}px` } //modifyDisplay is empty
                }>
            <div className="sidebar-top">
              <div style={{ fontSize: `${30 * scaleFactor}px` }} className="name">
              {t("global.dashboard.title")}
                <div className="buttons">
                  <button className="viewMapButton" style={{ marginRight: '0px', fontSize: `${14 * scaleFactor}px`}} onClick={toggleMap}>
                  {showMap ? 'Close map' : 'View map'}
                </button>
                <button style={{ fontSize: `${14 * scaleFactor}px` }} className="add-button"><Link to="/add-restroom" style={{ textDecoration: 'none', color: 'inherit'}}>{t("global.dashboard.addPost")}</Link></button>
              </div>
              </div>
              <div className="locationSettings">
                <div className="checkboxAndDistance">
                  <input type="checkbox" id="sort-by-ratings" checked={sortByRatings} onChange={handleSortByRatingsChange} />
                  <label style={{ fontSize: `${16 * scaleFactor}px` }} htmlFor="sort-by-ratings">{t("global.dashboard.sortby")}</label>
                  <button className="setDistance" onClick={handleDistanceDropdown}>
                  <span style={{ fontSize: `${20 * scaleFactor}px` }} >{t("global.dashboard.within")} </span><span style={{ fontSize: `${20 * scaleFactor}px` }}>{distance}</span><span style={{ fontSize: `${20 * scaleFactor}px` }}> {t("global.dashboard.distancemetric")} </span>
                      <img src="https://static.thenounproject.com/png/551749-200.png" className="open-dropdown" alt="" />
                  </button>
                </div>
                <div className={`dropdown-contentB ${dropdownOpenB ? 'flex' : 'hidden'}`}>
                <span style={{ fontSize: `${16 * scaleFactor}px` }} onClick={()=>handleDistanceChange(0.5)}>{t("global.dashboard.within")} 0.5 {t("global.dashboard.distancemetric")}</span>
                      <span style={{ fontSize: `${16 * scaleFactor}px` }} onClick={()=>handleDistanceChange(1.0)}>{t("global.dashboard.within")} 1.0 {t("global.dashboard.distancemetric")}</span>
                      <span style={{ fontSize: `${16 * scaleFactor}px` }} onClick={()=>handleDistanceChange(2.0)}>{t("global.dashboard.within")} 2.0 {t("global.dashboard.distancemetric")}</span>
                      <span style={{ fontSize: `${16 * scaleFactor}px` }} onClick={()=>handleDistanceChange(5.0)}>{t("global.dashboard.within")} 5.0 {t("global.dashboard.distancemetric")}</span>
                      <span style={{ fontSize: `${16 * scaleFactor}px` }} onClick={()=>handleDistanceChange(10.0)}>{t("global.dashboard.within")} 10.0 {t("global.dashboard.distancemetric")}</span>
                      <span style={{ fontSize: `${16 * scaleFactor}px` }} onClick={()=>handleDistanceChange(15.0)}>{t("global.dashboard.within")} 15.0 {t("global.dashboard.distancemetric")}</span>
                </div>
              </div>
            </div>

            <div className={`displayLocations ${modifyDisplay}`} 
                  style={
                    !wideDisplay
                      ? modifyDisplay !== ''
                        ? { height: `${380 * scaleFactor}px`, paddingTop: `${400 + (20 * (scaleFactor-1))}px` } // If wideDisplay is false and modifyDisplay is not empty
                        : { height: `${440 * scaleFactor}px` } // If wideDisplay is false and modifyDisplay is empty
                       : { height: `${440 - 240 * (scaleFactor - 1)}px`, minHeight: `${500 - 30 * (scaleFactor - 1)}px` } // Default empty style
                  }>
              <ul>
                {nearbyLocations.map((location, index) => (
                <li key={`${location.address}-${index}`}
                  onMouseEnter={() => highlightMarker(index)} 
                  onClick={()=>handleListItemClick(index)}>
                  <div className="locationInfo">
                    <span style={{ fontSize: `${20 * scaleFactor}px` }} className="name-text">{location.name}</span>
                    <span style={{ fontSize: `${20 * scaleFactor}px` }} className="location-text">{location.address}</span>
                    <span> </span>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '15px' }}>
                      <span style={{ fontSize: `${15 * scaleFactor}px` }} className="routeDistance">{location.distance} mi / {(location.distance * 1.60934).toFixed(3)} km</span>
                      <span style={{ marginRight: '-55px', justifyContent: 'none', borderRadius: '3px', padding: '4px', color: 'white', background: `${location.color}`, fontSize: `${15 * scaleFactor}px` }}>                  
                          {location.rating === 0 ? 
                            " No  ratings " :
                            `${(location.rating).toFixed(1)} / 5.0 ★`
                          }
                      </span>
                    </div>
                  </div>
                  <button className="result-sales-button"
                    onClick={()=> navigateToReviewPage(index)}>
                    <img
                      src="/assets/arrow.PNG"
                      className="array-image"
                      alt=""
                    />
                  </button>  
                </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const { scaleFactor } = useTextSize();
  return (
    <div>
      <div className="lower-content">
        <Sidebar update={dataLoaded} />
          <div className="search-map">
            <div className="input-container">
              <input style={{ fontSize: `${20 * scaleFactor}px` }}
                id="locationInput"
                name="location"
                type="text"
                placeholder={t("global.dashboard.searchbar")}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Search Location"
              />
              <button style={{ fontSize: `${16 * scaleFactor}px` }} id="searchButton" type="button" className="searchButton" onClick={handleSearch}>
                {t("global.dashboard.search")}
              </button>
              <img className="currentLocationButton" 
                style={{ height: `${38 * scaleFactor}px` }}
                onClick={()=>{setLocation('Your Location'); handleCurrentLocation();}}
                src="/assets/currentLocation.PNG"
                alt="current_location"
              />
            </div>
            
            {wideDisplay ? (
                <div className="map" id="map" style={{ minHeight: `${500}px`}}></div>
            ) : (
                showMap && <div className="map" id="map" style={{ top: `${196  + (76 * (scaleFactor-1))}px` }}></div>
            )}
          </div>
      </div>
    </div>
  );
}

function UserProfile(){
  const {t} = useTranslation();
  const [dropdownOpen, setdropdownOpen] = useState(false);
  const handleProfileDropdown = () => {
    setdropdownOpen(!dropdownOpen); // Toggle the dropdown
  };

  const [languagesOpen, setlanguagesOpen] = useState(false);

  let settingsRef = useRef();
  let profileRef = useRef();
  let backRef = useRef();
  //let testRef = useRef();

  useEffect(() =>{
    let handler = (e)=> {
      if(settingsRef.current.contains(e.target)){
        setdropdownOpen(false);
        setlanguagesOpen(true);
      }
      if(!profileRef.current.contains(e.target)){
        setdropdownOpen(false);
        setlanguagesOpen(false);
      }
      if(backRef.current.contains(e.target)){
        setdropdownOpen(true);
        setlanguagesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);

    return() => {
      document.removeEventListener("mousedown", handler);
    }
  })
  const { increaseTextSize, decreaseTextSize } = useTextSize();
  const { scaleFactor } = useTextSize();
  const textSizePercentage = Math.round(scaleFactor * 100);



  return (
    <div className="profile" ref={profileRef}>

            <img
                src="/assets/settingsButton.PNG"
                className="pfp"
                alt="settings"
                onClick={handleProfileDropdown}
              />
 
          {/* eslint-disable jsx-a11y/anchor-is-valid */}
          <div className={`dropdown-content ${dropdownOpen ? 'show' : ''}`}>
            <div className="size-mod">
              <button style={{ fontSize: `${30 * scaleFactor}px` }} className="btn-size" onClick={decreaseTextSize}>-</button>
              <div className="size-info">
                <p style={{ fontSize: `${12 * scaleFactor}px` }} className="size-label">{t("global.dropdown.textsize")}</p>
                <p style={{ fontSize: `${18 * scaleFactor}px` }} className="size-display">{textSizePercentage}%</p>
              </div>
              <button style={{ fontSize: `${30 * scaleFactor}px` }} className="btn-size" onClick={increaseTextSize}>+</button>
            </div>
            {/* eslint-disable-next-line */}
            <button style={{ fontSize: `${20 * scaleFactor}px` }} className="btn-size" onClick={increaseTextSize} className="lang-btn" ref={settingsRef} type="button">
            {t("global.dropdown.language")}       
            </button >
          </div>
          {/* eslint-disable jsx-a11y/anchor-is-valid */}
          <div className={`dropdown-content ${languagesOpen ? 'show' : ''}`}>
            <LanguageSelector />
            <a style={{ fontSize: `${18 * scaleFactor}px` }} ref={backRef}>{t("global.dropdown.return")}</a>
          </div>

          <div>

          

          </div>
        </div>
  );
}

function Dashboard(){
   const {t} = useTranslation();

   const { scaleFactor } = useTextSize();

    return(
    <div className="dashboard">
      <div className="topbar">
          <div className="content">
            <div className="image-container">
              <img
                src="/assets/Main Logo.PNG"
                className="logo"
                alt="logo"
              />
            </div>
            <div style={{fontSize: `${44 * scaleFactor}px`}} className="name">{t("global.header.name")}</div>        
          </div>
          {UserProfile()}
      </div>
        {SearchLocation()}

    </div>
  );
}

export default Dashboard;