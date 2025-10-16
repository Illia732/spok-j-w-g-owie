'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Filter, Phone, Clock, MapPin, Heart, School, Users, Shield, Church, AlertTriangle, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import Header from '@/components/layout/header' // Zaktualizowana ścieżka importu

// Typy danych
interface SupportPlace {
  id: string
  name: string
  type: 'psychologist' | 'hotline' | 'ngo' | 'school' | 'hospital' | 'family' | 'senior' | 'crisis' | 'religious' | 'victim'
  address: string
  phone?: string
  hours?: string
  description?: string
  website?: string
  email?: string
}

// KOMPLETNA BAZA WSPARCIA PSYCHOLOGICZNEGO W WARSZAWIE
const WARSAW_SUPPORT_PLACES: SupportPlace[] = [
  // WSPARCIE PSYCHOLOGICZNE
  {
    id: 'syntonia',
    name: 'Stowarzyszenie Syntonia',
    type: 'psychologist',
    address: 'Warszawa',
    phone: '792 810 820, 792 810 180',
    hours: 'Pon 9:00-13:00, Wt-Śr 9:00-12:00',
    email: 'wsparcieopiekunow@gmail.com, zapisy@syntonia.org.pl',
    description: 'Wsparcie psychologiczne online'
  },
  {
    id: 'pck',
    name: 'Polski Czerwony Krzyż',
    type: 'psychologist',
    address: 'Warszawa',
    phone: '607 050 655',
    hours: 'Pon-Pt 9:00-14:00, Pon 8:00-20:00, Czw 18:00-20:00',
    description: 'Porady psychologiczne'
  },
  {
    id: 'razem',
    name: 'Fundacja Razem',
    type: 'psychologist',
    address: 'Warszawa',
    phone: '733 563 311',
    hours: 'Pon-Pt 10:00-18:00',
    description: 'Wsparcie psychologiczne'
  },

  // TELEFONY ZAUFANIA
  {
    id: 'mali-bracia',
    name: 'Stowarzyszenie Mali Bracia Ubogich',
    type: 'hotline',
    address: 'Warszawa',
    phone: '22 635 09 54',
    hours: 'Pon-Pt 17:00-20:00',
    description: 'Telefon zaufania dla seniorów'
  },
  {
    id: 'znajdz-pomoc',
    name: 'Fundacja "Znajdź Pomoc"',
    type: 'hotline',
    address: 'Warszawa',
    phone: '800 220 280',
    hours: 'Pon-Pt 17:00-20:00',
    description: 'Infolinia wsparcia psychologicznego'
  },
  {
    id: '116-111',
    name: 'Telefon Zaufania dla Dzieci i Młodzieży',
    type: 'hotline',
    address: 'ul. Nowogrodzka 75, 00-662 Warszawa',
    phone: '116 111',
    hours: '24/7',
    description: 'Bezpłatny, całodobowy telefon zaufania'
  },
  {
    id: 'itaka',
    name: 'ITAKA - Antydepresyjny Telefon Zaufania',
    type: 'hotline',
    address: 'ul. Nowogrodzka 49, 00-695 Warszawa',
    phone: '22 654 40 41',
    hours: 'Pon-Pt 17:00-20:00',
    description: 'Wsparcie dla osób w depresji'
  },

  // WSPARCIE DLA RODZIN I SENIORÓW
  {
    id: 'wawer-rodzina',
    name: 'Specjalistyczna Poradnia Rodzinna Dzielnicy Wawer',
    type: 'family',
    address: 'Warszawa',
    phone: '22 612 77 94, 22 277 11 98',
    hours: 'Pon-Pt 8:00-16:00',
    description: 'Pomoc dla rodzin, również przez Skype'
  },
  {
    id: 'projekt-starsi',
    name: 'Fundacja Projekt Starsi',
    type: 'senior',
    address: 'Warszawa',
    phone: '537 375 505',
    description: 'Pomoc osobom starszym krzywdzonym przez bliskich'
  },

  // PORADNIE KATOLICKIE
  {
    id: 'katolicka-poradnia',
    name: 'Archidiecezjalna Poradnia Katolicka',
    type: 'religious',
    address: 'ul. Nowogrodzka 49, Warszawa',
    phone: '22 629 02 61',
    hours: '15:00-19:00',
    website: 'http://duszpasterstworodzin.pl',
    description: 'Pomoc psychologiczna, prawna, duchowa'
  },
  {
    id: 'dewajtis',
    name: 'Poradnia Dewajtis',
    type: 'religious',
    address: 'ul. Dzielna 11a, Warszawa',
    phone: '660 511 566',
    hours: 'Pon-Pt 14:00-19:00',
    email: 'kontaktdewajtis@gmail.com',
    website: 'http://www.dewajtis.pl/'
  },
  {
    id: 'bednarska',
    name: 'Poradnia "Bednarska"',
    type: 'religious',
    address: 'ul. Mariensztat 8, Warszawa',
    phone: '22 828 54 83',
    hours: 'Pon-Pt 8:00-20:00',
    website: 'www.opp.bednarska.warszawa.pl'
  },
  {
    id: 'inigo',
    name: 'Fundacja INIGO',
    type: 'religious',
    address: 'ul. A. Boboli 12, Warszawa',
    phone: '797 002 584',
    hours: 'Pon-Czw 16:00-19:00, Pt 9:00-12:00',
    website: 'www.inigo.org.pl'
  },

  // POMOC POKRZYWDZONYM
  {
    id: 'centrum-pomocy',
    name: 'Centrum Psychologicznej Pomocy Rodzinie',
    type: 'victim',
    address: 'ul. Wspólna 35/8, 00-519 Warszawa',
    phone: '22 621 11 51'
  },
  {
    id: 'dzieci-niczyje',
    name: 'Centrum Pomocy Rodzinie "Dzieci Niczyje"',
    type: 'victim',
    address: 'ul. Walecznych 59, 03-926 Warszawa',
    phone: '22 616 02 68'
  },

  // PORADNIE PSYCHOLOGICZNO-PEDAGOGICZNE (wybrane)
  {
    id: 'ppp1',
    name: 'Poradnia Psychologiczno-Pedagogiczna nr 1',
    type: 'school',
    address: 'ul. Złota 9 lok. 3, 00-019 Warszawa',
    phone: '22 290 36 99',
    website: 'ppp1.waw.pl',
    email: 'sekretariat.ppp1@eduwarszawa.pl'
  },
  {
    id: 'ppp2',
    name: 'Poradnia Psychologiczno-Pedagogiczna nr 2',
    type: 'school',
    address: 'ul. Karolkowa 53 A, 01-197 Warszawa',
    phone: '22 836 70 88',
    website: 'poradnia2.waw.pl',
    email: 'sekretariat.ppp2@eduwarszawa.pl'
  },
  {
    id: 'ppp3',
    name: 'Poradnia Psychologiczno-Pedagogiczna nr 3',
    type: 'school',
    address: 'ul. Felińskiego 15, 01-513 Warszawa',
    phone: '22 277-22-10',
    website: 'poradnia-nr3.pl',
    email: 'sekretariat.ppp3@eduwarszawa.pl'
  },
  {
    id: 'ppp4',
    name: 'Poradnia Psychologiczno-Pedagogiczna nr 4',
    type: 'school',
    address: 'ul. Mińska 1/5, 03-806 Warszawa',
    phone: '22 810 20 29',
    website: 'ppp4.edu.pl',
    email: 'ppp4@eduwarszawa.pl'
  },
  {
    id: 'ppp-top',
    name: 'Specjalistyczna Poradnia Psychologiczno-Pedagogiczna "TOP"',
    type: 'school',
    address: 'ul. Raszyńska 8/10, 02-026 Warszawa',
    phone: '22 822 77 17',
    email: 'sppptop@eduwarszawa.pl',
    website: 'poradnia-top.pl'
  },

  // KRYZYS
  {
    id: 'pogotowie-rodzina',
    name: 'Pogotowie dla Rodziny',
    type: 'crisis',
    address: 'ul. Domaniewska 20, Warszawa',
    phone: '692 032 370',
    website: 'https://www.pogotowiedlarodziny.com'
  },
  {
    id: 'pracownia-dialogu',
    name: 'Pracownia Dialogu',
    type: 'crisis',
    address: 'ul. Freta 20/24a, Warszawa',
    phone: '664 050 178',
    website: 'https://pracowniadialogu.pl/'
  }
]

