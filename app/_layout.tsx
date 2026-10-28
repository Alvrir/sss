import * as Crypto from 'expo-crypto';
import {configureIds} from '../src/domain/types';
configureIds(Crypto.randomUUID);
import React from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from '../src/data/store';
import {colors} from '../src/ui/kit';
export default function Layout(){return <SafeAreaProvider><Provider><StatusBar style="light"/><Stack screenOptions={{headerStyle:{backgroundColor:colors.bg},headerTintColor:colors.text,contentStyle:{backgroundColor:colors.bg},headerBackTitle:'Volver'}}><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="torneo/[id]" options={{title:'Torneo'}}/><Stack.Screen name="catalogo" options={{title:'Equipos y listas'}}/><Stack.Screen name="jugadores" options={{title:'Jugadores'}}/><Stack.Screen name="importar" options={{title:'Importación'}}/></Stack></Provider></SafeAreaProvider>;}
