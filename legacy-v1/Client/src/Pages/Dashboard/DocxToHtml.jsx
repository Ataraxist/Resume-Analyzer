import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth';

const DocxToHtml = ({ file }) => {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Convert the file to an ArrayBuffer
    file
      .arrayBuffer()
      .then((arrayBuffer) => {
        // Convert DOCX to HTML using Mammoth
        return mammoth.convertToHtml({ arrayBuffer });
      })
      .then((result) => {
        // Set the resulting HTML in state
        setHtml(result.value);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error converting DOCX to HTML:', err);
        setError('Error converting DOCX to HTML.');
        setLoading(false);
      });
  }, [file]);

  if (loading) return <p>Loading DOCX...</p>;
  if (error) return <p>{error}</p>;

  // Render the converted HTML
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ whiteSpace: 'pre-wrap' }}
    />
  );
};

export default DocxToHtml;
