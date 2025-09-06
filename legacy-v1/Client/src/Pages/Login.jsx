import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const LoginSignUp = () => {
  const [selectedForm, setSelectedForm] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // login logic here
    console.log('Logging in with:', { email, password });
    //after success send to dashboard
    navigate('/dashboard');
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    // check if passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // sign up logic here
    console.log('Signing up with:', { email, password });
    //after success send to dashboard
    navigate('/dashboard');
  };

  // Initial screen with buttons to choose form type
  if (!selectedForm) {
    return (
      <div className='login-signup-container'>
        <div className='form-wrapper'>
          <h2>Welcome!</h2>
          <div className='choice-buttons'>
            <button onClick={() => setSelectedForm('login')}>Login</button>
            <button onClick={() => setSelectedForm('signup')}>Sign Up</button>
          </div>
        </div>
      </div>
    );
  }

  // Login form view
  if (selectedForm === 'login') {
    return (
      <div className='login-signup-container'>
        <div className='form-wrapper'>
          <h2>Login</h2>
          <form onSubmit={handleLoginSubmit}>
            <div>
              <label>Email:</label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type='submit'>Login</button>
          </form>
          <button className='back-button' onClick={() => setSelectedForm(null)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // Sign Up form view
  if (selectedForm === 'signup') {
    return (
      <div className='login-signup-container'>
        <div className='form-wrapper'>
          <h2>Sign Up</h2>
          <form onSubmit={handleSignUpSubmit}>
            <div>
              <label>Email:</label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Confirm Password:</label>
              <input
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type='submit'>Sign Up</button>
          </form>
          <button className='back-button' onClick={() => setSelectedForm(null)}>
            Back
          </button>
        </div>
      </div>
    );
  }
};

export default LoginSignUp;
