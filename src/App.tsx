/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Volume2, VolumeX, Calendar, Clock, Heart } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

// Menggunakan font serif untuk kesan estetik pernikahan
const aestheticFont = "font-serif"; 
const musicUrl = "https://videotourl.com/audio/1790744302500-f63aea6e-d438-4b72-8f33-b485dc0efd38.mp3"; // Musik pernikahan dari link pengguna

// Dummy data
const dummyGuests: Guest[] = [
  { id: '1', name: 'Andi & Susi', attendance: 'attending', message: 'Selamat menempuh hidup baru! Semoga bahagia selalu.' },
  { id: '2', name: 'Budi Hartono', attendance: 'attending', message: 'Lancar sampai hari H ya teman-teman!' },
  { id: '3', name: 'Citra Lestari', attendance: 'maybe', message: 'Semoga bisa hadir, acaranya pasti syahdu sekali.' },
];

interface Guest {
  id: string;
  name: string;
  attendance: string;
  message?: string;
  likes?: number;
}

// Inside the component return, update the guest card:
// Inside the guests.map((guest) => (
// Add this inside the map:
// const [likes, setLikes] = useState(guest.likes || 0);
// const handleLike = () => {
//    // Implementation would need to update firestore document
//    setLikes(prev => prev + 1);
// };
// Inside the card JSX:
// <button onClick={handleLike} className="flex items-center text-stone-500 hover:text-red-500 transition-colors">
//    <Heart size={16} className="mr-1" />
//    {likes}
// </button>

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex justify-center gap-4 py-8 bg-stone-100/50">
      {Object.entries(timeLeft).map(([label, value]) => (
        <div key={label} className="text-center">
          <div className="text-2xl font-bold font-serif">{value}</div>
          <div className="text-xs text-stone-500 uppercase">{label}</div>
        </div>
      ))}
    </div>
  );
}

