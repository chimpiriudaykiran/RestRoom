import React, { createContext, useState, useEffect, useContext } from 'react';

const TextSizeContext = createContext();

export const useTextSize = () => useContext(TextSizeContext);

export const TextSizeProvider = ({ children }) => {
  const MAX_SCALE_FACTOR = 2; // Maximum allowed scale factor
  const MIN_SCALE_FACTOR = 1; // Minimum allowed scale factor

  const [scaleFactor, setScaleFactor] = useState(() => {
    // Load scaleFactor from localStorage if available, otherwise default to 1
    return parseFloat(localStorage.getItem('scaleFactor')) || 1;
  });

  const increaseTextSize = () => {
    setScaleFactor(prevScale => {
      const newScale = prevScale + 0.1;
      const limitedScale = Math.min(newScale, MAX_SCALE_FACTOR); // Limit scale to maximum value
      localStorage.setItem('scaleFactor', limitedScale); // Save new scale factor to localStorage
      return limitedScale;
    });
  };

  const decreaseTextSize = () => {
    setScaleFactor(prevScale => {
      const newScale = Math.max(prevScale - 0.1, MIN_SCALE_FACTOR); // Limit scale to minimum value
      localStorage.setItem('scaleFactor', newScale); // Save new scale factor to localStorage
      return newScale;
    });
  };

  const setTextSize = (val) => {
    console.log(val);
    setScaleFactor(prevScale => {
      let newScale = Math.max(val, MIN_SCALE_FACTOR); // Limit scale to minimum value
      newScale = Math.min(newScale, MAX_SCALE_FACTOR);
      localStorage.setItem('scaleFactor', newScale); // Save new scale factor to localStorage
      return newScale;
    });
  };

  useEffect(() => {
    // Update scaleFactor in localStorage whenever it changes
    localStorage.setItem('scaleFactor', scaleFactor);
  }, [scaleFactor]);

  return (
    <TextSizeContext.Provider value={{ scaleFactor, increaseTextSize, decreaseTextSize, setTextSize, setScaleFactor }}>
      {children}
    </TextSizeContext.Provider>
  );
};