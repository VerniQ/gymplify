import React from "react";
import LoginFormComponent from "../components/LoginFormComponent.tsx";
import Brand from "../assets/brand.svg"

const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                <img src={Brand} alt="Brand" className="h-16" />
            </div>
            <div className="w-full max-w-xl">
                <LoginFormComponent />
            </div>
        </div>
    )
};

export default LoginPage;