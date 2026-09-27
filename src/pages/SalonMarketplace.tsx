import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  Sparkles,
  Phone,
  MessageCircle,
  Instagram,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  User,
  Heart,
  SlidersHorizontal,
  ExternalLink,
  Bot,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  category: "hair" | "braids" | "spa" | "beard" | "nails";
  duration: string;
  priceTZS: number;
  popular?: boolean;
  description: string;
  image: string;
}

interface Stylist {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  specialty: string;
}

const SERVICES: Service[] = [
  {
    id: "s1",
    name: "Executive Fade & Beard Sculpt",
    category: "hair",
    duration: "45 mins",
    priceTZS: 25000,
    popular: true,
    description: "Precision skin fade, hot towel prep, beard shaping with razor finish, and botanical cologne mist.",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "s2",
    name: "Knotless Box Braids (Mid-Back)",
    category: "braids",
    duration: "2.5 - 3 hrs",
    priceTZS: 65000,
    popular: true,
    description: "Tension-free scalp installation with premium pre-stretched extensions and shine mousse finish.",
    image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "s3",
    name: "Deep Hydro-Clarifying Facial",
    category: "spa",
    duration: "50 mins",
    priceTZS: 45000,
    popular: false,
    description: "Ultrasonic blackhead pore cleansing, tea tree steam treatment, hyaluronic acid infusion mask.",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "s4",
    name: "Deluxe Spa Pedicure & Gel Polish",
    category: "nails",
    duration: "45 mins",
    priceTZS: 30000,
    popular: false,
    description: "Epsom salt foot soak, exfoliating sugar scrub, callous removal, cuticles, and long-lasting gel polish.",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "s5",
    name: "Luxury Hot Towel Beard Grooming",
    category: "beard",
    duration: "30 mins",
    priceTZS: 15000,
    popular: false,
    description: "Steam treatment with essential cedarwood oil, beard trimming, straight-edge line up & balm treatment.",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "s6",
    name: "Silk Press & Deep Conditioning",
    category: "hair",
    duration: "1.5 hrs",
    priceTZS: 40000,
    popular: true,
    description: "Clarifying wash, keratin deep conditioning mask, blow dry, and glass-shine heat styling.",
    image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&auto=format&fit=crop&q=80",
  },
];

const STYLISTS: Stylist[] = [
  {
    id: "st1",
    name: "Juma Baraka",
    role: "Master Barber",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    rating: 4.9,
    specialty: "Skin Fades & Beard Design",
  },
  {
    id: "st2",
    name: "Amina Khalfan",
    role: "Senior Hair & Braids Artist",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80",
    rating: 5.0,
    specialty: "Knotless Braids & Silk Press",
  },
  {
    id: "st3",
    name: "Grace Moshi",
    role: "Esthetician & Nail Technician",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
    rating: 4.8,
    specialty: "Facials & Spa Pedicure",
  },
];

const TIME_SLOTS = [
  "09:30 AM", "10:30 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM", "07:00 PM"
];

