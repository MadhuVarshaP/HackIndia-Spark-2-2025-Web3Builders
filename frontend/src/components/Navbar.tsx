"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current route
  const [activeTab, setActiveTab] = useState<string>("Home");

  const tabs: { name: string; route: string }[] = [
    { name: "Home", route: "/" },
    { name: "Posts", route: "/post" },
    { name: "Bounties", route: "/bounty" },
    { name: "Profile", route: "/profile" },
    { name: "About Us", route: "/about" },
  ];

  useEffect(() => {
    // Update the active tab based on the current route
    const currentTab =
      tabs.find((tab) => tab.route === pathname)?.name || "Home";
    setActiveTab(currentTab);
  }, [pathname]);

  const handleTabClick = (tab: string, route: string) => {
    setActiveTab(tab);
    router.push(route); // Navigate to the respective route
  };

  return (
    <div className="mt-8 flex justify-center items-center font-rajdhani font-medium text-[20px]">
      <div className="flex space-x-5 bg-[#17151B] bg-opacity-50 backdrop-blur-md px-6 py-4 rounded-xl">
        {tabs.map((tab) => (
          <p
            key={tab.name}
            className={`relative py-2 px-4 rounded-full cursor-pointer text-white transition-all duration-300 transform ease-in-out ${
              activeTab === tab.name
                ? "bg-gradient-to-r from-purple-500 to-blue-500 scale-110 shadow-lg"
                : "hover:bg-gray-700 hover:scale-105 hover:shadow-md"
            }`}
            onClick={() => handleTabClick(tab.name, tab.route)}
          >
            {/* Tab text */}
            <span className="relative z-10">{tab.name}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
