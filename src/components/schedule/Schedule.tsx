"use client";
import React, { useMemo, useState } from "react";
import localFont from "next/font/local";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin } from "lucide-react";

const terminal = localFont({ src: "../../app/fonts/terminal-grotesque.ttf" });

const scheduleData = [
  {
    day: "Saturday",
    date: "March 14",
    events: [
      {
        name: "Hacker Check-In",
        startTime: "8:30 AM",
        endTime: "-",
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
        name: "Lunch",
        startTime: "12:30 PM",
        endTime: "1:30 PM",
        location: "The NODE",
      },
      {
        name: "Hacking Starts!",
        startTime: "11:00 AM",
        endTime: "-",
        location: "NI hallway & NE tables",
      },
      {
        name: "Hacking with GitHub Copilot - MLH Workshop",
        startTime: "11:00 AM",
        endTime: "11:30 AM",
        location: "NE 1039",
      },
      {
        name: "Intro to Arduino Workshop - MIME Workshop",
        startTime: "11:30 AM",
        endTime: "1:00 PM",
        location: "NE 1320",
      },
      {
        name: "Tech Together - MLH Workshop",
        startTime: "12:30 AM",
        endTime: "1:00 PM",
        location: "NE 1021",
      },
      {
        name: "Intro to Google AI Studio - MLH Workshop",
        startTime: "1:30 PM",
        endTime: "2:00 PM",
        location: "NE 1039",
      },
      {
        name: "From Prompt to Agent: Creating an OpenClaw AI Agent - CodeEcho Workshop",
        startTime: "2:00 PM",
        endTime: "3:00 PM",
        location: "NE 1300",
      },
      {
        name: "Ship It: Build Real Software with AI in One Hackathon - A.R.T. Workshop",
        startTime: "3:00 PM",
        endTime: "4:00 PM",
        location: "NE 1039",
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
  const [activeFilters, setActiveFilters] = useState<
    Array<"workshop" | "food">
  >([]);

  const currentDaySchedule = scheduleData.find(
    (item) => item.day === selectedDay,
  );

  const getEventType = (eventName: string): "workshop" | "food" | "general" => {
    const name = eventName.toLowerCase();
    if (name.includes("workshop")) return "workshop";
    if (
      name.includes("lunch") ||
      name.includes("dinner") ||
      name.includes("breakfast")
    ) {
      return "food";
    }
    return "general";
  };

  const filteredEvents = useMemo(() => {
    if (!currentDaySchedule) return [];
    if (activeFilters.length === 0) return currentDaySchedule.events;
    return currentDaySchedule.events.filter((event) => {
      const type = getEventType(event.name);
      return activeFilters.includes(type as "workshop" | "food");
    });
  }, [currentDaySchedule, activeFilters]);

  const counts = useMemo(() => {
    const base = { workshop: 0, food: 0 };
    if (!currentDaySchedule) return base;
    for (const e of currentDaySchedule.events) {
      const t = getEventType(e.name);
      if (t === "workshop") base.workshop += 1;
      if (t === "food") base.food += 1;
    }
    return base;
  }, [currentDaySchedule]);

  const toggleFilter = (filter: "workshop" | "food") => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  const EventCard = ({
    event,
    index,
  }: {
    event: (typeof scheduleData)[0]["events"][0];
    index: number;
  }) => {
    const type = getEventType(event.name);
    const accent =
      type === "workshop"
        ? {
            border: "border-rh-purple-light/35 hover:border-rh-purple-light/60",
            glow: "group-hover:shadow-rh-purple-light/20",
            badge:
              "bg-rh-purple-light/15 text-rh-purple-light border-rh-purple-light/35",
            dot: "bg-rh-purple-light",
          }
        : type === "food"
          ? {
              border: "border-rh-yellow/30 hover:border-rh-yellow/60",
              glow: "group-hover:shadow-rh-yellow/20",
              badge: "bg-rh-yellow/15 text-rh-yellow border-rh-yellow/35",
              dot: "bg-rh-yellow",
            }
          : {
              border: "border-white/10 hover:border-white/20",
              glow: "group-hover:shadow-white/10",
              badge: "bg-white/5 text-rh-white/70 border-white/10",
              dot: "bg-rh-orange",
            };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: index * 0.03 }}
        viewport={{ once: true }}
        className="group"
      >
        <div
          className={`relative px-4 py-3 rounded-lg bg-gradient-to-r from-rh-navy-light/40 to-rh-navy-dark/40 backdrop-blur-sm border ${accent.border} hover:from-rh-navy-light/60 hover:to-rh-navy-dark/60 transition-all duration-300 group-hover:shadow-lg ${accent.glow}`}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg opacity-70">
            <div className={`h-full w-full ${accent.dot}`} />
          </div>

          <div className="flex items-start justify-between gap-4 pl-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base md:text-lg font-bold text-white group-hover:text-rh-yellow transition-colors leading-snug">
                  {event.name}
                </h3>
                <span
                  className={`hidden sm:inline-flex flex-shrink-0 items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${accent.badge}`}
                >
                  {type === "workshop"
                    ? "Workshop"
                    : type === "food"
                      ? "Food"
                      : "Event"}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-rh-white/80">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 text-rh-yellow flex-shrink-0" />
                  <span className="truncate">
                    {event.startTime}{" "}
                    <span className="text-rh-white/50">–</span> {event.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-rh-orange flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

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
              className="rounded-2xl border border-white/10 bg-rh-navy-dark/30 backdrop-blur-md shadow-2xl overflow-hidden"
            >
              {/* Filter Bar */}
              <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-rh-navy-dark/65 to-rh-navy-light/40 backdrop-blur-xl">
                <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-rh-white/70">
                        Showing{" "}
                        <span className="text-rh-yellow font-semibold">
                          {filteredEvents.length}
                        </span>{" "}
                        event{filteredEvents.length === 1 ? "" : "s"}
                      </p>
                      {activeFilters.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilters([])}
                          className="text-xs text-rh-white/60 hover:text-rh-white/90 underline underline-offset-4"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-rh-white/40 mt-1">
                      Tip: toggle Workshops and Food to focus fast.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFilter("workshop")}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-semibold transition-all ${
                        activeFilters.includes("workshop")
                          ? "bg-rh-purple-light/20 text-rh-purple-light border-rh-purple-light/45 shadow-lg shadow-rh-purple-light/15"
                          : "bg-white/5 text-rh-white/70 border-white/10 hover:border-rh-purple-light/30 hover:text-rh-white/90"
                      }`}
                      aria-pressed={activeFilters.includes("workshop")}
                    >
                      <span className="w-2 h-2 rounded-full bg-rh-purple-light" />
                      Workshops
                      <span className="text-xs opacity-75">
                        ({counts.workshop})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFilter("food")}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-semibold transition-all ${
                        activeFilters.includes("food")
                          ? "bg-rh-yellow/20 text-rh-yellow border-rh-yellow/45 shadow-lg shadow-rh-yellow/15"
                          : "bg-white/5 text-rh-white/70 border-white/10 hover:border-rh-yellow/30 hover:text-rh-white/90"
                      }`}
                      aria-pressed={activeFilters.includes("food")}
                    >
                      <span className="w-2 h-2 rounded-full bg-rh-yellow" />
                      Food
                      <span className="text-xs opacity-75">
                        ({counts.food})
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Events List */}
              <div className="max-h-[520px] md:max-h-[620px] overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, index) => (
                    <EventCard
                      key={`${event.name}-${index}`}
                      event={event}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 text-rh-purple-light">
                    No events match your filters.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
