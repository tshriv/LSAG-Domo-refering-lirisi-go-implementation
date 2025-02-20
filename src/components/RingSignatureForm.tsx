// src/components/RingSignatureForm.tsx
import React, { useState } from 'react';
import { RingSignature } from '../crypto/ringSignature';
import { generateTestPrivateKey, generateTestPublicKeys } from '../crypto/testUtils';
import { PublicKey, PrivateKey, Signature } from '../crypto/types';
import BN from 'bn.js';

export const RingSignatureForm: React.FC = () => {
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  // Store the public keys used for signing to use in verification
  const [currentPublicKeys, setCurrentPublicKeys] = useState<PublicKey[]>([]);

  const handleSign = async () => {
    try {
        const signer = new RingSignature();
        const privateKey = await generateTestPrivateKey();
        const otherPublicKeys = await generateTestPublicKeys(4);
        const allPublicKeys = [...otherPublicKeys, privateKey.publicKey];
        
        setCurrentPublicKeys(allPublicKeys);
        
        const sig = await signer.create(
            privateKey,
            allPublicKeys,
            new TextEncoder().encode(message)
        );
        
        // Convert BN objects to hex strings for JSON serialization
        const serializedSig = {
            keyImage: sig.keyImage,
            c: sig.c.map(c => c.toString('hex')),
            r: sig.r.map(r => r.toString('hex')),
        };
        
        setSignature(JSON.stringify({
            signature: serializedSig,
            publicKeys: allPublicKeys
        }));
    } catch (err) {
        console.error('Signing failed:', err);
    }
};

  const handleVerify = async () => {
    try {
        const signer = new RingSignature();
        const parsedData = JSON.parse(signature);
        const { signature: sig, publicKeys } = parsedData;
        
        // Convert hex strings back to BN objects
        const deserializedSig = {
            keyImage: sig.keyImage,
            c: sig.c.map((c: string) => new BN(c, 'hex')),
            r: sig.r.map((r: string) => new BN(r, 'hex')),
        };
        
        const isValid = await signer.verify(
            deserializedSig,
            publicKeys,
            new TextEncoder().encode(message)
        );
        
        setVerificationResult(isValid);
    } catch (err) {
        console.error('Verification failed:', err);
    }
};

  return (
    <div>
      <h2>Ring Signature Demo</h2>
      <div>
        <textarea 
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Enter message to sign"
          style={{ width: '100%', minHeight: '100px' }}
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleSign}>Sign</button>
        <button onClick={handleVerify} style={{ marginLeft: '10px' }}>Verify</button>
      </div>
      
      {signature && (
        <div>
          <h3>Signature and Public Keys:</h3>
          <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
            {signature}
          </pre>
        </div>
      )}
      
      {verificationResult !== null && (
        <div>
          <h3>Verification Result:</h3>
          <p style={{ color: verificationResult ? 'green' : 'red' }}>
            {verificationResult ? 'Valid' : 'Invalid'}
          </p>
        </div>
      )}
    </div>
  );
};