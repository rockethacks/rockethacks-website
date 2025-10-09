"use client";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { terminal } from "../../app/fonts/fonts";
import { GlassCard } from "../ui/glass-card";
import { AnimatedIcon } from "../ui/animated-icon";
import { FaQuestionCircle, FaUsers, FaLaptop, FaClock, FaMapMarkerAlt, FaDollarSign, FaFileAlt, FaEnvelope } from "react-icons/fa";

interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "registration" | "event" | "logistics";
  icon: React.ReactNode;
}

function FAQ() {
  const faqItems: FAQItem[] = [
    {
      question: "What is RocketHacks?",
      answer: "RocketHacks is an event where individuals or teams collaborate intensively on software development or hardware projects, typically within 24 hours. The event will start on Saturday, March 15, 2025 and end on Sunday, March 16, 2025. However there is additional time before and after hacking for introductions and presentations. It's an opportunity to learn, create, and innovate while competing with other teams.",
      category: "general",
      icon: <FaQuestionCircle size={20} />
    },
    {
      question: "Who can participate?",
      answer: "RocketHacks: Any student enrolled in a university or high school can participate in RocketHacks.\n\nCode&Create: Any underclassman/senior enrolled at any high school.",
      category: "registration",
      icon: <FaUsers size={20} />
    },
    {
      question: "What should I bring?",
      answer: "Bring your laptop, charger, and any hardware you plan to hack with. We'll provide food, drinks, and a space-themed workspace!",
      category: "logistics",
      icon: <FaLaptop size={20} />
    },
    {
      question: "Do I need a team?",
      answer: "You can participate solo or in teams of up to 4 people. Don't have a team? We'll help you find one during our team formation event!",
      category: "registration",
      icon: <FaUsers size={20} />
    },
    {
      question: "What if I don't have coding experience?",
      answer: "No worries! Hackathons are a great place to learn. There will be workshops, mentors, and resources available to help you. You can also focus on other aspects like design, project management, or testing.",
      category: "general",
      icon: <FaQuestionCircle size={20} />
    },
    {
      question: "How long does RocketHacks last?",
      answer: "RocketHacks will last for 24 hours. The event will start on Saturday, March 15, 2025 and end on Sunday, March 16, 2025. However, there is additional time before and after hacking for introductions and presentations.",
      category: "event",
      icon: <FaClock size={20} />
    },
    {
      question: "Is RocketHacks 2025 in-person or virtual?",
      answer: "RocketHacks 2025 is an in-person only event. We hope to give you the best hackathon experience at the University of Toledo North Engineering Campus, 1700 N Westwood Ave, Toledo, OH 43607. Unfortunately, we will not be providing a virtual option this year. We are also unable to offer travel reimbursements at this time.",
      category: "logistics",
      icon: <FaMapMarkerAlt size={20} />
    },
    {
      question: "How much does RocketHacks cost?",
      answer: "RocketHacks is free for all students enrolled at any accredited university or high school. Swag, prizes, and great memories are all included with this completely free cost!",
      category: "registration",
      icon: <FaDollarSign size={20} />
    },
    {
      question: "Should I expect a waiver?",
      answer: "You betcha. Before any hacking begins we require you to sign a waiver which will be emailed to all registered participants prior to the hackathon. If you are under 18, you will need a parent or legal guardian to sign the waiver.",
      category: "logistics",
      icon: <FaFileAlt size={20} />
    },
    {
      question: "Is there a Code of Conduct?",
      answer: "Absolutely! We operate on the Major League Hacking Code of Conduct to create an all-inclusive environment for our hackers.",
      category: "general",
      icon: <FaFileAlt size={20} />
    },
    {
      question: "What if I have more questions?",
      answer: "Send us an email to rockethacks@utoledo.edu. We are always happy to help.",
      category: "general",
      icon: <FaEnvelope size={20} />
    }
  ];

  const categories = {
    general: { name: "General", color: "yellow" as const, count: faqItems.filter(item => item.category === "general").length },
    registration: { name: "Registration", color: "orange" as const, count: faqItems.filter(item => item.category === "registration").length },
    event: { name: "Event Details", color: "purple" as const, count: faqItems.filter(item => item.category === "event").length },
    logistics: { name: "Logistics", color: "pink" as const, count: faqItems.filter(item => item.category === "logistics").length }
  };

  return (
    <div>
      <section 
        id="faq" 
        className="relative bg-gradient-to-b from-rh-navy-light via-rh-navy-dark to-rh-background text-white py-12 px-5 md:px-10"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 196, 90, 0.3) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 animate-slide-up">
            <h2 className={`${terminal.className} heading-lg gradient-text mb-4 uppercase tracking-wider`}>
              FAQ
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-rh-yellow to-rh-orange mx-auto mb-6 rounded-full"></div>
            <p className="text-base leading-relaxed text-rh-white/90 max-w-2xl mx-auto">
              Got questions? We've got answers!
            </p>
          </div>



          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto">
            <GlassCard variant="strong" className="p-6">
              <Accordion type="single" collapsible className="space-y-2">
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="border-rh-white/10 hover:border-rh-yellow/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left hover:text-rh-yellow transition-colors py-3">
                      <div className="flex items-center space-x-3">
                        <AnimatedIcon
                          icon={item.icon}
                          size="sm"
                          color={categories[item.category].color}
                          animation="pulse"
                        />
                        <span className="font-medium text-sm">{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-rh-white/80 leading-relaxed pb-3 text-sm">
                      <div className="pl-10">
                        {item.answer.split('\n\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
                            {paragraph.split('\n').map((line, lIndex) => (
                              <span key={lIndex}>
                                {line.includes('**') ? (
                                  <strong className="text-rh-yellow">
                                    {line.replace(/\*\*/g, '')}
                                  </strong>
                                ) : (
                                  line
                                )}
                                {lIndex < paragraph.split('\n').length - 1 && <br />}
                              </span>
                            ))}
                          </p>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </GlassCard>
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-16">
            <GlassCard variant="subtle" className="max-w-2xl mx-auto p-8">
              <AnimatedIcon 
                icon={<FaEnvelope size={32} />}
                size="lg"
                color="yellow"
                animation="float"
                className="mx-auto mb-6"
              />
              <h3 className={`${terminal.className} text-xl text-rh-yellow mb-4`}>
                Still Have Questions?
              </h3>
              <p className="text-rh-white/90 mb-6">
                Our team is here to help! Don't hesitate to reach out if you need 
                any additional information about RocketHacks 2026.
              </p>
              <a
                href="mailto:rockethacks@utoledo.edu?subject=RocketHacks 2026 Question"
                className="btn-primary px-6 py-3 inline-flex items-center space-x-2"
              >
                <FaEnvelope size={16} />
                <span>Contact Us</span>
              </a>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FAQ;
