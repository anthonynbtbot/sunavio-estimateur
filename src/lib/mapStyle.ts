// Sunavio dark map style for Google Maps
export const SUNAVIO_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1A1A1A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1A1A1A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#C8C0B4" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#E8A84C" }],
  },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#C8C0B4" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#2A3A2A" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A2A2A" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1A1A1A" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#C8C0B4" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3A2A1A" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1E2A3A" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4A5A6A" }] },
];

export const GOLD_MARKER_SVG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#E8A84C" stroke="#1A1A1A" stroke-width="1.5"/><circle cx="18" cy="18" r="6" fill="#1A1A1A"/></svg>`,
  );
