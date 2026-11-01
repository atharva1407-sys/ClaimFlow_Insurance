import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

// Custom SVG Icons matching the healthcare design
function HospitalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 2h6v4h-6z M16.5 1h3v6h-3z" fill="currentColor" />
      <path d="M12 9h12a2 2 0 012 2v21H10V11a2 2 0 012-2z" fill="currentColor" />
      <path d="M4 14h6v18H5a1 1 0 01-1-1V15a1 1 0 011-1z M26 14h6a1 1 0 011 1v16a1 1 0 01-1 1h-6V14z" fill="currentColor" />
      <rect x="6" y="17" width="2.5" height="2.5" rx="0.5" fill="white" />
      <rect x="6" y="22" width="2.5" height="2.5" rx="0.5" fill="white" />
      <rect x="27.5" y="17" width="2.5" height="2.5" rx="0.5" fill="white" />
      <rect x="27.5" y="22" width="2.5" height="2.5" rx="0.5" fill="white" />
      <path d="M17 13h2v3h3v2h-3v3h-2v-3h-3v-2h3v-3z" fill="white" />
      <path d="M16 26h4v6h-4z" fill="white" />
    </svg>
  );
}

function DoctorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="9.5" r="5" fill="currentColor" />
      <path d="M9 28c0-5 4-8.5 9-8.5s9 3.5 9 8.5v2H9v-2z" fill="currentColor" />
      <path d="M13.5 19v3.5a4.5 4.5 0 009 0V19" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="18" cy="24.5" r="1.5" fill="white" />
    </svg>
  );
}

function PatientIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="10" r="5.5" fill="currentColor" />
      <path d="M8 28c0-5.5 4.5-9 10-9s10 3.5 10 9v2H8v-2z" fill="currentColor" />
    </svg>
  );
}

function EmergencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 3v3 M10 7.5l2 2 M26 7.5l-2 2 M5.5 16h3 M27.5 16h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 16.5a7 7 0 0114 0V25H11v-8.5z" fill="currentColor" />
      <path d="M14 15.5a4 4 0 014.5-3" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="9" y="25" width="18" height="4.5" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function DotMatrix({ className }: { className?: string }) {
  return (
    <div className={`grid grid-cols-5 gap-3 ${className}`} aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300/70" />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FBFDFF] text-slate-800 font-sans">
      {/* Left Column: Crisp High-Resolution Reactive Hospital Reception Hero */}
      <div className="w-full lg:w-[44%] xl:w-[42%] lg:h-screen lg:sticky lg:top-0 flex-shrink-0 p-3 sm:p-4 lg:py-4 lg:pl-4 lg:pr-0 xl:py-6 xl:pl-6 2xl:py-8 2xl:pl-8">
       <div className="relative w-full h-full min-h-[340px] sm:min-h-[440px] lg:min-h-0 overflow-hidden rounded-[1.75rem] xl:rounded-[2.25rem] bg-slate-950 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 group">
        <Image
          src="/images/hospital_lobby.jpg?v=3"
          alt="ClaimFlow Modern Hospital Reception"
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-[center_20%] transition-transform duration-700 ease-out group-hover:scale-105 select-none"
        />
        {/* Soft Ambient Depth & Reactive Hover Lighting */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-black/10 pointer-events-none group-hover:from-slate-950/20 transition-all duration-500" />
        
        {/* Live Reactive Status Indicator Pill */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-sm font-medium shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Bajaj Pre-Auth Desk &bull; 24/7 Digital Intake</span>
          </div>
        </div>
       </div>
      </div>

      {/* Right Column: Clean Role Selector Portal */}
      <div className="w-full lg:w-[56%] xl:w-[58%] min-h-[calc(100vh-288px)] lg:min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 lg:px-12 xl:px-16 py-10 relative">
        {/* Subtle Decorative Dot Matrix Patterns */}
        <DotMatrix className="hidden sm:grid absolute top-8 right-8 pointer-events-none" />
        <DotMatrix className="hidden sm:grid absolute bottom-8 right-8 pointer-events-none" />

        <div className="w-full max-w-xl mx-auto flex flex-col items-center">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3.5 mb-6">
            <Image
              src="/images/logo.png"
              alt="ClaimFlow Health Logo"
              width={56}
              height={56}
              unoptimized
              priority
              className="w-14 h-14 rounded-2xl shadow-md shadow-blue-500/20 object-contain flex-shrink-0"
            />
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1528]">
              ClaimFlow <span className="text-[#0A65FF]">Health</span>
            </span>
          </div>

          {/* Heading and Subtitle with Plus Jakarta Sans / Inter Typography */}
          <div className="text-center mb-8 sm:mb-9">
            <h1 className="text-2xl sm:text-[32px] font-bold text-[#0B1528] tracking-tight leading-tight">
              Welcome to ClaimFlow Health
            </h1>
            <p className="text-slate-500 text-sm sm:text-base font-normal mt-2 tracking-normal">
              Choose your role to access your workspace
            </p>
          </div>

          {/* 2x2 Grid of shadcn UI Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
            {/* 1. Hospital Desk Card */}
            <a
              href="/login?role=HOSPITAL_STAFF"
              className="group block focus:outline-none"
            >
              <Card className="h-full bg-[#EDF5FF] border-[#DCEBFF] hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 rounded-[22px] transition-all duration-200">
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-100/60 flex items-center justify-center text-[#0A65FF]">
                      <HospitalIcon className="w-8 h-8" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0A65FF] group-hover:bg-[#0A65FF] group-hover:text-white transition-all duration-200">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                  <CardTitle className="text-[17px] font-bold text-[#0B1528] tracking-tight">
                    Hospital Desk
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-[13px] text-slate-600 leading-relaxed mt-1">
                    Manage cashless requests, track cases and coordinate with doctors and patients.
                  </CardDescription>
                </CardHeader>
              </Card>
            </a>

            {/* 2. Doctor Card */}
            <a
              href="/login?role=DOCTOR"
              className="group block focus:outline-none"
            >
              <Card className="h-full bg-[#EDFBF3] border-[#D7F5E3] hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 rounded-[22px] transition-all duration-200">
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100/60 flex items-center justify-center text-[#00A86B]">
                      <DoctorIcon className="w-8 h-8" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#00A86B] group-hover:bg-[#00A86B] group-hover:text-white transition-all duration-200">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                  <CardTitle className="text-[17px] font-bold text-[#0B1528] tracking-tight">
                    Doctor
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-[13px] text-slate-600 leading-relaxed mt-1">
                    Review assigned patients, provide clinical inputs and approve cases.
                  </CardDescription>
                </CardHeader>
              </Card>
            </a>

            {/* 3. Patient Card */}
            <Link
              href="/patient/access"
              className="group block focus:outline-none"
            >
              <Card className="h-full bg-[#F5F0FF] border-[#EBDDFF] hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 rounded-[22px] transition-all duration-200">
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-100/60 flex items-center justify-center text-[#8B3DFF]">
                      <PatientIcon className="w-8 h-8" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#8B3DFF] group-hover:bg-[#8B3DFF] group-hover:text-white transition-all duration-200">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                  <CardTitle className="text-[17px] font-bold text-[#0B1528] tracking-tight">
                    Patient
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-[13px] text-slate-600 leading-relaxed mt-1">
                    Fill in your part of the cashless request form.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* 4. Emergency Card */}
            <a
              href="/login?role=EMERGENCY_OPERATOR"
              className="group block focus:outline-none"
            >
              <Card className="h-full bg-[#FFF0F0] border-[#FFE0E0] hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/10 rounded-[22px] transition-all duration-200">
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-rose-100/60 flex items-center justify-center text-[#FF4242]">
                      <EmergencyIcon className="w-8 h-8" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#FF4242] group-hover:bg-[#FF4242] group-hover:text-white transition-all duration-200">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                  <CardTitle className="text-[17px] font-bold text-[#0B1528] tracking-tight">
                    Emergency
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-[13px] text-slate-600 leading-relaxed mt-1">
                    Fast-track case creation for critical and time-sensitive admissions.
                  </CardDescription>
                </CardHeader>
              </Card>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
