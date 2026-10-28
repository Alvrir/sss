import type {ConfigContext,ExpoConfig} from 'expo/config';
export default ({config}:ConfigContext):ExpoConfig=>({
 ...config,
 name:'Match Roulette',
 slug:'match-roulette',
 experiments:{...config.experiments,baseUrl:process.env.EXPO_PUBLIC_BASE_URL??''},
});
