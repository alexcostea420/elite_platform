"use client";

import { useState } from "react";

import { FaqItem } from "@/components/faq/FaqItem";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { faqs } from "@/lib/constants/site";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="px-4 py-20" id="faq">
      <Container className="max-w-4xl">
        <SectionHeading title={<span className="gradient-text">Întrebări Frecvente</span>} description="Tot ce trebuie să știi înainte de a începe" />
        <div className="mt-16 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <FaqItem
                key={faq.question}
                answer={faq.answer}
                id={`faq-item-${index}`}
                isOpen={isOpen}
                onToggle={() => setOpenIndex(isOpen ? null : index)}
                question={faq.question}
              />
            );
          })}
        </div>
      </Container>
    </section>
  );
}
