import React, { useState, useEffect } from 'react';

const ImageLoader = () => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    // API dan rasm URL olish
    fetch('') // o'zingizning URL manzilingizni kiriting
      .then((response) => response.json())
      .then((data) => {
        // API javobidan rasm URL-ni olish
        setImageUrl(data.imageUrl); // rasm URL-ni o'zgartiring
      })
      .catch((error) => console.error('Rasmni yuklashda xato:', error));
  }, []);

  return (
    <div>
      {imageUrl ? (
        <img src={imageUrl} alt="Fetched Image" />
      ) : (
        <p>Rasm yuklanmoqda...</p>
      )}
    </div>
  );
};

export default ImageLoader;
