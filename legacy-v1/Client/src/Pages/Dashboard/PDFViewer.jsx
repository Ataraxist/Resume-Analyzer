import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the workerSrc property for pdf.js (make sure this is correct)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.js';

const PdfToImage = ({ pdfUrl, pageNumber = 1, scale = 1.5 }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  // Use a ref to store the current render task
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setImgSrc(null);

    // Cancel any ongoing render task if it exists
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
    loadingTask.promise
      .then((pdf) => {
        return pdf.getPage(pageNumber);
      })
      .then((page) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        const renderContext = { canvasContext: context, viewport };
        // Save the render task so we can cancel if needed
        renderTaskRef.current = page.render(renderContext);
        return renderTaskRef.current.promise;
      })
      .then(() => {
        if (cancelled) return;
        // Convert canvas content to a data URL
        const dataUrl = canvasRef.current.toDataURL();
        setImgSrc(dataUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err && err.name === 'RenderingCancelledException') {
          console.log('Rendering cancelled');
        } else {
          console.error('Error rendering PDF page:', err);
          setError('Error rendering PDF page.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      // Cancel the current render task if it exists
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfUrl, pageNumber, scale]);

  return (
    <div>
      {loading && <p>Loading PDF...</p>}
      {error && <p>{error}</p>}
      {imgSrc && !loading && !error && (
        <img src={imgSrc} alt='Converted PDF Page' />
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default PdfToImage;
