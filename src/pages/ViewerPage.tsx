import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Eye, Clock, Download, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [fileMeta, setFileMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wordHtml, setWordHtml] = useState('');
  const [numPages, setNumPages] = useState<number>();
  const [pageWidth, setPageWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setPageWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const res = await fetch(`/api/files/${id}`);
        if (!res.ok) throw new Error('File not found or expired');
        const data = await res.json();
        setFileMeta(data);

        if (data.mimetype.includes('word')) {
          const contentRes = await fetch(`/api/files/${id}/content`);
          const html = await contentRes.text();
          setWordHtml(html);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    // Prevent right click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Prevent keyboard shortcuts for saving/printing
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        alert('Downloading and printing are disabled for this document.');
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009A44]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="bg-slate-50 p-8 rounded-2xl max-w-md w-full border border-slate-200 shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const isImage = fileMeta.mimetype.startsWith('image/');
  const isPdf = fileMeta.mimetype === 'application/pdf';
  const isWord = fileMeta.mimetype.includes('word');

  return (
    <div className="h-[100dvh] w-full bg-white text-slate-800 font-sans flex flex-col no-select overflow-hidden">
      {/* Premium Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.postimg.cc/7Y07cnMv/AGROLIVA%20logo%20Photoroom.png" 
              alt="Agroliva" 
              className="h-8 object-contain" 
            />
          </div>
          
          <div className="flex-1 text-center px-4 truncate">
            <h1 className="text-sm font-medium text-slate-600 truncate">
              {fileMeta.filename}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-[#009A44] bg-[#009A44]/10 px-3 py-1.5 rounded-full border border-[#009A44]/20">
              <Shield size={14} />
              <span className="hidden sm:inline">Protected View</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col bg-slate-100 overflow-hidden relative">
        {/* Document Metadata / Stats - Floating */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Eye size={16} className="text-[#009A44]" />
            <span className="font-medium">View Only</span>
          </div>
          <div className="w-px h-4 bg-slate-300"></div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock size={16} className="text-[#8DC63F]" />
            <span className="font-medium">Accès illimité</span>
          </div>
        </motion.div>

        {/* Viewer Container */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 w-full h-full relative"
        >
          {/* Overlay to prevent interaction with iframe/image if needed, but we want scrolling */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] z-10"></div>
          
          <div className="absolute inset-0 w-full h-full">
            {isPdf && (
              <div className="w-full h-full bg-slate-100 overflow-auto flex flex-col items-center py-8 px-4">
                <Document
                  file={`/api/files/${id}/content`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#009A44] mb-4"></div>
                      <p>Chargement du document...</p>
                    </div>
                  }
                  error={
                    <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
                      Impossible de charger le document PDF.
                    </div>
                  }
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page 
                      key={`page_${index + 1}`} 
                      pageNumber={index + 1} 
                      className="mb-8 shadow-xl rounded-sm overflow-hidden"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={Math.min(pageWidth - 32, 1000)}
                    />
                  ))}
                </Document>
              </div>
            )}

            {isImage && (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 p-4 sm:p-8 overflow-auto">
                <img 
                  src={`/api/files/${id}/content`} 
                  alt={fileMeta.filename}
                  className="max-w-full max-h-full object-contain shadow-md"
                  draggable={false}
                />
              </div>
            )}

            {isWord && (
              <div className="w-full h-full bg-white overflow-auto p-4 sm:p-8 md:p-16 text-slate-800">
                <div 
                  className="max-w-4xl mx-auto prose prose-slate prose-emerald"
                  dangerouslySetInnerHTML={{ __html: wordHtml }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </main>

    </div>
  );
}
