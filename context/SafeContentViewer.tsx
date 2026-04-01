'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DOMPurify from 'dompurify';
import { RootState } from './store';
import { setContent } from './contentSlice';

export default function SafeContentViewer() {
  // Read the HTML content from Redux
  const dirtyHtml = useSelector((state: RootState) => state.content.userHtml);
  const dispatch = useDispatch();

  // Safely sanitize the HTML using DOMPurify. 
  // This strips out the malicious <script> and onerror handlers from the slice.
  const cleanHtml = DOMPurify.sanitize(dirtyHtml);

  const handleUpdate = () => {
    const newContent = '<p>The content was updated via <strong>Redux Toolkit</strong>!</p>';
    dispatch(setContent(newContent));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Safely Rendered Content:</h2>
      
      {/* dangerouslySetInnerHTML is now completely safe because we purified it */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      
      <button 
        onClick={handleUpdate}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Update Content
      </button>
    </div>
  );
}