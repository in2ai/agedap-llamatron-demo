import { StateGraph, END, START, MessagesAnnotation, MemorySaver } from '@langchain/langgraph';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatLlamaCpp } from '@langchain/community/chat_models/llama_cpp';
import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch';
import { trimMessages } from '@langchain/core/messages';

let model = null;
export let configuration = null;
let trimmer = trimMessages({
  maxTokens: configuration?.maxTokens || 1024,
  strategy: 'last',
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: 'human',
});

export const loadModel = async (config) => {
  configuration = config;
  model = await ChatLlamaCpp.initialize(config);
  trimmer = trimMessages({
    maxTokens: configuration?.maxTokens || 1024,
    strategy: 'last',
    tokenCounter: (msgs) => msgs.length,
    includeSystem: true,
    allowPartial: false,
    startOn: 'human',
  });
};

let promptTemplate = ChatPromptTemplate.fromMessages([
  ['system', 'Eres un asistente amable. Puedes usar markdown para responder.'],
  ['placeholder', '{messages}'],
]);

export const changePromptTemplate = async (prompt) => {
  promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', prompt],
    ['placeholder', '{messages}'],
  ]);
};

const callModel = async (state) => {
  try {
    if (model === null) {
      throw new Error('Model not loaded');
    }

    if (model._context.sequencesLeft === 0) {
      model._context = await model._model.createContext({
        contextSize: configuration.contextSize || 1024,
      });
    }

    const trimmedMessage = await trimmer.invoke(state.messages);
    const prompt = await promptTemplate.invoke({ messages: trimmedMessage });
    const response = await model.invoke(prompt, {
      onToken: async (token) => {
        const detokenized = model._model.tokenizer.detokenize(token);
        await dispatchCustomEvent('onTextChunk', detokenized);
      },
    });

    return { messages: [response] };
  } catch (error) {
    return { messages: [{ type: 'system', text: error.toString() }] };
  }
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('model', callModel)
  .addEdge(START, 'model')
  .addEdge('model', END);

export const app = workflow.compile({ checkpointer: new MemorySaver() });
