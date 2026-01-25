const crypto = require('crypto');
const fs = require('fs');

/**
 * Utility to generate RSA 2048-bit key pairs for RS256 JWT signing
 */
const generateKeys = () => {
    console.log('Generating RSA 2048-bit key pair...');

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    console.log('\n--- PRIVATE KEY (Save to JWT_PRIVATE_KEY in .env) ---\n');
    console.log(privateKey.replace(/\n/g, '\\n'));

    console.log('\n--- PUBLIC KEY (Save to JWT_PUBLIC_KEY in .env) ---\n');
    console.log(publicKey.replace(/\n/g, '\\n'));

    const keyData = `JWT_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"\nJWT_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"`;
    fs.writeFileSync('temp_keys.txt', keyData);
    console.log('\nKeys written to temp_keys.txt');

    console.log('\nIMPORTANT: Copy the keys above (including the \\n) and add them to your .env file.');
};

// Run if called directly
if (require.main === module) {
    generateKeys();
}

module.exports = { generateKeys };
