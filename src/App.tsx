/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  Scissors, 
  Award, 
  User, 
  ArrowLeft, 
  Star, 
  ChevronDown, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Share2, 
  TrendingUp,
  History as HistoryIcon,
  Menu,
  ArrowRight,
  Gift,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Screen = 'HOME' | 'BOOKING' | 'CONFIRMED' | 'REWARDS' | 'HISTORY';

interface Barber {
  id: string;
  name: string;
  role: string;
  rating: number;
  image: string;
  isPreferred?: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Appointment {
  id: string;
  barberId: string;
  serviceId: string;
  date: Date;
  time: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  location: string;
}

// --- Mock Data ---

const BARBERS: Barber[] = [
  {
    id: 'marcus',
    name: 'Marcus',
    role: 'Master Stylist',
    rating: 5,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCohHONzY45f4b2mlsTF3hMe4n3awoVg9phkDUQAOzeWVH_e-TOTYDThW2BJNGVni6AnVmnbSIHxx7aalnmsU03R68psUp4XgzS3727heSz23EyFVfZIQPXJvXTLJDU55z9zjAnfuhYx-FZYdCdZMY8tiNuyUj9zlnWj_OVSG80bQCmkIyohxKaGMYDroMio-zHU7Z22Ux1o7UQJAxBCnb7Px3qxi4fs9SwZTCNG5ovqlqLdc8sK2yAeENrCjHSRag2Y_4uYdiJ8YY',
    isPreferred: true
  },
  {
    id: 'matt',
    name: 'Matt',
    role: 'Senior Barber',
    rating: 4,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDVOABJjueQ9HAPwrNaeA7ACvlgxv1kmCbPWec4n2awlMAaGL6M_WsK5nn1puwbmPZT2Vilc9iXIKi4dEE4WI-laSkynwKStpJ-LJ__uxdgm9blrjGChf6th3lj_RJDqNmKWDMY6d8Dpu8gl8ZKqBvQkwhRN18SmQMPcKNOqWFBYscCDKsSt5EW2LRyU69Te5mQtP-odcPA2W7DPvbH_0A4A6Wj_i3idkLq6xrsJT8jLvj1Zu1OCmy388eoa9HB96jkuJn5pgOU2I',
  },
  {
    id: 'james',
    name: 'James',
    role: 'Stylist',
    rating: 4,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6ih5EVDWvtxB3pLYeAH0VCqQCbHBLuKxa1PtV_EBlv9jzOWxRAa6ccY8sS9CiU5fqPeFBg-4cpQ4TPZtA3dZZ0UurpudtcKccz6Vvxm3jK3Wln9gIurSEEq1GzONQnfmUMrnqv2-V1OxBJMIpLnrXOBT0MamfeD29nD7PfYlRC7j_2df5SqBodPCBw4ZB5t1UYNzISFfMMbXOR1jteWhefBjcDKz1aBeZ8vxVxdqydHEI2HrXO3M4Y-4aAQV5zCCKWwp1VafUGsU',
  }
];

const SERVICES: Service[] = [
  { id: 'haircut', name: 'Haircut', price: 30, duration: 45 },
  { id: 'fade', name: 'Executive Fade', price: 45, duration: 60 },
  { id: 'beard', name: 'Beard Trim', price: 25, duration: 30 },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    barberId: 'marcus',
    serviceId: 'fade',
    date: new Date(2026, 1, 25),
    time: '10:00 AM',
    status: 'COMPLETED',
    location: 'Camberwell'
  },
  {
    id: '2',
    barberId: 'matt',
    serviceId: 'haircut',
    date: new Date(2026, 1, 4),
    time: '2:00 PM',
    status: 'COMPLETED',
    location: 'Richmond'
  }
];

// --- Utilities ---

const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const getDayNumber = (date: Date) => date.getDate();
const isDiscountDay = (date: Date) => {
  const day = date.getDay();
  return day === 1 || day === 2; // Mon or Tue
};

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

