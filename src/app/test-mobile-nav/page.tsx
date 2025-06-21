"use client";

import { useEffect, useState } from "react";

export default function TestMobileNav() {
  const [windowWidth, setWindowWidth] = useState(0);
  const [touchEvents, setTouchEvents] = useState<string[]>([]);
  const [clickEvents, setClickEvents] = useState<string[]>([]);

  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const addTouchEvent = (event: string) => {
    setTouchEvents((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${event}`]);
  };

  const addClickEvent = (event: string) => {
    setClickEvents((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${event}`]);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mobile Navigation Test Page</h1>

      <div className="space-y-4">
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Device Info</h2>
          <p>Window Width: {windowWidth}px</p>
          <p>User Agent: {typeof window !== "undefined" ? navigator.userAgent : "N/A"}</p>
          <p>
            Touch Support:{" "}
            {typeof window !== "undefined" && "ontouchstart" in window ? "Yes" : "No"}
          </p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Test Touch Target</h2>
          <button
            className="w-full h-16 bg-primary text-primary-foreground rounded-lg"
            onTouchStart={() => addTouchEvent("touchstart")}
            onTouchEnd={() => addTouchEvent("touchend")}
            onClick={() => addClickEvent("click")}
          >
            Test Button (Touch/Click Me)
          </button>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Touch Events</h2>
          {touchEvents.length === 0 ? (
            <p className="text-muted-foreground">No touch events yet</p>
          ) : (
            <ul className="text-sm space-y-1">
              {touchEvents.map((event, i) => (
                <li key={i}>{event}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Click Events</h2>
          {clickEvents.length === 0 ? (
            <p className="text-muted-foreground">No click events yet</p>
          ) : (
            <ul className="text-sm space-y-1">
              {clickEvents.map((event, i) => (
                <li key={i}>{event}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Navigation Breakpoint Test</h2>
          <p className="md:hidden text-green-600">Mobile View (md:hidden visible)</p>
          <p className="hidden md:block text-blue-600">Desktop View (md:block visible)</p>
        </div>
      </div>
    </div>
  );
}
