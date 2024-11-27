"use client"; 
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import "leaflet/dist/leaflet.css"; 
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"; 
import markerIcon from "leaflet/dist/images/marker-icon.png"; 
import markerShadow from "leaflet/dist/images/marker-shadow.png"; 
import L from "leaflet"; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 
import { Alert, AlertDescription } from '@/components/ui/alert'; 
import { AlertCircle, Ambulance, Phone, Navigation2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Interface for Location
interface Location {
  lat: number;
  lng: number;
}

// Interface for Hospital
interface Hospital {
  id: number;
  name: string;
  coordinates: [number, number];
  contact: string;
  ambulancesAvailable: number;
}

// Custom hospital icon function
const createHospitalIcon = (ambulancesAvailable: number) => {
  
  return L.divIcon({
    className: 'custom-hospital-icon',
    html: `
      <div style="
        background-color: ${getHospitalIconColor(ambulancesAvailable)};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <span style="font-size: 16px;">${ambulancesAvailable}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Color function based on ambulance availability
const getHospitalIconColor = (ambulancesAvailable: number): string => {
  if (ambulancesAvailable >= 4) return '#22c55e'; // Green for high availability
  if (ambulancesAvailable >= 2) return '#eab308'; // Yellow for moderate availability
  return '#ef4444'; // Red for low availability
};

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src 
});

export default function Mapcomponent() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<'success' | 'error' | null>(null);

  // Sample hospital data 
  const HOSPITALS: Hospital[] = [
    {
      id: 1,
      name: "City General Hospital",
      coordinates: [27.7271, 85.3376],
      contact: "+1234567890",
      ambulancesAvailable: 3
    },
    {
      id: 2,
      name: "Medicare Hospital",
      coordinates: [27.7072, 85.3140],
      contact: "+1234567891",
      ambulancesAvailable: 2
    },
    {
      id: 3,
      name: "Emergency Care Center",
      coordinates: [27.7372, 85.3440],
      contact: "+1234567892",
      ambulancesAvailable: 1
    },
    {
      id: 4,
      name: "Life Support Hospital",
      coordinates: [27.7172, 85.3040],
      contact: "+1234567893",
      ambulancesAvailable: 4
    },
    {
      id: 5,
      name: "Urgent Care Hospital",
      coordinates: [27.7072, 85.3340],
      contact: "+1234567894",
      ambulancesAvailable: 2
    }
  ];

  const KATHMANDU_CENTER: [number, number] = [27.694, 85.320];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log(error);
          // Fallback to Kathmandu center if geolocation fails
          setUserLocation({
            lat: KATHMANDU_CENTER[0],
            lng: KATHMANDU_CENTER[1]
          });
        }
      );
    }
  }, []);

  const calculateRoute = async (start: Location, end: [number, number]) => {
    try {
      // Use Open Source Routing Machine (OSRM) API for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        // Extract route coordinates
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        
        setRouteCoordinates(coordinates);
        
        // Calculate distance and time
        const distanceKm = (data.routes[0].distance / 1000).toFixed(2);
        const timeMinutes = Math.ceil(data.routes[0].duration / 60);
        
        setDistance(distanceKm);
        setEstimatedTime(timeMinutes);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      
      // Fallback to simple straight-line route if API fails
      const fallbackRoute = [
        [start.lat, start.lng],
        [end[0], end[1]]
      ];
      setRouteCoordinates(fallbackRoute as [number, number][]);
      
      // Calculate straight-line distance
      const dist = calculateDistance(start, end);
      setDistance(dist.toFixed(2));
      setEstimatedTime(Math.ceil(dist * 2));
    }
  };

  const calculateDistance = (loc1: Location, loc2: [number, number]): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(loc2[0] - loc1.lat);
    const dLon = deg2rad(loc2[1] - loc1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2[0])) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  const makeEmergencyCall = async () => {
    if (!selectedHospital || !userLocation) return;
    
    setIsLoading(true);
    try {
      // Simulate emergency call
      const response = await fetch('/api/make-emergency-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hospitalPhone: selectedHospital.contact,
          userLocation: `${userLocation.lat}, ${userLocation.lng}`,
          hospitalName: selectedHospital.name
        }),
      });

      if (response.ok) {
        setCallStatus('success');
      } else {
        setCallStatus('error');
      }
    } catch (error) {
      console.error('Error making emergency call:', error);
      setCallStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    if (!userLocation) return;

    // Set selected hospital
    setSelectedHospital(hospital);
    
    // Calculate and draw route
    calculateRoute(userLocation, hospital.coordinates);
  };

  return (
    <div className='flex h-screen'>
      <div className='w-2/3 p-4'>
        <div className='w-full h-full rounded-2xl overflow-hidden shadow-xl border border-gray-400'>
          <MapContainer 
            center={KATHMANDU_CENTER} 
            zoom={13} 
            scrollWheelZoom={false} 
            style={{ height:"600px", width:"100%" }}
          > 
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            /> 
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>Your Current Location</Popup>
              </Marker>
            )}
            {HOSPITALS.map((hospital) => (
              <Marker 
                key={hospital.id} 
                position={hospital.coordinates}
                icon={createHospitalIcon(hospital.ambulancesAvailable)}
                eventHandlers={{
                  click: () => handleHospitalSelect(hospital)
                }}
              >
                <Popup>
                  <div>
                    <strong>{hospital.name}</strong>
                    <br />
                    Ambulances Available: {hospital.ambulancesAvailable}
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Route Visualization */}
            {routeCoordinates.length > 0 && (
              <Polyline 
                positions={routeCoordinates} 
                color="blue" 
                weight={5} 
                opacity={0.7} 
              />
            )}
          </MapContainer>
        </div>
      </div>
      
      <div className='w-1/3 p-4 bg-gray-50'>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className='w-5 h-5 mr-2'/>
              Emergency Ambulance Booking
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {!userLocation && (
              <Alert variant='destructive'>
                <AlertDescription>
                  Please enable location services to use this service
                </AlertDescription>
              </Alert>
            )}

            {selectedHospital && (
              <div className="space-y-4 p-4 bg-white rounded-lg border">
                <h3 className="font-medium text-lg">{selectedHospital.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Available Ambulances:</span>
                    <span className="font-medium">{selectedHospital.ambulancesAvailable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-medium">{distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Arrival Time:</span>
                    <span className="font-medium">{estimatedTime} mins</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={makeEmergencyCall}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Connecting..."
                  ) : (
                    <>
                      <Navigation2 className="w-4 h-4 mr-2" />
                      Call Ambulance Now
                    </>
                  )}
                </Button>

                {callStatus && (
                  <Alert variant={callStatus === 'success' ? 'default' : 'destructive'}>
                    <AlertDescription>
                      {callStatus === 'success' 
                        ? 'Emergency call placed successfully. Ambulance is on the way.'
                        : 'Failed to place emergency call. Please try again or call emergency services directly.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!selectedHospital && (
              <div className="text-center text-gray-500">
                <Ambulance className="w-12 h-12 mx-auto mb-2" />
                <p>Select a hospital on the map to book an ambulance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}