// --- Components ---

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  
  // Booking State
  const [selectedBarber, setSelectedBarber] = useState<Barber>(BARBERS[0]);
  const [selectedService, setSelectedService] = useState<Service>(SERVICES[1]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [smsReminder, setSmsReminder] = useState(true);

  // Derived State
  const next7Days = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const hasUpcoming = useMemo(() => appointments.some(a => a.status === 'CONFIRMED'), [appointments]);
  const lastAppointment = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'COMPLETED');
    return completed[completed.length - 1];
  }, [appointments]);

  const pricing = useMemo(() => {
    const base = selectedService.price;
    const discount = isDiscountDay(selectedDate) ? base * 0.2 : 0;
    return { base, discount, total: base - discount };
  }, [selectedService, selectedDate]);

  // Actions
  const handleConfirmBooking = () => {
    const newAppt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      barberId: selectedBarber.id,
      serviceId: selectedService.id,
      date: selectedDate,
      time: selectedTime,
      status: 'CONFIRMED',
      location: 'Camberwell'
    };
    setAppointments([...appointments, newAppt]);
    setCurrentScreen('CONFIRMED');
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex justify-center bg-slate-950">
      <div className="w-full max-w-[375px] bg-background min-h-screen relative flex flex-col shadow-2xl overflow-hidden">
        
        <AnimatePresence mode="wait">
          {currentScreen === 'HOME' && (
            <HomeScreen 
              key="home"
              lastAppointment={lastAppointment}
              hasUpcoming={hasUpcoming}
              onNavigate={navigateTo}
            />
          )}
          {currentScreen === 'BOOKING' && (
            <BookingScreen 
              key="booking"
              selectedBarber={selectedBarber}
              setSelectedBarber={setSelectedBarber}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              smsReminder={smsReminder}
              setSmsReminder={setSmsReminder}
              next7Days={next7Days}
              pricing={pricing}
              onConfirm={handleConfirmBooking}
              onBack={() => navigateTo('HOME')}
            />
          )}
          {currentScreen === 'CONFIRMED' && (
            <ConfirmationScreen 
              key="confirmed"
              barber={selectedBarber}
              service={selectedService}
              date={selectedDate}
              time={selectedTime}
              discount={pricing.discount}
              onReturn={() => navigateTo('HOME')}
            />
          )}
          {currentScreen === 'REWARDS' && (
            <RewardsScreen 
              key="rewards"
              appointments={appointments}
              onBack={() => navigateTo('HOME')}
            />
          )}
          {currentScreen === 'HISTORY' && (
            <HistoryScreen 
              key="history"
              appointments={appointments}
              onBack={() => navigateTo('HOME')}
              onBookAgain={(appt) => {
                const barber = BARBERS.find(b => b.id === appt.barberId) || BARBERS[0];
                const service = SERVICES.find(s => s.id === appt.serviceId) || SERVICES[0];
                setSelectedBarber(barber);
                setSelectedService(service);
                navigateTo('BOOKING');
              }}
            />
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-[375px] z-50 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 px-6 pb-8 pt-4">
          <div className="flex justify-between items-center">
            <NavItem 
              active={currentScreen === 'HOME'} 
              icon={<Home size={24} />} 
              label="Home" 
              onClick={() => navigateTo('HOME')} 
            />
            <NavItem 
              active={currentScreen === 'BOOKING' || currentScreen === 'CONFIRMED'} 
              icon={<Scissors size={24} />} 
              label="Book" 
              onClick={() => navigateTo('BOOKING')} 
            />
            <NavItem 
              active={currentScreen === 'REWARDS'} 
              icon={<Award size={24} />} 
              label="Rewards" 
              onClick={() => navigateTo('REWARDS')} 
            />
            <NavItem 
              active={currentScreen === 'HISTORY'} 
              icon={<User size={24} />} 
              label="Profile" 
              onClick={() => navigateTo('HISTORY')} 
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

// --- Sub-Screens ---

function HomeScreen({ lastAppointment, hasUpcoming, onNavigate }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 overflow-y-auto px-6 pt-12 pb-32 space-y-8"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-10 bg-primary-blue rounded-lg flex items-center justify-center text-white">
            <Scissors size={20} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter font-display">Style & Substance</h1>
        </div>
        <button className="p-2 text-slate-400">
          <Menu size={28} />
        </button>
      </header>

      <section>
        <h2 className="text-3xl font-bold tracking-tight font-display">Welcome back, Alex</h2>
        <p className="text-slate-400 mt-1">Ready for your next fresh cut?</p>
      </section>

      {/* Quick Rebook CTA - Only if no upcoming and has past */}
      {!hasUpcoming && lastAppointment && (
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-primary-blue text-white p-6 shadow-xl">
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Quick Rebook</span>
                  <h3 className="text-2xl font-bold mt-1 font-display">Book with Marcus Again</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium bg-black/10 w-fit px-3 py-1.5 rounded-full">
                <Clock size={14} />
                Next available: Today, 4:00 PM
              </div>
              <button 
                onClick={() => onNavigate('BOOKING')}
                className="w-full bg-white text-primary-blue font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                Confirm Appointment
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-12 -mt-12 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-8 -mb-8 blur-2xl" />
          </div>
        </section>
      )}

      {/* Loyalty Progress */}
      <section className="bg-card border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-lg font-bold font-display">Loyalty Status</h3>
            <p className="text-sm text-slate-400">4/5 visits completed</p>
          </div>
          <div className="text-right">
            <span className="text-primary-blue font-black text-xl">80%</span>
          </div>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
          <div className="bg-primary-blue h-full w-[80%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <Gift size={18} className="text-primary-blue" />
          <p className="text-sm font-semibold">One more visit until your <span className="text-primary-blue">FREE</span> haircut!</p>
        </div>
      </section>

      {/* Quick Action Grid */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('BOOKING')}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-card border border-white/5 rounded-2xl hover:bg-slate-800 transition-colors active:scale-95"
        >
          <div className="p-3 bg-primary-blue/10 rounded-full text-primary-blue">
            <Scissors size={24} />
          </div>
          <span className="font-bold text-sm">Browse Services</span>
        </button>
        <button 
          onClick={() => onNavigate('HISTORY')}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-card border border-white/5 rounded-2xl hover:bg-slate-800 transition-colors active:scale-95"
        >
          <div className="p-3 bg-primary-blue/10 rounded-full text-primary-blue">
            <HistoryIcon size={24} />
          </div>
          <span className="font-bold text-sm">View History</span>
        </button>
      </section>
    </motion.div>
  );
}

function BookingScreen({ 
  selectedBarber, setSelectedBarber, 
  selectedService, setSelectedService,
  selectedDate, setSelectedDate,
  selectedTime, setSelectedTime,
  smsReminder, setSmsReminder,
  next7Days, pricing, onConfirm, onBack
}: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex-1 overflow-y-auto pb-32"
    >
      <header className="sticky top-0 w-full z-50 flex items-center px-6 h-16 bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg">Book Appointment</h1>
        </div>
      </header>

      <main className="mt-4 px-4 space-y-8">
        {/* Barber Selection */}
        <section>
          <h2 className="font-display font-bold text-xl mb-4">Select Your Barber</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {BARBERS.map(barber => (
              <div 
                key={barber.id}
                onClick={() => setSelectedBarber(barber)}
                className={`min-w-[180px] rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                  selectedBarber.id === barber.id ? 'bg-slate-800/50 border-primary-blue' : 'bg-slate-800/30 border-transparent opacity-60'
                } relative flex flex-col items-center text-center`}
              >
                {barber.isPreferred && (
                  <span className="absolute top-2 right-2 bg-primary-blue text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Preferred</span>
                )}
                <div className={`w-16 h-16 rounded-full overflow-hidden mb-3 border-2 ${selectedBarber.id === barber.id ? 'border-primary-blue' : 'border-transparent'}`}>
                  <img src={barber.image} alt={barber.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold">{barber.name}</h3>
                <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest">{barber.role}</p>
                <div className="flex text-yellow-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} fill={i < barber.rating ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Service Selection */}
        <section>
          <h2 className="font-display font-bold text-xl mb-4">Select Service</h2>
          <div className="relative">
            <select 
              value={selectedService.id}
              onChange={(e) => setSelectedService(SERVICES.find(s => s.id === e.target.value))}
              className="w-full bg-card appearance-none p-4 rounded-xl border border-white/5 focus:outline-none focus:border-primary-blue transition-colors font-medium"
            >
              {SERVICES.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({formatPrice(s.price)})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={20} />
          </div>
        </section>

        {/* Date Selection */}
        <section>
          <h2 className="font-display font-bold text-xl mb-4">Select Date</h2>
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-white/5">
            {next7Days.map((date: Date, i: number) => {
              const isSelected = selectedDate.toDateString() === date.toDateString();
              const discount = isDiscountDay(date);
              return (
                <div 
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center rounded-xl px-3 py-2 cursor-pointer transition-all relative ${
                    isSelected ? 'bg-primary-blue' : 'opacity-40'
                  }`}
                >
                  {discount && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                      isSelected ? 'bg-accent-orange text-white' : 'bg-accent-orange text-white'
                    }`}>20% OFF</span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {getDayName(date)}
                  </span>
                  <span className="text-lg font-black">{getDayNumber(date)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Time Selection */}
        <section>
          <h2 className="font-display font-bold text-xl mb-4">Available Times</h2>
          <div className="grid grid-cols-3 gap-3">
            {['9:00 AM', '10:00 AM', '11:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '4:00 PM', '5:00 PM'].map(time => {
              const isSelected = selectedTime === time;
              const isTue = isDiscountDay(selectedDate);
              const hasPromo = isTue && time === '10:00 AM';
              const isUnavailable = time === '12:00 PM' || time === '4:00 PM';

              return (
                <button 
                  key={time}
                  disabled={isUnavailable}
                  onClick={() => setSelectedTime(time)}
                  className={`py-4 rounded-xl font-bold text-xs transition-all relative border ${
                    isSelected 
                      ? 'bg-primary-blue border-blue-400 text-white' 
                      : isUnavailable 
                        ? 'bg-slate-800/30 border-transparent text-slate-700 opacity-40' 
                        : 'bg-slate-800/30 border-white/5 text-slate-400'
                  }`}
                >
                  {hasPromo && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent-orange text-[7px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">SAVE 20%</span>
                  )}
                  {time}
                </button>
              );
            })}
          </div>
        </section>

        {/* SMS Toggle */}
        <section 
          onClick={() => setSmsReminder(!smsReminder)}
          className="flex items-center justify-between bg-card p-4 rounded-2xl border border-white/5 cursor-pointer"
        >
          <p className="text-sm text-slate-300">Get a text 24 hours before your appointment</p>
          <div className={`w-12 h-6 rounded-full relative transition-colors ${smsReminder ? 'bg-primary-blue' : 'bg-slate-700'}`}>
            <motion.div 
              animate={{ x: smsReminder ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </div>
        </section>

        {/* Summary Card */}
        <section className="bg-primary-blue/5 border border-primary-blue/20 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-start border-b border-white/5 pb-4">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-blue mb-1">Appointment Details</h3>
              <p className="font-black text-white text-lg font-display">{selectedService.name}</p>
              <p className="text-sm text-slate-400">{selectedBarber.name} - {selectedBarber.role}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white font-medium">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <p className="text-sm text-primary-blue font-black">{selectedTime}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Original Price</span>
              <span className="text-slate-400 line-through">{formatPrice(pricing.base)}</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Discount ({getDayName(selectedDate)} Promo)</span>
                <span className="text-accent-orange font-black">- {formatPrice(pricing.discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="font-black text-white font-display">Total Amount</span>
              <span className="text-2xl font-black text-primary-blue tracking-tighter">{formatPrice(pricing.total)}</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 pb-12">
          <button 
            onClick={onConfirm}
            className="w-full py-5 bg-primary-blue hover:bg-blue-600 text-white font-black text-lg rounded-xl shadow-[0px_10px_30px_rgba(59,130,246,0.3)] active:scale-[0.97] transition-all font-display"
          >
            Confirm Booking
          </button>
          <button onClick={onBack} className="text-primary-blue text-sm font-bold hover:underline">
            Reschedule existing appointment instead?
          </button>
        </section>
      </main>
    </motion.div>
  );
}

function ConfirmationScreen({ barber, service, date, time, discount, onReturn }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-32"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary-blue rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="relative w-20 h-20 bg-primary-blue rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.6)]">
          <Check size={40} className="text-white stroke-[4px]" />
        </div>
      </div>

      <div className="text-center space-y-2 mb-10">
        <h2 className="font-display font-black text-3xl tracking-tighter">Booking Confirmed!</h2>
        <p className="text-slate-400">We're looking forward to seeing you, Alex!</p>
      </div>

      <div className="w-full bg-card rounded-2xl overflow-hidden shadow-2xl relative mb-8 border border-white/5">
        {discount > 0 && (
          <div className="bg-accent-orange py-2 px-4 flex items-center justify-center gap-2">
            <TrendingUp size={14} className="text-white" />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">You saved {formatPrice(discount)}!</span>
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <img src={barber.image} alt={barber.name} className="w-16 h-16 rounded-full border-2 border-primary-blue/30 object-cover" />
            <div>
              <h3 className="font-display font-bold text-xl">{barber.name}</h3>
              <p className="text-slate-400 text-sm">{barber.role}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <DetailRow icon={<Calendar size={18} />} text={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} />
            <DetailRow icon={<Clock size={18} />} text={`${time} (${service.duration} minutes)`} />
            <DetailRow icon={<Scissors size={18} />} text={service.name} />
            <DetailRow icon={<MapPin size={18} />} text="Camberwell Location" />
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 mb-8">
        <button className="w-full bg-primary-blue text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
          <Calendar size={18} /> Add to Calendar
        </button>
        <button className="w-full border border-primary-blue/30 text-primary-blue py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <Share2 size={18} /> Share Appointment
        </button>
      </div>

      <button 
        onClick={onReturn}
        className="w-full bg-white text-slate-950 py-5 rounded-xl font-black font-display text-lg active:scale-95 transition-transform"
      >
        Return to Home
      </button>
    </motion.div>
  );
}

function RewardsScreen({ appointments, onBack }: any) {
  const visits = appointments.filter((a: any) => a.status === 'COMPLETED').length;
  const progress = (visits % 5) * 20;
  const remaining = 5 - (visits % 5);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 overflow-y-auto pb-32"
    >
      <header className="sticky top-0 w-full z-50 bg-background flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <ArrowLeft onClick={onBack} size={24} className="cursor-pointer active:scale-90" />
          <h1 className="font-display font-bold text-xl tracking-tight">Loyalty Rewards</h1>
        </div>
      </header>

      <main className="px-6 space-y-10 pt-6">
        <section className="flex flex-col items-center text-center space-y-6">
          <div className="relative flex items-center justify-center">
            <svg className="w-[180px] h-[180px]">
              <circle className="text-slate-800" cx="90" cy="90" fill="transparent" r="80" stroke="currentColor" strokeWidth="12" />
              <motion.circle 
                initial={{ strokeDashoffset: 502.65 }}
                animate={{ strokeDashoffset: 502.65 - (502.65 * progress) / 100 }}
                className="text-primary-blue" cx="90" cy="90" fill="transparent" r="80" stroke="currentColor" strokeDasharray="502.65" strokeLinecap="round" strokeWidth="12" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-black text-4xl tracking-tighter">{progress}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl">{visits % 5} out of 5 visits</h2>
            <p className="text-slate-400 font-medium">One more visit until FREE haircut! ✂️🎉</p>
          </div>
        </section>

        <section className="bg-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <p className="text-primary-blue font-black text-[10px] uppercase tracking-widest">Next Reward</p>
              <h3 className="font-display font-bold text-xl">Free Haircut</h3>
            </div>
            <div className="bg-primary-blue/10 p-3 rounded-xl text-primary-blue">
              <Gift size={24} />
            </div>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-display font-black text-primary-blue tracking-tighter">Value: $45</span>
          </div>
          <div className="pt-6 border-t border-white/5 flex gap-3">
            <Calendar size={14} className="text-slate-500 mt-0.5" />
            <p className="text-slate-400 text-xs leading-relaxed">Based on your booking history, you visit every 3 weeks. Estimated reward date: <span className="text-white font-semibold">April 15, 2026</span></p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-display font-bold text-lg">Visit History</h3>
          <div className="space-y-3">
            {appointments.map((appt: any, i: number) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                <div className="bg-primary-blue w-6 h-6 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white stroke-[3px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{appt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {SERVICES.find(s => s.id === appt.serviceId)?.name}</p>
                  <p className="text-xs text-slate-500">with {BARBERS.find(b => b.id === appt.barberId)?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </motion.div>
  );
}

function HistoryScreen({ appointments, onBack, onBookAgain }: any) {
  const [filter, setFilter] = useState('All');

  const stats = useMemo(() => ({
    total: appointments.length,
    favorite: 'Executive Fade',
    barber: 'Marcus',
    since: 'June 2025'
  }), [appointments]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="flex-1 overflow-y-auto pb-32"
    >
      <header className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <ArrowLeft onClick={onBack} size={24} className="cursor-pointer active:scale-90" />
            <h1 className="font-display font-bold text-xl tracking-tight">Booking History</h1>
          </div>
          <button className="p-2 text-slate-400">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <main className="px-4 mt-6 space-y-8">
        <section className="grid grid-cols-2 gap-3">
          <StatCard label="Total Visits" value={stats.total} icon={<TrendingUp size={14} />} />
          <StatCard label="Favorite Service" value={stats.favorite} />
          <StatCard label="Preferred Barber" value={stats.barber} avatar="M" />
          <StatCard label="Member Since" value={stats.since} blueValue />
        </section>

        <section className="flex overflow-x-auto gap-2 no-scrollbar">
          {['All', 'Upcoming', 'Completed', 'Cancelled'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                filter === f ? 'bg-primary-blue text-white shadow-lg shadow-blue-500/20' : 'border border-slate-700 text-slate-400'
              }`}
            >
              {f}
            </button>
          ))}
        </section>

        <section className="space-y-4">
          {appointments.map((appt: any) => (
            <div key={appt.id} className="bg-card rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${appt.status === 'CONFIRMED' ? 'text-primary-blue' : 'text-slate-500'}`}>
                    {appt.status}
                  </span>
                  <h3 className="font-display font-bold text-lg">
                    {appt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {appt.time}
                  </h3>
                </div>
                {appt.status === 'COMPLETED' && <CheckCircle2 className="text-primary-blue" size={20} />}
              </div>
              <div className="space-y-1 text-sm text-slate-400">
                <p>{SERVICES.find(s => s.id === appt.serviceId)?.name} with {BARBERS.find(b => b.id === appt.barberId)?.name}</p>
                <p className="text-xs opacity-60">{appt.location} Location</p>
              </div>
              {appt.status === 'COMPLETED' && (
                <button 
                  onClick={() => onBookAgain(appt)}
                  className="w-full bg-primary-blue text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
                >
                  Book Again
                </button>
              )}
            </div>
          ))}
        </section>
      </main>
    </motion.div>
  );
}

// --- UI Components ---

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
        active ? 'text-primary-blue' : 'text-slate-500'
      }`}
    >
      <div className={active ? 'text-primary-blue' : 'text-slate-500'}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="nav-dot" className="size-1 bg-primary-blue rounded-full mt-0.5" />}
    </button>
  );
}

function DetailRow({ icon, text }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center text-primary-blue">
        {icon}
      </div>
      <p className="text-slate-200 font-medium">{text}</p>
    </div>
  );
}

function StatCard({ label, value, icon, avatar, blueValue }: any) {
  return (
    <div className="bg-card p-4 rounded-2xl flex flex-col justify-between h-32 border border-white/5">
      <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        {avatar && (
          <div className="w-6 h-6 rounded-full bg-primary-blue flex items-center justify-center text-[10px] font-bold text-white">
            {avatar}
          </div>
        )}
        <span className={`text-2xl font-display font-black leading-none ${blueValue ? 'text-primary-blue' : 'text-white'}`}>
          {value}
        </span>
        {icon && <span className="text-primary-blue">{icon}</span>}
      </div>
    </div>
  );
}
