import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Landing Page
    'landing.welcome': 'Welcome to',
    'landing.appName': 'InfraTrace',
    'landing.tagline': 'Construction Field Management',
    'landing.subtitle': 'Track attendance, manage tasks, and monitor progress',
    'landing.getStarted': 'Get Started',
    
    // Login
    'login.title': 'Login',
    'login.selectRole': 'Select Your Role',
    'login.phoneNumber': 'Phone Number',
    'login.phonePlaceholder': 'Enter your phone number',
    'login.continue': 'Continue',
    'login.labour': 'Labour',
    'login.supervisor': 'Supervisor',
    'login.engineer': 'Engineer',
    'login.owner': 'Owner',
    'login.selectLanguage': 'Select Language',
    
    // Home
    'home.goodMorning': 'Good Morning',
    'home.goodAfternoon': 'Good Afternoon',
    'home.goodEvening': 'Good Evening',
    'home.markAttendance': 'Mark Attendance',
    'home.gpsRequired': 'GPS • Time • Live Photo Required',
    'home.synced': 'Synced',
    'home.yourTasks': 'Your Tasks',
    'home.pending': 'Pending',
    'home.site': 'Site',
    
    // Projects
    'projects.title': 'Projects',
    'projects.all': 'All',
    'projects.active': 'Active',
    'projects.completed': 'Completed',
    'projects.onHold': 'On Hold',
    'projects.progress': 'Progress',
    'projects.tasks': 'Tasks',
    'projects.members': 'Members',
    
    // Stats
    'stats.title': 'Statistics',
    'stats.attendance': 'Attendance',
    'stats.hoursWorked': 'Hours Worked',
    'stats.tasksOverview': 'Tasks Overview',
    'stats.thisMonth': 'This Month',
    'stats.completed': 'Completed',
    'stats.inProgress': 'In Progress',
    'stats.delayed': 'Delayed',
    'stats.weeklyPerformance': 'Weekly Performance',
    'stats.lastSevenDays': 'Last 7 Days',
    'stats.detailedMetrics': 'Detailed Metrics',
    'stats.daysPresent': 'Days Present',
    'stats.onTimeCheckins': 'On-Time Check-ins',
    'stats.sitesVisited': 'Sites Visited',
    'stats.performanceRating': 'Performance Rating',
    
    // Profile
    'profile.title': 'Profile',
    'profile.labour': 'Labour',
    'profile.supervisor': 'Supervisor',
    'profile.engineer': 'Engineer',
    'profile.owner': 'Owner',
    'profile.active': 'Active',
    'profile.phoneNumber': 'Phone Number',
    'profile.location': 'Location',
    'profile.language': 'Language',
    'profile.settings': 'Settings',
    'profile.helpSupport': 'Help & Support',
    'profile.about': 'About',
    'profile.logout': 'Logout',
    
    // Days
    'day.mon': 'Mon',
    'day.tue': 'Tue',
    'day.wed': 'Wed',
    'day.thu': 'Thu',
    'day.fri': 'Fri',
    'day.sat': 'Sat',
    'day.sun': 'Sun',
  },
  hi: {
    // Landing Page
    'landing.welcome': 'स्वागत है',
    'landing.appName': 'इन्फ्राट्रेस',
    'landing.tagline': 'निर्माण क्षेत्र प्रबंधन',
    'landing.subtitle': 'उपस्थिति ट्रैक करें, कार्य प्रबंधित करें और प्रगति की निगरानी करें',
    'landing.getStarted': 'शुरू करें',
    
    // Login
    'login.title': 'लॉगिन',
    'login.selectRole': 'अपनी भूमिका चुनें',
    'login.phoneNumber': 'फ़ोन नंबर',
    'login.phonePlaceholder': 'अपना फ़ोन नंबर दर्ज करें',
    'login.continue': 'जारी रखें',
    'login.labour': 'मजदूर',
    'login.supervisor': 'पर्यवेक्षक',
    'login.engineer': 'इंजीनियर',
    'login.owner': 'मालिक',
    'login.selectLanguage': 'भाषा चुनें',
    
    // Home
    'home.goodMorning': 'सुप्रभात',
    'home.goodAfternoon': 'शुभ दोपहर',
    'home.goodEvening': 'शुभ संध्या',
    'home.markAttendance': 'उपस्थिति दर्ज करें',
    'home.gpsRequired': 'जीपीएस • समय • लाइव फोटो आवश्यक',
    'home.synced': 'समन्वयित',
    'home.yourTasks': 'आपके कार्य',
    'home.pending': 'लंबित',
    'home.site': 'साइट',
    
    // Projects
    'projects.title': 'परियोजनाएं',
    'projects.all': 'सभी',
    'projects.active': 'सक्रिय',
    'projects.completed': 'पूर्ण',
    'projects.onHold': 'रुकी हुई',
    'projects.progress': 'प्रगति',
    'projects.tasks': 'कार्य',
    'projects.members': 'सदस्य',
    
    // Stats
    'stats.title': 'आंकड़े',
    'stats.attendance': 'उपस्थिति',
    'stats.hoursWorked': 'काम के घंटे',
    'stats.tasksOverview': 'कार्य सारांश',
    'stats.thisMonth': 'इस महीने',
    'stats.completed': 'पूर्ण',
    'stats.inProgress': 'प्रगति में',
    'stats.delayed': 'विलंबित',
    'stats.weeklyPerformance': 'साप्ताहिक प्रदर्शन',
    'stats.lastSevenDays': 'पिछले 7 दिन',
    'stats.detailedMetrics': 'विस्तृत मेट्रिक्स',
    'stats.daysPresent': 'उपस्थित दिन',
    'stats.onTimeCheckins': 'समय पर चेक-इन',
    'stats.sitesVisited': 'साइट्स का दौरा',
    'stats.performanceRating': 'प्रदर्शन रेटिंग',
    
    // Profile
    'profile.title': 'प्रोफ़ाइल',
    'profile.labour': 'मजदूर',
    'profile.supervisor': 'पर्यवेक्षक',
    'profile.engineer': 'इंजीनियर',
    'profile.owner': 'मालिक',
    'profile.active': 'सक्रिय',
    'profile.phoneNumber': 'फ़ोन नंबर',
    'profile.location': 'स्थान',
    'profile.language': 'भाषा',
    'profile.settings': 'सेटिंग्स',
    'profile.helpSupport': 'सहायता और समर्थन',
    'profile.about': 'के बारे में',
    'profile.logout': 'लॉगआउट',
    
    // Days
    'day.mon': 'सोम',
    'day.tue': 'मंगल',
    'day.wed': 'बुध',
    'day.thu': 'गुरु',
    'day.fri': 'शुक्र',
    'day.sat': 'शनि',
    'day.sun': 'रवि',
  },
  mr: {
    // Landing Page
    'landing.welcome': 'स्वागत आहे',
    'landing.appName': 'इन्फ्राट्रेस',
    'landing.tagline': 'बांधकाम क्षेत्र व्यवस्थापन',
    'landing.subtitle': 'उपस्थिती ट्रॅक करा, कार्ये व्यवस्थापित करा आणि प्रगतीचे निरीक्षण करा',
    'landing.getStarted': 'सुरू करा',
    
    // Login
    'login.title': 'लॉगिन',
    'login.selectRole': 'तुमची भूमिका निवडा',
    'login.phoneNumber': 'फोन नंबर',
    'login.phonePlaceholder': 'तुमचा फोन नंबर प्रविष्ट करा',
    'login.continue': 'पुढे चला',
    'login.labour': 'कामगार',
    'login.supervisor': 'पर्यवेक्षक',
    'login.engineer': 'अभियंता',
    'login.owner': 'मालक',
    'login.selectLanguage': 'भाषा निवडा',
    
    // Home
    'home.goodMorning': 'सुप्रभात',
    'home.goodAfternoon': 'शुभ दुपार',
    'home.goodEvening': 'शुभ संध्याकाळ',
    'home.markAttendance': 'उपस्थिती नोंदवा',
    'home.gpsRequired': 'जीपीएस • वेळ • लाइव्ह फोटो आवश्यक',
    'home.synced': 'समक्रमित',
    'home.yourTasks': 'तुमची कार्ये',
    'home.pending': 'प्रलंबित',
    'home.site': 'साइट',
    
    // Projects
    'projects.title': 'प्रकल्प',
    'projects.all': 'सर्व',
    'projects.active': 'सक्रिय',
    'projects.completed': 'पूर्ण',
    'projects.onHold': 'थांबलेले',
    'projects.progress': 'प्रगती',
    'projects.tasks': 'कार्ये',
    'projects.members': 'सदस्य',
    
    // Stats
    'stats.title': 'आकडेवारी',
    'stats.attendance': 'उपस्थिती',
    'stats.hoursWorked': 'काम केलेले तास',
    'stats.tasksOverview': 'कार्य सारांश',
    'stats.thisMonth': 'या महिन्यात',
    'stats.completed': 'पूर्ण',
    'stats.inProgress': 'प्रगतीपथावर',
    'stats.delayed': 'विलंबित',
    'stats.weeklyPerformance': 'साप्ताहिक कामगिरी',
    'stats.lastSevenDays': 'गेले 7 दिवस',
    'stats.detailedMetrics': 'तपशीलवार मेट्रिक्स',
    'stats.daysPresent': 'उपस्थित दिवस',
    'stats.onTimeCheckins': 'वेळेवर चेक-इन',
    'stats.sitesVisited': 'साइट्सला भेट',
    'stats.performanceRating': 'कामगिरी रेटिंग',
    
    // Profile
    'profile.title': 'प्रोफाइल',
    'profile.labour': 'कामगार',
    'profile.supervisor': 'पर्यवेक्षक',
    'profile.engineer': 'अभियंता',
    'profile.owner': 'मालक',
    'profile.active': 'सक्रिय',
    'profile.phoneNumber': 'फोन नंबर',
    'profile.location': 'स्थान',
    'profile.language': 'भाषा',
    'profile.settings': 'सेटिंग्ज',
    'profile.helpSupport': 'मदत आणि समर्थन',
    'profile.about': 'बद्दल',
    'profile.logout': 'लॉगआउट',
    
    // Days
    'day.mon': 'सोम',
    'day.tue': 'मंगळ',
    'day.wed': 'बुध',
    'day.thu': 'गुरु',
    'day.fri': 'शुक्र',
    'day.sat': 'शनि',
    'day.sun': 'रवि',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
