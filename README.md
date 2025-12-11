# Agedap-Llamatron

Aplicación para la búsqueda de empleo al ofrecer a los usuarios la capacidad de conectar sus perfiles de LinkedIn o Europass, o ingresar manualmente sus datos como un currículum vitae. Todo esto de forma local y nativa en dispositivos móviles y escritorio y conectándose mediante el protocolo Nostr para buscar, filtrar y ver ofertas que las empresas publican en los Relays.

# Requisitos
Tener el dump de Linkedin de nuestro perfil en un archivo zip siguiendo las instrucciones que oferece Linkedin aquí:
https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data?lang=es-ES

# Pasos:
1. Descargar el modelo de lenguaje que vamos a utilizar:
   https://huggingface.co/hugging-quants/Llama-3.2-3B-Instruct-Q4_K_M-GGUF/resolve/main/llama-3.2-3b-instruct-q4_k_m.gguf

2. Abrir la aplicación de Agedap. Nos pedirá cargar un modelo remoto o local. Usaremos el modelo local descargado anteriormente.
   <img width="1275" height="755" alt="imagen" src="https://github.com/user-attachments/assets/3679a0ee-e94c-4bcd-bbaf-50ae46d0bbb1" />
   Sleccionamos el archivos y pulsamos en Abrir
   <img width="1893" height="947" alt="imagen" src="https://github.com/user-attachments/assets/22187fb9-5e9b-4a66-9845-b53202502724" />

3. Una vez cargado el modelo, vamos a "Espacio de trabajo"
   <img width="1197" height="758" alt="imagen" src="https://github.com/user-attachments/assets/c1f28c53-7b4d-4e10-8b23-7c56e0b71529" />
4. Despues en "Crear espacio de trabajo"
   <img width="1273" height="758" alt="imagen" src="https://github.com/user-attachments/assets/149b6a6a-3022-4a21-b3c6-ac1abad1e77b" />
5. Elegimos el relay de "Ofertas de trabajo"
   <img width="1278" height="762" alt="imagen" src="https://github.com/user-attachments/assets/8d8098ba-3140-4d33-b40a-302728d0d041" />
6. Cargamos nuestro zip con el currículum que descargamos previamente de Linkedin
   <img width="1275" height="757" alt="imagen" src="https://github.com/user-attachments/assets/bff9c6fc-3139-4de0-a3d2-0771fcd16b43" />
7. Elegimos un nombre para nuestro espacio de trabajo y una descripción (opcional)
   <img width="1279" height="761" alt="imagen" src="https://github.com/user-attachments/assets/fb132803-aa2c-4871-95fb-705983640b30" />
8. Pulsamos en "crear espacio de trabajo" y luego en "Crear chat" (podemos tener varios espacios de trabajo, cada uno con un CV, y varios chats dentro de cada espacio de trabajo)
   <img width="1195" height="754" alt="imagen" src="https://github.com/user-attachments/assets/fe7e6e83-569b-4999-afd5-933427c56261" />
9. Introducimos un nombre para el chat, y una descripción opcional y pulsamos en "Crear chat"
   <img width="1281" height="757" alt="imagen" src="https://github.com/user-attachments/assets/c5550c34-3a29-49fd-941c-402ffe2d20d1" />
   El chatbot analizará nuestro CV y nos hará un resumen
   <img width="1278" height="1253" alt="imagen" src="https://github.com/user-attachments/assets/a0a0bbba-0555-4e33-88c3-703374c7003d" />
   Despues buscará ofertas relevantes a nuestro perfil
   <img width="778" height="1006" alt="imagen" src="https://github.com/user-attachments/assets/5d774ac0-bec1-472d-a600-f3d5b4b8f6fd" />
10. Podemos pinchar en "Haz click aquí si te interesa esta oferta de trabajo" para inciar un chat con la empresa
   <img width="779" height="471" alt="imagen" src="https://github.com/user-attachments/assets/9725baf9-5919-461b-9b11-f8d2ad3fb8c4" />

# Pasos y requisitos para versión de desarrollo
Necesitamos instalar nodejs>18
```
npm install --force
npm run electron (probar)
npm run make (crear ejecutable)
```


<img height="128" alt="XUNTA-2-Axencia-Inn-positivo" src="https://github.com/user-attachments/assets/9e6bec29-66cf-4775-8c45-9243dc06c390" />
<img height="128" alt="FEDER horizontal castellano" src="https://github.com/user-attachments/assets/e12e0d66-4837-435e-841e-0e52a4aefe8c" />

Este proyecto ha sido subvencionado por la Axencia Galega de Innovación (GAIN) con fondos FEDER de la Unión Europea, con el apoyo de la Consellería de Economía e Industria de la Xunta de Galicia, en el marco de su compromiso con el impulso a la investigación, el desarrollo tecnológico y la innovación.
