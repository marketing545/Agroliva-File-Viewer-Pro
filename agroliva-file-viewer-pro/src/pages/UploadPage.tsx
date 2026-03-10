import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ id: string, viewerUrl: string, qrCodeDataUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('origin', window.location.origin);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      
      // Generate QR code on the client side to guarantee the exact URL works on mobile
      const viewerUrl = `${window.location.origin}/viewer/${data.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(viewerUrl, {
        color: {
          dark: '#009A44', // Agroliva Dark Green
          light: '#FFFFFF'
        },
        margin: 2,
        width: 300
      });
      
      setResult({
        id: data.id,
        viewerUrl: viewerUrl,
        qrCodeDataUrl: qrCodeDataUrl
      });
    } catch (error) {
      console.error('Upload failed details:', error);
      alert('Upload failed. Please ensure the backend server is running and supports persistent storage (like Render or Railway). Netlify (static) is not compatible with this backend.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.viewerUrl);
      alert('URL copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12 flex flex-col items-center">
          {/* Agroliva Logo */}
          <img 
            src="https://i.postimg.cc/7Y07cnMv/AGROLIVA%20logo%20Photoroom.png" 
            alt="Agroliva" 
            className="h-20 md:h-24 mb-6 object-contain" 
          />
          <p className="text-lg text-slate-600">
            Securely convert and share your documents with premium viewing experience.
          </p>
        </div>

        {!result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
          >
            <div className="p-8 md:p-12">
              <div 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
                  isDragging ? 'border-[#009A44] bg-[#009A44]/5' : 'border-slate-300 hover:border-[#8DC63F] hover:bg-slate-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                />
                
                <div className="flex justify-center mb-6">
                  <div className="bg-[#009A44]/10 p-4 rounded-full text-[#009A44]">
                    <Upload size={32} />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {file ? file.name : 'Drag & drop your file here'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Supports PDF, Word, and Images'}
                </p>

                {file && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                    disabled={uploading}
                    className="bg-[#009A44] hover:bg-[#008038] text-white font-medium py-3 px-8 rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#009A44]/20"
                  >
                    {uploading ? 'Processing...' : 'Generate Premium Link'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2"><FileText size={16} /> PDF & Word</div>
              <div className="flex items-center gap-2"><ImageIcon size={16} /> High-Res Images</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} /> Anti-Download</div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 md:p-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#009A44]/10 text-[#009A44] rounded-full mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Ready to Share</h2>
            <p className="text-slate-600 mb-8">Your premium viewer link has been generated securely.</p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <img src={result.qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <Link 
                  to={`/viewer/${result.id}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 bg-[#009A44] hover:bg-[#008038] text-white font-medium py-3 px-8 rounded-full transition-colors shadow-md shadow-[#009A44]/20"
                >
                  <ExternalLink size={18} /> Open Viewer
                </Link>
                
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 px-8 rounded-full transition-colors border border-slate-200"
                >
                  <Copy size={18} /> Copy Link
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => { setResult(null); setFile(null); }}
              className="text-[#009A44] hover:text-[#008038] font-medium text-sm"
            >
              Upload another file
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
