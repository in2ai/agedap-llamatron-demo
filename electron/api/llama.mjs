import path from "node:path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { withLock, State } from "lifecycle-utils";

// Estado inicial del LLM
export const llmState = new State({
  llama: {
    loaded: false,
  },
  model: {
    loaded: false,
  },
  context: {
    loaded: false,
  },
  contextSequence: {
    loaded: false,
  },
  chatSession: {
    loaded: false,
    generatingResult: false,
    simplifiedChat: [],
    draftPrompt: {
      prompt: "",
      completion: "",
    },
  },
});

let llama = null;
let model = null;
let context = null;
let contextSequence = null;

let chatSession = null;
let chatSessionCompletionEngine = null;
let promptAbortController = null;
let inProgressResponse = "";

export const llmFunctions = {
  async loadLlama() {
    await withLock(llmFunctions, "llama", async () => {
      if (llama != null) {
        try {
          await llama.dispose();
          llama = null;
        } catch (err) {
          console.error("Failed to dispose llama", err);
        }
      }

      try {
        llmState.state = {
          ...llmState.state,
          llama: { loaded: false },
        };

        llama = await getLlama();
        llmState.state = {
          ...llmState.state,
          llama: { loaded: true },
        };

        llama.onDispose.createListener(() => {
          llmState.state = {
            ...llmState.state,
            llama: { loaded: false },
          };
        });
      } catch (err) {
        console.error("Failed to load llama", err);
        llmState.state = {
          ...llmState.state,
          llama: {
            loaded: false,
            error: String(err),
          },
        };
      }
    });
  },

  async loadModel(modelPath) {
    await withLock(llmFunctions, "model", async () => {
      if (llama == null) throw new Error("Llama not loaded");

      if (model != null) {
        try {
          await model.dispose();
          model = null;
        } catch (err) {
          console.error("Failed to dispose model", err);
        }
      }

      try {
        llmState.state = {
          ...llmState.state,
          model: {
            loaded: false,
            loadProgress: 0,
          },
        };

        model = await llama.loadModel({
          modelPath,
          onLoadProgress(loadProgress) {
            llmState.state = {
              ...llmState.state,
              model: {
                ...llmState.state.model,
                loadProgress,
              },
            };
          },
        });
        llmState.state = {
          ...llmState.state,
          model: {
            loaded: true,
            loadProgress: 1,
            name: path.basename(modelPath),
          },
        };

        model.onDispose.createListener(() => {
          llmState.state = {
            ...llmState.state,
            model: { loaded: false },
          };
        });
      } catch (err) {
        console.error("Failed to load model", err);
        llmState.state = {
          ...llmState.state,
          model: {
            loaded: false,
            error: String(err),
          },
        };
      }
    });
  },

  async createContext() {
    await withLock(llmFunctions, "context", async () => {
      if (model == null) throw new Error("Model not loaded");

      if (context != null) {
        try {
          await context.dispose();
          context = null;
        } catch (err) {
          console.error("Failed to dispose context", err);
        }
      }

      try {
        llmState.state = {
          ...llmState.state,
          context: { loaded: false },
        };

        context = await model.createContext();
        llmState.state = {
          ...llmState.state,
          context: { loaded: true },
        };

        context.onDispose.createListener(() => {
          llmState.state = {
            ...llmState.state,
            context: { loaded: false },
          };
        });
      } catch (err) {
        console.error("Failed to create context", err);
        llmState.state = {
          ...llmState.state,
          context: {
            loaded: false,
            error: String(err),
          },
        };
      }
    });
  },

  async createContextSequence() {
    await withLock(llmFunctions, "contextSequence", async () => {
      if (context == null) throw new Error("Context not loaded");

      try {
        llmState.state = {
          ...llmState.state,
          contextSequence: { loaded: false },
        };

        contextSequence = context.getSequence();
        llmState.state = {
          ...llmState.state,
          contextSequence: { loaded: true },
        };

        contextSequence.onDispose.createListener(() => {
          llmState.state = {
            ...llmState.state,
            contextSequence: { loaded: false },
          };
        });
      } catch (err) {
        console.error("Failed to get context sequence", err);
        llmState.state = {
          ...llmState.state,
          contextSequence: {
            loaded: false,
            error: String(err),
          },
        };
      }
    });
  },

  chatSession: {
    async createChatSession() {
      await withLock(llmFunctions, "chatSession", async () => {
        if (contextSequence == null)
          throw new Error("Context sequence not loaded");

        if (chatSession != null) {
          try {
            chatSession.dispose();
            chatSession = null;
            chatSessionCompletionEngine = null;
          } catch (err) {
            console.error("Failed to dispose chat session", err);
          }
        }

        try {
          llmState.state = {
            ...llmState.state,
            chatSession: {
              loaded: false,
              generatingResult: false,
              simplifiedChat: [],
              draftPrompt: llmState.state.chatSession.draftPrompt,
            },
          };

          llmFunctions.chatSession.resetChatHistory(false);

          try {
            await chatSession?.preloadPrompt("", {
              signal: promptAbortController?.signal,
            });
          } catch (err) {
            // do nothing
          }
          chatSessionCompletionEngine?.complete(
            llmState.state.chatSession.draftPrompt.prompt
          );

          llmState.state = {
            ...llmState.state,
            chatSession: {
              ...llmState.state.chatSession,
              loaded: true,
            },
          };
        } catch (err) {
          console.error("Failed to create chat session", err);
          llmState.state = {
            ...llmState.state,
            chatSession: {
              loaded: false,
              generatingResult: false,
              simplifiedChat: [],
              draftPrompt: llmState.state.chatSession.draftPrompt,
            },
          };
        }
      });
    },

    async prompt(message, progressCallback) {
      await withLock(llmFunctions, "chatSession", async () => {
        if (chatSession == null) throw new Error("Chat session not loaded");

        llmState.state = {
          ...llmState.state,
          chatSession: {
            ...llmState.state.chatSession,
            generatingResult: true,
            draftPrompt: {
              prompt: "",
              completion: "",
            },
          },
        };
        promptAbortController = new AbortController();

        llmState.state = {
          ...llmState.state,
          chatSession: {
            ...llmState.state.chatSession,
            simplifiedChat: getSimplifiedChatHistory(true, message),
          },
        };
        await chatSession.prompt(message, {
          signal: promptAbortController.signal,
          stopOnAbortSignal: true,
          //maxTokens: 200,
          repeatPenalty: {
            lastTokens: 24,
            penalty: 1.12,
            penalizeNewLine: true,
            frequencyPenalty: 0.02,
            presencePenalty: 0.02,
            punishTokensFilter(tokens) {
              return tokens.filter((token) => {
                const text = model.detokenize([token]);

                // allow the model to repeat tokens
                // that contain the word "better"
                return !text.toLowerCase().includes("better");
              });
            },
          },
          onTextChunk(chunk) {
            inProgressResponse += chunk;

            llmState.state = {
              ...llmState.state,
              chatSession: {
                ...llmState.state.chatSession,
                simplifiedChat: getSimplifiedChatHistory(true, message),
              },
            };

            if (progressCallback) {
              progressCallback({
                func: "partial-response",
                chatSession: llmState.state.chatSession,
              });
            }
          },
        });
        llmState.state = {
          ...llmState.state,
          chatSession: {
            ...llmState.state.chatSession,
            generatingResult: false,
            simplifiedChat: getSimplifiedChatHistory(false),
            draftPrompt: {
              ...llmState.state.chatSession.draftPrompt,
              completion:
                chatSessionCompletionEngine?.complete(
                  llmState.state.chatSession.draftPrompt.prompt
                ) ?? "",
            },
          },
        };
        inProgressResponse = "";
      });
    },

    stopActivePrompt() {
      promptAbortController?.abort();
    },

    resetChatHistory(markAsLoaded = true) {
      if (contextSequence == null) return;

      chatSession?.dispose();
      chatSession = new LlamaChatSession({
        contextSequence,
        autoDisposeSequence: false,
      });
      chatSessionCompletionEngine = chatSession.createPromptCompletionEngine({
        onGeneration(prompt, completion) {
          if (llmState.state.chatSession.draftPrompt.prompt === prompt) {
            llmState.state = {
              ...llmState.state,
              chatSession: {
                ...llmState.state.chatSession,
                draftPrompt: {
                  prompt,
                  completion,
                },
              },
            };
          }
        },
      });

      llmState.state = {
        ...llmState.state,
        chatSession: {
          loaded: markAsLoaded ? true : llmState.state.chatSession.loaded,
          generatingResult: false,
          simplifiedChat: [],
          draftPrompt: {
            prompt: llmState.state.chatSession.draftPrompt.prompt,
            completion:
              chatSessionCompletionEngine.complete(
                llmState.state.chatSession.draftPrompt.prompt
              ) ?? "",
          },
        },
      };

      chatSession.onDispose.createListener(() => {
        llmState.state = {
          ...llmState.state,
          chatSession: {
            loaded: false,
            generatingResult: false,
            simplifiedChat: [],
            draftPrompt: llmState.state.chatSession.draftPrompt,
          },
        };
      });
    },

    setDraftPrompt(prompt) {
      if (chatSessionCompletionEngine == null) return;

      llmState.state = {
        ...llmState.state,
        chatSession: {
          ...llmState.state.chatSession,
          draftPrompt: {
            prompt: prompt,
            completion: chatSessionCompletionEngine.complete(prompt) ?? "",
          },
        },
      };
    },
  },
};

function getSimplifiedChatHistory(generatingResult, currentPrompt) {
  if (chatSession == null) return [];

  const chatHistory = chatSession.getChatHistory().flatMap((item) => {
    if (item.type === "system") return [];
    else if (item.type === "user")
      return [{ type: "user", message: item.text }];
    else if (item.type === "model")
      return [
        {
          type: "model",
          message: item.response
            .filter((value) => typeof value === "string")
            .join(""),
        },
      ];

    // ensure all item types are handled
    return [];
  });

  if (generatingResult && currentPrompt != null) {
    chatHistory.push({
      type: "user",
      message: currentPrompt,
    });

    if (inProgressResponse.length > 0)
      chatHistory.push({
        type: "model",
        message: inProgressResponse,
      });
  }

  return chatHistory;
}
