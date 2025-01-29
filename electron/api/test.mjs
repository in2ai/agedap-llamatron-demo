import { ChatLlamaCpp } from "@langchain/community/chat_models/llama_cpp";

const llamaPath = "C:\\Users\\adri2\\Desktop\\model.gguf";

const model = await ChatLlamaCpp.initialize({
  modelPath: llamaPath,
  temperature: 0.5,
  maxTokens: 20,
});

const stream = await model.stream("Hi, I'm Adrian, how are you?");

for await (const chunk of stream) {
  console.log(chunk.content);
}

/*const response = await model.invoke(
  "Tell me a short story about a happy Llama.",
  {
    onToken: async (token) => {
      const detokenized = model._model.tokenizer.detokenize(token);
      console.log(`Detokenized token: ${detokenized}`);
    },
  }
);

console.log(response.content);*/
