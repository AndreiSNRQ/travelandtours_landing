import { LoginForm } from "../components/login-form"
import { Link } from "react-router";
import { motion } from "motion/react";
import { ModeToggle } from "../components/theme-toggler"
import { useContext, useEffect } from "react"
import AuthContext from "../context/AuthProvider"

import { useNavigate } from 'react-router'

import bg from '@/assets/ironpattern.png'
import logo from '@/assets/finallogo.avif'
import { OTPForm } from "../components/otp-form";
import TermsAndConditions from '../components/term-conditions'
export default function LoginPage(){
        
        const navigate = useNavigate()
        const { pendingOtp, loading: authLoading, auth, roleAccess } = useContext(AuthContext);
        
        useEffect(() => {
            // Only redirect if authentication check is done
            if (auth) {
                roleAccess(auth);
            } else if (!authLoading && !pendingOtp) {
                navigate("/login");
            }
        }, [auth, authLoading, pendingOtp, navigate, roleAccess]);
        
        
        return( 
        <>
            <title>JOLI - Login</title>
            <div className="flex min-h-svh w-full flex-col items-center p-6 md:p-10 relative">
            
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-6 right-6 md:top-8 md:right-8"
                >
                    <ModeToggle />
                </motion.div>
    
                {/* Centered Logo */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center mb-10 mt-10"
                >
                    <Link to="/">
                        <img src={logo} className="w-40 md:w-64 scale-150" alt="Logo" />
                    </Link>
                </motion.div>

                
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xs sm:max-w-xs md:max-w-sm lg:max-w-md scale-110"
                >
                    <OTPForm />
                </motion.div>                   
                
                {/* Background */}
                <div
                    className="absolute inset-0 -z-50 bg-repeat"
                    style={{ backgroundImage: `url(${bg})` }}
                />
            </div>
        </>
    )
}