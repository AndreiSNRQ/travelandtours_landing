import React from "react"
import { Link } from "react-router"

import Header from "@/components/core1/header"
import FadeIn from "@/components/core1/fade-in"
import Footer from "@/components/core1/footer"

import { Button } from "@/components/ui/button"

import wallpaperHeader from "@/assets/wallpaper-header.jpg"
import featuredImg1 from "@/assets/Bohol.jpg"
import featuredImg2 from "@/assets/Boracay.jpg"
import featuredImg3 from "@/assets/Palawan.jpg"

export default function LandingPage() {
  const featuredDestinations = [
    { image: featuredImg3, title: "El Nido, Palawan", subtitle: "Lagoon Hooping Limestone Cliff" },
    { image: featuredImg2, title: "Boracay", subtitle: "White Beach Water Sport" },
    { image: featuredImg1, title: "Bohol", subtitle: "Chocolate Hills Tarsier" },
  ]

  return (
    <div className="flex justify-center">
      <div className="max-w-[1920px] w-full">
        <div className="relative overflow-hidden">
          {/* Background */}
          <img
            src={wallpaperHeader}
            alt="wallpaper"
            alt="LOGO"
            className="absolute inset-0 w-full h-full object-cover -z-10 blur-[2px]"
          />

          {/* Content */}
          <div className="relative z-10">
            <Header />

            <div className="p-60 px-10 flex justify-center">
              <FadeIn className="p-8 rounded-lg bg-white lg:w-[700px] flex flex-col">
                <h1 className="text-[30px] text-center font-bold">
                  Design your next Escape with
                </h1>

                <p className="text-(--primary) lg:text-[50px] text-center font-bold leading-tight text-[40px]">
                  Company Title
                </p>

                <p className="my-4 text-center">
                  Curated itineraries, reliable transfer, and local-guided experiences across the
                  philippines and beyond.
                </p>

                {/* ✅ Packages route */}
                <Link to="/packages" className="self-center">
                  <Button className="cursor-pointer">Find Packages</Button>
                </Link>
              </FadeIn>
            </div>
          </div>
        </div>

        <div className="p-20 lg:flex lg:flex-col lg:items-center" id="destinations">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-[20px] font-bold">Destinations</h1>

            {/* ✅ Packages route */}
            <Link to="/packages">
              <p className="text-(--primary) text-[20px] font-bold">See all Packages</p>
            </Link>
          </div>

          {/* keep your existing rest of landing file below unchanged */}
          {/* ... */}
        </div>

        <Footer />
      </div>
    </div>
  )
}
