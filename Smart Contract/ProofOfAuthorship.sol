// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Author: Alireza Tajary, tajary@gmail.com
contract ProofOfAuthorship {

    // Struct to store more robust registration data
    struct Registration {
        address author;
        uint256 timestamp;
    }

    mapping(bytes32 => Registration) public registrations;

    // Event emitted when a new hash is registered
    event HashRegistered(address indexed author, bytes32 indexed hash, uint256 timestamp);

    // Custom error for better gas efficiency and clarity
    error HashAlreadyRegistered(bytes32 hash);

    /**
     * @dev Registers a hash and ties it to the sender's address.
     * @param _hash The SHA-256 hash of the author's name + file content.
     */
    function registerHash(bytes32 _hash) external {
        // Check if the hash is already registered. Revert if it is.
        if (registrations[_hash].timestamp != 0) {
            revert HashAlreadyRegistered(_hash);
        }

        // Create a new registration record
        registrations[_hash] = Registration({
            author: msg.sender, 
            timestamp: block.timestamp
        });

        emit HashRegistered(msg.sender, _hash, block.timestamp);
    }

    /**
     * @dev Retrieves the registration data for a given hash.
     * @param _hash The hash to look up.
     * @return The author's address and the timestamp of registration.
     */
    function getRegistration(bytes32 _hash) external view returns (address, uint256) {
        Registration memory reg = registrations[_hash];
        require(reg.timestamp != 0, "Hash not registered");
        return (reg.author, reg.timestamp);
    }
}