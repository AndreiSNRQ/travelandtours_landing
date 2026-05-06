import { Separator } from "@/components/ui/separator";
import React from 'react';
import logo from '@/assets/finallogo.avif';

export default function Footer() {
    return (
        <>
            <Separator/>

            <div className="flex items-center justify-evenly p-8">
                <div>
                    <img src={logo} className="w-60 ml-[-40px]" alt="Logo"/>
                    <h1 className="font-bold text-(--primary)">Travel and Tours</h1>
                </div>

                <div>
                    <h1 className="font-bold">Explore</h1>
                    <p>Destinations</p>
                    <p>Packages</p>
                    <p>Reviews</p>
                </div>

                <div>
                    <h1 className="font-bold">Company</h1>
                    <p>About</p>
                    <p>FAQ</p>
                    <p>Contact</p>
                </div>
            </div>
        </>
    )
}