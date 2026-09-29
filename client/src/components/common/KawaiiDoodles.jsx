import React from 'react';

/**
 * Hand-drawn Kawaii Food Doodles and Floating Background Elements
 * Official Warm Modern Organic Palette:
 * - Soft Pastel Green: #315C45, #5F9B72, #DCEBDD
 * - Terracotta & Coral: #D97B5B, #E06D53, #B85E40
 * - Butter Yellow: #F4D98A, #F8E09B, #D4AD42
 * - Muted Pink: #F3B0A9, #E8A598, #FAD2E1
 * - Warm Cream (Background): #FFF9EF
 */

// 🥑 Smiling Avocado Character
export const AvocadoDoodle = ({ className = "w-10 h-10", animated = false }) => (
  <svg
    viewBox="0 0 100 120"
    className={`${className} ${animated ? 'doodle-float-1' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Dark skin */}
    <path
      d="M50 8C30 8 15 35 15 65C15 95 30 112 50 112C70 112 85 95 85 65C85 35 70 8 50 8Z"
      fill="#315C45"
    />
    {/* Light mint flesh */}
    <path
      d="M50 14C33 14 20 38 20 65C20 92 33 106 50 106C67 106 80 92 80 65C80 38 67 14 50 14Z"
      fill="#DCEBDD"
    />
    {/* Seed cavity */}
    <ellipse cx="50" cy="74" rx="20" ry="22" fill="#D97B5B" />
    <ellipse cx="46" cy="70" rx="16" ry="18" fill="#B85E40" opacity="0.4" />
    {/* Cheerful Eyes */}
    <circle cx="42" cy="46" r="3.5" fill="#1E2E24" />
    <circle cx="58" cy="46" r="3.5" fill="#1E2E24" />
    <circle cx="43" cy="45" r="1.2" fill="#FFFFFF" />
    <circle cx="59" cy="45" r="1.2" fill="#FFFFFF" />
    {/* Rosy Cheeks */}
    <ellipse cx="36" cy="50" rx="3.5" ry="2" fill="#F3B0A9" opacity="0.8" />
    <ellipse cx="64" cy="50" rx="3.5" ry="2" fill="#F3B0A9" opacity="0.8" />
    {/* Happy Smile */}
    <path
      d="M46 51C47 54 53 54 54 51"
      stroke="#1E2E24"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// 🍓 Smiling Strawberry Character
export const StrawberryDoodle = ({ className = "w-9 h-9", animated = false }) => (
  <svg
    viewBox="0 0 100 110"
    className={`${className} ${animated ? 'doodle-float-2' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Strawberry body */}
    <path
      d="M50 102C32 85 18 64 18 42C18 24 32 18 50 18C68 18 82 24 82 42C82 64 68 85 50 102Z"
      fill="#D97B5B"
    />
    {/* Seeds */}
    <circle cx="34" cy="36" r="1.6" fill="#F4D98A" />
    <circle cx="66" cy="36" r="1.6" fill="#F4D98A" />
    <circle cx="28" cy="52" r="1.6" fill="#F4D98A" />
    <circle cx="72" cy="52" r="1.6" fill="#F4D98A" />
    <circle cx="38" cy="70" r="1.6" fill="#F4D98A" />
    <circle cx="62" cy="70" r="1.6" fill="#F4D98A" />
    <circle cx="50" cy="85" r="1.6" fill="#F4D98A" />
    {/* Green leaf crown */}
    <path
      d="M50 20C45 10 32 12 32 18C32 20 42 22 46 25C40 22 28 26 30 32C35 30 46 26 50 26C54 26 65 30 70 32C72 26 60 22 54 25C58 22 68 20 68 18C68 12 55 10 50 20Z"
      fill="#315C45"
    />
    {/* Eyes */}
    <circle cx="43" cy="50" r="3" fill="#1E2E24" />
    <circle cx="57" cy="50" r="3" fill="#1E2E24" />
    <circle cx="44" cy="49" r="1" fill="#FFFFFF" />
    <circle cx="58" cy="49" r="1" fill="#FFFFFF" />
    {/* Rosy blush */}
    <ellipse cx="37" cy="54" rx="3.2" ry="1.8" fill="#F3B0A9" opacity="0.85" />
    <ellipse cx="63" cy="54" rx="3.2" ry="1.8" fill="#F3B0A9" opacity="0.85" />
    {/* Smile */}
    <path
      d="M47 54C48 57 52 57 53 54"
      stroke="#1E2E24"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// 🥕 Smiling Carrot Character
export const CarrotDoodle = ({ className = "w-9 h-11", animated = false }) => (
  <svg
    viewBox="0 0 90 120"
    className={`${className} ${animated ? 'doodle-float-3' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Green leafy tufts */}
    <path d="M45 30C40 8 30 14 36 26" stroke="#315C45" strokeWidth="4" strokeLinecap="round" />
    <path d="M45 28C45 6 48 4 52 24" stroke="#315C45" strokeWidth="4" strokeLinecap="round" />
    <path d="M47 30C58 10 65 18 56 28" stroke="#315C45" strokeWidth="4" strokeLinecap="round" />
    {/* Carrot root body */}
    <path
      d="M24 38C24 32 66 32 66 38C66 60 52 110 45 116C38 110 24 60 24 38Z"
      fill="#D97B5B"
    />
    {/* Texture ridges */}
    <path d="M30 48C36 50 40 49 42 48" stroke="#B85E40" strokeWidth="2" strokeLinecap="round" />
    <path d="M52 64C56 65 60 64 62 63" stroke="#B85E40" strokeWidth="2" strokeLinecap="round" />
    <path d="M36 78C40 79 44 78 46 77" stroke="#B85E40" strokeWidth="2" strokeLinecap="round" />
    {/* Cute eyes */}
    <circle cx="40" cy="46" r="2.8" fill="#1E2E24" />
    <circle cx="52" cy="46" r="2.8" fill="#1E2E24" />
    <circle cx="41" cy="45" r="0.9" fill="#FFFFFF" />
    <circle cx="53" cy="45" r="0.9" fill="#FFFFFF" />
    {/* Cheeks */}
    <ellipse cx="35" cy="50" rx="2.5" ry="1.5" fill="#F4D98A" opacity="0.9" />
    <ellipse cx="57" cy="50" rx="2.5" ry="1.5" fill="#F4D98A" opacity="0.9" />
    {/* Smile */}
    <path d="M44 51C45 53 47 53 48 51" stroke="#1E2E24" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 🍋 Smiling Lemon Doodle
export const LemonDoodle = ({ className = "w-9 h-9", animated = false }) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} ${animated ? 'doodle-float-4' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Lemon oval with pointy ends */}
    <path
      d="M15 50C15 28 32 18 58 18C78 18 85 30 85 50C85 72 68 82 42 82C22 82 15 72 15 50Z"
      transform="rotate(-15 50 50)"
      fill="#F4D98A"
    />
    {/* Leaf on top */}
    <path
      d="M48 24C52 14 62 16 66 22C60 26 52 26 48 24Z"
      fill="#315C45"
    />
    {/* Eyes */}
    <circle cx="43" cy="48" r="3" fill="#1E2E24" />
    <circle cx="57" cy="48" r="3" fill="#1E2E24" />
    <circle cx="44" cy="47" r="1" fill="#FFFFFF" />
    <circle cx="58" cy="47" r="1" fill="#FFFFFF" />
    {/* Cheeks */}
    <ellipse cx="37" cy="53" rx="3.2" ry="1.6" fill="#F3B0A9" opacity="0.75" />
    <ellipse cx="63" cy="53" rx="3.2" ry="1.6" fill="#F3B0A9" opacity="0.75" />
    {/* Smile */}
    <path d="M47 53C48 56 52 56 53 53" stroke="#1E2E24" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 🍅 Smiling Tomato Doodle
export const TomatoDoodle = ({ className = "w-9 h-9", animated = false }) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} ${animated ? 'doodle-float-5' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Calyx & Stem */}
    <path
      d="M50 22C51 14 56 8 62 7C60 12 55 17 52 22"
      stroke="#315C45"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M50 24C44 18 33 20 31 25C37 26 44 25 48 26C44 30 38 34 40 39C44 35 47 30 50 27C53 30 56 35 60 39C62 34 56 30 52 26C56 25 63 26 69 25C67 20 56 18 50 24Z"
      fill="#315C45"
    />
    {/* Plump Round Tomato Body */}
    <ellipse cx="50" cy="58" rx="37" ry="33" fill="#D97B5B" />
    <path
      d="M50 25C34 25 17 38 17 58C17 77 33 91 50 91C67 91 83 77 83 58C83 38 66 25 50 25Z"
      fill="#E06D53"
    />
    {/* Soft highlight */}
    <ellipse cx="35" cy="43" rx="6" ry="3.5" transform="rotate(-30 35 43)" fill="#FFFFFF" opacity="0.32" />
    {/* Eyes */}
    <circle cx="41" cy="58" r="3.2" fill="#1E2E24" />
    <circle cx="59" cy="58" r="3.2" fill="#1E2E24" />
    <circle cx="42" cy="57" r="1.1" fill="#FFFFFF" />
    <circle cx="60" cy="57" r="1.1" fill="#FFFFFF" />
    {/* Rosy Pastel Cheeks */}
    <ellipse cx="33" cy="63" rx="4.2" ry="2.2" fill="#F3B0A9" opacity="0.85" />
    <ellipse cx="67" cy="63" rx="4.2" ry="2.2" fill="#F3B0A9" opacity="0.85" />
    {/* Smile */}
    <path
      d="M46 63C47 67 53 67 54 63"
      stroke="#1E2E24"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// 🍃 Organic Leaf Doodle
export const LeafDoodle = ({ className = "w-6 h-6", animated = false }) => (
  <svg
    viewBox="0 0 60 60"
    className={`${className} ${animated ? 'doodle-float-6' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M10 50C10 50 20 20 50 10C50 10 40 40 10 50Z"
      fill="#DCEBDD"
      stroke="#315C45"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M12 48C22 36 34 26 48 12" stroke="#315C45" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 🌱 Tiny Sprout Leaf Doodle
export const SproutLeafDoodle = ({ className = "w-6 h-6", animated = false }) => (
  <svg
    viewBox="0 0 60 60"
    className={`${className} ${animated ? 'doodle-float-7' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Stem */}
    <path d="M30 52C30 38 30 28 30 24" stroke="#315C45" strokeWidth="2.5" strokeLinecap="round" />
    {/* Left Leaf */}
    <path
      d="M30 32C20 32 12 24 16 16C24 16 28 24 30 32Z"
      fill="#DCEBDD"
      stroke="#315C45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Right Leaf */}
    <path
      d="M30 26C40 26 48 18 44 10C36 10 32 18 30 26Z"
      fill="#A3CCA8"
      stroke="#315C45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// ✨ 4-Point Sparkle Star Doodle
export const SparkleStarDoodle = ({ className = "w-5 h-5", fill = "#F4D98A", animated = false }) => (
  <svg
    viewBox="0 0 40 40"
    className={`${className} ${animated ? 'doodle-sparkle-pulse' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20 2C20 12 28 20 38 20C28 20 20 28 20 38C20 28 12 20 2 20C12 20 20 12 20 2Z"
      fill={fill}
    />
  </svg>
);

// 💫 Delicate Twinkle Sparkle with satellite dots
export const TwinkleSparkleDoodle = ({ className = "w-5 h-5", fill = "#F4D98A", animated = false }) => (
  <svg
    viewBox="0 0 48 48"
    className={`${className} ${animated ? 'doodle-sparkle-pulse' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M24 4C24 15 33 24 44 24C33 24 24 33 24 44C24 33 15 24 4 24C15 24 24 15 24 4Z"
      fill={fill}
    />
    <circle cx="10" cy="10" r="2.2" fill={fill} opacity="0.7" />
    <circle cx="38" cy="38" r="2" fill={fill} opacity="0.7" />
  </svg>
);

// ⭐️ 5-Point Rounded Cute Star Doodle
export const CuteStarDoodle = ({ className = "w-5 h-5", fill = "#F4D98A", animated = false }) => (
  <svg
    viewBox="0 0 40 40"
    className={`${className} ${animated ? 'doodle-sparkle-pulse' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20 4L24.5 14.5L36 15.5L27.5 23L30 34.5L20 28.5L10 34.5L12.5 23L4 15.5L15.5 14.5L20 4Z"
      fill={fill}
      stroke="#D4AD42"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// 🍄 Cute Smiling Mushroom Doodle
export const MushroomDoodle = ({ className = "w-8 h-8", animated = false }) => (
  <svg
    viewBox="0 0 80 80"
    className={`${className} ${animated ? 'doodle-float-8' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Cap */}
    <path
      d="M10 42C10 22 25 10 40 10C55 10 70 22 70 42C70 46 62 48 40 48C18 48 10 46 10 42Z"
      fill="#D97B5B"
    />
    {/* Dots */}
    <circle cx="28" cy="24" r="4" fill="#FFF9EF" />
    <circle cx="52" cy="22" r="5" fill="#FFF9EF" />
    <circle cx="40" cy="34" r="3.5" fill="#FFF9EF" />
    {/* Stem */}
    <path
      d="M32 46C30 62 30 68 40 68C50 68 50 62 48 46Z"
      fill="#FFF9EF"
      stroke="#EADDC7"
      strokeWidth="2"
    />
    {/* Face */}
    <circle cx="36" cy="56" r="1.8" fill="#1E2E24" />
    <circle cx="44" cy="56" r="1.8" fill="#1E2E24" />
    <path d="M39 59C40 60 41 60 42 59" stroke="#1E2E24" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * Ambient Continuous Floating Doodle Background
 *
 * Requirements Met:
 * - Cute hand-drawn illustrations: Avocados, Strawberries, Lemons, Carrots, Tomatoes, Leaves, Stars, Sparkles
 * - Continuous natural floating, gentle side-to-side drift, subtle tilt
 * - Unique animation speeds, directions, and negative delays so they NEVER move in sync
 * - Lightly faded (opacity 0.38 - 0.55) on warm cream background (#FFF9EF)
 * - Soft pastel palette (pastel green, terracotta, yellow, muted pink)
 * - Distributed along margins, corners, and empty gutters behind cards/buttons/text (z-0)
 * - Non-blocking: pointer-events-none
 * - Hardware accelerated CSS transforms (translate3d & rotate)
 * - Full prefers-reduced-motion support
 * - Responsive: clean minimalist subset on mobile, rich enchanting display on tablet and desktop
 */
export const KawaiiBackgroundDoodles = () => {
  return (
    <div
      className="floating-doodle-container"
      aria-hidden="true"
    >
      {/* ================= TOP PERIMETER ================= */}

      {/* 1. Top-Left Smiling Avocado */}
      <div
        className="floating-doodle doodle-float-1"
        style={{
          top: '2.5%',
          left: '2.5%',
          animationDelay: '-3.4s',
          animationDuration: '18s',
          opacity: 0.52
        }}
      >
        <AvocadoDoodle className="w-12 h-14 sm:w-14 sm:h-16 lg:w-16 lg:h-20" />
      </div>

      {/* 2. Top Left-Center Sparkle Star (Yellow) */}
      <div
        className="floating-doodle doodle-sparkle-pulse hidden sm:block"
        style={{
          top: '3.8%',
          left: '18%',
          animationDelay: '-1.6s',
          opacity: 0.48
        }}
      >
        <SparkleStarDoodle className="w-5 h-5 lg:w-6 lg:h-6" fill="#F4D98A" />
      </div>

      {/* 3. Top Center-Left Lemon */}
      <div
        className="floating-doodle doodle-float-3 hidden md:block"
        style={{
          top: '2%',
          left: '34%',
          animationDelay: '-8.5s',
          animationDuration: '23s',
          opacity: 0.48
        }}
      >
        <LemonDoodle className="w-9 h-9 lg:w-12 lg:h-12" />
      </div>

      {/* 4. Top Center Sprout Leaf */}
      <div
        className="floating-doodle doodle-float-5 hidden sm:block"
        style={{
          top: '1.5%',
          left: '52%',
          animationDelay: '-13.2s',
          animationDuration: '26s',
          opacity: 0.46
        }}
      >
        <SproutLeafDoodle className="w-7 h-7 lg:w-8 lg:h-8" />
      </div>

      {/* 5. Top Center-Right Smiling Tomato */}
      <div
        className="floating-doodle doodle-float-2 hidden md:block"
        style={{
          top: '2.8%',
          right: '30%',
          animationDelay: '-6.3s',
          animationDuration: '21s',
          opacity: 0.50
        }}
      >
        <TomatoDoodle className="w-10 h-10 lg:w-12 lg:h-12" />
      </div>

      {/* 6. Top Right-Center Twinkle Sparkle (Muted Pink) */}
      <div
        className="floating-doodle doodle-sparkle-pulse hidden sm:block"
        style={{
          top: '4.2%',
          right: '16%',
          animationDelay: '-4.1s',
          opacity: 0.45
        }}
      >
        <TwinkleSparkleDoodle className="w-5 h-5 lg:w-6 lg:h-6" fill="#F3B0A9" />
      </div>

      {/* 7. Top-Right Strawberry */}
      <div
        className="floating-doodle doodle-float-4"
        style={{
          top: '2.5%',
          right: '2.5%',
          animationDelay: '-9.8s',
          animationDuration: '20s',
          opacity: 0.52
        }}
      >
        <StrawberryDoodle className="w-11 h-11 sm:w-12 sm:h-12 lg:w-15 lg:h-15" />
      </div>

      {/* ================= LEFT MARGIN FLANK ================= */}

      {/* 8. Upper-Left Smiling Carrot */}
      <div
        className="floating-doodle doodle-float-6"
        style={{
          top: '22%',
          left: '1.2%',
          animationDelay: '-11.4s',
          animationDuration: '17s',
          opacity: 0.50
        }}
      >
        <CarrotDoodle className="w-9 h-12 sm:w-10 sm:h-14 lg:w-12 lg:h-16" />
      </div>

      {/* 9. Mid-Upper Left Delicate Leaf */}
      <div
        className="floating-doodle doodle-float-7 hidden lg:block"
        style={{
          top: '36%',
          left: '3.5%',
          animationDelay: '-14.8s',
          animationDuration: '27s',
          opacity: 0.44
        }}
      >
        <LeafDoodle className="w-6 h-6 lg:w-7 lg:h-7" />
      </div>

      {/* 10. Mid-Left Smiling Tomato */}
      <div
        className="floating-doodle doodle-float-8 hidden sm:block"
        style={{
          top: '50%',
          left: '1.5%',
          animationDelay: '-16.2s',
          animationDuration: '22s',
          opacity: 0.50
        }}
      >
        <TomatoDoodle className="w-10 h-10 sm:w-11 sm:h-11 lg:w-13 lg:h-13" />
      </div>

      {/* 11. Lower-Left Sparkle Star (Butter Yellow) */}
      <div
        className="floating-doodle doodle-sparkle-pulse hidden md:block"
        style={{
          top: '64%',
          left: '2.8%',
          animationDelay: '-2.7s',
          opacity: 0.46
        }}
      >
        <CuteStarDoodle className="w-5 h-5 lg:w-6 lg:h-6" fill="#F4D98A" />
      </div>

      {/* 12. Lower-Left Strawberry */}
      <div
        className="floating-doodle doodle-float-5 hidden sm:block"
        style={{
          top: '76%',
          left: '1.5%',
          animationDelay: '-18.5s',
          animationDuration: '24s',
          opacity: 0.48
        }}
      >
        <StrawberryDoodle className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12" />
      </div>

      {/* ================= RIGHT MARGIN FLANK ================= */}

      {/* 13. Upper-Right Cute Star (Lavender / Pink) */}
      <div
        className="floating-doodle doodle-sparkle-pulse hidden sm:block"
        style={{
          top: '20%',
          right: '2%',
          animationDelay: '-7.2s',
          opacity: 0.45
        }}
      >
        <SparkleStarDoodle className="w-5 h-5 lg:w-7 lg:h-7" fill="#E8DFF5" />
      </div>

      {/* 14. Upper-Right Mini Avocado */}
      <div
        className="floating-doodle doodle-float-1 hidden xl:block"
        style={{
          top: '32%',
          right: '3.2%',
          animationDelay: '-12.7s',
          animationDuration: '19s',
          opacity: 0.45
        }}
      >
        <AvocadoDoodle className="w-9 h-11 lg:w-11 lg:h-13" />
      </div>

      {/* 15. Mid-Right Smiling Lemon */}
      <div
        className="floating-doodle doodle-float-3"
        style={{
          top: '48%',
          right: '1.5%',
          animationDelay: '-5.9s',
          animationDuration: '25s',
          opacity: 0.50
        }}
      >
        <LemonDoodle className="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14" />
      </div>

      {/* 16. Mid-Lower Right Sprout Leaf */}
      <div
        className="floating-doodle doodle-float-6 hidden lg:block"
        style={{
          top: '62%',
          right: '3.5%',
          animationDelay: '-10.3s',
          animationDuration: '18s',
          opacity: 0.44
        }}
      >
        <SproutLeafDoodle className="w-6 h-6 lg:w-7 lg:h-7" />
      </div>

      {/* 17. Lower-Right Smiling Carrot */}
      <div
        className="floating-doodle doodle-float-2 hidden sm:block"
        style={{
          top: '74%',
          right: '1.8%',
          animationDelay: '-13.9s',
          animationDuration: '22s',
          opacity: 0.48
        }}
      >
        <CarrotDoodle className="w-9 h-12 sm:w-10 sm:h-13 lg:w-11 lg:h-15" />
      </div>

      {/* ================= BOTTOM PERIMETER ================= */}

      {/* 18. Bottom-Left Smiling Avocado */}
      <div
        className="floating-doodle doodle-float-7"
        style={{
          bottom: '3%',
          left: '2.5%',
          animationDelay: '-4.8s',
          animationDuration: '28s',
          opacity: 0.52
        }}
      >
        <AvocadoDoodle className="w-12 h-14 sm:w-13 sm:h-16 lg:w-15 lg:h-18" />
      </div>

      {/* 19. Bottom Left-Center Smiling Tomato */}
      <div
        className="floating-doodle doodle-float-4 hidden sm:block"
        style={{
          bottom: '2.5%',
          left: '22%',
          animationDelay: '-11.9s',
          animationDuration: '20s',
          opacity: 0.48
        }}
      >
        <TomatoDoodle className="w-10 h-10 lg:w-12 lg:h-12" />
      </div>

      {/* 20. Bottom Left-Center Twinkle (Muted Pink) */}
      <div
        className="floating-doodle doodle-sparkle-pulse hidden md:block"
        style={{
          bottom: '3.8%',
          left: '38%',
          animationDelay: '-5.4s',
          opacity: 0.45
        }}
      >
        <TwinkleSparkleDoodle className="w-5 h-5 lg:w-6 lg:h-6" fill="#F3B0A9" />
      </div>

      {/* 21. Bottom Center Leaf Doodle */}
      <div
        className="floating-doodle doodle-float-6 hidden sm:block"
        style={{
          bottom: '1.8%',
          left: '52%',
          animationDelay: '-15.4s',
          animationDuration: '16s',
          opacity: 0.44
        }}
      >
        <LeafDoodle className="w-7 h-7 lg:w-8 lg:h-8" />
      </div>

      {/* 22. Bottom Right-Center Strawberry */}
      <div
        className="floating-doodle doodle-float-8 hidden md:block"
        style={{
          bottom: '2.5%',
          right: '24%',
          animationDelay: '-8.2s',
          animationDuration: '21s',
          opacity: 0.48
        }}
      >
        <StrawberryDoodle className="w-10 h-10 lg:w-12 lg:h-12" />
      </div>

      {/* 23. Bottom Right-Center Sparkle Star (Yellow) */}
      <div
        className="floating-doodle doodle-sparkle-pulse hidden sm:block"
        style={{
          bottom: '4%',
          right: '14%',
          animationDelay: '-3.6s',
          opacity: 0.46
        }}
      >
        <SparkleStarDoodle className="w-5 h-5 lg:w-6 lg:h-6" fill="#F4D98A" />
      </div>

      {/* 24. Bottom-Right Smiling Lemon */}
      <div
        className="floating-doodle doodle-float-3"
        style={{
          bottom: '3%',
          right: '2.5%',
          animationDelay: '-17.1s',
          animationDuration: '24s',
          opacity: 0.52
        }}
      >
        <LemonDoodle className="w-11 h-11 sm:w-12 sm:h-12 lg:w-15 lg:h-15" />
      </div>
    </div>
  );
};
