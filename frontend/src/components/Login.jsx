
import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';
import './Login.css';




export default function WalletLogin () {
 
  const container = useRef(null);

  const [walletAddress, setWalletAddress] = useState('');
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCompany, setIsCompany] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const { signup, login } = useAuth()

  async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      alert("MetaMask not detected!");
      return;
    }

    setAuthenticating(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // (Optional) Sign a message for authentication
      const signature = await signer.signMessage("Login to StudyApp");
      console.log('Signature:', signature);

      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
      alert(`Wallet connected: ${address}`);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet");
    } finally {
      setAuthenticating(false);
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
      setIsCompany(false);
    }
  }

  function toggleRight() {
    
    if (container.current) {
      setEmail('');
      setPassword('');
      container.current.classList.add('active');
      setIsCompany(true);
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