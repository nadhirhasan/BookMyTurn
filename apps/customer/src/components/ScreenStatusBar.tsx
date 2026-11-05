import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
export function ScreenStatusBar({ light=false }:{light?:boolean}) { const focused=useIsFocused();return focused?<StatusBar style={light?'light':'dark'}/>:null; }
