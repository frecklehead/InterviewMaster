
"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
export default function Home() {
  const router=useRouter();//naviagaton hook
  return (
    <div className=" flex h-screen flex-col items-center justify-center bg-red-100">
      <h1 className="text-4xl font-bold text-red-600 ">Ambulance Booking App</h1>
      <p className=" mt-2 text-lg text-red-500">Fast and Reliable Emergency Services</p>

      <Button  className=" mt-6 bg-red-600 hover:bg-red-900" onClick={()=> router.push("/sign-up")}> Signin</Button>
    </div>
  );
}