function RangkaianAcara({ id }: { id: string }) {
  const events = [
    { name: "Akad Nikah", time: "09:00 WIB", icon: <Heart size={24} /> },
    { name: "Resepsi", time: "11:00 WIB", icon: <Calendar size={24} /> },
  ];

  return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        id={id} className="container mx-auto px-6 py-20 text-center"
      >
        <h2 className="text-3xl font-serif mb-10">Rangkaian Acara</h2>
        <div className="max-w-md mx-auto space-y-4">
          {events.map((event, index) => (
            <div key={index} className="flex items-center bg-white p-6 rounded-lg border border-rose-100 shadow-sm">
              <div className="text-rose-900 mr-4">{event.icon}</div>
              <div className="flex-1 text-left">
                <div className="font-bold">{event.name}</div>
                <div className="flex items-center text-sm text-stone-600">
                  <Clock size={14} className="mr-1" />
                  {event.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
  );
}

function RsvpSummary({ guests }: { guests: Guest[] }) {
  const summary = guests.reduce((acc, guest) => {
    acc[guest.attendance] = (acc[guest.attendance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section className="container mx-auto px-6 py-10 bg-stone-100 rounded-lg">
      <h2 className="text-2xl font-serif text-center mb-6">Ringkasan RSVP</h2>
      <div className="flex justify-around text-center">
        <div>
          <div className="text-3xl font-bold">{summary['attending'] || 0}</div>
          <div className="text-sm text-stone-600">Hadir</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{summary['maybe'] || 0}</div>
          <div className="text-sm text-stone-600">Mungkin</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{summary['not_attending'] || 0}</div>
          <div className="text-sm text-stone-600">Tidak Hadir</div>
        </div>
      </div>
    </section>
  );
}

function PhotoGallery({ id }: { id: string }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const photos = [
    { src: "https://images.pexels.com/photos/1024987/pexels-photo-1024987.jpeg?auto=compress&cs=tinysrgb&w=600", desc: "Pertemuan pertama kami." },
    { src: "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=600", desc: "Momen liburan tak terlupakan." },
    { src: "https://images.pexels.com/photos/2959192/pexels-photo-2959192.jpeg?auto=compress&cs=tinysrgb&w=600", desc: "Saat lamaran yang penuh haru." },
    { src: "https://images.pexels.com/photos/168442/pexels-photo-168442.jpeg?auto=compress&cs=tinysrgb&w=600", desc: "Persiapan hari bahagia." },
  ];

  return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        id={id} className="container mx-auto px-6 py-20"
      >
        <h2 className="text-3xl font-serif text-center mb-10">Galeri Foto</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer overflow-hidden rounded-lg"
              onClick={() => setSelectedImage(photo.src)}
            >
              <img src={photo.src} alt={`Foto ${index + 1}`} className="w-full h-48 object-cover" />
              <p className="mt-2 text-sm text-center text-stone-600 font-serif italic">{photo.desc}</p>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedImage(null)}
            >
              <img src={selectedImage} alt="Fullscreen" className="max-h-full max-w-full rounded-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
  );
}

function Location({ id }: { id: string }) {
  const latitude = -6.2088; // Contoh koordinat Jakarta
  const longitude = 106.8456;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <section id={id} className="container mx-auto px-6 py-20 text-center">
      <h2 className="text-3xl font-serif mb-10">Lokasi Acara</h2>
      <div className="bg-white p-6 rounded-lg border border-stone-100 shadow-sm max-w-2xl mx-auto">
        <div className="aspect-video mb-6 bg-stone-200 rounded-lg flex items-center justify-center">
            <MapPin size={48} className="text-stone-400" />
            <span className="ml-2">Peta Lokasi Gedung</span>
        </div>
        <p className="mb-6 text-stone-600">Alamat Gedung Resepsi, Kota, Indonesia</p>
        <a 
          href={mapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block bg-stone-900 text-white px-8 py-3 rounded-lg hover:bg-stone-800 transition-colors"
        >
          Buka di Google Maps
        </a>
      </div>
    </section>
  );
}

function OurStory({ id }: { id: string }) {
  return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        id={id} className="container mx-auto px-6 py-20"
      >
        <h2 className="text-3xl font-serif text-center mb-10">Cerita Kami</h2>
        <div className="max-w-3xl mx-auto text-center space-y-6 text-stone-700">
          <p>
            Perjalanan cinta kami dimulai dari pertemuan yang tak terduga. Sejak saat itu, setiap hari menjadi petualangan baru yang memperkuat ikatan kami.
          </p>
          <p>
            Setelah melalui berbagai suka dan duka bersama, kami menyadari bahwa kami ingin menghabiskan sisa hidup kami untuk saling mendukung dan menyayangi.
          </p>
          <p>
            Hari pernikahan ini adalah langkah awal dari babak baru dalam hidup kami, dan kami sangat bahagia dapat merayakannya bersama Anda.
          </p>
        </div>
      </motion.section>
  );
}

function ShareButton() {
  const shareUndangan = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Undangan Pernikahan Rida & Ryan',
          text: 'Kami mengundang Anda untuk merayakan hari bahagia kami!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Fitur berbagi tidak didukung di browser ini.');
    }
  };

  return (
    <div className="text-center py-10">
      <button 
        onClick={shareUndangan}
        className="inline-block bg-stone-900 text-white px-8 py-3 rounded-lg hover:bg-stone-800 transition-colors"
      >
        Bagikan Undangan
      </button>
    </div>
  );
}

function AmplopDigital({ id }: { id: string }) {
  const bankAccount = "1234567890";
  const bankInfo = `BCA: ${bankAccount} (Rida/Ryan)`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bankAccount);
    alert("Nomor rekening berhasil disalin!");
  };

  return (
    <section id={id} className="container mx-auto px-6 py-20 text-center">
      <h2 className="text-3xl font-serif mb-10">Amplop Digital</h2>
      <div className="bg-white p-8 rounded-lg border border-stone-100 shadow-sm max-w-sm mx-auto">
        <p className="mb-4 text-stone-600">
          Untuk mempermudah, Anda dapat memberikan kado pernikahan melalui transfer bank berikut:
        </p>
        <div className="flex justify-center mb-4">
          <QRCodeSVG value={bankInfo} size={128} />
        </div>
        <div className="font-bold text-xl mb-2">Bank BCA</div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="text-lg font-mono">{bankAccount}</div>
          <button 
            onClick={copyToClipboard}
            className="text-stone-500 hover:text-stone-900 transition-colors"
            title="Salin nomor rekening"
          >
            📋
          </button>
        </div>
        <div className="text-stone-600">a.n. Rida atau Ryan</div>
      </div>
    </section>
  );
}

