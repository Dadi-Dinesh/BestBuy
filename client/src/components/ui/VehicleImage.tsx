import type { ImgHTMLAttributes } from 'react';

const fallback = "./icon.png";

export function VehicleImage({ src, alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} className={`grayscale ${className || ""}`} alt={alt} src={src || fallback} loading="lazy" decoding="async" onError={event => {
    const image = event.currentTarget;
    if (image.getAttribute('src') !== fallback) image.src = fallback;
  }} />;
}
