import {
  startMongoServer,
  newChat,
  updateChat,
  getChat,
  stopMongoServer,
} from "./chatManager.mjs";

(async () => {
  try {
    await startMongoServer();

    const chatId = await newChat("group");
    console.log("Nuevo chat creado con ID:", chatId);

    await updateChat(chatId, "¡Hola, este es un mensaje!");
    const chat = await getChat(chatId);
    console.log("Contenido del chat:", chat);

    // Detener el servidor al final (opcional)
    await stopMongoServer();
  } catch (error) {
    console.error("Error en la aplicación:", error);
  }
})();