function CalendarSync() {
  const addToCalendar = () => {
    const event = {
      title: "Pernikahan Rida & Ryan",
      description: "Pernikahan Rida dan Ryan",
      location: "Gedung Resepsi, Kota, Indonesia",
      startTime: "20261115T020000Z", // 09:00 WIB is 02:00 UTC
      endTime: "20261115T090000Z",
    };
    
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&dates=${event.startTime}/${event.endTime}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="text-center py-10">
      <button 
        onClick={addToCalendar}
        className="inline-block bg-stone-100 text-stone-900 px-6 py-2 rounded-lg hover:bg-stone-200 transition-colors"
      >
        Simpan ke Kalender
      </button>
    </div>
  );
}

function FloralDecoration({ className }: { className: string }) {
  return (
    <svg width="60" height="60" viewBox="0 0 100 100" className={`absolute text-stone-300 opacity-50 ${className}`}>
      <path
        d="M50,10 C60,20 70,20 80,10 C70,30 70,40 80,50 C60,40 50,40 40,50 C50,60 50,70 40,80 C30,70 20,70 10,80 C20,60 20,50 10,40 C30,50 40,50 50,40 C40,30 40,20 50,10"
        fill="currentColor"
      />
    </svg>
  );
}

function Navigation() {
  const links = [
    { name: "Galeri", href: "#galeri", icon: <Calendar size={20} /> },
    { name: "Acara", href: "#acara", icon: <Clock size={20} /> },
    { name: "Cerita", href: "#cerita", icon: <Heart size={20} /> },
    { name: "Lokasi", href: "#lokasi", icon: <MapPin size={20} /> },
    { name: "RSVP", href: "#rsvp", icon: <Calendar size={20} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200 py-3">
      <div className="container mx-auto px-6 flex justify-center gap-6 overflow-x-auto">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            title={link.name}
            className="flex flex-col items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap"
          >
            {link.icon}
            <span className="hidden sm:inline">{link.name}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

function PetalBackground() {
  const petals = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}vw`,
    animationDelay: `${Math.random() * 10}s`,
    animationDuration: `${5 + Math.random() * 10}s`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute text-stone-300 animate-fall"
          style={{
            left: petal.left,
            animationDelay: petal.animationDelay,
            animationDuration: petal.animationDuration,
          }}
        >
          🌸
        </div>
      ))}
    </div>
  );
}

function Fireworks() {
  const fireworks = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 80 + 10}%`,
    left: `${Math.random() * 80 + 10}%`,
    delay: `${Math.random() * 1}s`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {fireworks.map((fw) => (
        <div
          key={fw.id}
          className="absolute text-yellow-400 animate-firework"
          style={{
            top: fw.top,
            left: fw.left,
            animationDelay: fw.delay,
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('attending');
  const [message, setMessage] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const weddingDate = new Date('2026-11-15T09:00:00');

  const guestName = new URLSearchParams(window.location.search).get('to') || 'Tamu Undangan';

  useEffect(() => {
    const q = query(collection(db, 'guests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Guest[];
      setGuests(guestsData.length > 0 ? guestsData : dummyGuests);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const toggleAudio = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error("Audio playback error:", error);
      }
    }
  };

  const handleOpenInvitation = async () => {
    setIsOpened(true);
    setShowFireworks(true);
    setTimeout(() => setShowFireworks(false), 2000);
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Audio playback error:", error);
      }
    }
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'guests'), {
        name: rsvpName,
        attendance: rsvpStatus,
        message,
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
      setRsvpName('');
      setMessage('');
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 text-stone-800 relative">
      {showFireworks && <Fireworks />}
      <PetalBackground />
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-rose-100 flex flex-col items-center justify-center p-6 text-center"
          >
            <h1 className="text-4xl font-serif mb-6 text-rose-900">Pernikahan Rida & Ryan</h1>
            <p className="text-xl mb-8 text-rose-800">Kepada Yth. {guestName}</p>
            <button
              onClick={handleOpenInvitation}
              className="bg-rose-600 text-white px-8 py-3 rounded-full shadow-lg hover:bg-rose-700 transition-all text-lg"
            >
              Buka Undangan
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} src={musicUrl} loop preload="metadata" />
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <button 
          onClick={toggleAudio}
          className="p-4 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 transition-all"
        >
          {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>
      
      <CountdownTimer targetDate={weddingDate} />
      <Navigation />
      <header className={`relative py-20 text-center ${aestheticFont}`}>
        <FloralDecoration className="top-4 left-4 text-rose-300" />
        <FloralDecoration className="top-4 right-4 rotate-90 text-rose-300" />
        
        <div className="flex justify-center gap-4 mb-6">
          <img src="https://images.pexels.com/photos/1024987/pexels-photo-1024987.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Mempelai" className="w-40 h-40 object-cover rounded-full shadow-lg border-4 border-white" />
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl mb-4 text-rose-900"
        >
          Rida & Ryan
        </motion.h1>
        <p className="text-xl italic text-rose-800">Kami mengundang Anda untuk merayakan hari bahagia kami.</p>
      </header>

      <section className="relative py-16 px-6 bg-stone-100 text-center">
        <FloralDecoration className="top-2 left-2" />
        <FloralDecoration className="bottom-2 right-2 rotate-180" />
        <div className="max-w-2xl mx-auto">
          <p className="text-2xl font-serif italic text-stone-800 mb-4">
            "Cinta bukan tentang mencari seseorang yang sempurna, tetapi tentang belajar melihat kesempurnaan dalam diri seseorang yang tidak sempurna."
          </p>
          <p className="text-lg text-stone-600">— Anonymous</p>
        </div>
      </section>

      <PhotoGallery id="galeri" />
      <RangkaianAcara id="acara" />
      <OurStory id="cerita" />
      <Location id="lokasi" />
      <AmplopDigital id="amplop" />
      <CalendarSync />
      <ShareButton />
      <RsvpSummary guests={guests} />

      <section id="rsvp" className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-serif mb-10">RSVP</h2>
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-green-100 text-green-800 p-6 rounded-lg text-xl font-serif"
            >
              Terima kasih atas konfirmasi kehadiran Anda!
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleRSVP} 
              className="max-w-md mx-auto space-y-4"
            >
              <input 
                type="text" 
                placeholder="Nama Anda" 
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-lg"
                required
              />
              <select 
                value={rsvpStatus} 
                onChange={(e) => setRsvpStatus(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-lg"
              >
                <option value="attending">Hadir</option>
                <option value="not_attending">Tidak Hadir</option>
                <option value="maybe">Mungkin Hadir</option>
              </select>
              <textarea 
                placeholder="Ucapan & Doa" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-lg h-32"
              />
              <button type="submit" className="w-full bg-stone-900 text-white p-3 rounded-lg hover:bg-stone-800">
                Kirim Konfirmasi
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-serif text-center mb-10">Buku Tamu</h2>
        <motion.div 
          className="max-w-2xl mx-auto space-y-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {guests.map((guest) => (
            <GuestCard key={guest.id} guest={guest} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}

function GuestCard({ guest }: { guest: Guest }) {
  const [likes, setLikes] = useState(guest.likes || 0);

  const handleLike = () => {
    // In a real app, update Firestore document here
    setLikes(prev => prev + 1);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-lg border border-stone-100 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="font-bold">{guest.name}</h3>
      <p className="text-stone-500 text-sm mb-2 italic">
        {guest.attendance === 'attending' ? 'Hadir' : guest.attendance === 'maybe' ? 'Mungkin Hadir' : 'Tidak Hadir'}
      </p>
      {guest.message && <p className="mb-4">{guest.message}</p>}
      <button 
        onClick={handleLike} 
        className="flex items-center text-stone-500 hover:text-red-500 transition-colors"
      >
        <Heart size={16} className="mr-1" />
        {likes}
      </button>
    </motion.div>
  );
}
