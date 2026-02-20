"use client";
import React, { useState } from "react";
import localFont from "next/font/local";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const terminal = localFont({ src: "../../app/fonts/terminal-grotesque.ttf" });

const scheduleData = [
  {
    day: "Saturday",
    date: "March 14",
    events: [
      {
        name: "Hacker Check-In",
        startTime: "8:30 AM",
        endTime: "8:30 AM",
        location: "Nitschke Hall Entrance",
      },
      {
        name: "Opening Ceremony",
        startTime: "9:00 AM",
        endTime: "10:00 AM",
        location: "Nitschke Auditorium",
      },
      {
        name: "Team Formation",
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        location: "Nitschke Auditorium",
      },
      {
        name: "Career Fair/Expo",
        startTime: "10:00 AM",
        endTime: "12:00 PM",
        location: "NODE",
      },
      {
        name: "Hacking Starts!",
        startTime: "11:00 AM",
        endTime: "-",
        location: "NI hallway & NE tables",
      },
      {
        name: "Workshops",
        startTime: "11:00 AM",
        endTime: "5:00 PM",
        location: "T.B.D.",
      },
      {
        name: "Dinner",
        startTime: "8:00 PM",
        endTime: "9:00 PM",
        location: "The NODE",
      },
    ],
  },
  {
    day: "Sunday",
    date: "March 15",
    events: [
      {
        name: "Breakfast",
        startTime: "9:00 AM",
        endTime: "10:00 AM",
        location: "The NODE",
      },
      {
        name: "Hacking Ends! - Project Submission Deadline",
        startTime: "11:00 AM",
        endTime: "-",
        location: "NI Hallway and NE Tables",
      },
      {
        name: "Lunch",
        startTime: "12:00 PM",
        endTime: "1:00 PM",
        location: "The NODE",
      },
      {
        name: "Judging",
        startTime: "12:30 PM",
        endTime: "1:30 PM",
        location: "NI Hallway and NE Tables",
      },
      {
        name: "Closing Ceremony",
        startTime: "2:30 PM",
        endTime: "3:30 PM",
        location: "Nitschke Auditorium",
      },
    ],
  },
];

export default function Schedule() {
  const [selectedDay, setSelectedDay] = useState("Saturday");

  const currentDaySchedule = scheduleData.find(
    (item) => item.day === selectedDay,
  );

  const EventCard = ({
    event,
    index,
  }: {
    event: (typeof scheduleData)[0]["events"][0];
    index: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      viewport={{ once: true }}
      className="group"
    >
      <Accordion type="single" collapsible>
        <AccordionItem value={`event-${index}`} className="border-0 mb-3">
          <AccordionTrigger className="px-4 py-3 rounded-lg bg-gradient-to-r from-rh-navy-light/40 to-rh-navy-dark/40 backdrop-blur-sm border border-rh-yellow/20 hover:border-rh-yellow/50 hover:from-rh-navy-light/60 hover:to-rh-navy-dark/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-rh-yellow/20 [&[data-state=open]]:bg-gradient-to-r [&[data-state=open]]:from-rh-navy-light/60 [&[data-state=open]]:to-rh-navy-dark/60 [&[data-state=open]]:border-rh-yellow/50">
            <div className="flex items-start justify-between w-full gap-4">
              <div className="text-left flex-1">
                <h3 className="text-base md:text-lg font-bold text-white mb-2 group-hover:text-rh-yellow transition-colors">
                  {event.name}
                </h3>
                <div className="flex flex-col gap-2 text-xs md:text-sm text-rh-purple-light">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rh-yellow flex-shrink-0" />
                    <span>
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4 pb-3 bg-rh-navy-dark/50 border-t border-rh-yellow/20">
            <div className="flex items-center gap-2 text-rh-white">
              <MapPin className="w-5 h-5 text-rh-yellow flex-shrink-0" />
              <span className="text-sm">{event.location}</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );

  return (
    <section
      id="schedule"
      className="relative py-16 md:py-24 px-4 md:px-8 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/assets/rh_26/rh_26_folder/rh_bg_1.jpg')",
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-rh-background/50 via-rh-background/60 to-rh-background/65 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2
            className={`${terminal.className} text-4xl md:text-6xl text-rh-yellow mb-4`}
          >
            EVENT SCHEDULE
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-rh-yellow to-rh-pink mx-auto rounded-full" />
        </motion.div>

        {/* Day Selector */}
        <div className="flex justify-center gap-4 mb-12">
          {scheduleData.map((day) => (
            <motion.button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 ${
                selectedDay === day.day
                  ? "bg-gradient-to-r from-rh-yellow to-rh-pink text-rh-navy-dark shadow-lg shadow-rh-yellow/50"
                  : "bg-rh-navy-light/40 backdrop-blur-sm border border-rh-yellow/30 text-rh-white hover:border-rh-yellow/60 hover:bg-rh-navy-light/60"
              }`}
            >
              <span>{day.day}</span>
              <span className="text-sm ml-2 opacity-75">{day.date}</span>
            </motion.button>
          ))}
        </div>

        {/* Events Container */}
        <AnimatePresence mode="wait">
          {currentDaySchedule && (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {currentDaySchedule.events.length > 0 ? (
                currentDaySchedule.events.map((event, index) => (
                  <EventCard key={index} event={event} index={index} />
                ))
              ) : (
                <div className="text-center py-8 text-rh-purple-light">
                  No events scheduled for this day.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
