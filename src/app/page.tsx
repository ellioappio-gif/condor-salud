import { LanguageProvider } from "@/lib/i18n/context";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LandingContent from "@/components/LandingContent";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  return (
    <LanguageProvider>
      <Navbar />
      <main>
        <Hero />
        <LandingContent />
      </main>
      <Footer />
      <WhatsAppFloat />
      <Chatbot />
    </LanguageProvider>
  );
}
