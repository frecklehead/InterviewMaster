"use client";
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker,Popup, Polyline} from 'react-leaflet'
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import L from "leaflet";
import { Card ,CardContent,CardHeader,CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
 
 interface Location{
  lat:number;
  lng:number;
 }

 interface Hospital {
  id:number;
  name:string;
  coordinates:[number,number];
  contact:string
  ambulancesAvailable:number;
 }
//fix the marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src
});

//custom hospital icon
const createhospitalicon = (ambulancesAvailable: number)=>{
  return L.divIcon({
  className:"custom-hospital-icon",
  html:
    `
    <div style="
    background-color: ${getHospitalIconcolor(ambulancesAvailable)};
    width:40px;
    height:40px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    color: white;
    font-weight:bold;
    border:2px solid white;
    box-shadow:0 2px 5px rgba(0,0,0,0.4);


    ">
      <span> ${ambulancesAvailable}</span>

    </div>`,
    iconSize:[40,40],
    iconAnchor:[20,20],
    popupAnchor:[0,-20]
   });
};

const getHospitalIconcolor=(ambulancesAvailable: number)=>{
  if(ambulancesAvailable>=4){
    return "green";
  }
  if(ambulancesAvailable>=2){
    return "orange";
  }
  return "red";
}

export default function Mapcomponent() {

const [userLocation,setuserLocation] =useState<Location | null>(null);
const KATHMANDU_CENTER:[ number,number]=[27.694,85.320]

//states
const [selectedHospital, setselectedHospital]=useState<Hospital|null>(null);
const [distance,setdistance]=useState<string|null>(null);
const [estimatedtime,setestimatedtime]=useState<number|null>(null);
const [routeCoordinates,setRoutecoordinates]=useState<[number,number][]> ([]);
const HOSPITALS : Hospital [] =
[


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

  useEffect(()=>{
if (navigator.geolocation){
  navigator.geolocation.getCurrentPosition(
    (position)=>{
      console.log(position.coords.latitude,position.coords.longitude)
      setuserLocation({
        lat:position.coords.latitude,
        lng:position.coords.longitude
      })
    },
    (error)=>{
      console.log(error);
    }
  )
}

  },[])

const calculateRoute =async (start:Location,end:[number,number])=>{
  try {
    
    //use the orsm api for routinf
    const response = await fetch (
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end[1]},${end[0]}?overview=full&geometries=geojson`
    );
    const data= await response.json();

    if(data.routes && data.routes.length>0){
      const coordinates=data.routes[0].geometry.coordinates.map(
        (coord:[number,number])=>
          [coord[1],coord[0]] as [number,number]
        
      )

      setRoutecoordinates(coordinates);
      //calculate distance
      const distanceInKm = (data.routes[0].distance /1000).toFixed(2);
      const timeinminutes=Math.ceil(data.routes[0].duration/60);
      setdistance(distanceInKm);
      setestimatedtime(timeinminutes);
    }

  } catch (error) {
    console.log(error);
  }
}
const deg2rad=(deg:number):number=>{
  return deg * (Math.PI/180);
}

const calculatedistance=( loc1:Location ,loc2:[number,number]):
number=>{
  const R=6371;//radius of the earth;
  const dlat= deg2rad(loc2[0]-loc1.lat);
  const dlng=deg2rad(loc2[1]-loc1.lng);
  const a= Math.sin(dlat/2)* Math.sin(dlat/2) +
  Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2[0])) *
  Math.sin(dlng/2)*Math.sin(dlng/2);
  const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  const distance = R*c;
  return distance;


}

const handlehospitalselect= (hospital :Hospital)=>{
    if(!userLocation) return;
    setselectedHospital(hospital);
  calculateRoute(userLocation,hospital.coordinates)

  };


  
return (
    <div  className='flex h-screen'>
 
  <div className='w-2/3 p-4' >
    <div className='w-full  h-full rounded-2xl overflow-hidden shadow-xl border border-gray-400'>
    <MapContainer center={KATHMANDU_CENTER} zoom={13} scrollWheelZoom={false} style={{ height:"600px" ,width:"100%"}}>
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
{userLocation &&(
 <Marker position={[userLocation.lat, userLocation.lng]}>
 <Popup>
  Your current Location
 </Popup>
</Marker>
)}

{HOSPITALS.map((hospital)=>(
  <Marker 
  key={hospital.id}
  position={hospital.coordinates}
  icon={createhospitalicon(hospital.ambulancesAvailable)}
  eventHandlers={{
    click:()=>{
     handlehospitalselect(hospital);
    }
  }}
  >
<Popup>
  <div>
    <h3 className='font-medium text-lg'>{hospital.name}</h3>
    <p className='text-sm'> Ambulances Available: {hospital.ambulancesAvailable}</p>
    <p className='text-sm'> Contact: {hospital.contact}</p>
  </div>
</Popup>
  </Marker>

 
))}

{routeCoordinates.length >0 &&(

  <Polyline
  positions={routeCoordinates}
  color='blue'
  weight={5}
  opacity={0.5}
  >

  </Polyline>
)}
</MapContainer>
    </div>
  </div>

  <div className='w-1/3 p-4 bg-gray-50 '>

    <Card
     className=" h-full">
      <CardHeader> 
        <CardTitle className=" flex items-center text-red-600">
          <AlertCircle className='w-5 h-5 mr-2'></AlertCircle>
          Emergency Ambulane Booking
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-6'>
        {!userLocation &&( 
          <Alert variant='destructive'>
            <AlertDescription>

              PLease enable location services to use this service
            </AlertDescription>
          </Alert>
        )}

{
  selectedHospital &&(
    <div className='space-y-4 p-4 bg-white rounded-lg border'>
      <h3 className=' font-medium text-lg'>{selectedHospital.name}</h3>
      <div className='space-y-2 text-sm'>
        <div className='flex justify-between'>
          <span> Available Ambulances :</span>
          <span className='font-medium' > {selectedHospital.ambulancesAvailable}</span>
        </div>
        <div className='flex justify-between'>
          <span> Distance :</span>
          <span className='font-medium ' > {distance} km</span>
         </div>
         <div className='flex justify-between'>
            <span> Estimated Time :</span>
            <span className='font-medium '>{estimatedtime} minutes</span>
         </div>
        </div>
      </div>
   
    
    
  )
}

      </CardContent>
     </Card>
  </div>
    </div>
  )
}


