import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Accueil
import HomeScreen from '../screens/HomeScreen';

// Employés
import DashboardScreen from '../screens/employee/DashboardScreen';
import CreateTicketScreen from '../screens/employee/CreateTicketScreen';
import SearchVehicleScreen from '../screens/employee/SearchVehicleScreen';

// Public / Clients
import MyTicketsScreen from '../screens/public/MyTicketsScreen';
import AboutScreen from '../screens/public/AboutScreen';
import ProfileScreen from '../screens/public/ProfileScreen';

// Administrateurs
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ContraventionManagementScreen from '../screens/admin/ContraventionManagementScreen';
import VehiculeManagementScreen from '../screens/admin/VehiculeManagementScreen';
import EmplacementManagementScreen from '../screens/admin/EmplacementManagementScreen';
import RaisonManagementScreen from '../screens/admin/RaisonManagementScreen';

// Paramètres généraux
import SettingsScreen from '../screens/public/SettingsScreen';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081', 'parkflow://'],
  config: {
    screens: {
      Home: '',
      Login: 'login',
      EmployeeDashboard: 'employee/dashboard',
      CreateTicket: 'employee/create-ticket',
      SearchVehicle: 'employee/search-vehicle',
      MyTickets: 'public/my-tickets',
      About: 'about',
      Profile: 'profile',
      AdminDashboard: 'admin/dashboard',
      UserManagement: 'admin/users',
      EmplacementManagement: 'admin/emplacements',
      RaisonManagement: 'admin/raisons',
      Settings: 'settings',
    },
  },
};

const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator 
        id="root_stack"
        initialRouteName="Home"

        screenOptions={{
          headerShown: false
        }}
      >
        {/* Accueil */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Espace Employé/Agent */}
        <Stack.Screen name="EmployeeDashboard" component={DashboardScreen} />
        <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
        <Stack.Screen name="SearchVehicle" component={SearchVehicleScreen} />

        {/* Espace Client/Public */}
        <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Espace Admin */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="UserManagement" component={UserManagementScreen} />
        <Stack.Screen name="ContraventionManagement" component={ContraventionManagementScreen} />
        <Stack.Screen name="VehiculeManagement" component={VehiculeManagementScreen} />
        <Stack.Screen name="EmplacementManagement" component={EmplacementManagementScreen} />
        <Stack.Screen name="RaisonManagement" component={RaisonManagementScreen} />

        {/* Paramètres */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

