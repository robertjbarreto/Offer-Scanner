
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Offer } from '../types';
import { analyzeOfferImage } from '../services/geminiService';
import { CameraIcon, CheckIcon, SparklesIcon, XMarkIcon, CameraSlashIcon, ArrowUpTrayIcon } from './Icons';

interface ScannerProps {
  onScanComplete: (scannedData: Partial<Offer>) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera. Please check your browser settings and grant permission to use this feature.";
      if (err instanceof Error && err.name === "NotAllowedError") {
          message = "Camera access was denied. You need to grant permission in your browser's settings to scan job offers.";
      }
      setError(message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setCapturedImage(result);
          stopCamera();
        }
      };
      reader.onerror = (e) => {
        console.error("Error reading file:", e);
        setError("There was a problem loading the selected image.");
      };
      reader.readAsDataURL(file);
    }
  };


  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  const handleProcess = async () => {
    if (!capturedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const base64Data = capturedImage.split(',')[1];
      const scannedData = await analyzeOfferImage(base64Data);
      onScanComplete(scannedData);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
       setIsLoading(false);
    }
  };

  const LoadingOverlay: React.FC = () => (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white z-20">
      <SparklesIcon className="animate-pulse h-12 w-12 text-blue-400" />
      <p className="mt-4 text-lg font-semibold">Analyzing Offer...</p>
      <p className="text-sm text-gray-300">This might take a moment.</p>
    </div>
  );
  
  const CameraError: React.FC = () => (
      <div className="h-full w-full bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
          <CameraSlashIcon className="h-16 w-16 text-gray-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Camera Access Required</h2>
          <p className="mt-2 text-gray-300 max-w-sm">{error}</p>
          <button
              onClick={startCamera}
              className="mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
              Retry
          </button>
      </div>
  );


  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-fade-in">
      {isLoading && <LoadingOverlay />}

      <div className="absolute top-4 right-4 z-10">
        <button onClick={onClose} className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75">
            <XMarkIcon/>
        </button>
      </div>
      
      <div className="w-full h-full flex items-center justify-center">
        {!stream && !capturedImage && error ? <CameraError /> : (
            <>
                <div className="w-full h-full relative flex items-center justify-center">
                    {!capturedImage ? (
                        <>
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-0 border-8 border-white border-opacity-50 rounded-lg m-8"></div>
                        </>
                    ) : (
                        <img src={capturedImage} alt="Captured job offer" className="w-full h-full object-contain" />
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent flex flex-col items-center">
                    {error && !isLoading && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 w-full max-w-md text-center" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {!capturedImage ? (
                        <div className="flex w-full items-center justify-around">
                            <div className="w-16 h-16"></div>
                            <button onClick={handleCapture} disabled={!stream} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-gray-300 hover:border-blue-500 transition-colors disabled:bg-gray-400">
                                <CameraIcon className="text-gray-700" />
                            </button>
                            <label htmlFor="image-upload" className="w-16 h-16 flex items-center justify-center cursor-pointer text-white rounded-full bg-black bg-opacity-30 hover:bg-opacity-50 transition-colors">
                                <ArrowUpTrayIcon />
                            </label>
                            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                        </div>
                    ) : (
                        <div className="flex space-x-6">
                            <button onClick={handleRetake} className="bg-white text-gray-800 font-bold py-3 px-4 rounded-lg shadow-lg flex items-center hover:bg-gray-200">
                                <XMarkIcon className="h-5 w-5 mr-2" />
                                Retake
                            </button>
                            <button onClick={handleProcess} disabled={isLoading} className="bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center hover:bg-blue-700 disabled:bg-blue-300">
                                <CheckIcon className="h-5 w-5 mr-2" />
                                Use Scan
                            </button>
                        </div>
                    )}
                </div>
            </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};


export default Scanner;
