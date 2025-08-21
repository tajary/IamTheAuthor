# I am The Author - Blockchain Proof of Authorship

A decentralized application that allows creators to prove authorship of their digital content by timestamping cryptographic hashes on the Ethereum blockchain.

## Demo
[I am The Author dApp](https://tajary.github.io/i-am-the-author/index.html)

## 🌟 Features
- 📁 File Registration: Coose any file to generate a unique hash and register it on the blockchain
- 📝 Text Registration: Register text content like code snippets, ideas, or messages
- 🔍 Verification System: Verify the authenticity and timestamp of any registered content
- 🛡️ Decentralized: Built on Ethereum blockchain with MetaMask integration
- 🔒 Privacy-First: Only hashes are stored on-chain, content remains private

## 📦 Installation
~~~
git clone https://github.com/tajary/IamTheAuthor.git
cd iam-the-author
npm install
~~~

## 🚀 Quick Start
### Configure the Application
~~~
// Update these constants in src/FileAndTextHasher.jsx
const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";
const REGISTER_HASH_SELECTOR = "0x12345678";
const GET_REGISTRATION_SELECTOR = "0xabcdef12";
~~~

### Start the Development Server
~~~
npm start
~~~

### Connect MetaMask
<pre>
1. Install MetaMask extension
2. Switch to Sepolia Testnet  
3. Get test ETH from <a href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia">Ethereum Sepolia Faucet</a>
4. Connect wallet to application
</pre>

## 📋 Prerequisites
~~~
Node.js (v19+)
npm or yarn  
MetaMask browser extension
Sepolia ETH for testing
~~~

## 🛠️ Smart Contract

Use the `Smart Contract/ProofOfAuthorship.sol` file inside [Remix IDE](https://remix.ethereum.org/) and deploy the smart contract.

## 🤝 Contributing
~~~
1. Fork the repository
2. Create feature branch: git checkout -b feature/amazing-feature
3. Commit changes: git commit -m 'Add amazing feature'
4. Push to branch: git push origin feature/amazing-feature  
5. Open Pull Request
~~~

### 📞 Contact & Links
<pre>
LinkedIn: <a href="https://www.linkedin.com/in/tajary/">Alireza Tajary</a>
Email: tajary@gmail.com

GitHub Repository: <a href="https://github.com/tajary/IamTheAuthor">https://github.com/tajary/IamTheAuthor</a>
Live Demo: <a href="https://tajary.github.io/i-am-the-author/index.html">https://tajary.github.io/i-am-the-author/index.html</a>
</pre>

## 🙏 Acknowledgments
~~~
Built with React
Smart contracts powered by Solidity  
Blockchain interactions via MetaMask
Test ETH from Sepolia Faucet
~~~

~~~
⚠️ Disclaimer: This tool provides cryptographic proof of existence, not legal proof of authorship. Always consult with legal professionals for intellectual property matters.
~~~
