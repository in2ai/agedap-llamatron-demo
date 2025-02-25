import { StateGraph, END, START, MessagesAnnotation, MemorySaver } from '@langchain/langgraph';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatLlamaCpp } from '@langchain/community/chat_models/llama_cpp';
import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch';
import { trimMessages } from '@langchain/core/messages';

let model = null;
const CONTEXT_SIZE = 1024;
export let modelPath = null;
export const loadModel = async (path) => {
  modelPath = path;
  model = await ChatLlamaCpp.initialize({
    modelPath: modelPath,
    contextSize: CONTEXT_SIZE,
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

const trimmer = trimMessages({
  maxTokens: CONTEXT_SIZE - 128,
  strategy: 'last',
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: 'human',
});

const callModel = async (state) => {
  try {
    if (model === null) {
      throw new Error('Model not loaded');
    }

    if (model._context.sequencesLeft === 0) {
      model._context = await model._model.createContext({ contextSize: CONTEXT_SIZE });
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
