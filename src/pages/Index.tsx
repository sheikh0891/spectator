import { motion } from "framer-motion";
import { QrCode, Calendar, Bell, MapPin, CreditCard, Star } from "lucide-react";
import heroStadium from "@/assets/hero-stadium.jpg";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: QrCode,
    title: "Billetterie digitale",
    description: "QR code dynamique sécurisé pour un accès rapide et sans contact.",
  },
  {
    icon: Calendar,
    title: "Programme personnalisé",
    description: "Suivez vos épreuves favorites avec un calendrier sur mesure.",
  },
  {
    icon: Bell,
    title: "Notifications live",
    description: "Résultats en temps réel et alertes de dernière minute.",
  },
  {
    icon: MapPin,
    title: "Guide interactif",
    description: "Navigation pas à pas vers les sites, buvettes et services.",
  },
  {
    icon: CreditCard,
    title: "Paiement sans contact",
    description: "Payez partout avec Mobile Money ou carte, en un geste.",
  },
  {
    icon: Star,
    title: "Expérience VIP",
    description: "Contenus exclusifs, replays et statistiques avancées.",
  },
];

const Index = () => {
  const { user } = useAuth();
  const target = user ? "/dashboard" : "/auth";
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display text-sm font-bold text-primary-foreground">F</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Fan 360</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</a>
          </div>
          <Link to={target}>
            <Button size="sm" className="glow-primary">
              {user ? "Mon espace" : "Se connecter"}
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroStadium} alt="Stade illuminé" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
              Le compagnon numérique du supporter
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Vivez chaque
              <br />
              <span className="text-gradient">instant du match</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              De l'achat de votre billet à la dernière minute de jeu, Fan 360 digitalise toute votre expérience spectateur.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={target}>
                <Button size="lg" className="glow-primary text-base px-8">
                  Commencer maintenant
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base px-8">
                Découvrir
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: "50K+", label: "Supporters" },
              { value: "120+", label: "Événements" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Tout dans <span className="text-gradient">une seule app</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Billetterie, programme, paiement, navigation — Fan 360 centralise tout pour une expérience fluide.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Comment <span className="text-gradient">ça marche</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Créez votre profil", desc: "Inscrivez-vous et sélectionnez vos sports et équipes favoris." },
              { step: "02", title: "Réservez vos places", desc: "Achetez vos billets et recevez votre QR code instantanément." },
              { step: "03", title: "Profitez du match", desc: "Naviguez, payez et suivez les résultats, tout depuis l'app." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="font-display text-5xl font-bold text-gradient mb-4">{item.step}</div>
                <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-12 text-center glow-primary"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Prêt à vivre le match <span className="text-gradient">autrement</span> ?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Rejoignez des milliers de supporters qui vivent déjà l'expérience Fan 360.
            </p>
            <Link to={target}>
              <Button size="lg" className="glow-primary text-base px-10">
                Accéder à mon espace
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="font-display text-xs font-bold text-primary-foreground">F</span>
            </div>
            <span className="font-display text-sm font-semibold">Fan 360</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Fan 360 — Powered by Sonatel</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
