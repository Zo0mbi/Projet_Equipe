declare module '@react-native/new-app-screen' {
  import * as React from 'react';

  export const Header: React.FC;
  export const LearnMoreLinks: React.FC;
  export const Colors: any;
  export const DebugInstructions: React.FC;
  export const ReloadInstructions: React.FC;
  export const NewAppScreen: React.FC<{
    templateFileName?: string;
    safeAreaInsets?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  }>;
}

// Définitions manuelles des icônes Lucide car les types natifs peuvent parfois poser problème avec Metro/Web.
// Ajoutez simplement le nom de l'icône ici pour qu'elle soit reconnue par TypeScript.
declare module 'lucide-react-native' {
  import { FC } from 'react';
  import { ViewStyle, ColorValue } from 'react-native';

  export interface LucideProps {
    size?: number | string;
    color?: ColorValue;
    stroke?: ColorValue;
    strokeWidth?: number | string;
    style?: ViewStyle;
    opacity?: number;
  }

  export type LucideIcon = FC<LucideProps>;

  export const Car: LucideIcon;
  export const Ticket: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Shield: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const UserCircle: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const Search: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const MapPin: LucideIcon;
  export const FileText: LucideIcon;
  export const Camera: LucideIcon;
  export const CreditCard: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Clock: LucideIcon;
  export const Check: LucideIcon;
  export const Leaf: LucideIcon;
  export const Target: LucideIcon;
  export const Users: LucideIcon;
  export const User: LucideIcon;
  export const HardHat: LucideIcon;
  export const Settings: LucideIcon;
  export const Zap: LucideIcon;
  export const Globe: LucideIcon;
  export const Briefcase: LucideIcon;
  export const Users: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Activity: LucideIcon;
  export const FileBarChart: LucideIcon;
  export const Map: LucideIcon;
  export const LogOut: LucideIcon;
  // Ajoutez d'autres icônes ici si nécessaire ou utilisez un export générique
}







