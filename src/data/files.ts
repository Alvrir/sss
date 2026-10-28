import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
export async function exportText(name:string,text:string,mime='application/json'){const uri=FileSystem.cacheDirectory+name;await FileSystem.writeAsStringAsync(uri,text,{encoding:FileSystem.EncodingType.UTF8});if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:mime,dialogTitle:'Guardar o compartir archivo'});else throw new Error('El sistema no ofrece una aplicación para guardar o compartir archivos.');}
export async function readDocument(){const result=await DocumentPicker.getDocumentAsync({type:['application/json','text/*','application/octet-stream'],copyToCacheDirectory:true});if(result.canceled)return undefined;const asset=result.assets[0]!;if((asset.size??0)>30*1024*1024)throw new Error('El archivo supera 30 MB.');return FileSystem.readAsStringAsync(asset.uri,{encoding:FileSystem.EncodingType.UTF8});}
