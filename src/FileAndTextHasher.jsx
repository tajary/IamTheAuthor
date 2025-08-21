import { useState } from 'react';

// Replace with your actual contract address and function selectors
const CONTRACT_ADDRESS = "0xe40362fa4c989ad00f1796294547c8dbcbb79ed7";
// Get these from your contract compilation or Etherscan
const REGISTER_HASH_SELECTOR = "0x8f1de16e"; // replace with actual registerHash selector
const GET_REGISTRATION_SELECTOR = "0x9dccc5bf"; // replace with actual getRegistration selector

function FileAndTextHasher() {
  // State for tabs and shared data
  const [activeTab, setActiveTab] = useState('file');
  const [authorName, setAuthorName] = useState('');
  const [computedHash, setComputedHash] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // State for File tab
  const [selectedFile, setSelectedFile] = useState(null);

  // State for Text tab
  const [inputText, setInputText] = useState('');

  // State for Verify tab
  const [verifyAuthorName, setVerifyAuthorName] = useState('');
  const [verifyContent, setVerifyContent] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyFile, setVerifyFile] = useState(null);

  // Helper function to read a file as an ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper function to concatenate two ArrayBuffers
  const concatenateArrayBuffers = (buffer1, buffer2) => {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
  };

  // Validate hash format
  const isValidHash = (hash) => {
    return /^[0-9a-f]{64}$/i.test(hash);
  };

  // Function to compute hash from name and content
  const computeHash = async (name, content, isFile = false) => {
    const encoder = new TextEncoder();
    const nameBuffer = encoder.encode(name + '\n');

    let dataToHash;

    if (isFile) {
      dataToHash = concatenateArrayBuffers(nameBuffer, content);
    } else {
      const textBuffer = encoder.encode(content);
      dataToHash = concatenateArrayBuffers(nameBuffer, textBuffer);
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Connect wallet using ethereum.request
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const address = accounts[0];
      setIsConnected(true);
      setUserAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
      
      return address;
      
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
      throw err;
    }
  };

  // Debug function to see what's being sent
  const debugTransaction = async (fromAddress, data) => {
    let debugText = `=== TRANSACTION DEBUG ===\n`;
    debugText += `From: ${fromAddress}\n`;
    debugText += `To: ${CONTRACT_ADDRESS}\n`;
    debugText += `Data: ${data}\n`;
    debugText += `Data length: ${data.length} characters\n`;

    try {
      // Try to estimate gas
      const gasEstimate = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: fromAddress,
          to: CONTRACT_ADDRESS,
          data: data
        }]
      });
      debugText += `Gas estimate: ${gasEstimate}\n`;
    } catch (estimateError) {
      debugText += `Gas estimate failed: ${estimateError.message}\n`;
    }

    setDebugInfo(debugText);
    console.log(debugText);
  };

  // Main function to calculate the hash
  const handleCalculateHash = async () => {
    setError('');
    setComputedHash('');
    setDebugInfo('');

    if (!authorName) {
      setError('Please enter your name.');
      return;
    }

    try {
      let hash;
      if (activeTab === 'file') {
        if (!selectedFile) {
          setError('Please select a file.');
          return;
        }
        const fileBuffer = await readFileAsArrayBuffer(selectedFile);
        
        if (fileBuffer.byteLength === 0) {
          throw new Error('File appears to be empty or could not be read.');
        }
        
        hash = await computeHash(authorName, fileBuffer, true);
      } else {
        if (!inputText.trim()) {
          setError('Please enter some text.');
          return;
        }
        hash = await computeHash(authorName, inputText, false);
      }

      if (!isValidHash(hash)) {
        throw new Error(`Generated hash is incorrect length: ${hash.length} chars (expected 64).`);
      }

      setComputedHash(hash);
    } catch (err) {
      console.error('Error calculating hash:', err);
      setError(err.message || 'Failed to compute hash. See console for details.');
    }
  };

  // Fixed register hash function
  const handleRegisterHash = async () => {
    if (!computedHash) {
      setError('Please generate a hash first.');
      return;
    }

    if (!isValidHash(computedHash)) {
      setError('Invalid hash format. Please generate a new hash.');
      return;
    }

    setIsRegistering(true);
    setError('');
    setTxHash('');
    setDebugInfo('');

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature.');
      }

      // Connect wallet and get account
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      const fromAddress = accounts[0];

      // Create function signature and encoded data
      const hashBytes32 = '0x' + computedHash;
      const paddedHash = hashBytes32.slice(2).padStart(64, '0');
      const data = REGISTER_HASH_SELECTOR + paddedHash;

      // Debug the transaction first
      await debugTransaction(fromAddress, data);

      // Get current gas price
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      // Use a safe gas limit
      const gasLimit = '0x' + (200000).toString(16); // 200,000 gas

      console.log('Sending transaction with:', {
        from: fromAddress,
        to: CONTRACT_ADDRESS,
        data: data,
        gasPrice: gasPrice,
        gas: gasLimit
      });

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: fromAddress,
          to: CONTRACT_ADDRESS,
          data: data,
          gasPrice: gasPrice,
          gas: gasLimit
        }]
      });

      setTxHash(txHash);
      alert('Transaction submitted! You can check the status on Etherscan.');
      
    } catch (err) {
      console.error('Error registering hash:', err);
      if (err.code === 4001) {
        setError('Transaction was rejected by the user.');
      } else if (err.message.includes('revert')) {
        setError('Contract execution reverted. This usually means the hash is already registered or there is an error in the contract.');
      } else {
        setError(`Failed to register hash: ${err.message}`);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Verify authorship function
  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');
    setVerificationResult(null);
    setDebugInfo('');

    try {
      if (!verifyAuthorName) {
        throw new Error('Please enter the author name to verify.');
      }

      let contentHash;
      if (activeTab === 'verify-file') {
        if (!verifyFile) {
          throw new Error('Please select a file to verify.');
        }
        const fileBuffer = await readFileAsArrayBuffer(verifyFile);
        contentHash = await computeHash(verifyAuthorName, fileBuffer, true);
      } else {
        if (!verifyContent.trim()) {
          throw new Error('Please enter text to verify.');
        }
        contentHash = await computeHash(verifyAuthorName, verifyContent, false);
      }

      if (!isValidHash(contentHash)) {
        throw new Error('Invalid content for verification.');
      }

      // Encode function call for getRegistration
      const hashBytes32 = '0x' + contentHash;
      const paddedHash = hashBytes32.slice(2).padStart(64, '0');
      const data = GET_REGISTRATION_SELECTOR + paddedHash;

      // Call contract function
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: CONTRACT_ADDRESS,
          data: data
        }, 'latest']
      });

      if (result === '0x') {
        setVerificationResult({
          exists: false,
          message: 'This content has not been registered on the blockchain.'
        });
      } else {
        // Simple decoding of the result (address + timestamp)
        const authorAddress = '0x' + result.slice(26, 66); // Extract address
        const timestampHex = result.slice(66, 130); // Extract timestamp
        const timestamp = parseInt(timestampHex, 16);
        
        const ageInSeconds = Math.floor(Date.now() / 1000) - timestamp;
        const ageInDays = (ageInSeconds / 86400).toFixed(1);

        setVerificationResult({
          exists: true,
          author: authorAddress,
          timestamp: timestamp,
          ageInDays: ageInDays,
          message: `✓ Verified: This content was registered by ${authorAddress} on ${new Date(timestamp * 1000).toLocaleString()} (${ageInDays} days ago)`
        });
      }

    } catch (err) {
      console.error('Error verifying:', err);
      if (err.message.includes('revert') || err.message.includes('invalid opcode')) {
        setVerificationResult({
          exists: false,
          message: 'This content has not been registered on the blockchain.'
        });
      } else {
        setError(err.message || 'Failed to verify. See console for details.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Function to clear current tab's data
  const clearCurrentTabData = () => {
    if (activeTab === 'file') {
      setSelectedFile(null);
    } else if (activeTab === 'text') {
      setInputText('');
    } else if (activeTab.startsWith('verify-')) {
      setVerifyAuthorName('');
      setVerifyContent('');
      setVerifyFile(null);
      setVerificationResult(null);
    }
    setComputedHash('');
    setError('');
    setDebugInfo('');
  };

  const getTabStyle = (tabName) => ({
    padding: '10px 20px', 
    marginRight: '10px', 
    backgroundColor: activeTab === tabName ? '#007bff' : '#f8f9fa',
    color: activeTab === tabName ? 'white' : 'black',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    cursor: 'pointer'
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>I am <span style={{fontStyle:'italic'}}>The Author</span>!</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>Prove and verify authorship of any content, using blockchain.</p>
      <p style={{ textAlign: 'center', color: '#666' }}>This is a test dApp using Sepolia network (Ethereum test network).</p>

      {/* Wallet Connection */}
      {!isConnected ? (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button
            onClick={connectWallet}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f6851b',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Connect MetaMask Wallet
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', margin: '10px 0', color: '#28a745' }}>
          ✓ Connected: {userAddress}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        <button onClick={() => { setActiveTab('file'); clearCurrentTabData(); }} style={getTabStyle('file')}>
          Register File
        </button>
        <button onClick={() => { setActiveTab('text'); clearCurrentTabData(); }} style={getTabStyle('text')}>
          Register Text
        </button>
        <button onClick={() => { setActiveTab('verify-file'); clearCurrentTabData(); }} style={getTabStyle('verify-file')}>
          Verify File
        </button>
        <button onClick={() => { setActiveTab('verify-text'); clearCurrentTabData(); }} style={getTabStyle('verify-text')}>
          Verify Text
        </button>
      </div>

      {/* Registration Tabs */}
      {(activeTab === 'file' || activeTab === 'text') && (
        <>
          <div style={{ margin: '0 auto 20px auto' }}>
            <label htmlFor="authorName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Your Name: *
            </label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ced4da', 
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontSize: '16px'
              }}
              placeholder="Enter your full name or pseudonym"
            />
          </div>

          {activeTab === 'file' && (
            <div>
              <label htmlFor="fileInput" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select your file: *
              </label>
              <input
                type="file"
                id="fileInput"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={{ marginBottom: '15px' }}
              />
              {selectedFile && (
                <p>Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div>
              <label htmlFor="textInput" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Enter your text: *
              </label>
              <textarea
                id="textInput"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows="6"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontSize: '16px'
                }}
                placeholder="Paste your text, code, idea, or message here..."
              />
            </div>
          )}

          <div style={{ margin: '20px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCalculateHash}
              disabled={!authorName || (activeTab === 'file' && !selectedFile) || (activeTab === 'text' && !inputText.trim())}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Generate Proof Hash
            </button>

            <button
              onClick={handleRegisterHash}
              disabled={!isConnected || !computedHash || isRegistering}
              style={{
                padding: '12px 24px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: (isConnected && computedHash && !isRegistering) ? 'pointer' : 'not-allowed',
                opacity: (isConnected && computedHash && !isRegistering) ? 1 : 0.6,
                fontSize: '16px'
              }}
            >
              {isRegistering ? 'Registering...' : 'Register on Blockchain'}
            </button>
          </div>
        </>
      )}

      {/* Verification Tabs */}
      {(activeTab === 'verify-file' || activeTab === 'verify-text') && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="verifyAuthorName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Author's Name to Verify: *
            </label>
            <input
              type="text"
              id="verifyAuthorName"
              value={verifyAuthorName}
              onChange={(e) => setVerifyAuthorName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ced4da', 
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontSize: '16px'
              }}
              placeholder="Enter the author's name as it was registered"
            />
          </div>

          {activeTab === 'verify-file' && (
            <div>
              <label htmlFor="verifyFileInput" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select file to verify: *
              </label>
              <input
                type="file"
                id="verifyFileInput"
                onChange={(e) => setVerifyFile(e.target.files[0])}
                style={{ marginBottom: '15px' }}
              />
              {verifyFile && (
                <p>Selected: {verifyFile.name}</p>
              )}
            </div>
          )}

          {activeTab === 'verify-text' && (
            <div>
              <label htmlFor="verifyTextInput" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Enter text to verify: *
              </label>
              <textarea
                id="verifyTextInput"
                value={verifyContent}
                onChange={(e) => setVerifyContent(e.target.value)}
                rows="6"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontSize: '16px'
                }}
                placeholder="Paste the text you want to verify..."
              />
            </div>
          )}

          <div style={{ margin: '20px 0' }}>
            <button
              onClick={handleVerify}
              disabled={isVerifying || !verifyAuthorName || 
                (activeTab === 'verify-file' && !verifyFile) || 
                (activeTab === 'verify-text' && !verifyContent.trim())}
              style={{
                padding: '12px 24px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Authorship'}
            </button>
          </div>
        </>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: '15px', 
          margin: '20px 0', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb',
          borderRadius: '5px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div style={{ 
          padding: '15px', 
          margin: '20px 0', 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          border: '1px solid #ffeaa7',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>Debug Information:</strong><br />
          {debugInfo}
        </div>
      )}

      {/* Results Display for Registration */}
      {computedHash && (activeTab === 'file' || activeTab === 'text') && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
          <h3 style={{ marginTop: 0 }}>Your Unique Proof Hash:</h3>
          <p style={{ 
            wordBreak: 'break-all', 
            fontFamily: 'monospace', 
            backgroundColor: '#e9ecef', 
            padding: '15px',
            borderRadius: '4px',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {computedHash}
          </p>
        </div>
      )}

      {/* Verification Result Display */}
      {verificationResult && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: verificationResult.exists ? '#d4edda' : '#f8d7da',
          color: verificationResult.exists ? '#155724' : '#721c24',
          border: `1px solid ${verificationResult.exists ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px'
        }}>
          <h3 style={{ marginTop: 0 }}>Verification Result:</h3>
          <p>{verificationResult.message}</p>
          {verificationResult.exists && (
            <div style={{ marginTop: '15px', fontSize: '14px' }}>
              <p><strong>Author's Address:</strong> {verificationResult.author}</p>
              <p><strong>Registered On:</strong> {new Date(verificationResult.timestamp * 1000).toLocaleString()}</p>
              <p><strong>Age:</strong> {verificationResult.ageInDays} days ago</p>
            </div>
          )}
        </div>
      )}

      {/* Transaction Link */}
      {txHash && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
          <p style={{ margin: 0 }}><strong>Transaction Submitted!</strong></p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            View on Etherscan: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </div>
      )}

      <div id="footer">
        by: <a href="https://github.com/tajary">Alireza Tajary</a> 

      </div>

    </div>
  );
}

export default FileAndTextHasher;