export default function SalonMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<string>("any");
  const [selectedDate, setSelectedDate] = useState<string>("Today, Sept 17");
  const [selectedTime, setSelectedTime] = useState<string>("02:30 PM");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showBotSimulator, setShowBotSimulator] = useState(false);

  // Chat simulator state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string; options?: string[] }>>([
    {
      sender: "bot",
      text: "Mambo vipi! 👋 Karibu Luxe Studio & Barber Lounge (Mikocheni). Ninaweza kukusaidiaje leo?",
      time: "14:15",
      options: ["Ona Huduma & Bei ✂️", "Weka Appointment 📅", "Masaa ya Kazi ⏰", "Ongea na Mhudumu 👤"],
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const filteredServices = selectedCategory === "all"
    ? SERVICES
    : SERVICES.filter((s) => s.category === selectedCategory);

  const handleStartBooking = (service: Service) => {
    setSelectedService(service);
    setBookingSuccess(false);
    setBookingOpen(true);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      toast.error("Tafadhali weka jina na namba ya simu.");
      return;
    }

    setBookingSuccess(true);
    toast.success("Appointment yako imethibitishwa kikamilifu! 🎉", {
      description: `Ujumbe wa uthibitisho umetumwa WhatsApp kwa ${customerPhone}`,
    });
  };

  const handleSendChatMessage = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");

    // Bot automatic response simulation
    setTimeout(() => {
      let reply = "";
      let options: string[] | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes("appointment") || lower.includes("weka") || lower.includes("book")) {
        reply = "Safi sana! Tunayo nafasi leo saa 02:30 PM na 04:00 PM na Master Barber Juma au Amina Khalfan. Ungependa huduma ipi?";
        options = ["Executive Fade (25k)", "Knotless Braids (65k)", "Hydro Facial (45k)"];
      } else if (lower.includes("huduma") || lower.includes("bei") || lower.includes("fade")) {
        reply = "Huduma zetu kuu ni: \n• Executive Fade & Beard: TZS 25,000 (45 mins)\n• Knotless Braids: TZS 65,000 (2.5 hrs)\n• Hydro Facial: TZS 45,000 (50 mins)\n• Spa Pedicure: TZS 30,000\n\nJe, nikuwekee nafasi sasa?";
        options = ["Ndio, nithibitishie nafasi ✅", "Wapi mnapatikana? 📍"];
      } else if (lower.includes("wapi") || lower.includes("mahali") || lower.includes("location")) {
        reply = "Tunapatikana Mikocheni B, karibu na shoppers plaza, Dar es Salaam. Karibu sana! 💈";
        options = ["Weka Appointment 📅", "Nitumie Google Maps 📍"];
      } else {
        reply = "Asante kwa ujumbe wako! Master Barber Juma atakupigia simu punde au unaweza kubofya kitufe cha 'Weka Appointment' hapa chini kuona nafasi zote wazi.";
        options = ["Weka Appointment 📅", "Ona Huduma & Bei ✂️"];
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          options,
        },
      ]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* PERSPECTIVE SWITCHER TOP BAR */}
      <div className="bg-slate-900 text-white px-4 py-2 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-emerald-400">SALON CLIENT DEMO</span>
            <span className="text-slate-400 hidden sm:inline">&bull;</span>
            <span className="text-slate-300">Custom Domain: <strong className="text-white">luxesalon.co.tz</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Current View:</span>
            <span className="bg-emerald-500 text-white font-medium px-2 py-0.5 rounded text-[11px]">
              Customer Storefront
            </span>
            <Link
              to="/appointments"
              className="text-slate-300 hover:text-white underline flex items-center gap-1 transition-colors"
            >
              Go to Back-Office POS <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* SALON HEADER & NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">LUXE STUDIO</h1>
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50 font-semibold">
                  SALON & BARBER
                </Badge>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" /> Mikocheni B, Dar es Salaam &bull; Open 09:00 - 21:00
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* WhatsApp live trigger */}
            <Button
              onClick={() => setShowBotSimulator(true)}
              variant="outline"
              className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm h-10 px-3 sm:px-4 font-medium"
            >
              <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp Bot Demo</span>
              <span className="sm:hidden">Bot</span>
            </Button>

            <Button
              onClick={() => handleStartBooking(SERVICES[0])}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 text-xs sm:text-sm h-10 px-4 font-semibold"
            >
              <Calendar className="w-4 h-4 mr-1.5" /> Book Now
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-14 sm:py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Premium Hair, Beauty & Grooming Sanctuary</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Effortless Beauty & Sharp Precision. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Booked in Seconds.</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Explore our curated services, select your preferred expert stylist, and receive instant confirmation directly to your WhatsApp. No endless waiting at the counter.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white">4.9 / 5.0</span>
                <span className="text-slate-400">(240+ Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Clean & Sanitized</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Zero Wait Time with Booking</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick VIP Reservation</span>
                <span className="text-xs text-emerald-400 font-medium">Available Today</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Pick Favorite Service</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onChange={(e) => {
                      const svc = SERVICES.find((s) => s.id === e.target.value);
                      if (svc) handleStartBooking(svc);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Choose a service...</option>
                    {SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — TZS {s.priceTZS.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block">Next Available Slot</span>
                    <span className="text-sm font-bold text-emerald-400">02:30 PM (Today)</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block">Active Stylists</span>
                    <span className="text-sm font-bold text-white">3 On Duty</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleStartBooking(SERVICES[0])}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-5 text-sm"
                >
                  Reserve Slot Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE MARKETPLACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Service Catalog & Online Booking
            </h3>
            <p className="text-slate-600 text-sm mt-1">
              Select a category to explore treatments, durations, and official salon pricing.
            </p>
          </div>

          {/* Categories bar */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Services" },
              { id: "hair", label: "Hair & Styling" },
              { id: "braids", label: "Braids & Weaves" },
              { id: "spa", label: "Spa & Facial" },
              { id: "beard", label: "Beard Grooming" },
              { id: "nails", label: "Nails & Pedi" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 text-white shadow"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="overflow-hidden border border-slate-200 hover:border-emerald-400 transition-all hover:shadow-lg hover:-translate-y-1 group bg-white"
            >
              <div className="h-48 w-full overflow-hidden relative">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                {service.popular && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                    Most Popular
                  </span>
                )}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <span className="text-xs font-semibold bg-black/40 backdrop-blur px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-300" /> {service.duration}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-300 bg-slate-900/80 px-2.5 py-0.5 rounded-md">
                    TZS {service.priceTZS.toLocaleString()}
                  </span>
                </div>
              </div>

              <CardContent className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {service.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Pay at salon or mobile money
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartBooking(service)}
                    className="bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                  >
                    Select & Book <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* STYLISTS TEAM SPOTLIGHT */}
        <section className="mt-16 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="max-w-2xl mb-6">
            <h4 className="text-xl font-bold text-slate-900">Meet Our Master Stylists & Artists</h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select your favorite specialist when booking, or choose 'First Available' for immediate service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STYLISTS.map((st) => (
              <div key={st.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <img
                  src={st.avatar}
                  alt={st.name}
                  className="w-13 h-13 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm text-slate-900">{st.name}</span>
                    <span className="text-[11px] font-bold text-amber-500 flex items-center">
                      ★ {st.rating}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-emerald-700">{st.role}</div>
                  <div className="text-[11px] text-slate-500">{st.specialty}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* INTERACTIVE BOOKING MODAL */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Online Appointment</span>
                <DialogTitle className="text-lg font-bold text-white mt-0.5">
                  {selectedService?.name || "Book Service"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Duration: {selectedService?.duration} &bull; Total: <strong>TZS {selectedService?.priceTZS.toLocaleString()}</strong>
                </DialogDescription>
              </div>
            </div>
          </div>

          {!bookingSuccess ? (
            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              {/* Select Stylist */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">Choose Stylist</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedStylist("any")}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      selectedStylist === "any"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    ⚡ First Available
                  </button>
                  {STYLISTS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStylist(st.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        selectedStylist === st.id
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="font-semibold truncate">{st.name.split(" ")[0]}</div>
                      <div className="text-[10px] text-slate-500 truncate">{st.role}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">Available Time Slot (Today)</Label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-1.5 px-2 rounded-md border text-center text-xs font-medium transition-all ${
                        selectedTime === time
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <Label htmlFor="custName" className="text-xs font-semibold text-slate-700">Your Full Name</Label>
                  <Input
                    id="custName"
                    placeholder="e.g. Baraka Elias"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="custPhone" className="text-xs font-semibold text-slate-700">
                    WhatsApp Phone Number (For Instant Confirmation)
                  </Label>
                  <Input
                    id="custPhone"
                    placeholder="e.g. +255 712 345 678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 text-sm shadow-md mt-2"
              >
                Confirm Appointment (TZS {selectedService?.priceTZS.toLocaleString()})
              </Button>
            </form>
          ) : (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Nafasi Imethibitishwa!</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Asante <strong>{customerName}</strong>. Appointment yako ya <strong>{selectedService?.name}</strong> imewekwa rasmi:
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Muda:</span>
                  <span className="font-bold text-slate-800">{selectedTime}, {selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mtaalamu:</span>
                  <span className="font-bold text-slate-800">
                    {selectedStylist === "any" ? "First Available Stylist" : STYLISTS.find((s) => s.id === selectedStylist)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gharama:</span>
                  <span className="font-bold text-emerald-700">TZS {selectedService?.priceTZS.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Malipo:</span>
                  <span className="text-slate-700">Lipa Saluni (Cash / M-Pesa / Tigo Pesa)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => {
                    setBookingOpen(false);
                    setShowBotSimulator(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" /> Tazama WhatsApp Confirmation Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBookingOpen(false)}
                  className="text-xs"
                >
                  Funga
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WHATSAPP & INSTAGRAM BOT INTERACTIVE SIMULATOR DRAWER */}
      {showBotSimulator && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col h-[520px] animate-in fade-in slide-in-from-bottom-6">
          {/* Bot Header */}
          <div className="bg-emerald-700 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-white text-xs">
                  <Bot className="w-5 h-5 text-emerald-200" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-emerald-700 rounded-full"></span>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Luxe Salon Smart Bot</div>
                <div className="text-[10px] text-emerald-200 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300"></span> WhatsApp Business & IG Auto-Reply
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowBotSimulator(false)}
              className="text-emerald-200 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bot Conversation Screen */}
          <div className="flex-1 p-3 overflow-y-auto bg-[#efeae2] space-y-3 text-xs">
            <div className="text-center my-1">
              <span className="bg-white/80 text-slate-500 text-[10px] px-2 py-0.5 rounded shadow-sm">
                Leo, 14:15 &bull; Simulating Meta Webhook Integration
              </span>
            </div>

            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2.5 shadow-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#d9fdd3] text-slate-800 rounded-tr-none"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200/60"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className="text-[9px] text-slate-400 block text-right mt-1">
                    {msg.time} {msg.sender === "user" ? "✓✓" : ""}
                  </span>
                </div>

                {/* Interactive quick reply options */}
                {msg.options && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => handleSendChatMessage(opt)}
                        className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-xs transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bot Input Bar */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChatMessage();
              }}
              placeholder="Andika ujumbe (e.g. 'Nahitaji kunyoa kesho')..."
              className="text-xs h-9"
            />
            <Button
              size="sm"
              onClick={() => handleSendChatMessage()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* SALON FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Scissors className="w-4 h-4 text-emerald-400" /> LUXE STUDIO & BARBER LOUNGE
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Powered by WiseCash Retail & Booking Engine &bull; Custom Domain Instance
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> +255 712 000 111
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Instagram className="w-3.5 h-3.5 text-rose-400" /> @luxestudio_tz
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
