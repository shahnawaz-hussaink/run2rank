import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <MapPin className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-6xl font-bold font-display text-gradient mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Off the beaten path!</p>
        <p className="text-muted-foreground mb-8">
          The page "{location.pathname}" doesn't exist.
        </p>
        <Link to="/">
          <Button className="btn-glow">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
