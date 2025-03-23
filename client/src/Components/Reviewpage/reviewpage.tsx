import React, { useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";
import { db } from "../../firebase.ts";
import { doc, getDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useTextSize } from '../../TextSizeContext.js';
import "./reviewpage.css";
import { Modal, Button, InputGroup, Container, Row, Col } from 'react-bootstrap';
import LanguageSelector from "../../Translations/language-selector";

// Define a custom interface for restroom data
interface RestroomData {
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  address: string;
  direction: string;
  comments: string;
  // Add more fields as needed
}

interface Review {
  reviewerName: string;
  cleanliness: number;
  amenities: number;
  accessibility: number;
  description: string;
  image: File | null;
  date: Date; // Add date property
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  travelMode: string;
}

function ReviewPage() {
  const navigate = useNavigate();
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [totalTime, setTotalTime] = useState("");
  const [totalDistance, setTotalDistance] = useState("");
  const { id } = useParams();
  const { position } = useParams<{ position: string }>();
  const positionArray = (position ? position.split(',').map(Number) : []) || [];
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [restroomData, setRestroomData] = useState<RestroomData | null>(null);
  const [addingReview, setAddingReview] = useState(false);
  const [newReview, setNewReview] = useState<Review>({
    reviewerName: "",
    cleanliness: 0,
    amenities: 0,
    accessibility: 0,
    description: "",
    image: null,
    date: new Date(), // Initialize date with current date
  });
  const [reviewsData, setReviewsData] = useState<Review[]>([
  ]);

  const calculateStarColor = (starCount: number): string => {
    if (starCount === 1 || starCount === 2) {
      return 'one-star';
    } else if (starCount === 3) {
      return 'three-star';
    } else if (starCount === 4 || starCount === 5) {
      return 'four-star';
    } else {
      return ''; // Default color if count is invalid
    }
  };

  const handleAddReview = async () => {
    const updatedReviews = [...reviewsData, { ...newReview }];
    setReviewsData(updatedReviews);
    
    try {
      const cleanliness = document.querySelector('input[name="cleanliness"]:checked').value;
      console.log(newReview.reviewerName);
      const amenities = document.querySelector('input[name="amenities"]:checked').value;
      const accessibility = document.querySelector('input[name="accessibility"]:checked').value;
      
      // Add the new review to Firestore
      const docRef = await addDoc(collection(db, 'reviews'), {
        reviewerName: newReview.reviewerName,
        cleanliness: cleanliness,
        amenities: amenities,
        accessibility: accessibility,
        description: newReview.description,
        date: newReview.date,
        restroomsID: `/restrooms/${id}` // Use the restroom ID from the URL
      });
      console.log("New review added with ID: ", docRef.id);
    } catch (error) {
      console.error("Error adding review: ", error);
    }

    // Reset the new review form
    setNewReview({
      reviewerName: "",
      cleanliness: 0,
      amenities: 0,
      accessibility: 0,
      description: "",
      image: null,
      date: new Date(), // Update date with current date
    });
    setAddingReview(false);
    handleClose();
  };

  const calculateOverallQuality = (review: Review): number => {
    
    return (parseInt(review.cleanliness) + parseInt(review.amenities) + parseInt(review.accessibility)) / 3;
  };

  useEffect(() => {
    const fetchRestroomData = async () => {
      if (!id) return; // Exit early if ID is undefined

      try {
        const docRef = doc(db, "restrooms", id); // Reference to the restroom document
        const docSnap = await getDoc(docRef); // Fetch the document snapshot

        if (docSnap.exists()) {
          // If the document exists, set the restroom data state
          const data = docSnap.data();
          //const hold = `${data.street}, ${data.city}, ${data.state}, ${data.country}`;
          //setAddress(hold);
          setRestroomData({
            name: data.name,
            street: data.street,
            city: data.city,
            state: data.city,
            country: data.country,
            address: `${data.street}, ${data.city}, ${data.state}, ${data.country}`,
            direction: data.directions,
            comments: data.comment
            // Add more fields as needed
          });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching restroom data:", error);
      }
    };
    //const restroomId = "your_restroom_id";

    fetchRestroomData();
    //fetchReviews(); // Fetch restroom data when component mounts
  }, [id]); // Re-fetch data when the ID changes

  useEffect(() => {
    // Function to fetch reviews associated with the restroom ID
    const fetchReviews = async () => {
      try {
        const reviewRef = collection(db, 'reviews');
        console.log("Review collection reference:", reviewRef);

        const querySnapshot = await getDocs(reviewRef);
        console.log("Query snapshot:", querySnapshot);

        //let updatedReviews: Review[] = []; // Create a new array to hold the updated reviews
        const updatedReviews: Review[] = [];
        querySnapshot.forEach((doc) => {
          const reviewData = doc.data();
          console.log("Review data:", reviewData);

          // Assuming restroomsID is stored as a complete URL, like `/restrooms/123`
          if (reviewData.restroomsID === `/restrooms/${id}`) {
            const review: Review = {
              reviewerName: reviewData.reviewerName,
              cleanliness: reviewData.cleanliness,
              amenities: reviewData.amenities,
              accessibility: reviewData.accessibility,
              description: reviewData.description,
              image: null, // Assuming image is not stored in reviews collection
              date: reviewData.date.toDate(), // Convert Firestore Timestamp to JavaScript Date object
            };
            //updatedReviews = [...updatedReviews, review]; // Using spread operator to add review to array
            //reviewsData.push(review);
            updatedReviews.push(review);
            //setReviewsData(prevReviews => [...prevReviews, review]);
            console.log("Review data:", reviewData);
          }
        });

        //console.log("Fetched reviews:", updatedReviews);
        //setReviewsData(updatedReviews);
        setReviewsData(updatedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }
    fetchReviews(); // Fetch restroom data when component mounts
  }, [id]); // Re-fetch data when the ID changes

  useEffect(() => {
    //load map into page
    const loader = new Loader({
      apiKey: 'AIzaSyBl4DjPd_GM9redJ-bjzPWEGJOtcPKVjrM',
      version: 'weekly',
      libraries: ['places', 'geometry'], // You can add "directions" here for routes
    });

    loader.load().then(() => {
      const mapElement = document.getElementById('map');
      if (!mapElement || !position) return;

      const mapStyles = [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [
            { visibility: 'off' } //hide all extra markers
          ]
        }
      ];

      const makeMap = new google.maps.Map(mapElement, {
        center: { lat: 33.253946, lng: -97.152896 },
        zoom: 17,
        styles: mapStyles
      });

      setMap(makeMap);  //set changes to map
    });
  }, [position]);

  const [destLat, setDestLat] = useState(null);
  const [destLng, setDestLng] = useState(null);
  //whenever map changes
  useEffect(() => {

    const fetchData = async () => {

      if (!map) return; //if map not loaded
      //display route

      if (!restroomData) return;
      const address = `${restroomData.street}, ${restroomData.city}, ${restroomData.state}, ${restroomData.country}`;

      // Perform geocoding to convert address to coordinates
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBl4DjPd_GM9redJ-bjzPWEGJOtcPKVjrM`
      );

      if (response.ok) {
        const geoData = await response.json();
        //console.log("Geocoding response:", geoData); // Log the response from geocoding API
        if (geoData.results && geoData.results[0] && geoData.results[0].geometry) {
          const { lat, lng } = geoData.results[0].geometry.location;
          setDestLat(lat);
          setDestLng(lng);
        }
      }
    };

    fetchData(); // Call the async function
    // Return a cleanup function if needed
    return () => {
      // Cleanup code here
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restroomData]); // Dependency array

  useEffect(() => {
    if (!map || destLat === null || destLng === null) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    let request;

    request = {
      origin: {
        lat: positionArray[0], lng: positionArray[1]
      }, // Use user's position as the origin
      destination: {
        lat: destLat, lng: destLng
      },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);

        if (result) {
          const steps: RouteStep[] = [];
          const route = result.routes[0];

          if (route) {
            const legs = route.legs;
            const totalDurationText = route.legs[0]?.duration?.text || "";
            setTotalTime(totalDurationText);
            setTotalDistance(route.legs[0]?.distance?.text || "");

            // Log or use the total duration as needed
            legs.forEach((leg, legIndex) => {
              leg.steps.forEach((step, stepIndex) => {
                steps.push({
                  instruction: step.instructions,
                  distance: step.distance ? step.distance.text : "Unknown",
                  duration: step.duration ? step.duration.text : "Unknown",
                  travelMode: step.travel_mode,
                });
              });
            });
          }
          setRouteSteps(steps);
        }
      } else {
        console.error("Directions request failed due to " + status);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, destLat, destLng]);

  const handleDashboardReturn = () => {
    navigate(`/dashboard?latLng=${position}`);
  };

  console.log("Reviews data:",);

  const { t } = useTranslation();
  const { scaleFactor } = useTextSize();

  const [show, setShow] = useState(addingReview);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return (
    <div
    className="dashboard"
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      background: "radial-gradient(circle, rgb(0 0 0) 0%, rgb(0 6 59) 100%)",
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
        <div style={{display: 'flex', flexDirection: 'row-reverse', flex: 1, padding: '0px 45px'}}><LanguageSelector /></div>
      </div>
    <div className="page-wrapper">
      <div className="review-page">
        <div className="header-container">
          <div style={{ flex: '1' }}></div>
          <div style={{ flex: '1' }}></div>
          <div style={{ fontSize: `${24 * scaleFactor}px`, position:'absolute' }} className="review-header">{t("global.reviews.title")}</div>
          <div>
            {/* <button style={{ fontSize: `${13 * scaleFactor}px`, marginRight: '5px' }} className="add-review-btn" onClick={handleShow}>
        {t("global.reviews.addreview")}
        </button> */}
            <button style={{ fontSize: `${13 * scaleFactor}px` }} onClick={handleDashboardReturn} className="go-back-btn">{t("global.reviews.dashboard")}</button>
          </div>
        </div>
        <div className="place-details">
          <div className="place-info-container">
            <div className="place-info">
              <div style={{ display: 'flex', }}>
                <div style={{ fontSize: `${24 * scaleFactor}px`, flex: '1' }} className="place-name">{restroomData?.name}</div>
                <button
                  onClick={() => window.open(`https://www.google.com/maps?q=${destLat},${destLng}`, '_blank', 'noreferrer')}
                  style={{ fontSize: `${13 * scaleFactor}px`, marginRight: '5px' }}
                  className="add-review-btn"
                >
                  {t("global.reviews.navigate")}
                </button>

                <button style={{ fontSize: `${13 * scaleFactor}px`, marginRight: '5px' }} className="add-review-btn" onClick={handleShow}>
                  {t("global.reviews.addreview")}
                </button>
              </div>
              <div style={{ fontSize: `${18 * scaleFactor}px` }} className="place-address">{t("global.reviews.address")} {restroomData?.address}</div>
              <div style={{ fontSize: `${18 * scaleFactor}px` }} className="place-directions">{t("global.reviews.directions")} {restroomData?.direction}</div>
              <div className='map-directions'>
                <div className="directions">
                  <div style={{ fontSize: `${20 * scaleFactor}px`, padding: '10px', borderBottom: '2px solid lightgray' }}>{totalTime}, ({totalDistance})
                    <a href={`https://www.google.com/maps?q=${destLat},${destLng}`} target="_blank" rel="noreferrer" style={{ marginLeft: '20px' }} className="btn btn-primary">{t("global.reviews.navigate")}</a>
                  </div>
                  {routeSteps.map((step, index) => (
                    <div key={index}>
                      <p style={{ fontSize: `${14 * scaleFactor}px` }} className="route-step"><span dangerouslySetInnerHTML={{ __html: step.instruction }} /></p>
                      <p className="route-step" style={{ fontSize: `${10 * scaleFactor}px`, borderBottom: '2px solid lightgray' }}>&nbsp;&nbsp;&nbsp;<span dangerouslySetInnerHTML={{ __html: step.distance }} /></p>
                      <p></p>
                    </div>
                  ))}
                </div>
                <div className="map" id="map"></div>
              </div>
            </div>
            <div style={{ fontSize: `${18 * scaleFactor}px` }} className="place-comments">{t("global.reviews.comments")} {restroomData?.comments}</div>
            <div className="image-container">
              {/* <img src="Comp/Reviewpage/Handicap_toliet_2.jpg" alt="Place Image" />  */}
            </div>
          </div>
        </div>
        <div style={{ fontSize: `${24 * scaleFactor}px` }} className="review-bar">{t("global.reviews.reviewtitle")}</div>
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>{t("global.addreviews.title")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3 row">
              <label className="col-sm-2 col-form-label" style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.name")}</label>
              <div className="col-sm-10">
                <input
                  type="text"
                  className="form-control"
                  value={newReview.reviewerName}
                  onChange={(e) => setNewReview({ ...newReview, reviewerName: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-3 row">
              <div className="col-sm-4">
                <label className="col-form-label" style={{ fontSize: `${16 * scaleFactor}px`, width: '100%', textAlign: 'center' }}>{t("global.addreviews.cleanliness")}</label>
                <div class="product-review-stars cleanliness">
                  <input type="radio" id="cleanliness5" name="cleanliness" value="5" class="visuallyhidden" /><label
                    for="cleanliness5" title="Very Good">★</label>
                  <input type="radio" id="cleanliness4" name="cleanliness" value="4" class="visuallyhidden" /><label
                    for="cleanliness4" title="Good">★</label>
                  <input type="radio" id="cleanliness3" name="cleanliness" value="3" class="visuallyhidden" /><label
                    for="cleanliness3" title="Average">★</label>
                  <input type="radio" id="cleanliness2" name="cleanliness" value="2" class="visuallyhidden" /><label
                    for="cleanliness2" title="Not Good">★</label>
                  <input type="radio" id="cleanliness1" name="cleanliness" value="1" class="visuallyhidden" /><label
                    for="cleanliness1" title="Worst">★</label>
                </div>
              </div>
              <div className="col-sm-4">
                <label className="col-form-label" style={{ fontSize: `${16 * scaleFactor}px`, width: '100%', textAlign: 'center' }}>{t("global.addreviews.amenities")}</label>
                <div class="product-review-stars amenities">
                  <input type="radio" id="amenities5" name="amenities" value="5" class="visuallyhidden" /><label
                    for="amenities5" title="Very Good">★</label>
                  <input type="radio" id="amenities4" name="amenities" value="4" class="visuallyhidden" /><label
                    for="amenities4" title="Good">★</label>
                  <input type="radio" id="amenities3" name="amenities" value="3" class="visuallyhidden" /><label
                    for="amenities3" title="Average">★</label>
                  <input type="radio" id="amenities2" name="amenities" value="2" class="visuallyhidden" /><label
                    for="amenities2" title="Not Good">★</label>
                  <input type="radio" id="amenities1" name="amenities" value="1" class="visuallyhidden" /><label
                    for="amenities1" title="Worst">★</label>
                </div>
              </div>
              <div className="col-sm-4">
                <label className="col-form-label" style={{ fontSize: `${16 * scaleFactor}px`, width: '100%', textAlign: 'center' }}>{t("global.addreviews.accessibility")}</label>
                <div class="product-review-stars accessibility">
                  <input type="radio" id="accessibility5" name="accessibility" value="5" class="visuallyhidden" />
                  <label for="accessibility5" title="Very Good">★</label>
                  <input type="radio" id="accessibility4" name="accessibility" value="4" class="visuallyhidden" /><label
                    for="accessibility4" title="Good">★</label>
                  <input type="radio" id="accessibility3" name="accessibility" value="3" class="visuallyhidden" /><label
                    for="accessibility3" title="Average">★</label>
                  <input type="radio" id="accessibility2" name="accessibility" value="2" class="visuallyhidden" /><label
                    for="accessibility2" title="Not Good">★</label>
                  <input type="radio" id="accessibility1" name="accessibility" value="1" class="visuallyhidden" /><label
                    for="accessibility1" title="Worst">★</label>
                </div>
              </div>
            </div>


            <div className="mb-3">
              <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.description")}</label>
              <textarea
                className="form-control"
                style={{ fontSize: `${16 * scaleFactor}px` }}
                value={newReview.description}
                onChange={(e) => setNewReview({ ...newReview, description: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.image")}</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) => setNewReview({ ...newReview, image: e.target.files ? e.target.files[0] : null })}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              {t("global.addreviews.close")}
            </Button>
            <Button variant="primary" onClick={handleAddReview}>
              {t("global.addreviews.add")}
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* <div> */}
        <div className="row row-cols-1 row-cols-md-3 g-4" style={{ marginLeft: '40px' }}>
  {reviewsData.length > 0 ? (
    reviewsData.map((review, index) => (
      <div key={index} className='col'>
        <div className="card p-2" style={{ width: '300px', textAlign: 'left' }}>
          <div style={{ fontSize: `${25 * scaleFactor}px`, fontWeight: 'bold' }} className="card-header reviewer-name">
            {t("global.addreviews.name")} {review.reviewerName}
          </div>

          {review.image && (
            <div className="card-img-top">
              <img src={URL.createObjectURL(review.image)} alt="Review" />
            </div>
          )}

          <div className="list-group list-group-flush">
            <div style={{ fontSize: `${16 * scaleFactor}px`, display: 'flex' }} className='list-group-item'>
              <b style={{width: '40%', borderRight: '1px solid gray', marginRight: '10px'}}>{t("global.addreviews.cleanliness")}</b>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`star ${i < review.cleanliness ? 'filled' : ''}`}
                  style={{ color: i < review.cleanliness ? 'gold' : 'gray' }}
                >
                  &#9733;
                </span>
              ))}
            </div>
            <div style={{ fontSize: `${16 * scaleFactor}px`, display: 'flex' }} className='list-group-item'>
              <b style={{width: '40%', borderRight: '1px solid gray', marginRight: '10px'}}>{t("global.addreviews.amenities")}</b>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`star ${i < review.amenities ? 'filled' : ''}`}
                  style={{ color: i < review.amenities ? 'gold' : 'gray' }}
                >
                  &#9733;
                </span>
              ))}
            </div>
            <div style={{ fontSize: `${16 * scaleFactor}px`, display: 'flex' }} className='list-group-item'>
              <b style={{width: '40%', borderRight: '1px solid gray', marginRight: '10px'}}>{t("global.addreviews.accessibility")}</b>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`star ${i < review.accessibility ? 'filled' : ''}`}
                  style={{ color: i < review.accessibility ? 'gold' : 'gray' }}
                >
                  &#9733;
                </span>
              ))}
            </div>
          </div>

          <div className='card-body'>
            <div style={{ fontSize: `${16 * scaleFactor}px`, fontWeight: 'bold' }} className="card-title">
              {t("global.addreviews.description")}
            </div>
            <div style={{ fontSize: `${16 * scaleFactor}px` }} className="card-text">
              {review.description}
            </div>
          </div>
          
          <div className='list-group'>
          <div style={{ fontSize: `${18 * scaleFactor}px` }} className="list-group-item">
            <b>{t("global.reviews.quality")}</b> {`${calculateOverallQuality(review).toFixed(2)}/5`}
          </div>
          </div>

          <div style={{ fontSize: `${16 * scaleFactor}px` }} className="card-footer">
            {t("global.reviews.date")} {review.date.toLocaleDateString()}
          </div>
        </div>
      </div>
    ))
  ) : (
    <div style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.reviews.noneavail")}</div>
  )}
</div>


        {/* </div> */}
      </div>
    </div>
    </div>
  );
}

export default ReviewPage;