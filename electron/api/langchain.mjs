import { StateGraph, END, START, MessagesAnnotation, MemorySaver } from '@langchain/langgraph';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatLlamaCpp } from '@langchain/community/chat_models/llama_cpp';
import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch';

let model = null;
export let modelPath = null;
export const loadModel = async (path) => {
  modelPath = path;
  model = await ChatLlamaCpp.initialize({
    modelPath: modelPath,
    contextSize: 1024,
  });
};

const promptTemplate = ChatPromptTemplate.fromMessages([
  ['system', 'You are a helpful assistant. You can use markdown.'],
  ['placeholder', '{messages}'],
]);

const callModel = async (state) => {
  try {
    if (model === null) {
      throw new Error('Model not loaded');
    }

    if (model._context.sequencesLeft === 0) {
      model._context = await model._model.createContext({ contextSize: 1024 });
    }

    const prompt = await promptTemplate.invoke(state);
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
