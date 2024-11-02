import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

import "./Login.css"; // Ensure you have a corresponding CSS file for styling

function Login({ onNavigateBack }) {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle login logic here
    console.log("Login:", email, password);
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setUsername(e.target.value)}
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
        <button type="submit" className="button">
          Login
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

export default Login;



// function Login() {
//   const [username, setUsername] = useState("search");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = () => {
//     // Implement your login logic here
//     // For simplicity, we'll just display the username and password for now
//     alert(`Username: ${username}\nPassword: ${password}`);
//     navigate("/dashboard");
//   };

//   return (
//     <div className="login-container">
//       <h1>Login</h1>
//       <form>
//         <div className="input-container">
//           <label>Username</label>
//           <input
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//           />
//         </div>
//         <div className="input-container">
//           <label>Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//         </div>
//         <button type="button" onClick={handleLogin}>
//           Log In
//         </button>
//       </form>
//     </div>
//   );
// }

// export default Login;
