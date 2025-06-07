'use client'

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import '@/app/styles/Login.css';




export default function Login () {
  /*const [alias, setAlias] = useState('');
  const [colourPalette, setColourPalette] = useState('NORMAL');
  const [dateFormat, setDateFormat] = useState('standard');*/
  //const [username, setUsername] = useState('');
  const container = useRef(null);

  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const { signup, login } = useAuth()

  async function handleSubmit() {
        if (!email || !password || password.length < 6) {
            return
        }
        setAuthenticating(true)
        try {
            if (isRegister) {
                console.log('Signing up a new user')
                await signup(email, password)
            } else {
                console.log('Logging in existing user')
                await login(email, password)
            }

        } catch (err) {
            console.log(err.message)
        } finally {
            setAuthenticating(false)
        }
}


  const navigate = useRouter();

  //const handleUsernameChange = (event) => setUsername(event.target.value);
  const handleEmailChange = (event) => setEmail(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  function toggleLeft() {
   
    if (container.current) {
      setEmail('');
      setPassword('');
      container.current.classList.remove('active');
    }
  }

  function toggleRight() {
    
    if (container.current) {
      setEmail('');
      setPassword('');
      container.current.classList.add('active');
    }
  }


  return (
    <div>
      <div className="container" id="container" ref={container}>
        <div className="form-container sign-up">
          <form>
            <img className="logo" src='../g851.png' alt="Icon" />
            <h1>Create Account</h1>
            {/*<input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Username"
            />*/}
            <input
              type="email"
              value={email}
              onChange={(e) => {setEmail(e.target.value)}}
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => {setPassword(e.target.value)}}
              placeholder="Password"
            />
            <button type="button" onClick={handleSubmit}>Sign Up</button>
          </form>
        </div>

        <div className="form-container sign-in">
          <form>
            <img className="logo" src="../g851.png" alt="oth Icon" />
            <h1>Sign In</h1>
             <input
              type="email"
              value={email}
              onChange={(e) => {setEmail(e.target.value)}}
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => {setPassword(e.target.value)}}
              placeholder="Password"
            />
            <Link href="/forget">Forget Your Password?</Link>
            <button type="button" onClick={handleSubmit}>Sign In</button>
          </form>
        </div>

        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left" id="toggle left">
              <h1>Welcome Back!</h1>
              <p>Continue studying with ease.</p>
              <button type="button" className="block" id="login" onClick={() => {toggleLeft(); setIsRegister(!isRegister)}}>
                Back to Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right" id="toggle right">
              <h1>Hey There!</h1>
              <p>Register to transform your study experience, on the house.</p>
              <button type="button" className="block" id="register" onClick={() => { toggleRight(); setIsRegister(!isRegister)}}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}