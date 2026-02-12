import React, { useState, useEffect } from 'react';
import { Key, Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface LicenseValidatorProps {
  appId: string;
  onValidLicense: (licenseKey: string) => void;
  children: React.ReactNode;
}

const LicenseValidator: React.FC<LicenseValidatorProps> = ({ appId, onValidLicense, children }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLicenseInput, setShowLicenseInput] = useState(false);

  // Check for stored license on mount
  useEffect(() => {
    const storedLicense = localStorage.getItem(`license_${appId}`);
    if (storedLicense) {
      setLicenseKey(storedLicense);
      verifyLicense(storedLicense);
    }
  }, [appId]);

  const verifyLicense = async (key: string) => {
    setIsLoading(true);
    try {
      // In production, this would call your actual license verification API
      const response = await fetch('/api/apps/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, licenseKey: key })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.valid) {
          setIsValid(true);
          localStorage.setItem(`license_${appId}`, key);
          onValidLicense(key);
        } else {
          setIsValid(false);
        }
      } else {
        setIsValid(false);
      }
    } catch (error) {
      console.error('License verification failed:', error);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseKey.trim()) {
      verifyLicense(licenseKey.trim());
    }
  };

  if (isValid === true) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-1">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400 font-medium">Licensed</span>
        </div>
        {children}
      </div>
    );
  }

  if (showLicenseInput) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 border border-blue-500/50 rounded-full mb-4">
              <Key className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">License Required</h1>
            <p className="text-gray-400 text-sm">
              This application requires a valid license key to activate. Please enter your license key below.
            </p>
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                © 3000 Studios 2026 | Creator: mr.Jwswain@gmail.com
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                This is proprietary software. Unauthorized use is prohibited.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-300 mb-2">
                License Key
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="licenseKey"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="Enter your license key"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <Key className="absolute right-3 top-3.5 w-5 h-5 text-gray-500" />
              </div>
              {isValid === false && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid license key. Please check and try again.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !licenseKey.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Activate License
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Don't have a license key?{' '}
              <a href="https://voicetowebsite.com/appstore-new.html" className="text-blue-400 hover:text-blue-300 underline">
                Purchase one here
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full mb-4">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">License Required</h1>
        <p className="text-gray-400 mb-6">
          This application requires a valid license key to activate.
        </p>
        <button
          onClick={() => setShowLicenseInput(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
        >
          <Key className="w-5 h-5" />
          Enter License Key
        </button>
        <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            © 3000 Studios 2026 | Creator: mr.Jwswain@gmail.com
          </p>
          <p className="text-xs text-yellow-400 mt-1">
            This is proprietary software. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LicenseValidator;
