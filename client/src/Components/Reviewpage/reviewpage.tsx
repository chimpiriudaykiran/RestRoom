import React, { useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";
import { db } from "../../firebase.ts";
import { doc, getDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useTextSize } from '../../TextSizeContext.js';
import "./reviewpage.css";

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
      // Add the new review to Firestore
      const docRef = await addDoc(collection(db, 'reviews'), {
        reviewerName: newReview.reviewerName,
        cleanliness: newReview.cleanliness,
        amenities: newReview.amenities,
        accessibility: newReview.accessibility,
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
  };

  const calculateOverallQuality = (review: Review): number => {
    return (review.cleanliness + review.amenities + review.accessibility) / 3;
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
      apiKey: 'AIzaSyDaTix-YpKD6GHuumhE0s-XXkzOgKQpC5U',
      version: 'weekly',
      libraries: ['places', 'geometry'], // You can add "directions" here for routes
    });

    loader.load().then(() => {
      const mapElement = document.getElementById('map');
      if(!mapElement || !position) return;

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
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyDaTix-YpKD6GHuumhE0s-XXkzOgKQpC5U`
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

  console.log("Reviews data:", );

  const {t} = useTranslation();
  const { scaleFactor } = useTextSize();
  return (
    <div className="page-wrapper">
    <div className="review-page">
    <div className="header-container">
        <div style={{ fontSize: `${24 * scaleFactor}px` }} className="review-header">{t("global.reviews.title")}</div>
        <button style={{ fontSize: `${13 * scaleFactor}px` }} className="add-review-btn" onClick={() => setAddingReview(true)}>
        {t("global.reviews.addreview")}
        </button>
        <button style={{ fontSize: `${13 * scaleFactor}px` }} onClick={handleDashboardReturn} className="go-back-btn">{t("global.reviews.dashboard")}</button>
      </div>
      <div className="place-details">
        <div className="place-info-container">
          <div className="place-info">
          <div style={{ fontSize: `${24 * scaleFactor}px` }} className="place-name">{restroomData?.name}</div>
          <div style={{ fontSize: `${18 * scaleFactor}px` }} className="place-address">{t("global.reviews.address")} {restroomData?.address}</div>
          <div style={{ fontSize: `${18 * scaleFactor}px` }} className="place-directions">{t("global.reviews.directions")} {restroomData?.direction}</div>
          <div className='map-directions'>
            <div className="directions">
              <div style={{fontSize: `${30 * scaleFactor}px`, padding: '10px', marginBottom: '-20px', borderBottom: '2px solid lightgray'}}>{totalTime}, ({totalDistance})
              <a href={`https://www.google.com/maps?q=${destLat},${destLng}`} target="_blank" rel="noreferrer" style={{ marginLeft: '20px', textDecoration: 'none', color: 'white', fontSize: '20px', padding: '10px', backgroundColor: 'purple', borderRadius: '20px' }}>{t("global.reviews.navigate")}</a>
              </div>
            {routeSteps.map((step, index) => (
        <div key={index}>
          <p style={{ fontSize: `${24 * scaleFactor}px` }} className="route-step"><span dangerouslySetInnerHTML={{ __html: step.instruction }}/></p>
          <p className="route-step" style={{ fontSize: `${20 * scaleFactor}px`, borderBottom: '2px solid lightgray'}}>&nbsp;&nbsp;&nbsp;<span dangerouslySetInnerHTML={{ __html: step.distance }} /></p>
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
      {addingReview && (
        <div className="add-review-dropdown">
          <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.name")}</label>
          <input
            type="text"
            value={newReview.reviewerName}
            onChange={(e) => setNewReview({ ...newReview, reviewerName: e.target.value })}
          />
          <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.cleanliness")}</label>
          <input
            type="range"
            min={0}
            max={5}
            value={newReview.cleanliness}
            onChange={(e) => setNewReview({ ...newReview, cleanliness: parseFloat(e.target.value) })}
          />
          <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.amenities")}</label>
          <input
            type="range"
            min={0}
            max={5}
            value={newReview.amenities}
            onChange={(e) => setNewReview({ ...newReview, amenities: parseFloat(e.target.value) })}
          />
          <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.accessibility")}</label>
          <input
            type="range"
            min={0}
            max={5}
            value={newReview.accessibility}
            onChange={(e) => setNewReview({ ...newReview, accessibility: parseFloat(e.target.value) })}
          />
          <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.description")}</label>
          <input
            style={{ fontSize: `${16 * scaleFactor}px` }}
            type="text"
            value={newReview.description}
            onChange={(e) => setNewReview({ ...newReview, description: e.target.value })}
          />
          <label style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.addreviews.image")}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewReview({ ...newReview, image: e.target.files ? e.target.files[0] : null })}
          />
          <button style={{ fontSize: `${14 * scaleFactor}px` }} onClick={handleAddReview}>{t("global.addreviews.add")}</button>
        </div>
      )}
      
      <div className = "reviews-box">
      <div className="reviews-container">
      {reviewsData.length > 0 ? (
          reviewsData.map((review, index) => (
            <div key={index} className="review">
            <div style={{ fontSize: `${16 * scaleFactor}px` }} className="reviewer-name">{t("global.addreviews.name")} {review.reviewerName}</div>
            <div className="star-ratings">
            <div style={{ fontSize: `${16 * scaleFactor}px` }} >{t("global.addreviews.cleanliness")} {[...Array(review.cleanliness)].map((_, i) => <span key={i} className={`star ${calculateStarColor(review.cleanliness)}`}>&#9733;</span>)}</div>
            <div style={{ fontSize: `${16 * scaleFactor}px` }} >{t("global.addreviews.amenities")} {[...Array(review.amenities)].map((_, i) => <span key={i} className={`star ${calculateStarColor(review.amenities)}`}>&#9733;</span>)}</div>
            <div style={{ fontSize: `${16 * scaleFactor}px` }} >{t("global.addreviews.accessibility")} {[...Array(review.accessibility)].map((_, i) => <span key={i} className={`star ${calculateStarColor(review.accessibility)}`}>&#9733;</span>)}</div>
            </div>
            <div style={{ fontSize: `${18 * scaleFactor}px` }} className="overall-quality">{t("global.reviews.quality")} {`${calculateOverallQuality(review).toFixed(2)}/5`}</div>
            <div style={{ fontSize: `${16 * scaleFactor}px` }} className="description">{t("global.addreviews.description")} {review.description}</div>
            <div style={{ fontSize: `${16 * scaleFactor}px` }} className="date">{t("global.reviews.date")} {review.date.toLocaleDateString()}</div>
            {review.image && (
              <div className="photo">
                <img src={URL.createObjectURL(review.image)} alt="Review" />
              </div>
            )}
          </div>
        ))
        ) : (
          <div style={{ fontSize: `${16 * scaleFactor}px` }}>{t("global.reviews.noneavail")}</div>
        )}
      </div>
      </div>
    </div>
    </div>
  );
}

export default ReviewPage;