// Filtry kategorii
const PLACE_TYPES = [
  { 
    id: 'all', 
    label: 'Wszystkie', 
    icon: MapPin, 
    color: 'bg-gradient-to-r from-purple-500 to-pink-500', 
    markerColor: '#8B5CF6',
    emoji: '🏢'
  },
  { 
    id: 'school', 
    label: 'Poradnie PPP', 
    icon: School, 
    color: 'bg-gradient-to-r from-purple-500 to-indigo-500', 
    markerColor: '#8B5CF6',
    emoji: '🏫'
  },
  { 
    id: 'psychologist', 
    label: 'Psychologowie', 
    icon: Heart, 
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500', 
    markerColor: '#3B82F6',
    emoji: '🧠'
  },
  { 
    id: 'hotline', 
    label: 'Telefony', 
    icon: Phone, 
    color: 'bg-gradient-to-r from-red-500 to-orange-500', 
    markerColor: '#EF4444',
    emoji: '📞'
  },
  { 
    id: 'family', 
    label: 'Dla Rodzin', 
    icon: Users, 
    color: 'bg-gradient-to-r from-green-500 to-emerald-500', 
    markerColor: '#10B981',
    emoji: '👨‍👩‍👧‍👦'
  },
  { 
    id: 'senior', 
    label: 'Dla Seniorów', 
    icon: Home, 
    color: 'bg-gradient-to-r from-amber-500 to-orange-500', 
    markerColor: '#F59E0B',
    emoji: '👵'
  },
  { 
    id: 'religious', 
    label: 'Katolickie', 
    icon: Church, 
    color: 'bg-gradient-to-r from-gray-500 to-gray-700', 
    markerColor: '#6B7280',
    emoji: '⛪'
  },
  { 
    id: 'crisis', 
    label: 'Kryzys', 
    icon: AlertTriangle, 
    color: 'bg-gradient-to-r from-red-600 to-rose-600', 
    markerColor: '#DC2626',
    emoji: '🆘'
  },
  { 
    id: 'victim', 
    label: 'Pokrzywdzeni', 
    icon: Shield, 
    color: 'bg-gradient-to-r from-purple-600 to-violet-600', 
    markerColor: '#7C3AED',
    emoji: '🛡️'
  }
]

