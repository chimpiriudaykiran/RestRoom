import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./SignUp.css"; // Ensure this path is correct

function SignUp({ onNavigateBack }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      //Check that passwords match
      if(password !== confirmPassword) {
        console.error("Passwords do not match");
        return;
      }

      const response = await axios.post('http://localhost:3001/api/signup', {
        firstName,
        lastName,
        username,
        email,
        password,
      });

      console.log(response.data);

      navigate("/dashboard");
    } catch (error) {
      console.error("Error signing up:", error.response ? error.react.data : error.message);
    }
  };

  return (
    <div className="sign-up-container">
      <form onSubmit={(e) => { e.preventDefault(); handleSignUp();}}>
        <h2>Sign Up</h2>
        <div className="form-group">
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="button">
          Sign Up
        </button>
        <button
          type="button"
          onClick={onNavigateBack}
          className="button back-button"
        >
          Back to Home
        </button>
      </form>
    </div>
  );
}

export default SignUp;