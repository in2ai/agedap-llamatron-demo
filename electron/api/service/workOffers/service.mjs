import { addChatMessage } from '../../db.mjs';
import { getUserFromLinkedinZip } from '../../linkedin.mjs';
import { getWorkOffers } from '../../relay.mjs';
import { RELAY_LIST } from '../../relays.mjs';
import { computeSimilarity } from './cvMatching.mjs';

const checkInterval = 300000; // 5 minutes
const similarityThreshold = 0.43;

let chatController = undefined;
let userCv = null;
let lastTimeStamp = 0;

export async function workOffersService(theChatController) {
  userCv = null;
  chatController = theChatController;

  const { chat, workspace } = chatController;
  let cvPath = null;
  for (const document of workspace.documents) {
    if (document.type === 'linkedin') {
      cvPath = document.path;
      break;
    }
  }
  if (cvPath === null) await sendMessage('No se ha encontrado tu CV');

  userCv = await getUserFromLinkedinZip(cvPath);
  if (userCv === null)
    return await sendMessage('No se ha podido obtener tu información de LinkedIn');

  if (chat.messages.length === 0) {
    const firstName = userCv.Profile[0]['First Name'];
    const fullName = userCv.Profile[0]['First Name'] + ' ' + userCv.Profile[0]['Last Name'];
    const city = userCv.Profile[0]['Geo Location'];
    const industry = userCv.Profile[0].Industry;

    //Profile
    let firstMessage = `Hola **${firstName}**, hemos cargado tu CV correctamente, estos son tus datos:
    <br/><br/>
    **Nombre completo:** ${fullName}<br/>
    **Ciudad:** ${city}<br/>
    **Industria:** ${industry}
    <br/><br/>
    `;
    //Experiences
    if (userCv.Positions.length > 0) {
      firstMessage += '**Experiencia laboral:**<br/>';
      for (const position of userCv.Positions) {
        if (position['Company Name'] === undefined) continue;
        if (position.Title === undefined) continue;

        if (position['Finished On'] === '')
          firstMessage += `- ${position.Title} en ${position['Company Name']} desde ${position['Started On']}<br/>`;
        else
          firstMessage += `- ${position.Title} en ${position['Company Name']} desde ${position['Started On']} hasta ${position['Finished On']}<br/>`;
      }
      firstMessage += '<br/>';
    }

    //Skills
    if (userCv.Skills.length > 0) {
      firstMessage += '**Habilidades:**<br/>';
      for (const skill of userCv.Skills) {
        firstMessage += `- ${skill.Name}<br/>`;
      }
      firstMessage += '<br/>';
    }

    //Send message
    await sendMessage(firstMessage);
  }

  await sendMessage('Estamos buscando ofertas de trabajo que se ajusten a tu perfil...');

  setTimeout(checkWorkOffers, 5000);
  const timer = setInterval(checkWorkOffers, checkInterval);
  return timer;
}

async function checkWorkOffers() {
  console.log('Checking work offers...');
  const { workspace, event } = chatController;
  const relay = RELAY_LIST.find((r) => r.id === workspace.relayId);

  if (!relay || !relay.url) return;

  const workOffers = await getWorkOffers(relay.url, lastTimeStamp, null);
  lastTimeStamp = Date.now();

  for (const workOffer of workOffers) {
    try {
      const response = await computeSimilarity(userCv, workOffer);
      const similarity = response.overallSimilarity;
      workOffer.similarity = similarity;

      if (similarity > similarityThreshold) {
        const message = `Hemos encontrado una oferta de trabajo que podría interesarte:
        <br/><br/>
        **Título:** ${workOffer.title}<br/>
        **Descripción:** ${workOffer.summary}<br/>
        **Habilidades requeridas:** ${workOffer.requiredSkills.join(', ')}<br/>
        **Ubicación:** ${workOffer.location}<br/>
        **Sueldo:** ${workOffer.price}${workOffer.currency} ${workOffer.period}<br/>
        **Similitud:** ${similarity.toFixed(2) * 100}%<br/>
        `;
        await sendMessage(message);
      }
    } catch (error) {
      console.error('Error al calcular similitud', error, workOffer);
    }
  }
}

async function sendMessage(message) {
  const { chat, event } = chatController;
  await addChatMessage(chat.id, message, 'external');
  event.sender.send('onNewExternalMessage', {
    func: 'onNewExternalMessage',
    chatId: chat.id,
    content: message,
  });
}
