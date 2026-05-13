import React, { useRef } from "react";

interface ScreenshotUploadProps {
  onUpload: (base64: string) => void;
  isLoading: boolean;
}

const ScreenshotUpload: React.FC<ScreenshotUploadProps> = ({
  onUpload,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={!isLoading ? triggerUpload : undefined}
        className={`relative group border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center
          ${
            isLoading
              ? "bg-gray-50 border-gray-200 cursor-not-allowed"
              : "bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50"
          }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${isLoading ? "animate-pulse" : "group-hover:scale-110"} bg-blue-100 text-blue-600`}
        >
          <i
            className={`fa-solid ${isLoading ? "fa-spinner fa-spin" : "fa-cloud-arrow-up"} text-2xl`}
          ></i>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {isLoading ? "Analyzing Screenshot..." : "Drop a screenshot here"}
        </h3>
        <p className="text-gray-500 max-w-sm">
          {isLoading
            ? "Our AI is dissecting the layout, colors, and components to recreate them for you."
            : "Take a screenshot of any website you like and upload it. We will generate the code to clone its vibe."}
        </p>

        {!isLoading && (
          <button className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Select File
          </button>
        )}
      </div>
    </div>
  );
};

export default ScreenshotUpload;
