import React from 'react';
import {Tabs} from 'expo-router';
import {Text} from 'react-native';
import {colors} from '../../src/ui/kit';
export default function Layout(){return <Tabs screenOptions={{headerShown:false,tabBarStyle:{backgroundColor:colors.bg,borderTopColor:colors.line,height:78,paddingBottom:14,paddingTop:8},tabBarActiveTintColor:colors.lime,tabBarInactiveTintColor:colors.muted,tabBarLabelStyle:{fontSize:10,fontWeight:'700'}}}>{[['index','Inicio','⌂'],['ruletas','Ruletas','◉'],['torneos','Torneos','♜'],['estadisticas','Estadísticas','▥'],['configuracion','Configuración','⚙']].map(([name,title,icon])=><Tabs.Screen key={name} name={name!} options={{title,tabBarIcon:({color})=><Text style={{color,fontSize:23}}>{icon}</Text>}}/>)}</Tabs>;}
