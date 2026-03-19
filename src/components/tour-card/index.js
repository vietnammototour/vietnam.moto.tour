import React from "react";

export const TourCard = ({ tour }) => {
  const { title, imageUrl, rating, price, duration, distance, location } = tour;

  return (
    <div className="popular-tours__single">
      <div className="popular-tours__img">
        <picture style={{ display: 'block', width: '379px', height: '259px', overflow: 'hidden' }}>
          <source srcSet={imageUrl} type="image/webp" />
          <img
            src={imageUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.2)' }} />
        </picture>
        <div className="popular-tours__icon">
          <a href="tour-details.html">
            <i className="fa fa-heart"></i>
          </a>
        </div>
      </div>
      <div className="popular-tours__content">
        <div className="popular-tours__stars">
          <i className="fa fa-star"></i> {rating}
        </div>
        <h3 className="popular-tours__title">
          <a href="tour-details.html">{title}</a>
        </h3>
        <p className="popular-tours__rate">
          <span>${price}</span> / Per Person
        </p>
        <ul className="popular-tours__meta list-unstyled">
          <li>{duration}</li>
          <li>{distance}</li>
          <li>{location}</li>
        </ul>
      </div>
    </div>
  );
};
