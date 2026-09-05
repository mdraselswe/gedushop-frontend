const content: Record<string, { heading: string; paragraphs: string[] }> = {
  toys: {
    heading: "Choose kids toys with confidence",
    paragraphs: [
      "Explore activity, musical, pretend-play and indoor toys for babies, toddlers and growing children. Check the recommended age, material, size and included parts on each product page before choosing.",
      "For younger children, prefer age-appropriate toys with smooth edges and no loose small pieces. Product prices, availability and delivery information are shown clearly so families across Bangladesh can compare before ordering.",
    ],
  },
  education: {
    heading: "Learning products for play and practice",
    paragraphs: [
      "Browse talking books, writing-practice sets, puzzles and interactive learning products designed to make early practice more engaging. Choose by your child's age, current skills and the language or activity they enjoy.",
      "Every product page explains the included items and key features. This helps parents compare educational toys and learning aids before ordering for home, preschool or gifting.",
    ],
  },
  "feeding-nursing": {
    heading: "Everyday baby feeding essentials",
    paragraphs: [
      "Find bowls, spoons, food-preparation tools, bottles and practical feeding accessories for weaning and everyday meals. Review the listed material, age guidance, capacity and care instructions before use.",
      "Select the product that suits your baby's feeding stage and routine, then order with cash on delivery available across Bangladesh.",
    ],
  },
  "nursery-bedding": {
    heading: "Nursery and sleep-time essentials",
    paragraphs: [
      "Browse baby bedding, mosquito-net solutions and nursery accessories for a more comfortable daily routine. Product pages include dimensions, materials and included pieces wherever available.",
      "Always follow current safe-sleep guidance and the manufacturer's age and usage instructions when selecting or using a sleep-related product.",
    ],
  },
  "health-safety": {
    heading: "Practical baby health and safety products",
    paragraphs: [
      "Compare everyday care and safety accessories by their purpose, material, size and recommended use. Read the complete product information and instructions before using any item with a baby or child.",
      "These products support routine care but do not replace advice from a qualified medical professional when a child is unwell or has a specific health need.",
    ],
  },
  "skincare-bath": {
    heading: "Baby bath and skincare accessories",
    paragraphs: [
      "Discover bath-time and skincare accessories for a simpler care routine. Check product ingredients or materials, directions and age suitability, especially when your child has sensitive skin or allergies.",
      "Patch-test topical products when appropriate and stop use if irritation occurs. For persistent skin concerns, seek guidance from a qualified healthcare professional.",
    ],
  },
  "strollers-carriers": {
    heading: "Baby strollers and carriers",
    paragraphs: [
      "Compare mobility products using the stated age or weight range, dimensions, restraint system and folding features. The right choice depends on your child's stage and how your family plans to travel.",
      "Follow the manufacturer's setup and safety instructions, check straps before every use and never leave a child unattended.",
    ],
  },
  "baby-clothing": {
    heading: "Comfortable baby clothing",
    paragraphs: [
      "Browse clothing for babies and check the stated size, fabric and care information before ordering. When between sizes, compare the product measurements with clothing that already fits your child.",
      "Availability and prices are shown on each product page, with delivery offered across Bangladesh.",
    ],
  },
  party: {
    heading: "Kids party and birthday supplies",
    paragraphs: [
      "Plan birthdays and family celebrations with decoration sets and party accessories. Check the pack quantity, theme, dimensions and included tools so you know what else may be needed before the event.",
      "Order early enough to allow for delivery and a practice setup, particularly for larger balloon or backdrop arrangements.",
    ],
  },
  "gift-box": {
    heading: "Baby and kids gift ideas",
    paragraphs: [
      "Explore ready-to-gift products and bundles for birthdays, newborn visits and family occasions. Compare the contents, age suitability and individual product details before choosing a present.",
      "For direct gifting, confirm the recipient's delivery details and keep their child's age and interests in mind.",
    ],
  },
};

export default function CategorySeoContent({ slug }: { slug: string }) {
  const section = content[slug];
  if (!section) return null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 md:p-6">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-plum-800">{section.heading}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-plum-500">
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}