export default function WarsawMap() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedPlace, setSelectedPlace] = useState<SupportPlace | null>(null)
  
  // Filtrowanie miejsc
  const filteredPlaces = useMemo(() => 
    selectedFilter === 'all' 
      ? WARSAW_SUPPORT_PLACES 
      : WARSAW_SUPPORT_PLACES.filter(place => place.type === selectedFilter)
  , [selectedFilter])

  const getTypeConfig = (type: string) => {
    return PLACE_TYPES.find(t => t.id === type) || PLACE_TYPES[0]
  }

  // Funkcja telefonu
  const handleCall = (phone: string) => {
    // Usuń spacje i wybierz pierwszy numer
    const cleanPhone = phone.split(',')[0].trim().replace(/\s/g, '')
    window.open(`tel:${cleanPhone}`, '_self')
  }

  // Funkcja nawigacji
  const handleNavigate = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  // Statystyki
  const stats = useMemo(() => ({
    total: WARSAW_SUPPORT_PLACES.length,
    byType: PLACE_TYPES.filter(t => t.id !== 'all').map(type => ({
      type: type.id,
      label: type.label,
      count: WARSAW_SUPPORT_PLACES.filter(p => p.type === type.id).length,
      emoji: type.emoji
    }))
  }), [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Navbar */}
      <Header />
      
      <div className="py-8">
        <div className="container mx-auto max-w-7xl px-4">
          
          {/* Nagłówek */}
          <div className="flex items-center justify-between mb-8 p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg">
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                Lista Wsparcia Psychologicznego - Warszawa
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                {stats.total} miejsc pomocy psychologicznej w Warszawie
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Panel boczny */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Karta filtrów */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/40">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <Filter className="h-5 w-5 text-purple-600" />
                    Filtruj miejsca
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {PLACE_TYPES.map((type) => {
                    const count = WARSAW_SUPPORT_PLACES.filter(p => type.id === 'all' || p.type === type.id).length
                    
                    return (
                      <Button
                        key={type.id}
                        variant={selectedFilter === type.id ? "primary" : "outline"}
                        className={cn(
                          "w-full justify-start gap-3 py-4 text-sm font-semibold transition-all duration-200",
                          selectedFilter === type.id 
                            ? "text-white shadow-lg transform scale-[1.02] border-0" 
                            : "border-2 border-gray-200 bg-white/90 hover:bg-white hover:border-gray-300 text-gray-700 hover:scale-[1.01]"
                        )}
                        style={
                          selectedFilter === type.id 
                            ? { background: `linear-gradient(135deg, ${type.markerColor}20, ${type.markerColor}40)`, color: type.markerColor }
                            : {}
                        }
                        onClick={() => setSelectedFilter(type.id)}
                      >
                        <span className="text-lg">{type.emoji}</span>
                        {type.label}
                        <span className="ml-auto text-xs font-medium bg-black/10 px-2 py-1 rounded-full">
                          {count}
                        </span>
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Statystyki */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/40">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Statystyki
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                    <div className="text-gray-600">wszystkich miejsc</div>
                  </div>
                  {stats.byType.map(stat => (
                    <div key={stat.type} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{stat.emoji}</span>
                        <span className="text-gray-700">{stat.label}:</span>
                      </div>
                      <span className="font-bold">{stat.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Główna lista miejsc */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/40">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {selectedFilter === 'all' ? 'Wszystkie miejsca wsparcia' : `Miejsca: ${getTypeConfig(selectedFilter).label}`} ({filteredPlaces.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {filteredPlaces.map((place) => {
                      const config = getTypeConfig(place.type)
                      return (
                        <div
                          key={place.id}
                          className={cn(
                            "p-6 border-2 rounded-xl transition-all duration-200 hover:shadow-lg group",
                            selectedPlace?.id === place.id
                              ? "border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200"
                              : "border-gray-200 bg-white/90 shadow-sm hover:border-purple-300"
                          )}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md"
                                  style={{ backgroundColor: config.markerColor }}
                                >
                                  {config.emoji}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                    {place.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">{config.label}</span>
                                    {place.hours && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        {place.hours.split(',')[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <span>{place.address}</span>
                                </div>
                                
                                {place.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span className="font-bold text-purple-600">{place.phone}</span>
                                  </div>
                                )}
                                
                                {place.hours && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-600">{place.hours}</span>
                                  </div>
                                )}
                              </div>

                              {place.description && (
                                <p className="text-sm text-gray-600 mt-3">
                                  {place.description}
                                </p>
                              )}

                              {(place.website || place.email) && (
                                <div className="flex gap-4 mt-3 text-sm">
                                  {place.website && (
                                    <a href={`https://${place.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
                                      🌐 {place.website}
                                    </a>
                                  )}
                                  {place.email && (
                                    <a href={`mailto:${place.email}`} className="text-blue-600 font-medium hover:underline">
                                      ✉️ {place.email}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button 
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                              onClick={() => handleNavigate(place.address)}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Pokaż na mapie
                            </Button>
                            
                            {place.phone && (
                              <Button 
                                variant="outline" 
                                className="border-gray-200 hover:border-green-300 hover:text-green-600"
                                onClick={() => handleCall(place.phone!)}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Zadzwoń
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Informacja o ewentualnych błędach */}
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Uwaga dotycząca danych</p>
                      <p className="text-yellow-700">
                        Informacje o miejscach wsparcia mogą zawierać ewentualne błędy lub nieaktualne dane. 
                        Godziny otwarcia, numery telefonów i adresy mogą ulegać zmianom. 
                        Przed wizytą zalecamy telefoniczne potwierdzenie dostępności usług.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informacja o zgłaszaniu błędów */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Znalazłeś błąd w danych?</p>
                      <p className="text-blue-700 mb-2">
                        Jeżeli zauważyłeś jakiś błąd w informacjach lub masz sugestie dotyczące ulepszenia tej mapy wsparcia, prosimy o kontakt:
                      </p>
                      <a 
                        href="mailto:spokojwglowie.kontakt@gmail.com" 
                        className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium px-3 py-2 rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        spokojwglowie.kontakt@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}